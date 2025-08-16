'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useWishlist, useApiNotification, useCart, useProductStats } from '@/hooks';
import { Button, PageHeader, LoadingSpinner, Pagination } from '@/app/components/ui';
import FilterSidebar from '@/app/components/FilterSidebar';
import { WishlistItemEnhanced, WishlistQuickActions } from './WishlistEnhancements';
import { FaHeart, FaShoppingCart, FaTimes, FaBox } from 'react-icons/fa';
import { selectBestVariant, hasAvailableVariants } from '@/lib/variantUtils';
import VariantCacheService from '@/services/variantCacheService';
import styles from './WishlistPage.module.css';

// Filter and sort options
type SortOption = 'newest' | 'oldest' | 'price-asc' | 'price-desc' | 'name';
type FilterCategory = 'all' | string;

interface FilterState {
  category: FilterCategory;
  priceRange: {
    min: number;
    max: number;
  };
  sort: SortOption;
}

export default function WishlistPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { 
    wishlistItems, 
    loading, 
    error, 
    loadWishlist, 
    removeFromWishlist, 
    clearWishlist,
    hasItems,
    getWishlistItemsCount 
  } = useWishlist();
  const { showSuccess, showError } = useApiNotification();
  const { addMultipleToCart } = useCart();
  
  const variantCache = VariantCacheService.getInstance();

  // Get product stats for rating badges
  const productIds = wishlistItems.map(item => item.product._id);
  const { stats: productStats, loading: statsLoading } = useProductStats(productIds);

  // States for FilterSidebar
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Sort options for FilterSidebar
  const sortOptions = [
    { value: 'newest', label: 'Mới nhất' },
    { value: 'oldest', label: 'Cũ nhất' },
    { value: 'price-asc', label: 'Giá thấp đến cao' },
    { value: 'price-desc', label: 'Giá cao đến thấp' },
    { value: 'name', label: 'Tên A-Z' }
  ];

  // Don't redirect guest users - let them view wishlist
  // Only require login when they try to add to cart
  useEffect(() => {
    // Always load wishlist regardless of auth status (for guest users too)
    loadWishlist();
  }, [loadWishlist]);

  // Filter and sort wishlist items
  const filteredAndSortedItems = wishlistItems
    .filter(item => {
      // Search filter
      if (searchTerm && !item.product.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Category filter - Fixed to handle both parent and child categories
      if (selectedCategory !== 'all' && selectedCategory !== '') {
        const productCategory = (item.product as any).category;
        let categoryMatch = false;
        
        if (productCategory) {
          // Direct category match
          if (productCategory._id === selectedCategory) {
            categoryMatch = true;
          }
          // Parent category match
          else if (productCategory.parent === selectedCategory) {
            categoryMatch = true;
          }
        }
        
        if (!categoryMatch) {
          return false;
        }
      }

      // Price range filter
      const minPrice = priceRange.min ? parseFloat(priceRange.min) : 0;
      const maxPrice = priceRange.max ? parseFloat(priceRange.max) : Infinity;
      if (minPrice > 0 || maxPrice < Infinity) {
        const price = (item.product as any).salePrice || (item.product as any).price;
        if (price < minPrice || price > maxPrice) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          // Priority: addedAt field, fallback to createdAt
          const aDate = (a as any).addedAt || (a as any).createdAt || a.product.createdAt;
          const bDate = (b as any).addedAt || (b as any).createdAt || b.product.createdAt;
          return new Date(bDate).getTime() - new Date(aDate).getTime();
        case 'oldest':
          // Priority: addedAt field, fallback to createdAt
          const aDateOld = (a as any).addedAt || (a as any).createdAt || a.product.createdAt;
          const bDateOld = (b as any).addedAt || (b as any).createdAt || b.product.createdAt;
          return new Date(aDateOld).getTime() - new Date(bDateOld).getTime();
        case 'price-asc':
          return ((a.product as any).salePrice || (a.product as any).price) - 
                 ((b.product as any).salePrice || (b.product as any).price);
        case 'price-desc':
          return ((b.product as any).salePrice || (b.product as any).price) - 
                 ((a.product as any).salePrice || (a.product as any).price);
        case 'name':
          return a.product.name.localeCompare(b.product.name);
        default:
          return 0;
      }
    });

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedItems.length / itemsPerPage);
  const paginatedItems = filteredAndSortedItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Get unique categories from wishlist items
  const categories = Array.from(
    new Set(
      wishlistItems
        .map(item => (item.product as any).category)
        .filter((category): category is NonNullable<typeof category> => 
          category !== null && category !== undefined && typeof category === 'object' && category._id
        )
        .map(category => category._id)
    )
  ).map(categoryId => {
    const item = wishlistItems.find(item => {
      const productCategory = (item.product as any).category;
      return productCategory && typeof productCategory === 'object' && productCategory._id === categoryId;
    });
    const category = (item?.product as any).category;
    return {
      id: categoryId,
      name: category?.name || 'Unknown'
    };
  });

  // Handle filter changes - similar to products page
  const handleSearchChange = (search: string) => {
    setSearchTerm(search);
    setCurrentPage(1);
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
    setCurrentPage(1);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  const handlePriceRangeChange = (range: { min: string; max: string }) => {
    setPriceRange(range);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSortBy('newest');
    setSelectedCategory('all');
    setPriceRange({ min: '', max: '' });
    setCurrentPage(1);
  };

  // Handle add all to cart - ULTRA OPTIMIZED version with parallel processing
  const handleAddAllToCart = async () => {
    if (!hasWishlistItems) return;
    
    // Check if user is logged in - require login for cart operations
    if (!user) {
      showError('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng');
      router.push('/login?redirect=/wishlist');
      return;
    }
    
    try {
      console.log('🚀 Starting optimized batch add to cart...');
      
      // Step 1: Process all variants in parallel (much faster)
      const variantPromises = wishlistItems.map(async (item, index) => {
        try {
          console.log(`🔄 Processing item ${index + 1}/${wishlistItems.length}: ${item.product.name}`);
          
          let variants = item.product.variants;
          
          // If variants not loaded, lazy load them in parallel
          if (!variants || variants.length === 0) {
            console.log(`📦 Loading variants for ${item.product.name}...`);
            const loadedVariants = await variantCache.getProductVariants(item.product._id);
            variants = loadedVariants as any;
            console.log(`✅ Loaded ${variants?.length || 0} variants for ${item.product.name}`);
          }

          if (!variants || variants.length === 0) {
            console.warn(`❌ No variants found for ${item.product.name}`);
            return null;
          }

          // Check if there are available variants
          if (!hasAvailableVariants(variants as any)) {
            console.warn(`❌ Product ${item.product.name} is out of stock`);
            return null;
          }

          // Use smart variant selection
          const bestVariant = selectBestVariant(variants as any, {
            strategy: 'smart',
            preferredColorOrder: ['black', 'đen', 'white', 'trắng', 'blue', 'xanh dương', 'navy', 'xanh navy', 'gray', 'xám'],
            preferredSizeOrder: ['M', 'L', 'XL', 'S', 'XXL', '39', '40', '41', '42', '43']
          });

          if (bestVariant && bestVariant._id) {
            // CRITICAL: Validate and clean variant ID
            let variantId: any = bestVariant._id;
            
            // Convert ObjectId to string if needed
            if (typeof variantId === 'object' && variantId && typeof variantId.toString === 'function') {
              variantId = variantId.toString();
            }
            
            // Ensure it's a clean 24-character hex string (MongoDB ObjectId format)
            const cleanId = String(variantId).trim();
            if (!/^[0-9a-fA-F]{24}$/.test(cleanId)) {
              console.warn(`❌ Invalid ObjectId format for ${item.product.name}: "${cleanId}"`);
              return null;
            }
            
            console.log(`✅ Selected variant for ${item.product.name}: ${cleanId}`);
            return { 
              productVariantId: cleanId, 
              quantity: 1,
              productName: item.product.name // For debugging
            };
          } else {
            console.warn(`❌ No suitable variant found for ${item.product.name}`);
            return null;
          }
        } catch (error) {
          console.error(`❌ Error processing ${item.product.name}:`, error);
          return null;
        }
      });

      // Wait for ALL variant processing to complete in parallel
      console.log('⏱️ Processing variants in parallel...');
      const variantResults = await Promise.allSettled(variantPromises);
      
      // Collect valid cart items with ENHANCED duplicate detection
      const cartItemsMap = new Map<string, { productVariantId: string; quantity: number; productName: string }>();
      let errorCount = 0;
      
      console.log(`📊 Processing ${variantResults.length} variant results...`);
      
      variantResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          const item = result.value;
          const variantId = item.productVariantId;
          
          console.log(`📝 Item ${index + 1}: ${item.productName} → Variant ID: ${variantId}`);
          
          // Check for duplicates and merge quantities
          if (cartItemsMap.has(variantId)) {
            const existing = cartItemsMap.get(variantId)!;
            existing.quantity += item.quantity;
            console.log(`🔄 MERGED duplicate variant ${variantId} (${item.productName}): quantity now ${existing.quantity}`);
          } else {
            cartItemsMap.set(variantId, {
              productVariantId: variantId,
              quantity: item.quantity,
              productName: item.productName
            });
            console.log(`➕ ADDED new variant ${variantId} (${item.productName}): quantity ${item.quantity}`);
          }
        } else {
          errorCount++;
          console.log(`❌ Item ${index + 1}: Failed to process`);
        }
      });

      // Convert map to array and remove productName for API call
      const cartItems = Array.from(cartItemsMap.values()).map(item => ({
        productVariantId: item.productVariantId,
        quantity: item.quantity
      }));
      
      console.log(`📦 Final result: ${cartItems.length} unique items for batch add to cart`);
      console.log('📋 Unique cart items:', cartItems.map((item, index) => ({ 
        index: index + 1,
        productVariantId: item.productVariantId, 
        quantity: item.quantity 
      })));
      
      // Verify no duplicates in final array
      const variantIds = cartItems.map(item => item.productVariantId);
      const uniqueIds = new Set(variantIds);
      if (variantIds.length !== uniqueIds.size) {
        console.error('🚨 CRITICAL: Still have duplicates in final cart items!');
        console.error('All IDs:', variantIds);
        console.error('Unique IDs:', Array.from(uniqueIds));
      } else {
        console.log('✅ VERIFIED: No duplicates in final cart items');
      }

      // Step 2: Add all items to cart in ONE batch API call
      if (cartItems.length > 0) {
        try {
          const { successCount, errorCount: batchErrorCount } = await addMultipleToCart(cartItems);
          errorCount += batchErrorCount;
          
          if (successCount > 0) {
            showSuccess(`Đã thêm ${successCount} sản phẩm vào giỏ hàng`);
            // Navigate to cart after batch completes
            router.push('/cart');
          }
        } catch (error) {
          console.error('❌ Batch add to cart failed:', error);
          errorCount += cartItems.length;
        }
      }
      
      if (errorCount > 0) {
        showError(`Không thể thêm ${errorCount} sản phẩm vào giỏ hàng`);
      }
      
      if (cartItems.length === 0) {
        showError('Không có sản phẩm nào có thể thêm vào giỏ hàng');
      }
      
      console.log('✅ Batch add to cart completed!');
    } catch (error) {
      console.error('Error in handleAddAllToCart:', error);
      showError('Có lỗi xảy ra khi thêm sản phẩm vào giỏ hàng');
    }
  };

  // Handle clear wishlist
  const handleClearWishlist = async () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tất cả sản phẩm khỏi danh sách yêu thích?')) {
      try {
        await clearWishlist();
        showSuccess('Đã xóa tất cả sản phẩm khỏi danh sách yêu thích');
      } catch (error) {
        showError('Không thể xóa danh sách yêu thích');
      }
    }
  };

  // Handle remove single item
  const handleRemoveItem = async (productId: string) => {
    try {
      await removeFromWishlist(productId);
      showSuccess('Đã xóa sản phẩm khỏi danh sách yêu thích');
    } catch (error) {
      showError('Không thể xóa sản phẩm');
    }
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="container">
        <div className={styles.pageContainer}>
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  const hasWishlistItems = hasItems();
  const itemsCount = getWishlistItemsCount();

  return (
    <div className="container">
      <div className={styles.pageContainer}>
        {/* Page Header - Consistent with products page */}
        <PageHeader
          title="Danh sách yêu thích"
          subtitle={hasWishlistItems ? `Tìm thấy ${filteredAndSortedItems.length} sản phẩm yêu thích` : 'Chưa có sản phẩm nào trong danh sách yêu thích'}
          icon={FaHeart}
          breadcrumbs={[
            { label: 'Trang chủ', href: '/' },
            { label: 'Danh sách yêu thích', href: '/wishlist' }
          ]}
        />

        {/* Main Content */}
        {hasWishlistItems ? (
          <div className={styles.contentWrapper}>
            {/* FilterSidebar */}
            <FilterSidebar
              searchTerm={searchTerm}
              onSearchChange={handleSearchChange}
              sortBy={sortBy}
              sortOptions={[
                { value: 'newest', label: 'Mới nhất' },
                { value: 'oldest', label: 'Cũ nhất' },
                { value: 'price-asc', label: 'Giá thấp đến cao' },
                { value: 'price-desc', label: 'Giá cao đến thấp' },
                { value: 'name', label: 'Tên A-Z' }
              ]}
              onSortChange={handleSortChange}
              selectedCategory={selectedCategory}
              onCategoryChange={handleCategoryChange}
              priceRange={priceRange}
              onPriceRangeChange={handlePriceRangeChange}
              onClearFilters={handleClearFilters}
            />

            {/* Wishlist Container */}
            <div className={styles.wishlistContainer}>
              {paginatedItems.length > 0 ? (
                <>
                  {/* Enhanced Wishlist Actions */}
                  <WishlistQuickActions
                    totalItems={wishlistItems.length}
                    filteredItems={filteredAndSortedItems.length}
                    onClearAll={handleClearWishlist}
                    onAddAllToCart={handleAddAllToCart}
                    onSelectMode={() => setIsSelectMode(!isSelectMode)}
                    isSelectMode={isSelectMode}
                  />

                  {/* Wishlist Items Grid */}
                  <div className={styles.wishlistItems}>
                    {paginatedItems.map((item, index) => (
                      <WishlistItemEnhanced
                        key={`${item._id || item.product._id}-${index}`}
                        item={item}
                        index={index}
                        productStats={productStats}
                        onRemove={handleRemoveItem}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <Pagination
                      pagination={{
                        page: currentPage,
                        totalPages: totalPages,
                        limit: itemsPerPage,
                        totalProducts: filteredAndSortedItems.length,
                        hasNextPage: currentPage < totalPages,
                        hasPrevPage: currentPage > 1
                      }}
                      onPageChange={setCurrentPage}
                    />
                  )}
                </>
              ) : (
                <div className={styles.noResults}>
                  <FaBox className={styles.noResultsIcon} />
                  <h3>Không tìm thấy sản phẩm nào</h3>
                  <p>Thử thay đổi bộ lọc hoặc tìm kiếm sản phẩm khác</p>
                  <Button onClick={handleClearFilters}>
                    Xóa bộ lọc
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className={styles.emptyState}>
            <div className={styles.emptyStateContent}>
              <FaHeart className={styles.emptyStateIcon} />
              <h2 className={styles.emptyStateTitle}>Danh sách yêu thích trống</h2>
              <p className={styles.emptyStateText}>
                Bạn chưa có sản phẩm nào trong danh sách yêu thích. 
                Hãy khám phá và thêm những sản phẩm yêu thích của bạn!
              </p>
              <div className={styles.emptyStateActions}>
                <Button
                  onClick={() => router.push('/products')}
                  className={styles.exploreButton}
                >
                  <FaShoppingCart />
                  Khám phá sản phẩm
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/')}
                  className={styles.homeButton}
                >
                  Về trang chủ
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}