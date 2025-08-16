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
  FaPlus,
  FaCompressArrowsAlt,
  FaShareAlt
} from 'react-icons/fa';
import ProductItem from '@/app/components/ProductItem';
import { selectBestVariant, hasAvailableVariants } from '@/utils/variantUtils';
import styles from './WishlistEnhancements.module.css';

interface WishlistItemEnhancedProps {
  item: any;
  index: number;
  productStats: any;
  onRemove: (productId: string) => Promise<void>;
}

export function WishlistItemEnhanced({ 
  item, 
  index, 
  productStats, 
  onRemove 
}: WishlistItemEnhancedProps) {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { showSuccess, showError } = useApiNotification();
  const [isAdding, setIsAdding] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

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

  const stockInfo = getStockStatus();

  return (
    <div className={styles.wishlistItemCard}>
      {/* Header with actions */}
      <div className={styles.cardHeader}>
        <div className={styles.addedInfo}>
          <span className={styles.addedDate}>
            Đã thêm: {addedDate.toLocaleDateString('vi-VN')}
          </span>
          <span className={`${styles.stockStatus} ${stockInfo.className}`}>
            {stockInfo.label}
          </span>
        </div>
        <div className={styles.cardActions}>
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
}

export function WishlistQuickActions({
  totalItems,
  filteredItems,
  onClearAll,
  onAddAllToCart,
  onSelectMode,
  isSelectMode
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
