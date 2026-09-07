// src/pages/Checkout/EmbeddedPayment.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CreditCard, 
  Wallet, 
  Shield, 
  Lock, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Phone,
  ChevronDown,
  ChevronUp,
  Banknote
} from 'lucide-react';
import { checkoutPayment } from '../../../services/order';
import { responseMessageSetter } from '../../../services/authService';
import './EmbeddedPayment.css';

// Available wallet providers in Egypt with proper icons
const WALLET_PROVIDERS = [
  { 
    id: 'vodafone_cash', 
    label: 'فودافون كاش', 
    icon: '📱',
    color: '#e60000',
    bgColor: 'rgba(230, 0, 0, 0.1)'
  },
  { 
    id: 'orange_money', 
    label: 'أورنج موني', 
    icon: '🟠',
    color: '#ff6600',
    bgColor: 'rgba(255, 102, 0, 0.1)'
  },
  { 
    id: 'etisalat_cash', 
    label: 'اتصالات كاش', 
    icon: '🔵',
    color: '#0055a4',
    bgColor: 'rgba(0, 85, 164, 0.1)'
  },
  { 
    id: 'we_phone', 
    label: 'WE فون', 
    icon: '🟣',
    color: '#7b2fbe',
    bgColor: 'rgba(123, 47, 190, 0.1)'
  },
];

const PAYMENT_METHODS = [
  { id: 'cash', icon: <Banknote size={20} />, label: 'الدفع عند الاستلام' },
  { id: 'card', icon: <CreditCard size={20} />, label: 'بطاقة ائتمان / خصم' },
  { id: 'wallet', icon: <Wallet size={20} />, label: 'محفظة إلكترونية' },
];

