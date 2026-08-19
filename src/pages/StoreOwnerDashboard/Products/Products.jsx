import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  toggleProductStatus,
} from '../../../services/products';
import { buildImgSrc } from '../../../services/imageUtils';
import './Products.css';

/* ═══════════════════════════════════════════════════════════
   1. Toast Context & Provider
   ═══════════════════════════════════════════════════════════ */
const ToastContext = React.createContext(null);

const TOAST_ICONS = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, leaving: true } : t));
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 350);
  }, []);

  const toast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, leaving: false }]);
    timers.current[id] = setTimeout(() => dismiss(id), 3500);
  }, [dismiss]);

  const api = {
    success: (msg) => toast(msg, 'success'),
    error: (msg) => toast(msg, 'error'),
    warning: (msg) => toast(msg, 'warning'),
    info: (msg) => toast(msg, 'info'),
  };

  useEffect(() => () => Object.values(timers.current).forEach(clearTimeout), []);

  const toastColors = {
    success: { border: 'rgba(34,197,94,0.4)', bg: '#0d2318' },
    error: { border: 'rgba(239,68,68,0.4)', bg: '#200f0f' },
    warning: { border: 'rgba(234,179,8,0.4)', bg: '#1f1a08' },
    info: { border: 'rgba(156,39,176,0.4)', bg: '#150d24' },
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div style={{
        position: 'fixed', bottom: 24, left: 24, zIndex: 9999,
        display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 340,
      }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 16px', borderRadius: 16, color: '#fff',
            fontSize: 14, minWidth: 240,
            background: toastColors[t.type].bg,
            border: `1px solid ${toastColors[t.type].border}`,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            opacity: t.leaving ? 0 : 1,
            transform: t.leaving ? 'translateX(110%)' : 'translateX(0)',
            transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
          }}>
            <span style={{ fontSize: 16, fontWeight: 700, flexShrink: 0 }}>
              {TOAST_ICONS[t.type]}
            </span>
            <span style={{ flex: 1, lineHeight: 1.4 }}>{t.message}</span>
            <button onClick={() => dismiss(t.id)} style={{
              background: 'none', border: 'none', color: '#888',
              cursor: 'pointer', fontSize: 12, padding: '2px 4px',
              borderRadius: 4, flexShrink: 0,
            }}>✕</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function useToast() {
  return React.useContext(ToastContext);
}

/* ═══════════════════════════════════════════════════════════
   2. useProducts Hook 
   ═══════════════════════════════════════════════════════════ */
function useProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await getProducts();
      setProducts(res?.data?.products ?? []);
      console.log("products => ", res?.data?.products);
    } catch (err) {
      console.error('فشل في تحميل المنتجات', err);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await getCategories();
      console.log("fetch categories res => ", res.data ?? res);
      setCategories(res.data ?? res);
    } catch (err) {
      console.error('فشل في تحميل التصنيفات', err);
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([fetchProducts(), fetchCategories()]);
      setLoading(false);
    })();
  }, [fetchProducts, fetchCategories]);

  const handleAddProduct = useCallback(async (formData, onSuccess) => {
    setSubmitting(true);
    try {
      await addProduct(formData);
      await fetchProducts();
      onSuccess?.();
      return { ok: true };
    } catch (err) {
      console.error(err);
      return { ok: false, message: err?.response?.data?.message ?? 'فشل في إضافة المنتج' };
    } finally {
      setSubmitting(false);
    }
  }, [fetchProducts]);

  const handleUpdateProduct = useCallback(async (id, formData) => {
    setSubmitting(true);
    try {
      await updateProduct(id, formData);
      await fetchProducts();
      return { ok: true };
    } catch (err) {
      console.error(err);
      return { ok: false, message: err?.response?.data?.message ?? 'فشل في تحديث المنتج' };
    } finally {
      setSubmitting(false);
    }
  }, [fetchProducts]);

  const handleDeleteProduct = useCallback(async (id) => {
    setSubmitting(true);
    try {
      await deleteProduct(id);
      setProducts(prev => prev.filter(p => String(p._id) !== String(id)));
      return { ok: true };
    } catch (err) {
      console.error(err);
      await fetchProducts();
      return { ok: false, message: err?.response?.data?.message ?? 'فشل في حذف المنتج' };
    } finally {
      setSubmitting(false);
    }
  }, [fetchProducts]);

  const handleToggleStatus = useCallback(async (product) => {
    const productId = product._id;
    const currentStatus = product.is_active !== false;
    const newStatus = !currentStatus;
    
    setProducts(prev =>
      prev.map(p => String(p._id) === String(productId)
        ? { ...p, is_active: newStatus }
        : p)
    );
    
    setUpdatingId(productId);
    
    try {
      await toggleProductStatus(productId, newStatus);
      console.log("product status toggled successfully");
      return { ok: true };
    } catch (err) {
      setProducts(prev =>
        prev.map(p => String(p._id) === String(productId)
          ? { ...p, is_active: currentStatus }
          : p)
      );
      return { ok: false, message: err.message || 'فشل في تحديث الحالة' };
    } finally {
      setUpdatingId(null);
    }
  }, [setProducts]);

  return {
    products, categories, loading, submitting, updatingId,
    handleAddProduct, handleUpdateProduct, handleDeleteProduct,
    handleToggleStatus,
  };
}

