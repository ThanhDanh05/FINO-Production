'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { OrderWithRefs } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/app/components/ui';
import { 
  FaClock, 
  FaCheckCircle, 
  FaTruck, 
  FaTimesCircle,
  FaEye,
  FaDownload,
  FaUndo,
  FaStar,
  FaBox,
  FaShippingFast,
  FaMoneyBillWave
} from 'react-icons/fa';
import styles from './OrderEnhancements.module.css';

interface EnhancedOrderCardProps {
  order: OrderWithRefs;
  onCancelOrder?: (orderId: string) => Promise<void>;
  onReorder?: (orderId: string) => Promise<void>;
  onDownloadInvoice?: (orderId: string) => void;
}

export function EnhancedOrderCard({ 
  order, 
  onCancelOrder,
  onReorder,
  onDownloadInvoice 
}: EnhancedOrderCardProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  // Get status configuration
  const getStatusConfig = (status: string) => {
    const statusConfig = {
      pending: { 
        icon: <FaClock />, 
        label: 'Chờ xác nhận', 
        className: styles.statusPending,
        color: '#f59e0b',
        bgColor: '#fef3c7'
      },
      processing: { 
        icon: <FaBox />, 
        label: 'Đang xử lý', 
        className: styles.statusProcessing,
        color: '#3b82f6',
        bgColor: '#dbeafe'
      },
      shipped: { 
        icon: <FaShippingFast />, 
        label: 'Đã gửi hàng', 
        className: styles.statusShipped,
        color: '#8b5cf6',
        bgColor: '#e9d5ff'
      },
      delivered: { 
        icon: <FaCheckCircle />, 
        label: 'Đã giao', 
        className: styles.statusDelivered,
        color: '#10b981',
        bgColor: '#d1fae5'
      },
      cancelled: { 
        icon: <FaTimesCircle />, 
        label: 'Đã hủy', 
        className: styles.statusCancelled,
        color: '#ef4444',
        bgColor: '#fee2e2'
      }
    };

    return statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  };

  const statusConfig = getStatusConfig(order.status);

  // Get payment status
  const getPaymentStatusConfig = (paymentStatus: string) => {
    const paymentConfig = {
      paid: { label: 'Đã thanh toán', color: '#10b981', icon: <FaCheckCircle /> },
      pending: { label: 'Chờ thanh toán', color: '#f59e0b', icon: <FaClock /> },
      failed: { label: 'Thanh toán thất bại', color: '#ef4444', icon: <FaTimesCircle /> },
      cancelled: { label: 'Đã hủy', color: '#6b7280', icon: <FaTimesCircle /> }
    };

    return paymentConfig[paymentStatus as keyof typeof paymentConfig] || paymentConfig.pending;
  };

  const paymentConfig = getPaymentStatusConfig(order.paymentStatus || 'pending');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleCancelOrder = async () => {
    if (!onCancelOrder || isProcessing) return;

    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn hủy đơn hàng #${order.orderCode}?`
    );

    if (confirmed) {
      try {
        setIsProcessing(true);
        await onCancelOrder(order._id);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleReorder = async () => {
    if (!onReorder || isProcessing) return;

    try {
      setIsProcessing(true);
      await onReorder(order._id);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadInvoice = () => {
    if (onDownloadInvoice) {
      onDownloadInvoice(order._id);
    }
  };

  const canCancelOrder = order.status === 'pending' || order.status === 'processing';
  const canReorder = order.status === 'delivered' || order.status === 'cancelled';
  const canDownload = order.status === 'delivered' && order.paymentStatus === 'paid';

  return (
    <div className={styles.enhancedOrderCard}>
      {/* Header with status and info */}
      <div className={styles.orderHeader}>
        <div className={styles.orderMainInfo}>
          <div className={styles.orderCodeSection}>
            <h4 className={styles.orderCode}>#{order.orderCode}</h4>
            <div className={styles.orderMeta}>
              <span className={styles.orderDate}>
                <FaClock className={styles.metaIcon} />
                {formatDate(order.createdAt)}
              </span>
            </div>
          </div>

          <div className={styles.statusSection}>
            <div 
              className={`${styles.orderStatus} ${statusConfig.className}`}
              style={{ 
                color: statusConfig.color,
                backgroundColor: statusConfig.bgColor
              }}
            >
              <span className={styles.statusIcon}>{statusConfig.icon}</span>
              {statusConfig.label}
            </div>
            
            <div 
              className={styles.paymentStatus}
              style={{ color: paymentConfig.color }}
            >
              <span className={styles.statusIcon}>{paymentConfig.icon}</span>
              {paymentConfig.label}
            </div>
          </div>
        </div>

        <div className={styles.orderTotal}>
          <span className={styles.totalLabel}>Tổng tiền</span>
          <span className={styles.totalAmount}>
            {formatCurrency(order.finalTotal || 0)}
          </span>
        </div>
      </div>

      {/* Order Items Preview */}
      <div className={styles.orderItemsPreview}>
        <div className={styles.itemsList}>
          {order.items?.slice(0, 3).map((item: any, index: number) => (
            <div key={index} className={styles.orderItemPreview}>
              <div className={styles.itemImage}>
                {item.productVariant?.product?.images?.[0] ? (
                  <img 
                    src={item.productVariant.product.images[0]} 
                    alt={item.productVariant?.product?.name}
                    className={styles.productThumbnail}
                  />
                ) : (
                  <div className={styles.noImagePlaceholder}>
                    <FaBox />
                  </div>
                )}
              </div>
              
              <div className={styles.itemDetails}>
                <div className={styles.itemName}>
                  {item.productVariant?.product?.name || item.productName}
                </div>
                <div className={styles.itemVariant}>
                  {item.productVariant?.color?.name && `${item.productVariant.color.name}`}
                  {item.productVariant?.color?.name && item.productVariant?.size?.name && ' • '}
                  {item.productVariant?.size?.name && `${item.productVariant.size.name}`}
                </div>
                <div className={styles.itemQuantityPrice}>
                  SL: {item.quantity} • {formatCurrency(item.price)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {(order.items?.length || 0) > 3 && (
          <div className={styles.moreItemsIndicator}>
            +{(order.items?.length || 0) - 3} sản phẩm khác
          </div>
        )}
      </div>

      {/* Order Summary */}
      <div className={styles.orderSummary}>
        <div className={styles.summaryRow}>
          <span>Tạm tính:</span>
          <span>{formatCurrency(order.total || 0)}</span>
        </div>
        {order.discountAmount && order.discountAmount > 0 && (
          <div className={styles.summaryRow}>
            <span>Giảm giá:</span>
            <span className={styles.discount}>-{formatCurrency(order.discountAmount)}</span>
          </div>
        )}
        <div className={styles.summaryRow}>
          <span>Phí vận chuyển:</span>
          <span>{formatCurrency(order.shippingFee || 0)}</span>
        </div>
        <div className={`${styles.summaryRow} ${styles.totalRow}`}>
          <span>Tổng cộng:</span>
          <span>{formatCurrency(order.finalTotal || 0)}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className={styles.orderActions}>
        <div className={styles.primaryActions}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/orders/${order._id}`)}
            className={styles.viewDetailBtn}
          >
            <FaEye />
            Xem chi tiết
          </Button>

          {canDownload && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadInvoice}
              className={styles.downloadBtn}
            >
              <FaDownload />
              Tải hóa đơn
            </Button>
          )}
        </div>

        <div className={styles.secondaryActions}>
          {canReorder && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleReorder}
              disabled={isProcessing}
              className={styles.reorderBtn}
            >
              <FaUndo />
              Đặt lại
            </Button>
          )}

          {canCancelOrder && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancelOrder}
              disabled={isProcessing}
              className={styles.cancelBtn}
            >
              <FaTimesCircle />
              Hủy đơn
            </Button>
          )}

          {order.status === 'delivered' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/orders/${order._id}/review`)}
              className={styles.reviewBtn}
            >
              <FaStar />
              Đánh giá
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Order Statistics Component
interface OrderStatsProps {
  orders: OrderWithRefs[];
}

export function OrderStats({ orders }: OrderStatsProps) {
  const stats = {
    total: orders.length,
    pending: orders.filter(order => order.status === 'pending').length,
    processing: orders.filter(order => order.status === 'processing').length,
    delivered: orders.filter(order => order.status === 'delivered').length,
    cancelled: orders.filter(order => order.status === 'cancelled').length,
    totalSpent: orders
      .filter(order => order.status === 'delivered')
      .reduce((sum, order) => sum + (order.finalTotal || 0), 0)
  };

  const statItems = [
    { label: 'Tổng đơn hàng', value: stats.total, icon: <FaBox />, color: '#6b7280' },
    { label: 'Chờ xác nhận', value: stats.pending, icon: <FaClock />, color: '#f59e0b' },
    { label: 'Đang xử lý', value: stats.processing, icon: <FaTruck />, color: '#3b82f6' },
    { label: 'Đã giao', value: stats.delivered, icon: <FaCheckCircle />, color: '#10b981' },
    { label: 'Đã hủy', value: stats.cancelled, icon: <FaTimesCircle />, color: '#ef4444' }
  ];

  return (
    <div className={styles.orderStats}>
      <div className={styles.statsGrid}>
        {statItems.map((stat, index) => (
          <div key={index} className={styles.statCard}>
            <div 
              className={styles.statIcon}
              style={{ color: stat.color }}
            >
              {stat.icon}
            </div>
            <div className={styles.statInfo}>
              <div className={styles.statValue}>{stat.value}</div>
              <div className={styles.statLabel}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {stats.totalSpent > 0 && (
        <div className={styles.totalSpentCard}>
          <div className={styles.spentIcon}>
            <FaMoneyBillWave />
          </div>
          <div className={styles.spentInfo}>
            <div className={styles.spentLabel}>Tổng chi tiêu</div>
            <div className={styles.spentAmount}>{formatCurrency(stats.totalSpent)}</div>
          </div>
        </div>
      )}
    </div>
  );
}
