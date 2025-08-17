import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WishlistItem } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { hasAvailableVariants } from '@/lib/variantUtils';
import { 
  FaHeart, 
  FaShoppingCart, 
  FaTimes, 
  FaBox, 
  FaEye,
  FaStar,
  FaTag,
  FaCheckCircle,
  FaExclamationTriangle
} from 'react-icons/fa';

interface EnhancedWishlistItemProps {
  item: WishlistItem;
  onRemove: (productId: string) => void;
  onAddToCart: (productId: string, variantId?: string) => void;
  onViewProduct: (productId: string) => void;
  isRemoving?: boolean;
  isAddingToCart?: boolean;
}

export function EnhancedWishlistItem({ 
  item, 
  onRemove, 
  onAddToCart, 
  onViewProduct,
  isRemoving = false,
  isAddingToCart = false
}: EnhancedWishlistItemProps) {
  const [imageError, setImageError] = useState(false);
  const router = useRouter();
  
  const product = item.product;
  const hasDiscount = product.discountPercent && product.discountPercent > 0;
  const discountedPrice = hasDiscount 
    ? product.price * (1 - product.discountPercent! / 100) 
    : product.price;

  // Check stock status (using variants or a different approach)
  const isInStock = hasAvailableVariants ? hasAvailableVariants(product as any) : product.isActive !== false;
  const isLowStock = false; // This would need variant data to determine

  const handleImageError = () => {
    setImageError(true);
  };

  const handleViewProduct = () => {
    router.push(`/products/${product._id}`);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 group">
      <div className="p-6">
        <div className="flex gap-4">
          {/* Product Image */}
          <div className="relative w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
            {!imageError && product.images?.[0] ? (
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={handleImageError}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <FaBox className="w-8 h-8" />
              </div>
            )}

            {/* Stock Status Indicator */}
            <div className="absolute top-2 right-2">
              {isInStock ? (
                isLowStock ? (
                  <div className="bg-yellow-100 text-yellow-800 text-xs px-1.5 py-0.5 rounded-full border border-yellow-300">
                    <FaExclamationTriangle className="w-3 h-3" />
                  </div>
                ) : (
                  <div className="bg-green-100 text-green-800 text-xs px-1.5 py-0.5 rounded-full border border-green-300">
                    <FaCheckCircle className="w-3 h-3" />
                  </div>
                )
              ) : (
                <div className="bg-red-100 text-red-800 text-xs px-1.5 py-0.5 rounded-full border border-red-300">
                  <FaTimes className="w-3 h-3" />
                </div>
              )}
            </div>

            {/* Discount Badge */}
            {hasDiscount && (
              <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                -{product.discountPercent}%
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-2">
              <h3 
                className="font-semibold text-gray-900 text-lg line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors"
                onClick={handleViewProduct}
              >
                {product.name}
              </h3>
              
              <button
                onClick={() => onRemove(product._id)}
                disabled={isRemoving}
                className="ml-3 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
                title="Xóa khỏi danh sách yêu thích"
              >
                {isRemoving ? (
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                ) : (
                  <FaTimes className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Category & Rating */}
            <div className="flex items-center gap-3 mb-2 text-sm text-gray-600">
              {product.category && (
                <div className="flex items-center gap-1">
                  <FaTag className="w-3 h-3" />
                  <span>{product.category.name}</span>
                </div>
              )}
              
              {product.averageRating && product.averageRating > 0 && (
                <div className="flex items-center gap-1">
                  <FaStar className="w-3 h-3 text-yellow-500" />
                  <span>{product.averageRating.toFixed(1)}</span>
                  {product.reviewCount && (
                    <span className="text-gray-500">({product.reviewCount})</span>
                  )}
                </div>
              )}
            </div>

            {/* Price */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl font-bold text-gray-900">
                {formatCurrency(discountedPrice)}
              </span>
              {hasDiscount && (
                <span className="text-sm text-gray-500 line-through">
                  {formatCurrency(product.price)}
                </span>
              )}
            </div>

            {/* Stock Status */}
            <div className="mb-3">
              {isInStock ? (
                isLowStock ? (
                  <span className="text-sm text-yellow-600 font-medium">
                    Chỉ còn {product.stock} sản phẩm
                  </span>
                ) : (
                  <span className="text-sm text-green-600 font-medium">
                    Còn hàng
                  </span>
                )
              ) : (
                <span className="text-sm text-red-600 font-medium">
                  Hết hàng
                </span>
              )}
            </div>

            {/* Added Date */}
            <div className="text-xs text-gray-500 mb-4">
              Đã thêm: {new Date(item.createdAt).toLocaleDateString('vi-VN')}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <button
            onClick={handleViewProduct}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <FaEye className="w-4 h-4" />
            Xem chi tiết
          </button>

          <button
            onClick={() => onAddToCart(product._id)}
            disabled={!isInStock || isAddingToCart}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              isInStock
                ? 'text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50'
                : 'text-gray-500 bg-gray-200 cursor-not-allowed'
            }`}
          >
            {isAddingToCart ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Đang thêm...
              </>
            ) : (
              <>
                <FaShoppingCart className="w-4 h-4" />
                {isInStock ? 'Thêm vào giỏ' : 'Hết hàng'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Wishlist Statistics Component
interface WishlistStatsProps {
  items: WishlistItem[];
  loading?: boolean;
}

export function WishlistStats({ items, loading }: WishlistStatsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white p-4 rounded-xl shadow-sm border animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-6 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const stats = {
    total: items.length,
    inStock: items.filter(item => hasAvailableVariants(item.product as any) || item.product.isActive !== false).length,
    onSale: items.filter(item => item.product.discountPercent && item.product.discountPercent > 0).length,
    totalValue: items.reduce((sum, item) => {
      const price = item.product.discountPercent 
        ? item.product.price * (1 - item.product.discountPercent / 100)
        : item.product.price;
      return sum + price;
    }, 0)
  };

  const statCards = [
    {
      label: 'Tổng sản phẩm',
      value: stats.total,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      icon: <FaHeart className="w-5 h-5" />
    },
    {
      label: 'Còn hàng',
      value: stats.inStock,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      icon: <FaCheckCircle className="w-5 h-5" />
    },
    {
      label: 'Đang giảm giá',
      value: stats.onSale,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      icon: <FaTag className="w-5 h-5" />
    },
    {
      label: 'Tổng giá trị',
      value: formatCurrency(stats.totalValue),
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      icon: <FaShoppingCart className="w-5 h-5" />
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {statCards.map((stat, index) => (
        <div key={index} className={`p-4 rounded-xl shadow-sm border ${stat.bgColor}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
              <p className={`text-xl font-bold ${stat.color}`}>
                {typeof stat.value === 'number' && stat.label !== 'Tổng giá trị' 
                  ? stat.value.toLocaleString() 
                  : stat.value}
              </p>
            </div>
            <div className={stat.color}>
              {stat.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Quick Actions Component
interface WishlistQuickActionsProps {
  onClearAll: () => void;
  onAddAllToCart: () => void;
  onSortChange: (sort: string) => void;
  onFilterChange: (filter: any) => void;
  totalItems: number;
  inStockItems: number;
}

export function WishlistQuickActions({ 
  onClearAll, 
  onAddAllToCart, 
  onSortChange, 
  onFilterChange,
  totalItems,
  inStockItems
}: WishlistQuickActionsProps) {
  const [sortBy, setSortBy] = useState('newest');

  const handleSortChange = (value: string) => {
    setSortBy(value);
    onSortChange(value);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <h3 className="font-semibold text-gray-900">
            Danh sách yêu thích ({totalItems})
          </h3>
          {inStockItems > 0 && (
            <span className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded-full">
              {inStockItems} còn hàng
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <select 
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
            <option value="price-asc">Giá thấp → cao</option>
            <option value="price-desc">Giá cao → thấp</option>
            <option value="name">Tên A → Z</option>
          </select>

          {inStockItems > 0 && (
            <button
              onClick={onAddAllToCart}
              className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <FaShoppingCart className="inline w-3 h-3 mr-1" />
              Thêm tất cả vào giỏ
            </button>
          )}

          {totalItems > 0 && (
            <button
              onClick={onClearAll}
              className="px-4 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
            >
              <FaTimes className="inline w-3 h-3 mr-1" />
              Xóa tất cả
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default EnhancedWishlistItem;