const EmbeddedPayment = ({ 
  orderId, 
  billingData, 
  totalAmount, 
  onSuccess, 
  onError,
  onBack,
  initialMethod = 'card',
  validateForm,
  formData,
  setFormErrors
}) => {
  const navigate = useNavigate();
  
  // Payment method selection
  const [selectedMethod, setSelectedMethod] = useState(initialMethod);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [paymentToken, setPaymentToken] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('idle');
  const [actionMsg, setActionMsg] = useState({ success: false, message: '' });
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  
  // Wallet specific states
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [walletPhone, setWalletPhone] = useState('');
  const [walletErrors, setWalletErrors] = useState({});
  const [showWalletDropdown, setShowWalletDropdown] = useState(false);
  
  const paymentCheckInterval = useRef(null);
  const iframeRef = useRef(null);

  // Get iframe URL from environment or use default
  const getIframeUrl = () => {
    if (!paymentToken) return null;
    const iframeId = process.env.REACT_APP_PAYMOB_IFRAME_ID || '1012636';
    return `https://accept.paymob.com/api/acceptance/iframes/${iframeId}?payment_token=${paymentToken}`;
  };

  // Reset states when method changes
  useEffect(() => {
    setPaymentStatus('idle');
    setActionMsg({ success: false, message: '' });
    setPaymentToken(null);
    setShowPaymentForm(false);
    setIframeLoaded(false);
    setPaymentCompleted(false);
    
    if (paymentCheckInterval.current) {
      clearInterval(paymentCheckInterval.current);
      paymentCheckInterval.current = null;
    }
  }, [selectedMethod]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (paymentCheckInterval.current) {
        clearInterval(paymentCheckInterval.current);
        paymentCheckInterval.current = null;
      }
    };
  }, []);

  // Handle payment method change
  const handleMethodChange = (method) => {
    setSelectedMethod(method);
    setShowPaymentForm(false);
    setPaymentToken(null);
    setPaymentStatus('idle');
    setActionMsg({ success: false, message: '' });
    setIframeLoaded(false);
    setPaymentCompleted(false);
  };

  // Validate wallet inputs
  const validateWallet = () => {
    const errors = {};
    
    if (selectedMethod === 'wallet') {
      if (!selectedWallet) {
        errors.wallet = 'يرجى اختيار محفظتك';
      }
      
      if (!walletPhone || walletPhone.length < 11) {
        errors.phone = 'يرجى إدخال رقم هاتف صحيح (11 رقم)';
      } else if (!/^(010|011|012|015)\d{8}$/.test(walletPhone)) {
        errors.phone = 'رقم مصري غير صحيح (010, 011, 012, 015 + 8 أرقام)';
      }
    }
    
    setWalletErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Poll payment status (for wallet payments after redirect)
  const startPollingPaymentStatus = (orderId) => {
    let attempts = 0;
    const maxAttempts = 60;
    
    if (paymentCheckInterval.current) {
      clearInterval(paymentCheckInterval.current);
      paymentCheckInterval.current = null;
    }
    
    paymentCheckInterval.current = setInterval(async () => {
      attempts++;
      
      try {
        const response = await fetch(`/api/order/${orderId}/status`, {
          credentials: 'include',
        });
        const data = await response.json();
        
        console.log(`📊 Polling payment status (attempt ${attempts}):`, data);
        
        if (data.payment_status === 'completed' || data.payment_status === 'مكتمل') {
          clearInterval(paymentCheckInterval.current);
          paymentCheckInterval.current = null;
          
          setPaymentStatus('success');
          setProcessing(false);
          setPaymentCompleted(true);
          
          responseMessageSetter(true, '✅ تم الدفع بنجاح!', setActionMsg);
          
          if (onSuccess) onSuccess({ method: 'wallet', data });
          
          setTimeout(() => {
            navigate('/orders', { 
              state: { 
                paymentSuccess: true,
                orderId: orderId,
                message: 'تم الدفع بنجاح!'
              } 
            });
          }, 2000);
          
        } else if (data.payment_status === 'failed' || data.payment_status === 'فشل') {
          clearInterval(paymentCheckInterval.current);
          paymentCheckInterval.current = null;
          
          setPaymentStatus('failed');
          setProcessing(false);
          
          responseMessageSetter(false, '❌ فشل الدفع. يرجى المحاولة مرة أخرى.', setActionMsg);
        }
        
        if (attempts >= maxAttempts) {
          clearInterval(paymentCheckInterval.current);
          paymentCheckInterval.current = null;
          
          responseMessageSetter(
            false, 
            '⏱️ لم يتم تأكيد الدفع. يرجى التحقق من حالة الطلب في صفحة الطلبات.',
            setActionMsg
          );
          setProcessing(false);
        }
        
      } catch (error) {
        console.error('Error polling payment status:', error);
        if (attempts >= maxAttempts) {
          clearInterval(paymentCheckInterval.current);
          paymentCheckInterval.current = null;
          setProcessing(false);
        }
      }
    }, 3000);
  };

  // ✅ MAIN PAYMENT HANDLER
 const handlePayment = async () => {
    // ✅ First, validate the form using the parent's validation
    if (validateForm) {
      const result = await validateForm();
      if (!result.isValid) {
        // Show error message
        responseMessageSetter(
          false, 
          'يرجى إكمال بيانات الشحن بشكل صحيح قبل المتابعة', 
          setActionMsg
        );
        // Scroll to errors (handled by parent)
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    // ✅ Then validate wallet if selected
    if (selectedMethod === 'wallet' && !validateWallet()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // ✅ Ensure billing data is up to date
    if (!billingData || !billingData.email) {
      responseMessageSetter(false, 'يرجى إكمال بيانات الشحن أولاً', setActionMsg);
      return;
    }

    setProcessing(true);
    setLoading(true);
    setPaymentStatus('processing');
    setShowPaymentForm(true);

    try {
      // ✅ Use fresh billing data from parent
      const finalBillingData = { ...billingData };

      if (selectedMethod === 'wallet') {
        finalBillingData.phone_number = walletPhone;
        finalBillingData.wallet_provider = selectedWallet;
      }

      const response = await checkoutPayment(
        orderId,
        JSON.stringify({
          billing_data: finalBillingData,
          payment_method: selectedMethod,
          ...(selectedMethod === 'wallet' && { wallet_provider: selectedWallet }),
        })
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        responseMessageSetter(false, data.message || 'فشل بدء الدفع', setActionMsg);
        setPaymentStatus('failed');
        setLoading(false);
        setProcessing(false);
        return;
      }

      // Handle based on payment method
      if (selectedMethod === 'cash') {
        setPaymentStatus('success');
        setLoading(false);
        setProcessing(false);
        
        responseMessageSetter(true, data.message || 'تم تأكيد الطلب بنجاح!', setActionMsg);
        
        if (onSuccess) onSuccess({ method: 'cash', data });
        
        setTimeout(() => {
          navigate('/orders', { 
            state: { 
              paymentSuccess: true,
              orderId: orderId,
              message: 'تم تأكيد الطلب بنجاح!'
            } 
          });
        }, 2000);
        
      } else if (selectedMethod === 'card') {
        const token = data.payment_token || data.paymentKey || data.token;
        if (!token) {
          responseMessageSetter(false, 'لم يتم استلام رمز الدفع', setActionMsg);
          setPaymentStatus('failed');
          setLoading(false);
          setProcessing(false);
          return;
        }
        
        setPaymentToken(token);
        setLoading(false);
        setProcessing(false);
        
      } else if (selectedMethod === 'wallet') {
        setLoading(false);
        setProcessing(false);
        
        if (data.redirect_url) {
          sessionStorage.setItem('wallet_payment_order_id', orderId);
          sessionStorage.setItem('wallet_payment_timestamp', Date.now().toString());
          sessionStorage.setItem('wallet_payment_method', selectedWallet);
          
          responseMessageSetter(true, '🔄 جاري توجيهك إلى صفحة الدفع بالمحفظة...', setActionMsg);
          
          window.location.href = data.redirect_url;
        } else {
          responseMessageSetter(false, 'لم يتم استلام رابط الدفع', setActionMsg);
          setPaymentStatus('failed');
          setProcessing(false);
        }
      }
      
    } catch (error) {
      console.error('Payment error:', error);
      responseMessageSetter(false, error.message || 'حدث خطأ في الدفع', setActionMsg);
      setPaymentStatus('failed');
      setLoading(false);
      setProcessing(false);
    }
  };

  // Check for return from wallet payment
  useEffect(() => {
    const walletOrderId = sessionStorage.getItem('wallet_payment_order_id');
    const walletTimestamp = sessionStorage.getItem('wallet_payment_timestamp');
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatusParam = urlParams.get('payment_status');
    const transactionId = urlParams.get('transaction_id');
    
    const isWalletReturn = walletOrderId && 
                          paymentStatusParam && 
                          (Date.now() - parseInt(walletTimestamp || '0') < 300000);
    
    if (isWalletReturn && paymentStatusParam === 'success') {
      sessionStorage.removeItem('wallet_payment_order_id');
      sessionStorage.removeItem('wallet_payment_timestamp');
      sessionStorage.removeItem('wallet_payment_method');
      
      setPaymentStatus('success');
      setProcessing(false);
      setPaymentCompleted(true);
      
      responseMessageSetter(true, '✅ تم الدفع بنجاح!', setActionMsg);
      
      if (onSuccess) onSuccess({ method: 'wallet', transactionId });
      
      setTimeout(() => {
        navigate('/orders', { 
          state: { 
            paymentSuccess: true,
            orderId: walletOrderId,
            message: 'تم الدفع بنجاح!'
          } 
        });
      }, 2000);
      
    } else if (isWalletReturn && paymentStatusParam === 'failed') {
      sessionStorage.removeItem('wallet_payment_order_id');
      sessionStorage.removeItem('wallet_payment_timestamp');
      sessionStorage.removeItem('wallet_payment_method');
      
      setPaymentStatus('failed');
      setProcessing(false);
      
      responseMessageSetter(false, '❌ فشل الدفع. يرجى المحاولة مرة أخرى.', setActionMsg);
    }
    
    if (walletOrderId && !paymentStatusParam) {
      const timestamp = parseInt(sessionStorage.getItem('wallet_payment_timestamp') || '0');
      if (timestamp && (Date.now() - timestamp < 300000)) {
        startPollingPaymentStatus(walletOrderId);
      }
    }
  }, [navigate, onSuccess]);

  // ✅ Handle iframe message events (for payment completion)
  useEffect(() => {
    const handleMessage = (event) => {
      // Verify origin for security
      if (event.origin !== 'https://accept.paymob.com') return;
      
      console.log('📨 Message from Paymob:', event.data);
      
      // Check if payment was successful
      if (event.data && event.data.type === 'payment_complete') {
        setPaymentStatus('success');
        setProcessing(false);
        setPaymentCompleted(true);
        
        responseMessageSetter(true, '✅ تم الدفع بنجاح!', setActionMsg);
        
        if (onSuccess) onSuccess(event.data);
        
        setTimeout(() => {
          navigate('/orders', { 
            state: { 
              paymentSuccess: true,
              orderId: orderId,
              message: 'تم الدفع بنجاح!'
            } 
          });
        }, 2000);
      }
      
      if (event.data && event.data.type === 'payment_failed') {
        setPaymentStatus('failed');
        setProcessing(false);
        
        responseMessageSetter(false, '❌ فشل الدفع. يرجى المحاولة مرة أخرى.', setActionMsg);
        if (onError) onError(event.data);
      }
    };

    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [navigate, orderId, onSuccess, onError]);

  // Render wallet section
  const renderWalletSection = () => (
    <div className="wallet-payment-section">
      <div className="wallet-header">
        <Wallet size={32} />
        <h3>الدفع بالمحفظة الإلكترونية</h3>
        <p>اختر محفظتك وأدخل رقم هاتفك للدفع</p>
      </div>

      {actionMsg.message && !actionMsg.success && (
        <div className={`wallet-message ${actionMsg.success ? 'success' : 'error'}`}>
          {actionMsg.message}
        </div>
      )}

      <div className="wallet-provider-selector">
        <label className="wallet-label">
          <span>اختر المحفظة</span>
          <span className="required-star">*</span>
        </label>
        <div className="wallet-dropdown-wrapper">
          <button
            className={`wallet-dropdown-btn ${walletErrors.wallet ? 'error' : ''}`}
            onClick={() => setShowWalletDropdown(!showWalletDropdown)}
            disabled={processing}
          >
            <span className="wallet-dropdown-text">
              {selectedWallet 
                ? WALLET_PROVIDERS.find(w => w.id === selectedWallet)?.label 
                : 'اختر محفظتك...'}
            </span>
            {showWalletDropdown ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          
          {showWalletDropdown && (
            <div className="wallet-dropdown-menu">
              {WALLET_PROVIDERS.map(provider => (
                <button
                  key={provider.id}
                  className={`wallet-dropdown-item ${selectedWallet === provider.id ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedWallet(provider.id);
                    setShowWalletDropdown(false);
                    setWalletErrors(prev => ({ ...prev, wallet: '' }));
                  }}
                >
                  <span className="wallet-item-icon">{provider.icon}</span>
                  <span className="wallet-item-label">{provider.label}</span>
                  {selectedWallet === provider.id && (
                    <span className="wallet-check-mark">✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        {walletErrors.wallet && (
          <span className="wallet-error">{walletErrors.wallet}</span>
        )}
      </div>

      <div className="wallet-phone-group">
        <label className="wallet-label">
          <Phone size={16} />
          <span>رقم الهاتف المرتبط بالمحفظة</span>
          <span className="required-star">*</span>
        </label>
        <input
          type="tel"
          placeholder="01234567890"
          value={walletPhone}
          onChange={(e) => {
            const value = e.target.value.replace(/[^0-9]/g, '');
            setWalletPhone(value);
            setWalletErrors(prev => ({ ...prev, phone: '' }));
          }}
          className={`wallet-phone-input ${walletErrors.phone ? 'error' : ''}`}
          dir="ltr"
          maxLength={11}
          disabled={processing}
        />
        {walletErrors.phone && (
          <span className="wallet-error">{walletErrors.phone}</span>
        )}
        {/* <p className="wallet-hint">أدخل الرقم بدون مفتاح الدولة (مثال: 01234567890)</p> */}
      </div>

      <div className="wallet-security-notice">
        <Shield size={16} />
        <span>مدعوم من Paymob - دفع آمن ومشفر</span>
      </div>
    </div>
  );

  // Render card section with iframe
  const renderCardSection = () => (
    <div className="card-payment-section">
      <div className="card-payment-header">
        <div className="payment-method-badge">
          <CreditCard size={20} />
          <span>بطاقة ائتمان / خصم</span>
        </div>
        <div className="payment-secure-badge">
          <Lock size={16} />
          <span>مدفوعات آمنة</span>
        </div>
      </div>

      {actionMsg.message && (
        <div className={`embedded-payment-message ${actionMsg.success ? 'success' : 'error'}`}>
          {actionMsg.message}
        </div>
      )}

      {!showPaymentForm && paymentStatus === 'idle' && (
        <div className="card-payment-init">
          <div className="card-payment-info">
            <CreditCard size={48} />
            <h3>ادفع بأمان باستخدام بطاقتك</h3>
            <p>سيتم توجيهك إلى نموذج دفع آمن لإكمال العملية</p>
          </div>
        </div>
      )}

      {loading && showPaymentForm && paymentStatus === 'processing' && (
        <div className="payment-loading-state">
          <Loader2 className="spin" size={32} />
          <p>جاري تحميل نموذج الدفع...</p>
        </div>
      )}

      {paymentStatus === 'processing' && !loading && !iframeLoaded && (
        <div className="payment-processing-state">
          <Loader2 className="spin" size={32} />
          <p>جاري تحميل نموذج الدفع...</p>
        </div>
      )}

      {paymentStatus === 'success' && (
        <div className="payment-success-state">
          <CheckCircle size={48} color="#22c55e" />
          <h3>تم الدفع بنجاح!</h3>
          <p>{actionMsg.message || 'جاري تأكيد الطلب...'}</p>
        </div>
      )}

      {paymentStatus === 'failed' && (
        <div className="payment-failed-state">
          <XCircle size={48} color="#ef4444" />
          <h3>فشل الدفع</h3>
          <p>{actionMsg.message || 'حدث خطأ أثناء الدفع. يرجى المحاولة مرة أخرى.'}</p>
          <button onClick={() => {
            setPaymentStatus('idle');
            setShowPaymentForm(false);
            setActionMsg({ success: false, message: '' });
            setPaymentToken(null);
            setIframeLoaded(false);
            setPaymentCompleted(false);
          }}>
            إعادة المحاولة
          </button>
        </div>
      )}

      {paymentToken && showPaymentForm && !loading && paymentStatus !== 'success' && paymentStatus !== 'failed' && (
        <>
          <div className="paymob-iframe-container">
            <iframe
              ref={iframeRef}
              src={getIframeUrl()}
              className="paymob-iframe"
              style={{
                width: '100%',
                height: '550px',
                border: 'none',
                borderRadius: '12px',
                background: '#fff',
              }}
              onLoad={() => {
                console.log('✅ Paymob iframe loaded successfully');
                setIframeLoaded(true);
                setLoading(false);
                setPaymentStatus('idle');
              }}
              onError={(error) => {
                console.error('❌ Paymob iframe error:', error);
                setPaymentStatus('failed');
                setLoading(false);
                responseMessageSetter(false, 'فشل تحميل نموذج الدفع. يرجى المحاولة مرة أخرى.', setActionMsg);
              }}
              allow="payment *"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation"
              title="Paymob Payment"
            />
          </div>
          
          <div className="card-payment-footer">
            <div className="payment-footer-icons">
              <Shield size={16} />
              <span>مدعوم من</span>
              <span className="paymob-text">Paymob</span>
            </div>
            <div className="payment-footer-security">
              <span>🔒 100% آمن ومشفر</span>
            </div>
          </div>
        </>
      )}
    </div>
  );

  // Render COD section
  const renderCODSection = () => (
    <div className="cod-payment-section">
      <div className="cod-header">
        <Banknote size={32} />
        <h3>الدفع عند الاستلام</h3>
        <p>سيتم تحصيل المبلغ عند استلام الطلب</p>
      </div>
      
      <div className="cod-details">
        <div className="cod-detail-item">
          <span className="cod-detail-label">المبلغ المستحق</span>
          <span className="cod-detail-value">{totalAmount.toLocaleString()} ج.م</span>
        </div>
        <div className="cod-detail-item">
          <span className="cod-detail-label">طريقة الدفع</span>
          <span className="cod-detail-value">نقداً عند الاستلام</span>
        </div>
      </div>
      
      <div className="cod-notice">
        <Shield size={16} />
        <span>يمكنك الدفع نقداً عند استلام طلبك</span>
      </div>
    </div>
  );

  // ============================================
  // 🎯 MAIN RENDER
  // ============================================
  return (
    <div className="embedded-payment-wrapper">
      <div className="payment-method-tabs">
        {PAYMENT_METHODS.map((method) => (
          <button
            key={method.id}
            className={`payment-method-tab ${selectedMethod === method.id ? 'active' : ''}`}
            onClick={() => handleMethodChange(method.id)}
            disabled={processing || loading}
          >
            <span className="payment-method-icon">{method.icon}</span>
            <span className="payment-method-label">{method.label}</span>
          </button>
        ))}
      </div>

      <div className="payment-method-content">
        {selectedMethod === 'cash' && renderCODSection()}
        {selectedMethod === 'card' && renderCardSection()}
        {selectedMethod === 'wallet' && renderWalletSection()}
      </div>

      <div className="payment-action-container">
        {actionMsg.message && (
          <div className={`payment-action-message ${actionMsg.success ? 'success' : 'error'}`}>
            {actionMsg.message}
          </div>
        )}
        
        <button
          className="payment-checkout-btn"
          onClick={handlePayment}
          disabled={processing || loading || paymentStatus === 'success'}
        >
          {processing || loading ? (
            <>
              <Loader2 className="spin" size={20} />
              {selectedMethod === 'cash' ? 'جاري تأكيد الطلب...' : 
               selectedMethod === 'wallet' ? 'جاري التوجيه للدفع...' :
               'جاري معالجة الدفع...'}
            </>
          ) : paymentStatus === 'success' ? (
            '✅ تم بنجاح'
          ) : (
            'تأكيد الطلب'
          )}
        </button>
        
        {selectedMethod === 'card' && paymentStatus === 'idle' && (
          <p className="payment-checkout-hint">
            سيتم توجيهك إلى نموذج دفع آمن بعد تأكيد الطلب
          </p>
        )}
        
        {selectedMethod === 'wallet' && paymentStatus === 'idle' && (
          <p className="payment-checkout-hint">
            سيتم توجيهك إلى صفحة الدفع بالمحفظة بعد تأكيد الطلب
          </p>
        )}
      </div>
    </div>
  );
};

export default EmbeddedPayment;