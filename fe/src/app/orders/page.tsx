'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts';
import { useApiNotification } from '@/hooks';
import { PageHeader, LoadingSpinner, Button, Pagination } from '@/app/components/ui';
import { EnhancedOrderCard, OrderStats } from './EnhancedOrderComponents';
import { orderService } from '@/services/orderService';
import { useCart } from '@/contexts';
import { OrderWithRefs } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { 
  FaShoppingBag, 
  FaEye, 
  FaClock, 
  FaCheckCircle, 
  FaTruck, 
  FaTimesCircle,
  FaFilter,
  FaSearch,
  FaTimes
} from 'react-icons/fa';
import styles from './OrdersPage.module.css';

// Order status options for filter
const ORDER_STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'pending', label: 'Chờ xác nhận' },
  { value: 'processing', label: 'Đang xử lý' },
  { value: 'shipped', label: 'Đã gửi hàng' },
  { value: 'delivered', label: 'Đã giao' },
  { value: 'cancelled', label: 'Đã hủy' }
];

interface OrderFilters {
  status: string;
  startDate: string;
  endDate: string;
}

export default function OrdersPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { showError, showSuccess } = useApiNotification();

  // States
  const [orders, setOrders] = useState<OrderWithRefs[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [limit] = useState(10);

  // Filter states
  const [filters, setFilters] = useState<OrderFilters>({
    status: '',
    startDate: '',
    endDate: ''
  });

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const { addToCart } = useCart();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/orders');
      return;
    }
  }, [user, router, authLoading]);

  // Load user orders
  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user, currentPage, filters]);

  // Handle reorder
  const handleReorder = async (order: OrderWithRefs) => {
    try {
      for (const item of order.items || []) {
        if (item.productVariant) {
          await addToCart(
            item.productVariant._id, 
            item.quantity
          );
        }
      }
      showSuccess(`Đã thêm ${order.items?.length || 0} sản phẩm vào giỏ hàng`);
      router.push('/cart');
    } catch (error) {
      showError('Có lỗi khi thêm sản phẩm vào giỏ hàng');
    }
  };

  // Handle track order
  const handleTrackOrder = (orderId: string) => {
    router.push(`/orders/${orderId}/tracking`);
  };

  // Handle review order
  const handleReview = (orderId: string) => {
    router.push(`/orders/${orderId}/review`);
  };

  // Handle download invoice
  const handleDownloadInvoice = async (orderId: string) => {
    try {
      // In a real app, this would download a PDF invoice
      showSuccess('Tính năng tải hóa đơn sẽ có sớm');
    } catch (error) {
      showError('Không thể tải hóa đơn');
    }
  };

  // Handle view details
  const handleViewDetails = (orderId: string) => {
    setSelectedOrderId(orderId);
    setShowDetailModal(true);
  };

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      
      const queryParams: any = {
        page: currentPage,
        limit,
        ...(filters.status && { status: filters.status as any }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate })
      };

      console.log('📦 Loading orders with params:', queryParams);

      const response = await orderService.getUserOrders(queryParams);
      
      let ordersData: OrderWithRefs[] = [];
      let totalCount = 0;
      let totalPagesCount = 1;

      // Handle different response structures
      if (Array.isArray(response)) {
        ordersData = response;
        totalCount = response.length;
      } else if ((response as any)?.data?.documents && Array.isArray((response as any).data.documents)) {
        ordersData = (response as any).data.documents;
        totalCount = (response as any).data.pagination?.total || (response as any).data.documents.length;
        totalPagesCount = (response as any).data.pagination?.pages || Math.ceil((response as any).data.documents.length / limit);
      } else if (response?.data && Array.isArray(response.data)) {
        ordersData = response.data;
        totalCount = (response as any).total || response.data.length;
        totalPagesCount = (response as any).pages || Math.ceil(response.data.length / limit);
      } else if ((response as any)?.orders && Array.isArray((response as any).orders)) {
        ordersData = (response as any).orders;
        totalCount = (response as any).total || (response as any).orders.length;
        totalPagesCount = (response as any).pages || 1;
      } else {
        console.warn('⚠️ Unexpected orders response structure:', response);
        ordersData = [];
      }
      
      setOrders(ordersData);
      setTotalOrders(totalCount);
      setTotalPages(totalPagesCount);
      
    } catch (error: any) {
      console.error('❌ Error loading orders:', error);
      setOrders([]);
      if (error.message && !error.message.includes('Unauthorized')) {
        showError('Không thể tải danh sách đơn hàng', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (key: keyof OrderFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      status: '',
      startDate: '',
      endDate: ''
    });
    setCurrentPage(1);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle cancel order
  const handleCancelOrder = async (orderId: string) => {
    try {
      await orderService.cancelOrder(orderId);
      showSuccess('Đã hủy đơn hàng thành công');
      loadOrders(); // Reload orders
    } catch (error: any) {
      console.error('❌ Error canceling order:', error);
      showError('Không thể hủy đơn hàng', error);
    }
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="container">
        <div className={styles.pageContainer}>
          <div className={styles.loadingSection}>
            <LoadingSpinner size="lg" />
            <p>Đang kiểm tra xác thực...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className={styles.pageContainer}>
        <PageHeader
          title="Đơn hàng của tôi"
          subtitle="Theo dõi trạng thái và lịch sử đơn hàng"
          icon={FaShoppingBag}
          breadcrumbs={[
            { label: 'Trang chủ', href: '/' },
            { label: 'Đơn hàng', href: '/orders' }
          ]}
        />

        <div className={styles.mainContent}>
          {/* Order Statistics */}
          {orders.length > 0 && (
            <OrderStats orders={orders} />
          )}
          {/* Filters Section */}
          <div className={styles.filtersSection}>
            <div className={styles.filtersGrid}>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Trạng thái</label>
                <select
                  className={styles.filterSelect}
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  {ORDER_STATUS_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Từ ngày</label>
                <input
                  type="date"
                  className={styles.filterSelect}
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                />
              </div>

              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Đến ngày</label>
                <input
                  type="date"
                  className={styles.filterSelect}
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                />
              </div>

              <div className={styles.filterActions}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  disabled={!filters.status && !filters.startDate && !filters.endDate}
                >
                  <FaTimes />
                  Xóa bộ lọc
                </Button>
              </div>
            </div>
          </div>

          {/* Orders Container */}
          <div className={styles.ordersContainer}>
            <div className={styles.ordersHeader}>
              <div>
                <h2 className={styles.ordersTitle}>
                  <FaShoppingBag />
                  Danh sách đơn hàng
                </h2>
                <p className={styles.ordersCount}>
                  {totalOrders > 0 ? `${totalOrders} đơn hàng` : 'Không có đơn hàng'}
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className={styles.loadingSection}>
                <LoadingSpinner size="lg" />
                <p>Đang tải danh sách đơn hàng...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <FaShoppingBag />
                </div>
                <h3>Chưa có đơn hàng nào</h3>
                <p>Bạn chưa có đơn hàng nào. Hãy bắt đầu mua sắm ngay!</p>
                <Button variant="primary" onClick={() => router.push('/products')}>
                  <FaShoppingBag className={styles.buttonIcon} />
                  Bắt đầu mua sắm
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-6">
                  {orders.map((order) => (
                    <EnhancedOrderCard
                      key={order._id}
                      order={order}
                      onViewDetails={handleViewDetails}
                      onReorder={handleReorder}
                      onDownloadInvoice={handleDownloadInvoice}
                      onTrackOrder={handleTrackOrder}
                      onReview={handleReview}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className={styles.paginationWrapper}>
                    <Pagination
                      pagination={{
                        page: currentPage,
                        limit: limit,
                        totalPages: totalPages,
                        totalProducts: totalOrders,
                        hasNextPage: currentPage < totalPages,
                        hasPrevPage: currentPage > 1
                      }}
                      onPageChange={handlePageChange}
                      showInfo={true}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
