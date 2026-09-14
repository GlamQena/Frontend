import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildImgSrc } from '../services/imageUtils.js';
import "./ProductCard.css";

const ProductCard = ({
    product,
    isLoggedIn,
    isClientUser = true,
    onToggleWishlist,
    onAddToCart,
    onEdit,
    onDelete,
    onToggleStatus,
    updating,
    isAddingToCart = false,
}) => {
    const navigate = useNavigate();
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const productId = product._id || product.id;
    const productImages = product.images || [];
    const hasMultipleImages = productImages.length > 1;
    const currentImage = productImages[currentImageIndex] || productImages[0];
    const imageSrc = currentImage ? buildImgSrc(currentImage) : '/placeholder.png';

    const productNameDisplay = product.volume ? `${product.name} (${product.volume} مل)` : product.name;
    const isActive = product.is_active !== false;
    const stock = product.stock ?? 0;
    const isOutOfStock = stock <= 0;

    const nextImage = (e) => {
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev + 1) % productImages.length);
    };

    const prevImage = (e) => {
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev - 1 + productImages.length) % productImages.length);
    };

    const goToImage = (imgIndex, e) => {
        e.stopPropagation();
        setCurrentImageIndex(imgIndex);
    };

    const renderStockBadge = (stock) => {
        if (stock <= 0) return <span className="stock-badge out-of-stock">غير متوفر</span>;
        if (stock < 5) return <span className="stock-badge low-stock">متبقي {stock} قطع فقط</span>;
        return <span className="stock-badge in-stock">متوفر ({stock})</span>;
    };

    // Handle add to cart with loading state
    const handleAddToCartClick = (e) => {
        e.stopPropagation();
        if (onAddToCart && !isAddingToCart && !isOutOfStock) {
            onAddToCart(e, productId);
        }
    };

    return (
        <div 
            className="product-card" 
            onClick={() => productId && navigate(`/products/${productId}`)}
        >
            <div className="product-image-container">
                <div 
                    className="product-image" 
                    style={{ backgroundImage: `url(${imageSrc})` }}
                />
                
                {/* Client Wishlist Button */}
                {isClientUser && onToggleWishlist && (
                    <button 
                        className="wishlist-btn"
                        onClick={(e) => onToggleWishlist(e, productId)}
                        aria-label="قائمة الرغبات"
                    >
                        {isLoggedIn && product.addedToWishlist ? "❤️" : "🤍"}
                    </button>
                )}

                {/* Store Owner Status Toggle Switch */}
                {!isClientUser && onToggleStatus && (
                    <div className="status-switch-wrapper" onClick={(e) => e.stopPropagation()}>
                        <span className="status-switch-label">
                            {updating ? 'جاري التحديث...' : (isActive ? 'نشط' : 'معطل')}
                        </span>
                        <input
                            type="checkbox"
                            className="status-checkbox"
                            checked={isActive}
                            disabled={updating}
                            onChange={() => onToggleStatus(product)}
                            aria-label="تغيير حالة المنتج"
                        />
                    </div>
                )}

                {hasMultipleImages && (
                    <>
                        <button className="slider-btn slider-btn-prev" onClick={prevImage}>
                            <i className="fas fa-chevron-right"></i>
                        </button>
                        <div className="slider-dots">
                            {productImages.map((_, imgIndex) => (
                                <span 
                                    key={imgIndex}
                                    className={`slider-dot ${imgIndex === currentImageIndex ? 'active' : ''}`}
                                    onClick={(e) => goToImage(imgIndex, e)}
                                />
                            ))}
                        </div>
                        <button className="slider-btn slider-btn-next" onClick={nextImage}>
                            <i className="fas fa-chevron-left"></i> 
                        </button>
                    </>
                )}
            </div>
            
            {product.isNew && <div className="product-badge new">جديد</div>}
            {product.isBestseller && <div className="product-badge bestseller">الأكثر مبيعاً</div>}
        
            <div className="product-content">
                <div className="product-content-body">
                    {product.store_name || product.owner_store_id?.store_name &&
                        <div className="product-header-row">
                            <div className="product-store-name">
                                {product.store_name || product.owner_store_id?.store_name}
                            </div>
                            <div>
                                {renderStockBadge(stock)}
                            </div>
                        </div>
                    }
                    <h3 className="product-name">{productNameDisplay}</h3>
                </div>

                <div className="product-footer">
                    <div>
                        <span className="product-price-new">{product.price} ج.م</span>
                    </div>
                    <span className="product-rating">
                        <span className="total-rates">({product.totalRates || product.total_rates || 0})</span>
                        <span>{Number(product.rating || product.average_rating || 0).toFixed(1)} ⭐</span>
                    </span>
                </div>

                {/* Client Cart Button */}
                {(!isLoggedIn || isClientUser) && onAddToCart && (
                    <button 
                        className={`full-width-cart-btn`}
                        onClick={handleAddToCartClick}
                        disabled={isOutOfStock && !isAddingToCart}
                    >
                        {isAddingToCart ? (
                            <>
                                <span className="spinner-small"></span>
                                <span>جاري الإضافة...</span>
                            </>
                        ) : isOutOfStock ? (
                            <>
                                <i className="fas fa-times-circle"></i>
                                <span>غير متوفر</span>
                            </>
                        ) : (
                            <>
                                <i className="fas fa-shopping-cart"></i>
                                <span>أضف للسلة</span>
                            </>
                        )}
                    </button>
                )}

                {/* Store Owner Action Buttons (Edit & Delete) */}
                {!isClientUser && (
                    <div className="store-owner-actions" onClick={(e) => e.stopPropagation()}>
                        {onEdit && (
                            <button 
                                className="btn-owner-action btn-owner-edit"
                                onClick={() => onEdit(product)}
                            >
                                <i className="fas fa-edit"></i> تعديل
                            </button>
                        )}
                        {onDelete && (
                            <button 
                                className="btn-owner-action btn-owner-delete"
                                onClick={() => onDelete(product)}
                            >
                                <i className="fas fa-trash-alt"></i> حذف
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductCard;