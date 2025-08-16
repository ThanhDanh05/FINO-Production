'use client';

import { useState } from 'react';
import { useAuth, useCart, useWishlist } from '@/contexts';
import { useApiNotification } from '@/hooks';
import { Button } from '@/app/components/ui';
import { formatCurrency } from '@/lib/utils';
import { 
  FaHeart,
  FaShoppingCart,
  FaTimes,
  FaEye,
  FaCheck,
  FaShareAlt,
  FaBell,
  FaExchangeAlt,
  FaStar,
  FaTag,
  FaArrowDown,
  FaFilter,
  FaDownload,
  FaCopy,
  FaChartBar,
  FaDollarSign,
  FaCalculator,
  FaCalendarPlus,
  FaClock,
  FaEdit,
  FaLink,
  FaFacebook,
  FaTwitter,
  FaWhatsapp,
  FaTelegram,
  FaEnvelope,
  FaCrown,
  FaRedo,
  FaHistory,
  FaCalendarCheck,
  FaBookmark,
  FaStickyNote,
  FaImage,
  FaPrint,
  FaSync,
  FaSort,
  FaFileExport,
  FaFileImport,
  FaUserFriends,
  FaGift
} from 'react-icons/fa';
import ProductItem from '@/app/components/ProductItem';
import { selectBestVariant, hasAvailableVariants } from '@/lib/variantUtils';
import styles from './WishlistEnhancements.module.css';

interface WishlistItemEnhancedProps {
  item: any;
  index: number;
  productStats: any;
  onRemove: (productId: string) => Promise<void>;
  isCompareMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (productId: string) => void;
  onSetPriceAlert?: (productId: string, targetPrice: number) => void;
  onAddTag?: (productId: string, tag: string) => void;
  onSetPriority?: (productId: string, priority: 'high' | 'medium' | 'low') => void;
  onScheduleReminder?: (productId: string, date: string) => void;
  onToggleFeatured?: (productId: string) => void;
  onSetupAutoReorder?: (productId: string, frequency: 'weekly' | 'monthly' | 'quarterly') => void;
  onCancelAutoReorder?: (productId: string) => void;
  onAddNote?: (productId: string, note: string) => void;
  onToggleBookmark?: (productId: string) => void;
  onMoveToCollection?: (productId: string, collectionName: string) => void;
  onQuickOrder?: (productId: string, quantity: number) => void;
  userTags?: string[];
  priority?: 'high' | 'medium' | 'low';
  hasReminder?: boolean;
  isFeatured?: boolean;
  hasAutoReorder?: boolean;
  autoReorderFrequency?: 'weekly' | 'monthly' | 'quarterly';
  nextReorderDate?: string;
  userNote?: string;
  isBookmarked?: boolean;
  collections?: string[];
  currentCollection?: string;
  lastPurchaseDate?: string;
  purchaseCount?: number;
}

export function WishlistItemEnhanced({ 
  item, 
  index, 
  productStats, 
  onRemove,
  isCompareMode = false,
  isSelected = false,
  onToggleSelect,
  onSetPriceAlert,
  onAddTag,
  onSetPriority,
  onScheduleReminder,
  onToggleFeatured,
  onSetupAutoReorder,
  onCancelAutoReorder,
  onAddNote,
  onToggleBookmark,
  onMoveToCollection,
  onQuickOrder,
  userTags = [],
  priority = 'medium',
  hasReminder = false,
  isFeatured = false,
  hasAutoReorder = false,
  autoReorderFrequency = 'monthly',
  nextReorderDate,
  userNote = '',
  isBookmarked = false,
  collections = [],
  currentCollection = 'Mặc định',
  lastPurchaseDate,
  purchaseCount = 0
}: WishlistItemEnhancedProps) {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { showSuccess, showError } = useApiNotification();
  
  // Existing states
  const [isAdding, setIsAdding] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [showPriceAlert, setShowPriceAlert] = useState(false);
  const [targetPrice, setTargetPrice] = useState<string>('');
  const [showAutoReorderModal, setShowAutoReorderModal] = useState(false);
  const [selectedFrequency, setSelectedFrequency] = useState<'weekly' | 'monthly' | 'quarterly'>('monthly');
  
  // New states for enhanced features
  const [showTagModal, setShowTagModal] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderDate, setReminderDate] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [editNote, setEditNote] = useState(userNote);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState(currentCollection);
  const [quickOrderQuantity, setQuickOrderQuantity] = useState(1);
  const [showQuickOrderModal, setShowQuickOrderModal] = useState(false);
    const productStatsData = productStats[item.product._id];
  const addedDate = new Date((item as any).addedAt || (item as any).createdAt || item.product.createdAt);

  const handleAddToCart = async () => {
    if (!user) {
      showError('Vui lòng đăng nhập để thêm vào giỏ hàng');
      return;
    }

    try {
      setIsAdding(true);
      
      let variants = item.product.variants;
      if (!variants || variants.length === 0) {
        showError('Sản phẩm hiện không có phiên bản khả dụng');
        return;
      }

      if (!hasAvailableVariants(variants as any)) {
        showError('Sản phẩm hiện đang hết hàng');
        return;
      }

      const bestVariant = selectBestVariant(variants as any, {
        strategy: 'smart',
        preferredColorOrder: ['black', 'đen', 'white', 'trắng', 'blue', 'xanh'],
        preferredSizeOrder: ['M', 'L', 'XL', 'S', 'XXL']
      });

      if (bestVariant && bestVariant._id) {
        await addToCart(bestVariant._id.toString(), 1);
        showSuccess(`Đã thêm "${item.product.name}" vào giỏ hàng`);
      } else {
        showError('Không thể tìm thấy phiên bản phù hợp');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      showError('Không thể thêm sản phẩm vào giỏ hàng');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemove = async () => {
    if (isRemoving) return;
    
    try {
      setIsRemoving(true);
      await onRemove(item.product._id);
    } finally {
      setIsRemoving(false);
    }
  };

  const handleToggleFeatured = () => {
    if (onToggleFeatured) {
      onToggleFeatured(item.product._id);
      showSuccess(
        isFeatured 
          ? `Đã bỏ đánh dấu nổi bật cho "${item.product.name}"` 
          : `Đã đánh dấu nổi bật cho "${item.product.name}"`
      );
    }
  };

  const handleSetupAutoReorder = () => {
    if (onSetupAutoReorder) {
      onSetupAutoReorder(item.product._id, selectedFrequency);
      setShowAutoReorderModal(false);
      
      const frequencyText = {
        weekly: 'hàng tuần',
        monthly: 'hàng tháng', 
        quarterly: 'hàng quý'
      }[selectedFrequency];
      
      showSuccess(`Đã thiết lập đặt hàng lại ${frequencyText} cho "${item.product.name}"`);
    }
  };

  const handleCancelAutoReorder = () => {
    if (onCancelAutoReorder) {
      onCancelAutoReorder(item.product._id);
      showSuccess(`Đã hủy đặt hàng tự động cho "${item.product.name}"`);
    }
  };

  const formatNextReorderDate = () => {
    if (!nextReorderDate) return '';
    return new Date(nextReorderDate).toLocaleDateString('vi-VN');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.product.name,
          text: `Xem sản phẩm "${item.product.name}" trên FINO Store`,
          url: `${window.location.origin}/products/${item.product._id}`
        });
      } catch (error) {
        // User cancelled share or error occurred
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(`${window.location.origin}/products/${item.product._id}`);
        showSuccess('Đã copy link sản phẩm');
      } catch (error) {
        showError('Không thể copy link');
      }
    }
  };

  const handleAddNote = () => {
    if (onAddNote && editNote.trim()) {
      onAddNote(item.product._id, editNote.trim());
      setShowNoteModal(false);
      showSuccess(`Đã lưu ghi chú cho "${item.product.name}"`);
    }
  };

  const handleToggleBookmark = () => {
    if (onToggleBookmark) {
      onToggleBookmark(item.product._id);
      showSuccess(
        isBookmarked 
          ? `Đã bỏ bookmark cho "${item.product.name}"` 
          : `Đã bookmark "${item.product.name}"`
      );
    }
  };

  const handleMoveToCollection = () => {
    if (onMoveToCollection && selectedCollection !== currentCollection) {
      onMoveToCollection(item.product._id, selectedCollection);
      setShowCollectionModal(false);
      showSuccess(`Đã chuyển "${item.product.name}" đến bộ sưu tập "${selectedCollection}"`);
    }
  };

  const handleQuickOrder = () => {
    if (onQuickOrder) {
      onQuickOrder(item.product._id, quickOrderQuantity);
      setShowQuickOrderModal(false);
      showSuccess(`Đã đặt ${quickOrderQuantity} sản phẩm "${item.product.name}" vào giỏ hàng`);
    }
  };

  const formatLastPurchaseDate = () => {
    if (!lastPurchaseDate) return 'Chưa mua';
    return new Date(lastPurchaseDate).toLocaleDateString('vi-VN');
  };

  const getPriorityColor = () => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const handleSetPriceAlert = () => {
    if (!targetPrice || !onSetPriceAlert) return;
    
    const price = parseFloat(targetPrice);
    const currentPrice = (item.product as any).salePrice || (item.product as any).price;
    
    if (price >= currentPrice) {
      showError('Giá thông báo phải thấp hơn giá hiện tại');
      return;
    }
    
    onSetPriceAlert(item.product._id, price);
    setShowPriceAlert(false);
    setTargetPrice('');
    showSuccess(`Đã đặt thông báo giá cho "${item.product.name}"`);
  };

  const handleToggleSelect = () => {
    if (onToggleSelect) {
      onToggleSelect(item.product._id);
    }
  };

  const getStockStatus = () => {
    const variants = item.product.variants || [];
    const totalStock = variants.reduce((sum: number, variant: any) => sum + (variant.stock || 0), 0);
    
    if (totalStock === 0) {
      return { status: 'out', label: 'Hết hàng', className: styles.outOfStock };
    } else if (totalStock <= 5) {
      return { status: 'low', label: `Còn ${totalStock}`, className: styles.lowStock };
    }
    return { status: 'in', label: 'Còn hàng', className: styles.inStock };
  };

  const getPriceChangeInfo = () => {
    const currentPrice = (item.product as any).salePrice || (item.product as any).price;
    const originalPrice = (item.product as any).price;
    
    if ((item.product as any).salePrice && originalPrice > (item.product as any).salePrice) {
      const discountPercent = Math.round(((originalPrice - (item.product as any).salePrice) / originalPrice) * 100);
      return {
        hasDiscount: true,
        discountPercent,
        savings: originalPrice - (item.product as any).salePrice
      };
    }
    return { hasDiscount: false };
  };

  const stockInfo = getStockStatus();
  const priceInfo = getPriceChangeInfo();

  return (
    <div className={`${styles.wishlistItemCard} ${isCompareMode ? styles.compareMode : ''} ${isSelected ? styles.selected : ''} ${isFeatured ? styles.featuredCard : ''}`}>
      {/* Featured Badge */}
      {isFeatured && (
        <div className={styles.featuredBadge}>
          <FaCrown className={styles.featuredIcon} />
          <span>Nổi bật</span>
        </div>
      )}

      {/* Auto-Reorder Badge */}
      {hasAutoReorder && (
        <div className={styles.autoReorderBadge}>
          <FaRedo className={styles.autoReorderIcon} />
          <div className={styles.autoReorderInfo}>
            <span className={styles.autoReorderLabel}>Tự động</span>
            <span className={styles.autoReorderNext}>
              {formatNextReorderDate()}
            </span>
          </div>
        </div>
      )}

      {/* Bookmark Badge */}
      {isBookmarked && (
        <div className={styles.bookmarkBadge}>
          <FaBookmark />
        </div>
      )}

      {/* Priority Indicator */}
      {priority !== 'medium' && (
        <div className={styles.priorityIndicator} style={{ borderLeftColor: getPriorityColor() }}>
          <span style={{ color: getPriorityColor() }}>
            {priority === 'high' ? 'Cao' : priority === 'low' ? 'Thấp' : 'TB'}
          </span>
        </div>
      )}

      {/* Compare mode checkbox */}
      {isCompareMode && (
        <div className={styles.selectCheckbox}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleToggleSelect}
            className={styles.checkbox}
          />
        </div>
      )}

      {/* Price change notification */}
      {priceInfo.hasDiscount && (
        <div className={styles.priceAlert}>
          <FaArrowDown className={styles.priceAlertIcon} />
          <span>Giảm {priceInfo.discountPercent}% - Tiết kiệm {formatCurrency(priceInfo.savings || 0)}</span>
        </div>
      )}

      {/* Header with actions */}
      <div className={styles.cardHeader}>
        <div className={styles.addedInfo}>
          <div className={styles.basicInfo}>
            <span className={styles.addedDate}>
              Đã thêm: {addedDate.toLocaleDateString('vi-VN')}
            </span>
            <span className={`${styles.stockStatus} ${stockInfo.className}`}>
              {stockInfo.label}
            </span>
          </div>
          <div className={styles.extendedInfo}>
            {currentCollection !== 'Mặc định' && (
              <span className={styles.collectionInfo}>
                <FaTag /> {currentCollection}
              </span>
            )}
            {purchaseCount > 0 && (
              <span className={styles.purchaseInfo}>
                Đã mua {purchaseCount} lần | Lần cuối: {formatLastPurchaseDate()}
              </span>
            )}
            {userNote && (
              <span className={styles.notePreview}>
                <FaStickyNote /> {userNote.length > 30 ? userNote.substring(0, 30) + '...' : userNote}
              </span>
            )}
          </div>
        </div>
        <div className={styles.cardActions}>
          <button
            className={`${styles.actionBtn} ${isFeatured ? styles.featured : ''}`}
            onClick={handleToggleFeatured}
            title={isFeatured ? "Bỏ đánh dấu nổi bật" : "Đánh dấu nổi bật"}
          >
            <FaCrown />
          </button>
          <button
            className={styles.actionBtn}
            onClick={() => setShowPriceAlert(!showPriceAlert)}
            title="Đặt thông báo giá"
          >
            <FaBell />
          </button>
          <button
            className={`${styles.actionBtn} ${hasAutoReorder ? styles.autoReorderActive : ''}`}
            onClick={hasAutoReorder ? handleCancelAutoReorder : () => setShowAutoReorderModal(true)}
            title={hasAutoReorder ? "Hủy đặt hàng tự động" : "Thiết lập đặt hàng tự động"}
          >
            <FaRedo />
          </button>
          <button
            className={`${styles.actionBtn} ${isBookmarked ? styles.bookmarked : ''}`}
            onClick={handleToggleBookmark}
            title={isBookmarked ? "Bỏ bookmark" : "Bookmark"}
          >
            <FaBookmark />
          </button>
          <button
            className={styles.actionBtn}
            onClick={() => setShowNoteModal(true)}
            title="Thêm/Sửa ghi chú"
          >
            <FaStickyNote />
          </button>
          <button
            className={styles.actionBtn}
            onClick={handleShare}
            title="Chia sẻ sản phẩm"
          >
            <FaShareAlt />
          </button>
          <button
            className={`${styles.actionBtn} ${styles.removeBtn}`}
            onClick={handleRemove}
            disabled={isRemoving}
            title="Xóa khỏi danh sách yêu thích"
          >
            {isRemoving ? <div className={styles.spinner} /> : <FaTimes />}
          </button>
        </div>
      </div>

      {/* Product Item */}
      <div className={styles.productContainer}>
        <ProductItem 
          product={item.product as any}
          layout="grid"
          showQuickActions={false}
          averageRating={productStatsData?.averageRating || 0}
          reviewCount={productStatsData?.reviewCount || 0}
          showRatingBadge={true}
        />
      </div>

      {/* Enhanced Footer Actions */}
      <div className={styles.cardFooter}>
        <div className={styles.priceInfo}>
          <div className={styles.currentPrice}>
            {formatCurrency((item.product as any).salePrice || (item.product as any).price)}
          </div>
          {(item.product as any).salePrice && (item.product as any).price !== (item.product as any).salePrice && (
            <div className={styles.originalPrice}>
              {formatCurrency((item.product as any).price)}
            </div>
          )}
        </div>

        <div className={styles.footerActions}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowQuickOrderModal(true)}
            className={styles.quickOrderBtn}
          >
            <FaShoppingCart />
            Đặt nhanh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCollectionModal(true)}
            className={styles.collectionBtn}
          >
            <FaTag />
            Thu tập
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`/products/${item.product._id}`, '_blank')}
            className={styles.viewBtn}
          >
            <FaEye />
            Xem chi tiết
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleAddToCart}
            disabled={isAdding || stockInfo.status === 'out'}
            className={styles.addToCartBtn}
          >
            {isAdding ? (
              <div className={styles.spinner} />
            ) : (
              <FaShoppingCart />
            )}
            {isAdding ? 'Đang thêm...' : 'Thêm vào giỏ'}
          </Button>
        </div>
      </div>

      {/* Price Alert Modal */}
      {showPriceAlert && (
        <div className={styles.priceAlertModal}>
          <div className={styles.modalContent}>
            <h4>Đặt thông báo giá</h4>
            <p>Giá hiện tại: {formatCurrency((item.product as any).salePrice || (item.product as any).price)}</p>
            <input
              type="number"
              placeholder="Nhập giá mong muốn"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              className={styles.priceInput}
            />
            <div className={styles.modalActions}>
              <Button size="sm" variant="outline" onClick={() => setShowPriceAlert(false)}>
                Hủy
              </Button>
              <Button size="sm" onClick={handleSetPriceAlert}>
                Đặt thông báo
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Reorder Setup Modal */}
      {showAutoReorderModal && (
        <div className={styles.autoReorderModal}>
          <div className={styles.modalContent}>
            <h4>
              <FaRedo />
              Thiết lập đặt hàng tự động
            </h4>
            <p>Sản phẩm: <strong>{item.product.name}</strong></p>
            <p>Giá: <strong>{formatCurrency((item.product as any).salePrice || (item.product as any).price)}</strong></p>
            
            <div className={styles.frequencySelector}>
              <label>Tần suất đặt hàng:</label>
              <div className={styles.frequencyOptions}>
                <label className={styles.frequencyOption}>
                  <input
                    type="radio"
                    value="weekly"
                    checked={selectedFrequency === 'weekly'}
                    onChange={(e) => setSelectedFrequency(e.target.value as any)}
                  />
                  <span className={styles.frequencyLabel}>
                    <FaCalendarCheck />
                    Hàng tuần
                  </span>
                </label>
                <label className={styles.frequencyOption}>
                  <input
                    type="radio"
                    value="monthly"
                    checked={selectedFrequency === 'monthly'}
                    onChange={(e) => setSelectedFrequency(e.target.value as any)}
                  />
                  <span className={styles.frequencyLabel}>
                    <FaCalendarCheck />
                    Hàng tháng (Khuyến nghị)
                  </span>
                </label>
                <label className={styles.frequencyOption}>
                  <input
                    type="radio"
                    value="quarterly"
                    checked={selectedFrequency === 'quarterly'}
                    onChange={(e) => setSelectedFrequency(e.target.value as any)}
                  />
                  <span className={styles.frequencyLabel}>
                    <FaCalendarCheck />
                    Hàng quý
                  </span>
                </label>
              </div>
            </div>
            
            <div className={styles.autoReorderNote}>
              <FaHistory />
              <p>Hệ thống sẽ tự động thêm sản phẩm vào giỏ hàng theo lịch trình đã chọn. Bạn có thể hủy bất cứ lúc nào.</p>
            </div>

            <div className={styles.modalActions}>
              <Button size="sm" variant="outline" onClick={() => setShowAutoReorderModal(false)}>
                Hủy
              </Button>
              <Button size="sm" onClick={handleSetupAutoReorder}>
                <FaRedo />
                Thiết lập
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {showNoteModal && (
        <div className={styles.noteModal}>
          <div className={styles.modalContent}>
            <h4>
              <FaStickyNote />
              Ghi chú cho sản phẩm
            </h4>
            <p>Sản phẩm: <strong>{item.product.name}</strong></p>
            
            <textarea
              value={editNote}
              onChange={(e) => setEditNote(e.target.value)}
              placeholder="Thêm ghi chú của bạn..."
              className={styles.noteTextarea}
              maxLength={500}
            />
            <div className={styles.noteCounter}>
              {editNote.length}/500 ký tự
            </div>

            <div className={styles.modalActions}>
              <Button size="sm" variant="outline" onClick={() => setShowNoteModal(false)}>
                Hủy
              </Button>
              <Button size="sm" onClick={handleAddNote}>
                <FaStickyNote />
                Lưu ghi chú
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Collection Modal */}
      {showCollectionModal && (
        <div className={styles.collectionModal}>
          <div className={styles.modalContent}>
            <h4>
              <FaTag />
              Chuyển đến bộ sưu tập
            </h4>
            <p>Sản phẩm: <strong>{item.product.name}</strong></p>
            <p>Bộ sưu tập hiện tại: <strong>{currentCollection}</strong></p>
            
            <div className={styles.collectionSelector}>
              <label>Chọn bộ sưu tập:</label>
              <select
                value={selectedCollection}
                onChange={(e) => setSelectedCollection(e.target.value)}
                className={styles.collectionSelect}
              >
                {collections.map((collection, index) => (
                  <option key={index} value={collection}>
                    {collection}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.modalActions}>
              <Button size="sm" variant="outline" onClick={() => setShowCollectionModal(false)}>
                Hủy
              </Button>
              <Button size="sm" onClick={handleMoveToCollection} disabled={selectedCollection === currentCollection}>
                <FaTag />
                Chuyển
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Order Modal */}
      {showQuickOrderModal && (
        <div className={styles.quickOrderModal}>
          <div className={styles.modalContent}>
            <h4>
              <FaShoppingCart />
              Đặt hàng nhanh
            </h4>
            <p>Sản phẩm: <strong>{item.product.name}</strong></p>
            <p>Giá: <strong>{formatCurrency((item.product as any).salePrice || (item.product as any).price)}</strong></p>
            
            <div className={styles.quantitySelector}>
              <label>Số lượng:</label>
              <div className={styles.quantityControls}>
                <button
                  onClick={() => setQuickOrderQuantity(Math.max(1, quickOrderQuantity - 1))}
                  className={styles.quantityBtn}
                >
                  -
                </button>
                <input
                  type="number"
                  value={quickOrderQuantity}
                  onChange={(e) => setQuickOrderQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className={styles.quantityInput}
                  min="1"
                />
                <button
                  onClick={() => setQuickOrderQuantity(quickOrderQuantity + 1)}
                  className={styles.quantityBtn}
                >
                  +
                </button>
              </div>
            </div>

            <div className={styles.orderSummary}>
              <div className={styles.summaryItem}>
                <span>Tạm tính:</span>
                <span>{formatCurrency(((item.product as any).salePrice || (item.product as any).price) * quickOrderQuantity)}</span>
              </div>
            </div>

            <div className={styles.modalActions}>
              <Button size="sm" variant="outline" onClick={() => setShowQuickOrderModal(false)}>
                Hủy
              </Button>
              <Button size="sm" onClick={handleQuickOrder}>
                <FaShoppingCart />
                Thêm vào giỏ
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Wishlist Quick Actions Component
interface WishlistQuickActionsProps {
  totalItems: number;
  filteredItems: number;
  onClearAll: () => Promise<void>;
  onAddAllToCart: () => Promise<void>;
  onSelectMode: () => void;
  isSelectMode: boolean;
  onCompareMode: () => void;
  isCompareMode: boolean;
  selectedItemsCount: number;
  onCompareSelected: () => void;
}

export function WishlistQuickActions({
  totalItems,
  filteredItems,
  onClearAll,
  onAddAllToCart,
  onSelectMode,
  isSelectMode,
  onCompareMode,
  isCompareMode,
  selectedItemsCount,
  onCompareSelected
}: WishlistQuickActionsProps) {
  const [isClearing, setIsClearing] = useState(false);
  const [isAddingAll, setIsAddingAll] = useState(false);

  const handleClearAll = async () => {
    if (isClearing) return;
    
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn xóa tất cả ${totalItems} sản phẩm khỏi danh sách yêu thích?`
    );
    
    if (confirmed) {
      try {
        setIsClearing(true);
        await onClearAll();
      } finally {
        setIsClearing(false);
      }
    }
  };

  const handleAddAllToCart = async () => {
    if (isAddingAll) return;
    
    try {
      setIsAddingAll(true);
      await onAddAllToCart();
    } finally {
      setIsAddingAll(false);
    }
  };

  return (
    <div className={styles.quickActions}>
      <div className={styles.actionButtons}>
        <Button
          variant="outline"
          size="sm"
          onClick={onSelectMode}
          className={styles.selectModeBtn}
        >
          <FaCheck />
          {isSelectMode ? 'Thoát chọn' : 'Chọn nhiều'}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onCompareMode}
          className={styles.compareModeBtn}
        >
          <FaExchangeAlt />
          {isCompareMode ? 'Thoát so sánh' : 'So sánh'}
        </Button>

        {isCompareMode && selectedItemsCount > 0 && (
          <Button
            variant="primary"
            size="sm"
            onClick={onCompareSelected}
            className={styles.compareSelectedBtn}
            disabled={selectedItemsCount < 2 || selectedItemsCount > 4}
          >
            <FaExchangeAlt />
            So sánh ({selectedItemsCount})
          </Button>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={handleClearAll}
          disabled={isClearing || totalItems === 0}
          className={styles.clearAllBtn}
        >
          {isClearing ? <div className={styles.spinner} /> : <FaTimes />}
          {isClearing ? 'Đang xóa...' : 'Xóa tất cả'}
        </Button>

        <Button
          variant="primary"
          size="sm"
          onClick={handleAddAllToCart}
          disabled={isAddingAll || filteredItems === 0}
          className={styles.addAllBtn}
        >
          {isAddingAll ? <div className={styles.spinner} /> : <FaShoppingCart />}
          {isAddingAll ? 'Đang thêm...' : `Mua tất cả (${filteredItems})`}
        </Button>
      </div>

      <div className={styles.statsInfo}>
        <span className={styles.totalItems}>
          {filteredItems > 0 ? (
            <>Hiển thị {filteredItems} / {totalItems} sản phẩm</>
          ) : (
            <>Không có sản phẩm nào</>
          )}
        </span>
      </div>
    </div>
  );
}

// Wishlist Featured Filter Component
interface WishlistFeaturedFilterProps {
  showFeaturedOnly: boolean;
  onToggleFeaturedFilter: () => void;
  featuredCount: number;
  totalCount: number;
}

export function WishlistFeaturedFilter({
  showFeaturedOnly,
  onToggleFeaturedFilter,
  featuredCount,
  totalCount
}: WishlistFeaturedFilterProps) {
  return (
    <div className={styles.featuredFilter}>
      <button
        className={`${styles.featuredFilterBtn} ${showFeaturedOnly ? styles.active : ''}`}
        onClick={onToggleFeaturedFilter}
        title={showFeaturedOnly ? "Hiển thị tất cả" : "Chỉ hiển thị nổi bật"}
      >
        <FaCrown />
        {showFeaturedOnly ? (
          <span>Nổi bật ({featuredCount})</span>
        ) : (
          <span>Tất cả ({totalCount})</span>
        )}
      </button>
      {featuredCount > 0 && (
        <div className={styles.featuredStats}>
          <span className={styles.featuredLabel}>
            {featuredCount} / {totalCount} sản phẩm được đánh dấu nổi bật
          </span>
        </div>
      )}
    </div>
  );
}

// Wishlist Analytics Component
interface WishlistAnalyticsProps {
  analytics: {
    totalValue: number;
    averagePrice: number;
    priceDistribution: { range: string; count: number }[];
    categoryDistribution: { category: string; count: number; percentage: number }[];
    addedThisMonth: number;
    addedThisWeek: number;
    monthlyTrend: { month: string; count: number }[];
    popularBrands: { brand: string; count: number }[];
    avgDaysInWishlist: number;
  };
}

export function WishlistAnalytics({ analytics }: WishlistAnalyticsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'categories'>('overview');

  return (
    <div className={styles.analyticsContainer}>
      <div className={styles.analyticsHeader}>
        <h3>
          <FaChartBar />
          Phân tích danh sách yêu thích
        </h3>
        <div className={styles.analyticsTabs}>
          <button
            className={`${styles.tabBtn} ${activeTab === 'overview' ? styles.active : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Tổng quan
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'trends' ? styles.active : ''}`}
            onClick={() => setActiveTab('trends')}
          >
            xu hướng
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'categories' ? styles.active : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            Danh mục
          </button>
        </div>
      </div>

      <div className={styles.analyticsContent}>
        {activeTab === 'overview' && (
          <div className={styles.overviewTab}>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <FaDollarSign className={styles.statIcon} />
                <div className={styles.statInfo}>
                  <span className={styles.statLabel}>Tổng giá trị</span>
                  <span className={styles.statValue}>
                    {formatCurrency(analytics.totalValue)}
                  </span>
                </div>
              </div>
              <div className={styles.statCard}>
                <FaCalculator className={styles.statIcon} />
                <div className={styles.statInfo}>
                  <span className={styles.statLabel}>Giá trung bình</span>
                  <span className={styles.statValue}>
                    {formatCurrency(analytics.averagePrice)}
                  </span>
                </div>
              </div>
              <div className={styles.statCard}>
                <FaCalendarPlus className={styles.statIcon} />
                <div className={styles.statInfo}>
                  <span className={styles.statLabel}>Thêm tháng này</span>
                  <span className={styles.statValue}>{analytics.addedThisMonth}</span>
                </div>
              </div>
              <div className={styles.statCard}>
                <FaClock className={styles.statIcon} />
                <div className={styles.statInfo}>
                  <span className={styles.statLabel}>Thời gian TB</span>
                  <span className={styles.statValue}>{analytics.avgDaysInWishlist} ngày</span>
                </div>
              </div>
            </div>

            <div className={styles.priceDistribution}>
              <h4>Phân bổ theo giá</h4>
              <div className={styles.distributionChart}>
                {analytics.priceDistribution.map((item, index) => (
                  <div key={index} className={styles.distributionItem}>
                    <span className={styles.rangeLabel}>{item.range}</span>
                    <div className={styles.bar}>
                      <div 
                        className={styles.barFill}
                        style={{ 
                          width: `${(item.count / Math.max(...analytics.priceDistribution.map(p => p.count))) * 100}%` 
                        }}
                      />
                    </div>
                    <span className={styles.countLabel}>{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'trends' && (
          <div className={styles.trendsTab}>
            <div className={styles.trendChart}>
              <h4>Xu hướng thêm sản phẩm</h4>
              <div className={styles.monthlyChart}>
                {analytics.monthlyTrend.map((item, index) => (
                  <div key={index} className={styles.monthItem}>
                    <div 
                      className={styles.monthBar}
                      style={{ 
                        height: `${(item.count / Math.max(...analytics.monthlyTrend.map(m => m.count))) * 100}%` 
                      }}
                    />
                    <span className={styles.monthLabel}>{item.month}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.popularBrands}>
              <h4>Thương hiệu yêu thích</h4>
              <div className={styles.brandList}>
                {analytics.popularBrands.map((brand, index) => (
                  <div key={index} className={styles.brandItem}>
                    <span className={styles.brandName}>{brand.brand}</span>
                    <span className={styles.brandCount}>{brand.count} sản phẩm</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className={styles.categoriesTab}>
            <h4>Phân bổ theo danh mục</h4>
            <div className={styles.categoryChart}>
              {analytics.categoryDistribution.map((category, index) => (
                <div key={index} className={styles.categoryItem}>
                  <div className={styles.categoryInfo}>
                    <span className={styles.categoryName}>{category.category}</span>
                    <span className={styles.categoryPercentage}>{category.percentage}%</span>
                  </div>
                  <div className={styles.categoryBar}>
                    <div 
                      className={styles.categoryBarFill}
                      style={{ width: `${category.percentage}%` }}
                    />
                  </div>
                  <span className={styles.categoryCount}>{category.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Wishlist Notifications Component
interface NotificationItem {
  id: string;
  type: 'price_drop' | 'back_in_stock' | 'reminder' | 'sale';
  productId: string;
  productName: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  data?: any;
}

interface WishlistNotificationsProps {
  notifications: NotificationItem[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onRemoveNotification: (id: string) => void;
  onClearAll: () => void;
}

export function WishlistNotifications({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onRemoveNotification,
  onClearAll
}: WishlistNotificationsProps) {
  const [filter, setFilter] = useState<'all' | 'unread' | 'price_drop' | 'stock'>('all');
  
  const unreadCount = notifications.filter(n => !n.isRead).length;
  
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.isRead;
    if (filter === 'price_drop') return notification.type === 'price_drop';
    if (filter === 'stock') return notification.type === 'back_in_stock';
    return true;
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'price_drop': return <FaArrowDown className={styles.priceDropIcon} />;
      case 'back_in_stock': return <FaCheck className={styles.stockIcon} />;
      case 'reminder': return <FaBell className={styles.reminderIcon} />;
      case 'sale': return <FaTag className={styles.saleIcon} />;
      default: return <FaBell />;
    }
  };

  const formatNotificationTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} ngày trước`;
    if (hours > 0) return `${hours} giờ trước`;
    return 'Vừa xong';
  };

  return (
    <div className={styles.notificationsContainer}>
      <div className={styles.notificationsHeader}>
        <h3>
          <FaBell />
          Thông báo ({unreadCount > 0 && <span className={styles.unreadBadge}>{unreadCount}</span>})
        </h3>
        <div className={styles.notificationActions}>
          <Button size="sm" variant="outline" onClick={onMarkAllAsRead}>
            Đánh dấu đã đọc
          </Button>
          <Button size="sm" variant="outline" onClick={onClearAll}>
            Xóa tất cả
          </Button>
        </div>
      </div>

      <div className={styles.notificationFilters}>
        <button
          className={`${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`}
          onClick={() => setFilter('all')}
        >
          Tất cả ({notifications.length})
        </button>
        <button
          className={`${styles.filterBtn} ${filter === 'unread' ? styles.active : ''}`}
          onClick={() => setFilter('unread')}
        >
          Chưa đọc ({unreadCount})
        </button>
        <button
          className={`${styles.filterBtn} ${filter === 'price_drop' ? styles.active : ''}`}
          onClick={() => setFilter('price_drop')}
        >
          Giảm giá
        </button>
        <button
          className={`${styles.filterBtn} ${filter === 'stock' ? styles.active : ''}`}
          onClick={() => setFilter('stock')}
        >
          Có hàng
        </button>
      </div>

      <div className={styles.notificationsList}>
        {filteredNotifications.length === 0 ? (
          <div className={styles.emptyNotifications}>
            <FaBell className={styles.emptyIcon} />
            <p>Không có thông báo nào</p>
          </div>
        ) : (
          filteredNotifications.map(notification => (
            <div
              key={notification.id}
              className={`${styles.notificationItem} ${!notification.isRead ? styles.unread : ''}`}
            >
              <div className={styles.notificationIcon}>
                {getNotificationIcon(notification.type)}
              </div>
              <div className={styles.notificationContent}>
                <div className={styles.notificationMessage}>
                  {notification.message}
                </div>
                <div className={styles.notificationMeta}>
                  <span className={styles.productName}>{notification.productName}</span>
                  <span className={styles.timestamp}>
                    {formatNotificationTime(notification.timestamp)}
                  </span>
                </div>
              </div>
              <div className={styles.notificationActions}>
                {!notification.isRead && (
                  <button
                    className={styles.markReadBtn}
                    onClick={() => onMarkAsRead(notification.id)}
                    title="Đánh dấu đã đọc"
                  >
                    <FaCheck />
                  </button>
                )}
                <button
                  className={styles.removeBtn}
                  onClick={() => onRemoveNotification(notification.id)}
                  title="Xóa thông báo"
                >
                  <FaTimes />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Wishlist Sharing Component
interface WishlistSharingProps {
  wishlistId: string;
  wishlistName: string;
  isPublic: boolean;
  shareUrl: string;
  onTogglePublic: () => void;
  onUpdateName: (name: string) => void;
  onGenerateShareLink: () => void;
}

export function WishlistSharing({
  wishlistId,
  wishlistName,
  isPublic,
  shareUrl,
  onTogglePublic,
  onUpdateName,
  onGenerateShareLink
}: WishlistSharingProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(wishlistName);
  const [showShareOptions, setShowShareOptions] = useState(false);

  const handleUpdateName = () => {
    if (editName.trim() && editName !== wishlistName) {
      onUpdateName(editName.trim());
    }
    setIsEditing(false);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      // Show success toast
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const handleShare = async (platform: string) => {
    const text = `Xem danh sách yêu thích "${wishlistName}" của tôi trên FINO Store`;
    
    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(text)}`);
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`);
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + shareUrl)}`);
        break;
      case 'telegram':
        window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`);
        break;
      case 'email':
        window.open(`mailto:?subject=${encodeURIComponent('Danh sách yêu thích từ FINO Store')}&body=${encodeURIComponent(text + '\n\n' + shareUrl)}`);
        break;
    }
  };

  return (
    <div className={styles.sharingContainer}>
      <div className={styles.sharingHeader}>
        <h3>
          <FaShareAlt />
          Chia sẻ danh sách yêu thích
        </h3>
      </div>

      <div className={styles.wishlistNameSection}>
        <label>Tên danh sách:</label>
        {isEditing ? (
          <div className={styles.editNameForm}>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className={styles.nameInput}
              placeholder="Nhập tên danh sách"
            />
            <Button size="sm" onClick={handleUpdateName}>
              <FaCheck />
            </Button>
            <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
              <FaTimes />
            </Button>
          </div>
        ) : (
          <div className={styles.nameDisplay}>
            <span className={styles.wishlistName}>{wishlistName}</span>
            <button
              className={styles.editBtn}
              onClick={() => setIsEditing(true)}
            >
              <FaEdit />
            </button>
          </div>
        )}
      </div>

      <div className={styles.privacySection}>
        <div className={styles.privacyToggle}>
          <label className={styles.toggleLabel}>
            <input
              type="checkbox"
              checked={isPublic}
              onChange={onTogglePublic}
              className={styles.checkbox}
            />
            <span className={styles.toggleSlider}></span>
            Công khai danh sách
          </label>
          <p className={styles.privacyNote}>
            {isPublic 
              ? 'Danh sách có thể được xem bởi người khác thông qua link chia sẻ'
              : 'Chỉ bạn mới có thể xem danh sách này'
            }
          </p>
        </div>
      </div>

      {isPublic && (
        <div className={styles.shareSection}>
          <div className={styles.shareUrl}>
            <input
              type="text"
              value={shareUrl}
              readOnly
              className={styles.urlInput}
            />
            <Button size="sm" onClick={handleCopyLink}>
              <FaCopy />
              Copy
            </Button>
          </div>

          <div className={styles.shareActions}>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowShareOptions(!showShareOptions)}
            >
              <FaShareAlt />
              Chia sẻ qua mạng xã hội
            </Button>
            <Button size="sm" onClick={onGenerateShareLink}>
              <FaLink />
              Tạo link mới
            </Button>
          </div>

          {showShareOptions && (
            <div className={styles.shareOptions}>
              <button
                className={`${styles.shareBtn} ${styles.facebook}`}
                onClick={() => handleShare('facebook')}
              >
                <FaFacebook />
                Facebook
              </button>
              <button
                className={`${styles.shareBtn} ${styles.twitter}`}
                onClick={() => handleShare('twitter')}
              >
                <FaTwitter />
                Twitter
              </button>
              <button
                className={`${styles.shareBtn} ${styles.whatsapp}`}
                onClick={() => handleShare('whatsapp')}
              >
                <FaWhatsapp />
                WhatsApp
              </button>
              <button
                className={`${styles.shareBtn} ${styles.telegram}`}
                onClick={() => handleShare('telegram')}
              >
                <FaTelegram />
                Telegram
              </button>
              <button
                className={`${styles.shareBtn} ${styles.email}`}
                onClick={() => handleShare('email')}
              >
                <FaEnvelope />
                Email
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
