'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts';
import { PageHeader, Button } from '@/app/components/ui';
import { orderService } from '@/services';
import { OrderWithRefs } from '@/types';
import { formatCurrency } from '@/lib/utils';
import OrderInvoice from './OrderInvoice';
import styles from './OrderDetail.module.css';

const ORDER_STATUS_CONFIG = {
  pending: {
    label: 'Chờ xử lý',
    icon: '⏳',
    className: styles.statusPending
  },
  processing: {
    label: 'Đang xử lý',
    icon: '🔄',
    className: styles.statusProcessing
  },
  shipped: {
    label: 'Đang giao hàng',
    icon: '🚚',
    className: styles.statusShipped
  },
  delivered: {
    label: 'Đã giao hàng',
    icon: '✅',
    className: styles.statusDelivered
  },
  cancelled: {
    label: 'Đã hủy',
    icon: '❌',
    className: styles.statusCancelled
  }
};

// Danh sách tài xế giao hàng
const DELIVERY_DRIVERS = [
  {
    id: 'DRV001',
    name: 'Nguyễn Văn Minh',
    phone: '0123456789',
    vehicle: 'Honda Wave',
    rating: 4.8,
    completedDeliveries: 1247,
    avatar: '🚴‍♂️',
    status: 'active'
  },
  {
    id: 'DRV002', 
    name: 'Trần Thị Lan',
    phone: '0987654321',
    vehicle: 'Yamaha Sirius',
    rating: 4.9,
    completedDeliveries: 892,
    avatar: '🛵',
    status: 'active'
  },
  {
    id: 'DRV003',
    name: 'Lê Hoàng Nam',
    phone: '0369852147',
    vehicle: 'Honda Air Blade',
    rating: 4.7,
    completedDeliveries: 1534,
    avatar: '🏍️',
    status: 'active'
  },
  {
    id: 'DRV004',
    name: 'Phạm Văn Chiều',
    phone: '0365252576',
    vehicle: 'Honda Lead',
    rating: 4.6,
    completedDeliveries: 756,
    avatar: '🛴',
    status: 'active'
  },
  {
    id: 'DRV005',
    name: 'Võ Thị Mai',
    phone: '0912345678',
    vehicle: 'SH Mode',
    rating: 5.0,
    completedDeliveries: 2103,
    avatar: '🛵',
    status: 'active'
  },
  {
    id: 'DRV006',
    name: 'Đặng Văn Long',
    phone: '0898765432',
    vehicle: 'Exciter 150',
    rating: 4.4,
    completedDeliveries: 445,
    avatar: '🏍️',
    status: 'active'
  },
  {
    id: 'DRV007',
    name: 'Hoàng Thị Hương',
    phone: '0876543210',
    vehicle: 'Honda Vision',
    rating: 4.9,
    completedDeliveries: 1687,
    avatar: '🛵',
    status: 'active'
  },
  {
    id: 'DRV008',
    name: 'Bùi Văn Tú',
    phone: '0345678912',
    vehicle: 'Suzuki Raider',
    rating: 4.5,
    completedDeliveries: 923,
    avatar: '🏍️',
    status: 'active'
  },
  {
    id: 'DRV009',
    name: 'Đinh Thị Nga',
    phone: '0723456789',
    vehicle: 'Piaggio Liberty',
    rating: 4.8,
    completedDeliveries: 1456,
    avatar: '🛴',
    status: 'active'
  },
  {
    id: 'DRV010',
    name: 'Vũ Văn Đức',
    phone: '0634567891',
    vehicle: 'Kawasaki Z125',
    rating: 4.7,
    completedDeliveries: 834,
    avatar: '🏍️',
    status: 'active'
  }
];

// Hàm random tài xế dựa trên order ID
const getAssignedDriver = (orderCode: string) => {
  if (!orderCode) return null;
  const hash = orderCode.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  const index = Math.abs(hash) % DELIVERY_DRIVERS.length;
  return DELIVERY_DRIVERS[index];
};

// Hàm tạo mã vận đơn thực tế từ order
const generateTrackingCode = (orderCode: string, orderId: string) => {
  if (!orderCode) return null;
  // Tạo mã vận đơn dựa trên orderCode và orderId
  const orderNumber = orderCode.replace('FINO', '').replace(/\D/g, '');
  const idSuffix = orderId ? orderId.slice(-4).toUpperCase() : '0000';
  return `VD${orderNumber}${idSuffix}`;
};