/* ═══════════════════════════════════════════════════════════
   3. PRODUCT CARD 
   ═══════════════════════════════════════════════════════════ */
function ProductCard({ product, onEdit, onToggleStatus, onDelete, updating }) {
  const imageSrc = buildImgSrc(product.images?.[0]);
  
  return (
    <div className="owner-product-card" style={{ opacity: product.is_active === false ? 0.6 : 1 }}>
      <div className="product-img">
        {imageSrc ? (
          <img src={imageSrc} alt={product.name} className="product-img-real" />
        ) : (
          <span className="product-img-placeholder">🧴</span>
        )}
      </div>
      <div className="product-name">{product.name}</div>
      <div className="product-price">{Number(product.price).toLocaleString('ar-EG')} ج.م</div>
      
      <button className="btn-edit-product" onClick={() => onEdit(product)}>
        تعديل المنتج
      </button>
      
      <div className="row-actions-bottom">
        <button 
          className={`btn-toggle-status ${product.is_active !== false ? 'active' : 'inactive'}`}
          onClick={() => onToggleStatus(product)}
          disabled={updating}
        >
          {updating ? (
            <span className="spinner-small" />
          ) : (
            product.is_active !== false ? 'نشط' : 'غير مفعل'
          )}
        </button>
        <button 
          className="delete-icon" 
          aria-label="حذف المنتج" 
          onClick={() => onDelete(product)}
          disabled={updating}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   4. ADD PRODUCT CARD (في أول الـ Grid)
   ═══════════════════════════════════════════════════════════ */
function AddProductCard({ onClick }) {
  return (
    <div className="add-product-card" onClick={onClick} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && onClick()}>
      <div className="add-icon">➕</div>
      <h3>إضافة منتج جديد</h3>
      <p>أضف منتجاً جديداً للكتالوج</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   5. ADD PRODUCT FORM 
   ═══════════════════════════════════════════════════════════ */
const EMPTY_ADD = {
  name: '', price: 0, stock: 0, category_id: '', skinType: 'عادية',
  ingredients: [], weight: 0,
  dimensions: { length: 15, width: 10, height: 5 },
  description: '', images: [],
};

function AddProductForm({ categories, onAdd, submitting, onBack }) {
  const toast = useToast();
  const fileRef = useRef();
  const [form, setForm] = useState(EMPTY_ADD);
  const [previews, setPreviews] = useState([]);

  useEffect(() => () => previews.forEach(url => URL.revokeObjectURL(url)), [previews]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  
  const setIng = (k, v) => {
    const ingredientsArray = v.split(/[،,]+\s*/).filter(item => item.trim());
    setForm(f => ({ ...f, [k]: ingredientsArray }));
  };
  
  const setDim = (k, v) => {
    const numValue = v === '' ? 0 : Number(v);
    setForm(f => ({ ...f, dimensions: { ...f.dimensions, [k]: numValue } }));
  };

  const handleImages = (e) => {
    const files = Array.from(e.target.files);
    const currentCount = form.images.length;
    const availableSlots = 7 - currentCount;
    
    if (files.length > availableSlots) {
      toast.warning(`يمكن إضافة ${availableSlots} صور فقط (الحد الأقصى 7 صور)`);
      return;
    }
    
    setForm(f => ({ ...f, images: [...f.images, ...files] }));
    setPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
  };

  const validate = () => {
    // Name validation
    if (!form.name.trim()) { toast.warning('اسم المنتج مطلوب'); return false; }
    if (form.name.trim().length < 3) { toast.warning('اسم المنتج يجب أن يكون 3 أحرف على الأقل'); return false; }
    if (form.name.trim().length > 100) { toast.warning('اسم المنتج يجب ألا يتجاوز 100 حرف'); return false; }
    
    // Category validation
    if (!form.category_id) { toast.warning('التصنيف مطلوب'); return false; }
    
    // Price validation
    if (!form.price || form.price <= 0) { toast.warning('أدخل سعراً صحيحاً'); return false; }
    if (form.price > 9999.99) { toast.warning('السعر يجب ألا يتجاوز 9999.99 ج.م'); return false; }
    
    // Stock validation
    if (!form.stock || form.stock < 0) { toast.warning('أدخل كمية مخزون صحيحة'); return false; }
    if (form.stock > 10000) { toast.warning('المخزون يجب ألا يتجاوز 10000 وحدة'); return false; }
    
    // Images validation
    if (form.images.length === 0) { toast.warning('يرجى إضافة صورة واحدة على الأقل'); return false; }
    if (form.images.length > 7) { toast.warning('يمكن إضافة 7 صور كحد أقصى'); return false; }
    
    // Weight validation (in grams, convert to kg for backend)
    if (form.weight < 0) { toast.warning('الوزن لا يمكن أن يكون سالباً'); return false; }
    if (form.weight > 5000) { toast.warning('الوزن يجب ألا يتجاوز 5 كجم (5000 جم)'); return false; }
    
    // Dimensions validation
    if (form.dimensions.length < 1 || form.dimensions.length > 100) {
      toast.warning('الطول يجب أن يكون بين 1 و 100 سم');
      return false;
    }
    if (form.dimensions.width < 1 || form.dimensions.width > 100) {
      toast.warning('العرض يجب أن يكون بين 1 و 100 سم');
      return false;
    }
    if (form.dimensions.height < 1 || form.dimensions.height > 100) {
      toast.warning('الارتفاع يجب أن يكون بين 1 و 100 سم');
      return false;
    }
    
    // Description validation
    if (form.description && form.description.length > 600) {
      toast.warning('وصف المنتج يجب ألا يتجاوز 600 حرف');
      return false;
    }
    
    // Ingredients validation
    if (form.ingredients.length > 30) {
      toast.warning('لا يمكن إضافة أكثر من 30 مكون');
      return false;
    }
    for (const ingredient of form.ingredients) {
      if (ingredient.length < 3) {
        toast.warning(`المكون "${ingredient}" يجب أن يكون 3 أحرف على الأقل`);
        return false;
      }
      if (ingredient.length > 100) {
        toast.warning(`المكون "${ingredient}" يجب ألا يتجاوز 100 حرف`);
        return false;
      }
    }
    
    return true;
  };

  const removeImage = (indexToRemove) => {
    setForm(prev => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== indexToRemove)
    }));
    setPreviews(prev => {
      URL.revokeObjectURL(prev[indexToRemove]);
      return prev.filter((_, idx) => idx !== indexToRemove);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    const fd = new FormData();
    fd.append('name', form.name.trim());
    fd.append('price', Number(form.price));
    fd.append('stock', Number(form.stock));
    fd.append('category_id', form.category_id);
    fd.append('skinType', form.skinType);
    fd.append('ingredients', JSON.stringify(form.ingredients));
    fd.append('weight', Number(form.weight) / 1000); // Convert grams to KG for backend
    fd.append('description', form.description || '');
    fd.append('dimensions', JSON.stringify({
      length: Number(form.dimensions.length) || 15,
      width: Number(form.dimensions.width) || 10,
      height: Number(form.dimensions.height) || 5
    }));
    form.images.forEach(img => fd.append('images', img));

    const result = await onAdd(fd, reset);
    if (result?.ok) {
      toast.success('تمت إضافة المنتج بنجاح ✓');
      onBack?.();
    } else {
      toast.error(result?.message ?? 'فشل في إضافة المنتج');
    }
  };

  const reset = () => {
    previews.forEach(url => URL.revokeObjectURL(url));
    setForm(EMPTY_ADD);
    setPreviews([]);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <section className="add-section">
      <button type="button" className="back-btn" onClick={onBack}>
        <span>→</span> رجوع إلى المنتجات
      </button>
      <div className="section-header">
        <div className="section-header-left">
          <h1>إضافة منتج جديد</h1>
          <p>قم بتعبئة تفاصيل المنتج الجديد</p>
        </div>
      </div>
      <div className="form-container">
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label>اسم المنتج <span className="req">*</span></label>
            <input 
              type="text" 
              value={form.name} 
              onChange={e => set('name', e.target.value)} 
              placeholder="مثال: كريم الترطيب الليلي"
              maxLength="100"
            />
            <small className="hint">3-100 حرف</small>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>السعر (ج.م) <span className="req">*</span></label>
              <input 
                type="number" 
                min="0" 
                max="9999.99" 
                step="0.01"
                value={form.price} 
                onChange={e => set('price', e.target.value)} 
                placeholder="0.00 - 9999.99" 
              />
            </div>
            <div className="form-group">
              <label>المخزون <span className="req">*</span></label>
              <input 
                type="number" 
                min="0" 
                max="10000"
                value={form.stock} 
                onChange={e => set('stock', e.target.value)} 
                placeholder="0 - 10000" 
              />
            </div>
            <div className="form-group">
              <label>التصنيف <span className="req">*</span></label>
              <select value={form.category_id} onChange={e => set('category_id', e.target.value)}>
                <option value="">اختر تصنيف</option>
                {categories.map(cat => (
                  <option key={cat._id ?? cat.id} value={cat._id ?? cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>نوع البشرة</label>
              <select value={form.skinType} onChange={e => set('skinType', e.target.value)}>
                <option value="عادية">عادية</option>
                <option value="جافة">جافة</option>
                <option value="دهنية">دهنية</option>
                <option value="مختلطة">مختلطة</option>
                <option value="حساسة">حساسة</option>
              </select>
            </div>
            <div className="form-group">
              <label>المكونات</label>
              <input 
                type="text" 
                value={form.ingredients.join(', ')} 
                onChange={e => setIng('ingredients', e.target.value)} 
                placeholder="فيتامين E، زيت الأرجان، حمض الهيالورونيك" 
              />
              <small className="hint">افصل بين المكونات بفاصلة (، أو ,) الحد الأقصى 30 مكون</small>
            </div>
          </div>

          <div className="form-row dims-row">
            <div className="form-group">
              <label>الوزن (جم)</label>
              <input 
                type="number" 
                min="0" 
                max="5000" 
                step="1"
                value={form.weight} 
                onChange={e => set('weight', e.target.value)} 
                placeholder="0 - 5000 جم" 
              />
              <small className="hint">الحد الأقصى 5 كجم (5000 جم)</small>
            </div>
            <div className="form-group">
              <label>الطول (سم)</label>
              <input 
                type="number" 
                min="1" 
                max="100" 
                value={form.dimensions.length} 
                onChange={e => setDim('length', e.target.value)} 
                placeholder="1-100 سم" 
              />
            </div>
            <div className="form-group">
              <label>العرض (سم)</label>
              <input 
                type="number" 
                min="1" 
                max="100" 
                value={form.dimensions.width} 
                onChange={e => setDim('width', e.target.value)} 
                placeholder="1-100 سم" 
              />
            </div>
            <div className="form-group">
              <label>الارتفاع (سم)</label>
              <input 
                type="number" 
                min="1" 
                max="100" 
                value={form.dimensions.height} 
                onChange={e => setDim('height', e.target.value)} 
                placeholder="1-100 سم" 
              />
            </div>
          </div>

          <div className="form-group">
            <label>وصف المنتج</label>
            <textarea 
              rows="3" 
              value={form.description} 
              onChange={e => set('description', e.target.value)} 
              placeholder="اكتب تفاصيل المنتج هنا..."
              maxLength="600"
            />
            <small className="hint">حد أقصى 600 حرف</small>
          </div>

          <div className="form-group">
            <label>صور المنتج <span className="req">*</span></label>
            <div className="image-upload-area" onClick={() => fileRef.current?.click()}>
              <div className="upload-icon">📸</div>
              <div className="upload-text">اسحب الصور هنا أو اضغط للتصفح</div>
              <div className="upload-hint">PNG، JPEG، JPG (يجب إضافة صورة واحدة على الأقل، الحد الأقصى 7 صور)</div>
            </div>
            <input ref={fileRef} type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={handleImages} />
            {previews.length > 0 && (
              <div className="image-preview">
                {previews.map((src, i) => (
                  <div key={i} className="preview-item">
                    <img src={src} alt={`معاينة ${i + 1}`} />
                    <button 
                      type="button" 
                      className="remove-image-btn" 
                      onClick={() => removeImage(i)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="btn-group">
            <button type="button" className="btn-cancel" onClick={reset} disabled={submitting}>إلغاء</button>
            <button type="submit" className="btn-submit" disabled={submitting}>
              {submitting ? <span className="spinner" /> : '➕ إضافة المنتج'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   6. EDIT PRODUCT FORM
   ═══════════════════════════════════════════════════════════ */
function EditProductForm({ selectedProduct, categories, onUpdate, onDelete, submitting, onBack, onProductDeleted }) {
  const toast = useToast();
  const fileRef = useRef();
  const [form, setForm] = useState(EMPTY_ADD);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [existingImages, setExistingImages] = useState([]);

  useEffect(() => {
    if (selectedProduct) {
      // Parse ingredients if it's a string or use array
      let ingredientsArray = [];
      if (selectedProduct.ingredients) {
        if (Array.isArray(selectedProduct.ingredients)) {
          ingredientsArray = selectedProduct.ingredients;
        } else if (typeof selectedProduct.ingredients === 'string') {
          try {
            ingredientsArray = JSON.parse(selectedProduct.ingredients);
          } catch {
            ingredientsArray = selectedProduct.ingredients.split(/[،,]+\s*/).filter(item => item.trim());
          }
        }
      }

      setForm({
        name: selectedProduct.name ?? '',
        price: selectedProduct.price ?? 0,
        stock: selectedProduct.stock ?? 0,
        category_id: selectedProduct.category_id ?? '',
        skinType: selectedProduct.skinType ?? 'عادية',
        ingredients: ingredientsArray,
        weight: selectedProduct.weight ?? 0,
        dimensions: {
          length: selectedProduct.dimensions?.length ?? 15,
          width: selectedProduct.dimensions?.width ?? 10,
          height: selectedProduct.dimensions?.height ?? 5
        },
        description: selectedProduct.description ?? '',
        images: [],
      });
      setExistingImages(selectedProduct.images ?? []);
      setImagePreviews([]);
    }
  }, [selectedProduct]);

  useEffect(() => () => imagePreviews.forEach(url => URL.revokeObjectURL(url)), [imagePreviews]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  
  const setIng = (k, v) => {
    const ingredientsArray = v.split(/[،,]+\s*/).filter(item => item.trim());
    setForm(f => ({ ...f, [k]: ingredientsArray }));
  };
  
  const setDim = (k, v) => {
    const numValue = v === '' ? 0 : Number(v);
    setForm(f => ({ ...f, dimensions: { ...f.dimensions, [k]: numValue } }));
  };

  const handleImages = (e) => {
    const files = Array.from(e.target.files);
    const currentNewCount = form.images.length;
    const availableSlots = 7 - (existingImages.length + currentNewCount);
    
    if (files.length > availableSlots) {
      toast.warning(`يمكن إضافة ${availableSlots} صور فقط (الحد الأقصى 7 صور)`);
      return;
    }
    
    setForm(f => ({ ...f, images: [...f.images, ...files] }));
    setImagePreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
  };

  const validate = () => {
    if (!form.name.trim()) { toast.warning('اسم المنتج مطلوب'); return false; }
    if (form.name.length < 3) { toast.warning('اسم المنتج يجب أن يكون 3 أحرف على الأقل'); return false; }
    if (form.name.length > 100) { toast.warning('اسم المنتج يجب ألا يتجاوز 100 حرف'); return false; }
    if (!form.price || form.price <= 0) { toast.warning('أدخل سعراً صحيحاً'); return false; }
    if (form.price > 9999.99) { toast.warning('السعر يجب ألا يتجاوز 9999.99 ج.م'); return false; }
    if (!form.stock || form.stock < 0) { toast.warning('أدخل كمية مخزون صحيحة'); return false; }
    if (form.stock > 10000) { toast.warning('المخزون يجب ألا يتجاوز 10000 وحدة'); return false; }
    if (existingImages.length + form.images.length === 0) { toast.warning('يرجى إضافة صورة واحدة على الأقل'); return false; }
    if (existingImages.length + form.images.length > 7) { toast.warning('يمكن إضافة 7 صور كحد أقصى'); return false; }
    if (form.weight > 5) { toast.warning('الوزن يجب ألا يتجاوز 5 كجم'); return false; }
    if (form.dimensions.length > 100 || form.dimensions.width > 100 || form.dimensions.height > 100) {
      toast.warning('الأبعاد يجب ألا تتجاوز 100 وحدة');
      return false;
    }
    return true;
  };

  const removeImage = (indexToRemove) => {
    setForm(prev => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== indexToRemove)
    }));
    
    setImagePreviews(prev => {
      URL.revokeObjectURL(prev[indexToRemove]);
      return prev.filter((_, idx) => idx !== indexToRemove);
    });
  };

  const handleSubmit = async () => {
    if (!selectedProduct) { toast.warning('لا يوجد منتج محدد'); return; }
    if (!validate()) return;
    
    const fd = new FormData();
    fd.append('name', form.name);
    fd.append('price', Number(form.price));
    fd.append('stock', Number(form.stock));
    fd.append('category_id', form.category_id);
    fd.append('skinType', form.skinType);
    fd.append('ingredients', JSON.stringify(form.ingredients));
    fd.append('weight', Number(form.weight) || 0);
    fd.append('description', form.description);
    fd.append('dimensions', JSON.stringify({
      length: Number(form.dimensions.length) || 15,
      width: Number(form.dimensions.width) || 10,
      height: Number(form.dimensions.height) || 5
    }));
    
    form.images.forEach(img => fd.append('images', img));

    const result = await onUpdate(selectedProduct._id, fd);
    if (result?.ok) {
      toast.success('تم تحديث المنتج بنجاح ✓');
      onBack?.();
    } else {
      toast.error(result?.message ?? 'فشل في تحديث المنتج');
    }
  };

  const confirmDelete = async () => {
    const result = await onDelete(selectedProduct._id);
    setShowDeleteModal(false);
    if (result?.ok) {
      toast.success('تم حذف المنتج');
      onProductDeleted?.();
      onBack?.();
    } else {
      toast.error(result?.message ?? 'فشل في حذف المنتج');
    }
  };

  if (!selectedProduct) return null;

  return (
    <section className="edit-section">
      <button type="button" className="back-btn" onClick={onBack}>
        <span>→</span> رجوع إلى المنتجات
      </button>
      <div className="edit-header">
        <div>
          <h1>تعديل المنتج</h1>
          <p>تحديث تفاصيل المنتج: {selectedProduct.name}</p>
        </div>
        <div className="action-buttons">
          <button className="btn-cancel" onClick={() => { setForm({ ...form, name: '', price: 0, stock: 0, images: [] }); onBack(); }} disabled={submitting}>إلغاء</button>
          <button className="btn-submit" onClick={handleSubmit} disabled={submitting}>
            {submitting ? <span className="spinner" /> : 'حفظ التعديلات'}
          </button>
        </div>
      </div>

      <div className="info-card">
        <div className="card-title">المعلومات الأساسية</div>
        <div className="form-group">
          <label>اسم المنتج <span className="req">*</span></label>
          <input type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="3-100 حرف" />
          <small className="hint">3-100 حرف</small>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>السعر (ج.م) <span className="req">*</span></label>
            <input type="number" min="0" max="9999.99" step="0.01" value={form.price} onChange={e => set('price', e.target.value)} placeholder="0.00 - 9999.99" />
          </div>
          <div className="form-group">
            <label>المخزون <span className="req">*</span></label>
            <input type="number" min="0" max="10000" value={form.stock} onChange={e => set('stock', e.target.value)} placeholder="0 - 10000" />
          </div>
          <div className="form-group">
            <label>التصنيف</label>
            <select value={form.category_id} onChange={e => set('category_id', e.target.value)}>
              <option value="">اختر تصنيف</option>
              {categories.map(cat => <option key={cat._id ?? cat.id} value={cat._id ?? cat.id}>{cat.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="info-card">
        <div className="card-title">المواصفات الفنية</div>
        <div className="form-group">
          <label>المكونات</label>
          <input 
            type="text" 
            value={form.ingredients.join(', ')} 
            onChange={e => setIng('ingredients', e.target.value)} 
            placeholder="فيتامين E، زيت الأرجان، حمض الهيالورونيك" 
          />
          <small className="hint">افصل بين المكونات بفاصلة (، أو ,) الحد الأقصى 30 مكون</small>
        </div>
        <div className="specs-table">
          <div className="spec-item">
            <div className="spec-label">الوزن (كجم)</div>
            <input type="number" min="0" max="5" step="0.01" className="spec-value-input" value={form.weight} onChange={e => set('weight', e.target.value)} placeholder="0 - 5 كجم" />
          </div>
          <div className="spec-item">
            <div className="spec-label">نوع البشرة</div>
            <select value={form.skinType} onChange={e => set('skinType', e.target.value)} className="skin-select">
              <option value="جافة">جافة</option>
              <option value="دهنية">دهنية</option>
              <option value="مختلطة">مختلطة</option>
              <option value="حساسة">حساسة</option>
              <option value="عادية">عادية</option>
            </select>
          </div>
        </div>
        <div className="form-group" style={{ marginTop: 20 }}>
          <label>الأبعاد (سم)</label>
          <div className="dimensions">
            {[['length', 'الطول'], ['width', 'العرض'], ['height', 'الارتفاع']].map(([k, lbl]) => (
              <div className="dimension-box" key={k}>
                <div className="dimension-label">{lbl}</div>
                <input type="number" min="1" max="100" value={form.dimensions[k]} onChange={e => setDim(k, e.target.value)} placeholder="1-100" />
              </div>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label>الوصف</label>
          <textarea rows="2" value={form.description} onChange={e => set('description', e.target.value)} placeholder="وصف المنتج (حد أقصى 600 حرف)" maxLength="600" />
          <small className="hint">حد أقصى 600 حرف</small>
        </div>
      </div>

      <div className="info-card">
        <div className="card-title">صور المنتج <span className="req">*</span></div>
        <div className="image-upload-area" onClick={() => fileRef.current?.click()}>
          <div className="upload-icon">📸</div>
          <div className="upload-text">اضغط لإضافة صور جديدة</div>
          <div className="upload-hint">يمكن إضافة حتى {7 - existingImages.length} صور جديدة (الحد الأقصى 7 صور)</div>
        </div>
        <input ref={fileRef} type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={handleImages} />
        
        <div className="images-grid">
          { imagePreviews.length > 0 && (
          <div className="image-preview">
            {imagePreviews.map((src, i) => (
              <div key={i} className="preview-item">
                <img src={src} alt={`معاينة ${i + 1}`} />
                <button 
                  type="button" 
                  className="remove-image-btn" 
                  onClick={() => removeImage(i)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          )}
        </div>
      </div>

      <div className="delete-section">
        <button className="btn-delete-product" disabled={submitting} onClick={() => setShowDeleteModal(true)}>
          🗑️ حذف المنتج
        </button>
      </div>

      {showDeleteModal && (
        <div className="modal-overlay active" onClick={() => setShowDeleteModal(false)} role="dialog" aria-modal="true">
          <div className="delete-modal" onClick={e => e.stopPropagation()}>
            <div className="warning-icon">⚠️</div>
            <div className="question-text">هل أنت متأكد من حذف هذا المنتج؟</div>
            <div className="modal-product-name">{selectedProduct.name}</div>
            <div className="warning-text">هذا الإجراء لا يمكن التراجع عنه</div>
            <div className="modal-buttons-vertical">
              <button className="btn-delete" onClick={confirmDelete} disabled={submitting}>
                {submitting ? <span className="spinner" /> : 'نعم، حذف'}
              </button>
              <button className="btn-cancel-modal" onClick={() => setShowDeleteModal(false)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   7. DELETE MODAL
   ═══════════════════════════════════════════════════════════ */
function DeleteModal({ product, onConfirm, onCancel, submitting }) {
  if (!product) return null;
  
  return (
    <div className="modal-overlay active" onClick={onCancel} role="dialog" aria-modal="true">
      <div className="delete-modal" onClick={e => e.stopPropagation()}>
        <div className="warning-icon">⚠️</div>
        <div className="question-text">هل أنت متأكد من حذف هذا المنتج؟</div>
        <div className="modal-product-name">{product.name}</div>
        <div className="warning-text">هذا الإجراء لا يمكن التراجع عنه</div>
        <div className="modal-buttons-vertical">
          <button className="btn-delete" onClick={onConfirm} disabled={submitting}>
            {submitting ? <span className="spinner" /> : 'نعم، حذف'}
          </button>
          <button className="btn-cancel-modal" onClick={onCancel}>إلغاء</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   8. MAIN ADMIN PANEL
   ═══════════════════════════════════════════════════════════ */
function AdminPanel() {
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [selectedProductForEdit, setSelectedProductForEdit] = useState(null);
  const [selectedProductForDelete, setSelectedProductForDelete] = useState(null);
  
  const {
    products, categories, loading, submitting, updatingId,
    handleAddProduct, handleUpdateProduct, handleDeleteProduct,
    handleToggleStatus,
  } = useProducts();

  const handleEditFromCard = (product) => {
    setSelectedProductForEdit(product);
    setStep(3);
  };

  const handleDeleteFromCard = (product) => {
    setSelectedProductForDelete(product);
    setStep(4);
  };

  const confirmDelete = async () => {
    if (!selectedProductForDelete) return;
    const result = await handleDeleteProduct(selectedProductForDelete._id);
    if (result?.ok) {
      toast.success('تم حذف المنتج');
      setSelectedProductForDelete(null);
      setStep(1);
    } else {
      toast.error(result?.message ?? 'فشل في الحذف');
      setStep(1);
    }
  };

  const cancelDelete = () => {
    setSelectedProductForDelete(null);
    setStep(1);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loader-ring" />
        <span>جاري تحميل المنتجات...</span>
      </div>
    );
  }

  return (
    <div className="app-container">
      {step === 1 && (
        <section className="products-section">
          <div className="section-header">
            <div className="section-header-left">
              <h1>المنتجات</h1>
              <p>إدارة الكتالوج — {products.length} منتج</p>
            </div>
          </div>

          {products.length === 0 ? (
            <div className="empty-state">
              <p>لا يوجد منتجات بعد — أضف أول منتج</p>
              <button className="btn-add-empty" onClick={() => setStep(2)}>
                ➕ إضافة منتج جديد
              </button>
            </div>
          ) : (
            <div className="products-grid">
              <AddProductCard onClick={() => setStep(2)} />
              {
              products.map(product => (
                <ProductCard
                  key={product._id}
                  product={product}
                  onEdit={handleEditFromCard}
                  onToggleStatus={handleToggleStatus}
                  onDelete={handleDeleteFromCard}
                  updating={updatingId === product._id}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {step === 2 && (
        <AddProductForm 
          categories={categories} 
          onAdd={handleAddProduct} 
          submitting={submitting}
          onBack={() => setStep(1)}
        />
      )}

      {step === 3 && selectedProductForEdit && (
        <EditProductForm
          selectedProduct={selectedProductForEdit}
          categories={categories}
          onUpdate={handleUpdateProduct}
          onDelete={handleDeleteProduct}
          submitting={submitting}
          onBack={() => {
            setStep(1);
            setSelectedProductForEdit(null);
          }}
          onProductDeleted={() => setStep(1)}
        />
      )}

      {step === 4 && selectedProductForDelete && (
        <DeleteModal
          product={selectedProductForDelete}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
          submitting={submitting}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   9. ROOT EXPORT
   ═══════════════════════════════════════════════════════════ */
export default function StoreOwnerProducts() {
  return (
    <ToastProvider>
      <AdminPanel />
    </ToastProvider>
  );
}