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
import ProductCard from '../../../components/ProductCard';
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
            padding: '12px 16px', borderRadius: 16, color: 'var(--نص-رئيسي)',
            fontSize: 14, minWidth: 240,
            background: 'var(--خلفية-البطاقة)',
            border: '1px solid var(--حد-واضح)',
            boxShadow: 'var(--ظل-البطاقة)',
            opacity: t.leaving ? 0 : 1,
            transform: t.leaving ? 'translateX(110%)' : 'translateX(0)',
            transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
          }}>
            <span style={{ fontSize: 16, fontWeight: 700, flexShrink: 0, color: 'var(--بنفسجي)' }}>
              {TOAST_ICONS[t.type]}
            </span>
            <span style={{ flex: 1, lineHeight: 1.4 }}>{t.message}</span>
            <button onClick={() => dismiss(t.id)} style={{
              background: 'none', border: 'none', color: 'var(--نص-خافت)',
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
    } catch (err) {
      console.error('فشل في تحميل المنتجات', err);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await getCategories();
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
   3. ADD PRODUCT CARD
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
   4. ADD PRODUCT FORM 
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
    if (!form.name.trim()) { toast.warning('اسم المنتج مطلوب'); return false; }
    if (form.name.trim().length < 3) { toast.warning('اسم المنتج يجب أن يكون 3 أحرف على الأقل'); return false; }
    if (!form.category_id) { toast.warning('التصنيف مطلوب'); return false; }
    if (!form.price || form.price <= 0) { toast.warning('أدخل سعراً صحيحاً'); return false; }
    if (!form.stock || form.stock < 0) { toast.warning('أدخل كمية مخزون صحيحة'); return false; }
    if (form.images.length === 0) { toast.warning('يرجى إضافة صورة واحدة على الأقل'); return false; }
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
    fd.append('weight', Number(form.weight) / 1000); 
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
                placeholder="0.00" 
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
                placeholder="0" 
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
                placeholder="فيتامين E، زيت الأرجان" 
              />
            </div>
          </div>

          <div className="form-row dims-row">
            <div className="form-group">
              <label>الوزن (جم)</label>
              <input 
                type="number" 
                min="0" 
                max="5000" 
                value={form.weight} 
                onChange={e => set('weight', e.target.value)} 
                placeholder="0" 
              />
            </div>
            <div className="form-group">
              <label>الطول (سم)</label>
              <input 
                type="number" 
                min="1" 
                max="100" 
                value={form.dimensions.length} 
                onChange={e => setDim('length', e.target.value)} 
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
          </div>

          <div className="form-group">
            <label>صور المنتج <span className="req">*</span></label>
            <div className="image-upload-area" onClick={() => fileRef.current?.click()}>
              <div className="upload-icon">📸</div>
              <div className="upload-text">اسحب الصور هنا أو اضغط للتصفح</div>
            </div>
            <input ref={fileRef} type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={handleImages} />
            {previews.length > 0 && (
              <div className="image-preview">
                {previews.map((src, i) => (
                  <div key={i} className="preview-item">
                    <img src={src} alt={`معاينة ${i + 1}`} />
                    <button type="button" className="remove-image-btn" onClick={() => removeImage(i)}>✕</button>
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
   5. EDIT PRODUCT FORM
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
    if (!form.price || form.price <= 0) { toast.warning('أدخل سعراً صحيحاً'); return false; }
    if (!form.stock || form.stock < 0) { toast.warning('أدخل كمية مخزون صحيحة'); return false; }
    if (existingImages.length + form.images.length === 0) { toast.warning('يرجى إضافة صورة واحدة على الأقل'); return false; }
    return true;
  };

  const removeExistingImage = (indexToRemove) => {
    setExistingImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const removeNewImage = (indexToRemove) => {
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
    fd.append('existingImages', JSON.stringify(existingImages));
    
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
          <button className="btn-cancel" onClick={onBack} disabled={submitting}>إلغاء</button>
          <button className="btn-submit" onClick={handleSubmit} disabled={submitting}>
            {submitting ? <span className="spinner" /> : 'حفظ التعديلات'}
          </button>
        </div>
      </div>

      <div className="info-card">
        <div className="card-title">المعلومات الأساسية</div>
        <div className="form-group">
          <label>اسم المنتج <span className="req">*</span></label>
          <input type="text" value={form.name} onChange={e => set('name', e.target.value)} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>السعر (ج.م) <span className="req">*</span></label>
            <input type="number" min="0" step="0.01" value={form.price} onChange={e => set('price', e.target.value)} />
          </div>
          <div className="form-group">
            <label>المخزون <span className="req">*</span></label>
            <input type="number" min="0" value={form.stock} onChange={e => set('stock', e.target.value)} />
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
        <div className="card-title">صور المنتج</div>
        <div className="image-upload-area" onClick={() => fileRef.current?.click()}>
          <div className="upload-icon">📸</div>
          <div className="upload-text">اضغط لإضافة صور جديدة</div>
        </div>
        <input ref={fileRef} type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={handleImages} />
        
        <div className="image-preview">
          {existingImages.map((img, i) => (
            <div key={`exist-${i}`} className="preview-item">
              <img src={buildImgSrc(img)} alt={`صورة ${i}`} />
              <button type="button" className="remove-image-btn" onClick={() => removeExistingImage(i)}>✕</button>
            </div>
          ))}
          {imagePreviews.map((src, i) => (
            <div key={`new-${i}`} className="preview-item">
              <img src={src} alt={`معاينة جديدة ${i}`} />
              <button type="button" className="remove-image-btn" onClick={() => removeNewImage(i)}>✕</button>
            </div>
          ))}
        </div>
      </div>

      <div className="delete-section">
        <button type="button" className="btn-delete-product" onClick={() => setShowDeleteModal(true)} disabled={submitting}>
          حذف المنتج نهائياً
        </button>
      </div>

      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="delete-modal">
            <div className="warning-icon">⚠️</div>
            <div className="question-text">هل أنت متأكد من حذف هذا المنتج؟</div>
            <div className="modal-product-name">{selectedProduct.name}</div>
            <div className="modal-buttons-vertical">
              <button className="btn-delete" onClick={confirmDelete} disabled={submitting}>
                {submitting ? <span className="spinner" /> : 'نعم، قم بالحذف'}
              </button>
              <button className="btn-cancel-modal" onClick={() => setShowDeleteModal(false)} disabled={submitting}>
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   6. MAIN EXPORT COMPONENT
   ═══════════════════════════════════════════════════════════ */
export default function StoreOwnerProducts() {
  const {
    products, categories, loading, submitting, updatingId,
    handleAddProduct, handleUpdateProduct, handleDeleteProduct,
    handleToggleStatus,
  } = useProducts();

  const [view, setView] = useState('grid'); // 'grid' | 'add' | 'edit'
  const [selectedProduct, setSelectedProduct] = useState(null);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loader-ring" />
        <p>جاري تحميل المنتجات...</p>
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="app-container" dir="rtl">
        {view === 'grid' && (
          <main>
            <div className="section-header">
              <h1>إدارة المنتجات</h1>
              <p>عرض وإدارة منتجات متجرك والتحكم بحالتها والمخزون</p>
            </div>
            
            <div className="products-grid">
              <AddProductCard onClick={() => setView('add')} />
              {products.map(product => (
                <ProductCard
                  key={product._id}
                  product={product}
                  isLoggedIn={true}
                  isClientUser={false}
                  onEdit={(p) => { setSelectedProduct(p); setView('edit'); }}
                  onToggleStatus={handleToggleStatus}
                  onDelete={(p) => { setSelectedProduct(p); setView('edit'); }}
                  updating={updatingId === product._id}
                />
              ))}
            </div>
          </main>
        )}

        {view === 'add' && (
          <AddProductForm
            categories={categories}
            onAdd={handleAddProduct}
            submitting={submitting}
            onBack={() => setView('grid')}
          />
        )}

        {view === 'edit' && (
          <EditProductForm
            selectedProduct={selectedProduct}
            categories={categories}
            onUpdate={handleUpdateProduct}
            onDelete={handleDeleteProduct}
            submitting={submitting}
            onBack={() => setView('grid')}
            onProductDeleted={() => setView('grid')}
          />
        )}
      </div>
    </ToastProvider>
  );
}