// Hàm tạo link theo dõi đơn hàng thực tế
const getTrackingUrl = (trackingCode: string) => {
  if (!trackingCode) return null;
  return `https://tracking.fino.vn/track/${trackingCode}`;
};

// Hàm tạo thông tin vận chuyển chi tiết
const getShippingInfo = (status: string, createdAt: string) => {
  const orderDate = new Date(createdAt);
  const now = new Date();
  const diffHours = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60));
  
  switch(status) {
    case 'shipped':
      return {
        statusText: 'Đang giao hàng',
        estimatedTime: 'Dự kiến giao trong 1-2 ngày',
        trackingStatus: 'Đang vận chuyển',
        canTrack: true
      };
    case 'delivered':
      return {
        statusText: 'Đã giao thành công',
        estimatedTime: 'Đã giao hàng hoàn tất',
        trackingStatus: 'Giao hàng thành công',
        canTrack: true
      };
    default:
      return {
        statusText: 'Đang xử lý',
        estimatedTime: 'Đang chuẩn bị hàng',
        trackingStatus: 'Chưa có thông tin vận chuyển',
        canTrack: false
      };
  }
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<OrderWithRefs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [hasRefreshedFromPayment, setHasRefreshedFromPayment] = useState(false);

  const fetchOrderDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Fetching order detail for ID:', orderId);
      const orderData = await orderService.getOrderById(orderId);
      console.log('✅ Order data received:', orderData);
      setOrder(orderData);
    } catch (err: any) {
      console.error('❌ Error fetching order detail:', err);
      setError(err.message || 'Có lỗi xảy ra khi tải đơn hàng');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    console.log('🔍 Auth state:', { user: !!user, authLoading, isAuthenticated, orderId });
    
    if (authLoading) {
      console.log('⏳ Auth still loading...');
      return; // Wait for auth to load
    }
    
    if (orderId) {
      console.log('✅ Proceeding to fetch order');
      fetchOrderDetail();
    }
  }, [orderId, authLoading, fetchOrderDetail]);

  // Force refresh order data when coming from payment success - only once
  useEffect(() => {
    const fromPayment = searchParams.get('fromPayment');
    const refresh = searchParams.get('refresh');
    
    if ((fromPayment === 'true' || refresh === 'true') && orderId && !hasRefreshedFromPayment) {
      console.log('🔄 Force refreshing order data after payment');
      setHasRefreshedFromPayment(true);
      
      // Clear the query parameters to prevent further refreshes
      const url = new URL(window.location.href);
      url.searchParams.delete('fromPayment');
      url.searchParams.delete('refresh');
      router.replace(url.pathname + url.search, { scroll: false });
      
      // Small delay to ensure VNPay callback has completed
      setTimeout(() => {
        fetchOrderDetail();
      }, 1000);
    }
  }, [searchParams, orderId, hasRefreshedFromPayment, fetchOrderDetail, router]);

  const handleCancelOrder = async () => {
    if (!order || !window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) {
      return;
    }

    try {
      await orderService.cancelOrder(order._id);
      // Refresh order data
      fetchOrderDetail();
    } catch (err: any) {
      console.error('Error cancelling order:', err);
      alert('Không thể hủy đơn hàng: ' + (err.message || 'Có lỗi xảy ra'));
    }
  };

  const handlePrint = () => {
    setShowInvoice(true);
    // Wait for invoice to render, then print
    setTimeout(() => {
      const invoiceElement = document.getElementById('order-invoice');
      if (invoiceElement) {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>Hóa đơn #${order?.orderCode}</title>
                <style>
                  * { margin: 0; padding: 0; box-sizing: border-box; }
                  body { font-family: Arial, sans-serif; }
                </style>
              </head>
              <body>
                ${invoiceElement.outerHTML}
              </body>
            </html>
          `);
          printWindow.document.close();
          printWindow.print();
          printWindow.close();
        }
      }
      setShowInvoice(false);
    }, 100);
  };

  const getStatusConfig = (status: string) => {
    return ORDER_STATUS_CONFIG[status as keyof typeof ORDER_STATUS_CONFIG] || {
      label: status,
      icon: '❓',
      className: styles.statusPending
    };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canCancelOrder = (status: string) => {
    return ['pending', 'processing'].includes(status);
  };

  if (authLoading || loading) {
    return (
      <div className="container">
        <div className={styles.pageContainer}>
          <PageHeader
            title="Chi tiết đơn hàng"
            breadcrumbs={[
              { label: 'Trang chủ', href: '/' },
              { label: 'Đơn hàng', href: '/orders' },
              { label: 'Chi tiết', href: '' }
            ]}
          />
          
          <div className={styles.mainContent}>
            <div className={styles.loadingSection}>
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Đang tải...</span>
              </div>
              <p>{authLoading ? 'Đang xác thực...' : 'Đang tải thông tin đơn hàng...'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || (!loading && !order)) {
    console.log('🚨 Showing error state:', { error, loading, order: !!order });
    return (
      <div className="container">
        <div className={styles.pageContainer}>
          <PageHeader
            title="Chi tiết đơn hàng"
            breadcrumbs={[
              { label: 'Trang chủ', href: '/' },
              { label: 'Đơn hàng', href: '/orders' },
              { label: 'Chi tiết', href: '' }
            ]}
          />
          
          <div className={styles.mainContent}>
            <div className={styles.errorState}>
              <div className={styles.errorIcon}>📋</div>
              <h2>Không tìm thấy đơn hàng</h2>
              <p>{error || 'Đơn hàng không tồn tại hoặc bạn không có quyền truy cập'}</p>
              <Button
                variant="primary"
                size="lg"
                onClick={() => router.push('/orders')}
              >
                Quay lại danh sách đơn hàng
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(order?.status || 'pending');

  console.log('🎯 About to render order detail:', { order: !!order, orderCode: order?.orderCode });

  return (
    <div className="container">
      <div className={styles.pageContainer}>
        <PageHeader
          title="Chi tiết đơn hàng"
          breadcrumbs={[
            { label: 'Trang chủ', href: '/' },
            { label: 'Đơn hàng', href: '/orders' },
            { label: order?.orderCode || 'Chi tiết', href: '' }
          ]}
        />

        <div className={styles.mainContent}>
          {!order ? (
            <div className={styles.errorState}>
              <div className={styles.errorIcon}>📋</div>
              <h2>Đang tải dữ liệu...</h2>
              <p>Vui lòng chờ trong giây lát</p>
            </div>
          ) : (
            <>
              {/* Order Header */}
              <div className={styles.orderHeader}>
                <div className={styles.orderHeaderTop}>
                  <div className={styles.orderInfo}>
                    <h1 className={styles.orderCode}>#{order.orderCode}</h1>
                    <div className={styles.orderDate}>
                      <span>📅</span>
                      <span>Đặt hàng lúc: {formatDate(order.createdAt)}</span>
                    </div>
                  </div>
                  
                  <div className={styles.orderActions}>
                    <div className={`${styles.orderStatus} ${statusConfig.className}`}>
                      <span className={styles.statusIcon}>{statusConfig.icon}</span>
                      <span>{statusConfig.label}</span>
                    </div>
                    
                    {/* Refresh button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchOrderDetail}
                      disabled={loading}
                      className={styles.refreshButton}
                    >
                      🔄 Cập nhật
                    </Button>
                    
                    {canCancelOrder(order.status) && (
                      <Button
                        variant="outline"
                        size="md"
                        onClick={handleCancelOrder}
                        className={styles.cancelButton}
                      >
                        Hủy đơn hàng
                      </Button>
                    )}
                    
                    {/* Print Invoice button */}
                    <Button
                      variant="outline"
                      size="md"
                      onClick={handlePrint}
                      className={styles.printButton}
                    >
                      🖨️ In đơn hàng
                    </Button>
                  </div>
                </div>

                <div className={styles.orderMeta}>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Tổng tiền</span>
                    <span className={`${styles.metaValue} ${styles.orderTotal}`}>
                      {formatCurrency(order.finalTotal || 0)}
                    </span>
                  </div>
                  
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Phương thức thanh toán</span>
                    <span className={styles.metaValue}>
                      {order.paymentMethod?.method || 'Chưa xác định'}
                    </span>
                  </div>
                  
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Số lượng sản phẩm</span>
                    <span className={styles.metaValue}>
                      {order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0} sản phẩm
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.contentGrid}>
                {/* Order Items */}
                <div className={styles.orderItemsSection}>
                  <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>
                      <span className={styles.sectionIcon}>📦</span>
                      Sản phẩm đã đặt
                    </h3>
                  </div>
                  
                  <div className={styles.orderItemsList}>
                    {order.items?.map((item, index) => (
                      <div key={index} className={styles.orderItem}>
                        <div className={styles.itemImage}>
                          {item.productVariant?.product?.images?.[0] ? (
                            <img
                              src={item.productVariant.product.images[0]}
                              alt={item.productVariant.product.name}
                            />
                          ) : (
                            <span>📷</span>
                          )}
                        </div>
                        
                        <div className={styles.itemDetails}>
                          <h4 className={styles.itemName}>
                            {item.productVariant?.product?.name || 'Sản phẩm không xác định'}
                          </h4>
                          <div className={styles.itemVariant}>
                            Màu: {item.productVariant?.color?.name || 'N/A'} • 
                            Size: {item.productVariant?.size?.name || 'N/A'}
                          </div>
                          <div className={styles.itemPrice}>
                            {formatCurrency(item.price)} / sản phẩm
                          </div>
                        </div>
                        
                        <div className={styles.itemQuantity}>
                          x{item.quantity}
                        </div>
                        
                        <div className={styles.itemTotal}>
                          {formatCurrency(item.price * item.quantity)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sidebar */}
                <div className={styles.sidebar}>
                  {/* Shipping Address */}
                  <div className={styles.sidebarCard}>
                    <div className={styles.sectionHeader}>
                      <h3 className={styles.sectionTitle}>
                        <span className={styles.sectionIcon}>🏠</span>
                        Địa chỉ giao hàng
                      </h3>
                    </div>
                    
                    <div className={styles.cardContent}>
                      <div className={styles.addressInfo}>
                        <div className={styles.addressLine}>
                          <span className={styles.addressLabel}>Người nhận:</span>
                          <span className={styles.addressValue}>
                            {order.address?.fullName || 'N/A'}
                          </span>
                        </div>
                        
                        <div className={styles.addressLine}>
                          <span className={styles.addressLabel}>Số điện thoại:</span>
                          <span className={styles.addressValue}>
                            {order.address?.phone || 'N/A'}
                          </span>
                        </div>
                        
                        <div className={styles.fullAddress}>
                          <p>
                            {order.address?.addressLine && (
                              <>
                                {order.address.addressLine}
                                <br />
                              </>
                            )}
                            {order.address?.ward && `${order.address.ward}, `}
                            {order.address?.district && `${order.address.district}, `}
                            {order.address?.city}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className={styles.sidebarCard}>
                    <div className={styles.sectionHeader}>
                      <h3 className={styles.sectionTitle}>
                        <span className={styles.sectionIcon}>💳</span>
                        Thanh toán
                      </h3>
                    </div>
                    
                    <div className={styles.cardContent}>
                      <div className={styles.paymentMethod}>
                        <div className={styles.paymentIcon}>💰</div>
                        <div className={styles.paymentDetails}>
                          <h4>{order.paymentMethod?.method || 'Thanh toán khi nhận hàng'}</h4>
                          <p className={
                            order.paymentStatus === 'paid' ? styles.paymentPaid : 
                            order.paymentStatus === 'failed' ? styles.paymentFailed :
                            styles.paymentPending
                          }>
                            Trạng thái: {
                              order.paymentStatus === 'paid' ? 'Đã thanh toán' : 
                              order.paymentStatus === 'pending' ? 'Chờ thanh toán' : 
                              order.paymentStatus === 'failed' ? 'Thanh toán thất bại' :
                              'Chưa thanh toán'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Driver Info - Show for all orders but different content based on status */}
                  {order && (() => {
                    const assignedDriver = getAssignedDriver(order.orderCode);
                    const trackingCode = generateTrackingCode(order.orderCode, order._id);
                    const trackingUrl = trackingCode ? getTrackingUrl(trackingCode) : null;
                    const shippingInfo = getShippingInfo(order.status, order.createdAt);
                    
                    return assignedDriver && trackingCode ? (
                      <div className={styles.sidebarCard}>
                        <div className={styles.sectionHeader}>
                          <h3 className={styles.sectionTitle}>
                            <span className={styles.sectionIcon}>🚚</span>
                            Thông tin giao hàng
                          </h3>
                        </div>
                        
                        <div className={styles.cardContent}>
                          <div className={styles.driverInfo}>
                            {/* Always show driver assignment info */}
                            <div className={styles.driverHeader}>
                              <div className={styles.driverAvatar}>
                                {assignedDriver.avatar}
                              </div>
                              <div className={styles.driverBasicInfo}>
                                <div className={styles.driverTitle}>TÀI XẾ ĐƯỢC PHÂN CÔNG:</div>
                                <h4 className={styles.driverName}>{assignedDriver.name}</h4>
                                <div className={styles.driverPhone}>
                                  <span className={styles.phoneLabel}>📞</span>
                                  <span className={styles.phoneNumber}>{assignedDriver.phone}</span>
                                </div>
                                <div className={styles.driverVehicle}>
                                  <span className={styles.vehicleLabel}>🏍️</span>
                                  <span className={styles.vehicleInfo}>{assignedDriver.vehicle}</span>
                                </div>
                              </div>
                            </div>

                            {/* Shipping Details */}
                            <div className={styles.shippingDetails}>
                              <div className={styles.shippingRow}>
                                <span className={styles.shippingLabel}>ĐƠN VỊ VẬN CHUYỂN:</span>
                                <span className={styles.shippingValue}>FINO Express</span>
                              </div>
                              
                              <div className={styles.shippingRow}>
                                <span className={styles.shippingLabel}>MÃ VẬN ĐƠN:</span>
                                <div className={styles.trackingCodeWrapper}>
                                  <span className={styles.shippingValue}>{trackingCode}</span>
                                  <button 
                                    className={styles.copyBtn}
                                    onClick={() => {
                                      navigator.clipboard.writeText(trackingCode);
                                      alert('Đã copy mã vận đơn!');
                                    }}
                                    title="Copy mã vận đơn"
                                  >
                                    Copy
                                  </button>
                                </div>
                              </div>

                              {(order.status === 'shipped' || order.status === 'delivered') && (
                                <div className={styles.shippingRow}>
                                  <span className={styles.shippingLabel}>DỰ KIẾN GIAO:</span>
                                  <span className={styles.shippingValue}>
                                    {(() => {
                                      const orderDate = new Date(order.createdAt);
                                      orderDate.setDate(orderDate.getDate() + 2); // Add 2 days for expected delivery
                                      return formatDate(orderDate.toISOString());
                                    })()}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Delivery Status */}
                            <div className={styles.deliveryStatus}>
                              <div className={styles.statusIndicator}>
                                <span className={styles.statusText}>
                                  {order.status === 'delivered' ? 'ĐÃ GIAO THÀNH CÔNG' : 
                                   order.status === 'shipped' ? 'ĐANG GIAO HÀNG' :
                                   order.status === 'processing' ? 'ĐANG CHUẨN BỊ' :
                                   'CHỜ XỬ LÝ'}
                                </span>
                              </div>
                              <div className={styles.statusTime}>
                                {order.status === 'delivered' 
                                  ? (() => {
                                      const orderDate = new Date(order.createdAt);
                                      orderDate.setDate(orderDate.getDate() + 2); // Add 2 days for delivery
                                      return formatDate(orderDate.toISOString());
                                    })()
                                  : order.status === 'shipped'
                                  ? (() => {
                                      const orderDate = new Date(order.createdAt);
                                      orderDate.setDate(orderDate.getDate() + 1); // Add 1 day for shipping
                                      return formatDate(orderDate.toISOString());
                                    })()
                                  : formatDate(order.createdAt)
                                }
                              </div>
                            </div>

                            {/* Driver Actions - Show for shipped/delivered orders */}
                            {(order.status === 'shipped' || order.status === 'delivered') && (
                              <div className={styles.driverActions}>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className={styles.callDriverBtn}
                                  onClick={() => {
                                    if (window.confirm(`Gọi cho tài xế ${assignedDriver.name} (${assignedDriver.phone})?`)) {
                                      window.open(`tel:${assignedDriver.phone}`);
                                    }
                                  }}
                                >
                                  📞 Gọi tài xế
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className={styles.trackOrderBtn}
                                  onClick={() => {
                                    console.log('Opening tracking modal'); // Debug log
                                    setShowTrackingModal(true);
                                  }}
                                >
                                  🔍 Theo dõi
                                </Button>
                              </div>
                            )}

                            {/* Quick Actions for all statuses */}
                            <div className={styles.quickActions}>
                              <button 
                                className={styles.quickActionBtn}
                                onClick={() => {
                                  const shareText = `Đơn hàng ${order.orderCode} - Tài xế: ${assignedDriver.name} (${assignedDriver.phone}). Mã vận đơn: ${trackingCode}. Trạng thái: ${shippingInfo.statusText}`;
                                  if (navigator.share) {
                                    navigator.share({
                                      title: 'Thông tin đơn hàng',
                                      text: shareText
                                    });
                                  } else {
                                    navigator.clipboard.writeText(shareText);
                                    alert('Đã copy thông tin đơn hàng!');
                                  }
                                }}
                                title="Chia sẻ thông tin đơn hàng"
                              >
                                📤 Chia sẻ thông tin
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null;
                  })()}

                  {/* Order Summary */}
                  <div className={styles.sidebarCard}>
                    <div className={styles.sectionHeader}>
                      <h3 className={styles.sectionTitle}>
                        <span className={styles.sectionIcon}>💰</span>
                        Tổng kết đơn hàng
                      </h3>
                    </div>
                    
                    <div className={styles.cardContent}>
                      <div className={styles.orderSummary}>
                        <div className={styles.summaryLine}>
                          <span className={styles.summaryLabel}>Tạm tính:</span>
                          <span className={styles.summaryValue}>
                            {formatCurrency(order.total || 0)}
                          </span>
                        </div>
                        
                        {order.discountAmount > 0 && (
                          <div className={styles.summaryLine}>
                            <span className={styles.summaryLabel}>
                              Giảm giá {order.voucher?.code ? `(${order.voucher.code})` : ''}:
                            </span>
                            <span className={`${styles.summaryValue} ${styles.discount}`}>
                              -{formatCurrency(order.discountAmount)}
                            </span>
                          </div>
                        )}
                        
                        <div className={styles.summaryLine}>
                          <span className={styles.summaryLabel}>Phí vận chuyển:</span>
                          <span className={styles.summaryValue}>
                            {formatCurrency(order.shippingFee || 0)}
                          </span>
                        </div>
                        
                        <div className={`${styles.summaryLine} ${styles.summaryTotal}`}>
                          <span className={styles.summaryLabel}>Tổng cộng:</span>
                          <span className={styles.summaryValue}>
                            {formatCurrency(order.finalTotal || 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
        
        {/* Hidden Invoice for Printing */}
        {showInvoice && order && (
          <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
            <OrderInvoice order={order} />
          </div>
        )}

        {/* Tracking Modal */}
        {showTrackingModal && order && (() => {
          const assignedDriver = getAssignedDriver(order.orderCode);
          const trackingCode = generateTrackingCode(order.orderCode, order._id);
          const shippingInfo = getShippingInfo(order.status, order.createdAt);
          
          return (
            <div className={styles.trackingModal} onClick={() => setShowTrackingModal(false)}>
              <div className={styles.trackingModalContent} onClick={(e) => e.stopPropagation()}>
                <div className={styles.trackingModalHeader}>
                  <h2 className={styles.trackingModalTitle}>
                    🚚 Theo dõi đơn hàng
                  </h2>
                  <button 
                    className={styles.closeBtn}
                    onClick={() => setShowTrackingModal(false)}
                  >
                    ✕
                  </button>
                </div>

                <div className={styles.trackingModalBody}>
                  {/* Order Info */}
                  <div className={styles.trackingOrderInfo}>
                    <div className={styles.trackingInfoRow}>
                      <strong>Mã đơn hàng:</strong> {order.orderCode}
                    </div>
                    <div className={styles.trackingInfoRow}>
                      <strong>Mã vận đơn:</strong> 
                      <span className={styles.trackingCodeHighlight}>{trackingCode}</span>
                      <button 
                        className={styles.copySmallBtn}
                        onClick={() => {
                          navigator.clipboard.writeText(trackingCode || '');
                          alert('Đã copy mã vận đơn!');
                        }}
                      >
                        Copy
                      </button>
                    </div>
                    <div className={styles.trackingInfoRow}>
                      <strong>Đơn vị vận chuyển:</strong> FINO Express
                    </div>
                    <div className={styles.trackingInfoRow}>
                      <strong>Tài xế:</strong> {assignedDriver?.name} - {assignedDriver?.phone}
                    </div>
                  </div>

                  {/* Delivery Timeline */}
                  <div className={styles.deliveryTimeline}>
                    <h3 className={styles.timelineTitle}>Lộ trình giao hàng</h3>
                    
                    <div className={styles.timelineItem}>
                      <div className={`${styles.timelineIcon} ${styles.completed}`}>✅</div>
                      <div className={styles.timelineContent}>
                        <div className={styles.timelineTime}>{formatDate(order.createdAt)}</div>
                        <div className={styles.timelineText}>Đơn hàng đã được tạo</div>
                      </div>
                    </div>

                    {(order.status === 'processing' || order.status === 'shipped' || order.status === 'delivered') && (
                      <div className={styles.timelineItem}>
                        <div className={`${styles.timelineIcon} ${styles.completed}`}>📦</div>
                        <div className={styles.timelineContent}>
                          <div className={styles.timelineTime}>
                            {(() => {
                              const orderDate = new Date(order.createdAt);
                              orderDate.setHours(orderDate.getHours() + 3); // Add 3 hours for processing
                              return formatDate(orderDate.toISOString());
                            })()}
                          </div>
                          <div className={styles.timelineText}>Đơn hàng đang được chuẩn bị</div>
                        </div>
                      </div>
                    )}

                    {(order.status === 'shipped' || order.status === 'delivered') && (
                      <div className={styles.timelineItem}>
                        <div className={`${styles.timelineIcon} ${styles.completed}`}>🚚</div>
                        <div className={styles.timelineContent}>
                          <div className={styles.timelineTime}>
                            {(() => {
                              const orderDate = new Date(order.createdAt);
                              orderDate.setDate(orderDate.getDate() + 1); // Add 1 day for shipping
                              return formatDate(orderDate.toISOString());
                            })()}
                          </div>
                          <div className={styles.timelineText}>
                            Đơn hàng đang được giao bởi tài xế {assignedDriver?.name}
                            <br/>
                            <small>📞 {assignedDriver?.phone} • 🏍️ {assignedDriver?.vehicle}</small>
                          </div>
                        </div>
                      </div>
                    )}

                    {order.status === 'delivered' && (
                      <div className={styles.timelineItem}>
                        <div className={`${styles.timelineIcon} ${styles.completed}`}>🎉</div>
                        <div className={styles.timelineContent}>
                          <div className={styles.timelineTime}>
                            {(() => {
                              const orderDate = new Date(order.createdAt);
                              orderDate.setDate(orderDate.getDate() + 2); // Add 2 days for delivery
                              return formatDate(orderDate.toISOString());
                            })()}
                          </div>
                          <div className={styles.timelineText}>Đã giao hàng thành công</div>
                        </div>
                      </div>
                    )}

                    {order.status === 'shipped' && (
                      <div className={styles.timelineItem}>
                        <div className={`${styles.timelineIcon} ${styles.pending}`}>⏳</div>
                        <div className={styles.timelineContent}>
                          <div className={styles.timelineTime}>
                            Dự kiến: {(() => {
                              const orderDate = new Date(order.createdAt);
                              orderDate.setDate(orderDate.getDate() + 2); // Add 2 days for expected delivery
                              return formatDate(orderDate.toISOString());
                            })()}
                          </div>
                          <div className={styles.timelineText}>Sẽ giao hàng thành công</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Delivery Address */}
                  <div className={styles.deliveryAddress}>
                    <h3 className={styles.addressTitle}>Địa chỉ giao hàng</h3>
                    <div className={styles.addressContent}>
                      <strong>{order.address?.fullName}</strong><br/>
                      📞 {order.address?.phone}<br/>
                      📍 {order.address?.addressLine}, {order.address?.ward}, {order.address?.district}, {order.address?.city}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className={styles.trackingActions}>
                    <button 
                      className={styles.trackingActionBtn}
                      onClick={() => {
                        if (assignedDriver?.phone) {
                          window.open(`tel:${assignedDriver.phone}`);
                        }
                      }}
                    >
                      📞 Gọi tài xế
                    </button>
                    <button 
                      className={styles.trackingActionBtn}
                      onClick={() => {
                        const shareText = `Theo dõi đơn hàng ${order.orderCode} - Mã vận đơn: ${trackingCode}. Tài xế: ${assignedDriver?.name} (${assignedDriver?.phone}). Trạng thái: ${shippingInfo.statusText}`;
                        if (navigator.share) {
                          navigator.share({ title: 'Theo dõi đơn hàng', text: shareText });
                        } else {
                          navigator.clipboard.writeText(shareText);
                          alert('Đã copy thông tin theo dõi!');
                        }
                      }}
                    >
                      📤 Chia sẻ
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
