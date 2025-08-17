import { useState } from 'react';
import { OrderWithRefs } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { 
  FaEye, 
  FaClock, 
  FaCheckCircle, 
  FaTruck, 
  FaTimesCircle,
  FaCalendarAlt,
  FaBox,
  FaReceipt,
  FaStar,
  FaComment,
  FaDownload,
  FaCopy
} from 'react-icons/fa';

interface EnhancedOrderCardProps {
  order: OrderWithRefs;
  onViewDetails: (orderId: string) => void;
  onReorder?: (order: OrderWithRefs) => void;
  onDownloadInvoice?: (orderId: string) => void;
  onTrackOrder?: (orderId: string) => void;
  onReview?: (orderId: string) => void;
}

// Status mapping with better UI
const getStatusInfo = (status: string) => {
  const statusMap: Record<string, { label: string; icon: React.ReactNode; color: string; bgColor: string }> = {
    pending: {
      label: 'Chờ xác nhận',
      icon: <FaClock className="text-yellow-500" />,
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-100'
    },
    processing: {
      label: 'Đang xử lý',
      icon: <FaBox className="text-blue-500" />,
      color: 'text-blue-700',
      bgColor: 'bg-blue-100'
    },
    shipped: {
      label: 'Đã gửi hàng',
      icon: <FaTruck className="text-indigo-500" />,
      color: 'text-indigo-700',
      bgColor: 'bg-indigo-100'
    },
    delivered: {
      label: 'Đã giao',
      icon: <FaCheckCircle className="text-green-500" />,
      color: 'text-green-700',
      bgColor: 'bg-green-100'
    },
    cancelled: {
      label: 'Đã hủy',
      icon: <FaTimesCircle className="text-red-500" />,
      color: 'text-red-700',
      bgColor: 'bg-red-100'
    }
  };
  
  return statusMap[status] || {
    label: 'Không xác định',
    icon: <FaClock className="text-gray-500" />,
    color: 'text-gray-700',
    bgColor: 'bg-gray-100'
  };
};

export function EnhancedOrderCard({ 
  order, 
  onViewDetails, 
  onReorder, 
  onDownloadInvoice, 
  onTrackOrder, 
  onReview 
}: EnhancedOrderCardProps) {
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [copySuccess, setCopySuccess] = useState(false);
  
  const statusInfo = getStatusInfo(order.status);
  const canReview = order.status === 'delivered';
  const canTrack = ['processing', 'shipped'].includes(order.status);
  const canReorder = ['delivered', 'cancelled'].includes(order.status);

  // Handle image errors
  const handleImageError = (itemIndex: number) => {
    setImageErrors(prev => ({ ...prev, [itemIndex]: true }));
  };

  // Copy order ID to clipboard
  const copyOrderId = async () => {
    try {
      await navigator.clipboard.writeText(order._id);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy order ID:', err);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300">
      {/* Header */}
      <div className="flex justify-between items-start p-6 border-b border-gray-100">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Đơn hàng:</span>
              <span className="font-mono text-sm font-medium text-gray-900">
                #{order._id.slice(-8).toUpperCase()}
              </span>
              <button
                onClick={copyOrderId}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title="Sao chép mã đơn hàng"
              >
                <FaCopy className={`w-3 h-3 ${copySuccess ? 'text-green-500' : 'text-gray-400'}`} />
              </button>
              {copySuccess && (
                <span className="text-xs text-green-600 font-medium">Đã sao chép!</span>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-3 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <FaCalendarAlt className="w-3 h-3" />
              <span>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</span>
            </div>
            <span>•</span>
            <div className="flex items-center space-x-1">
              <FaBox className="w-3 h-3" />
              <span>{order.items?.length || 0} sản phẩm</span>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-medium ${statusInfo.color} ${statusInfo.bgColor}`}>
          {statusInfo.icon}
          <span>{statusInfo.label}</span>
        </div>
      </div>

      {/* Order Items Preview */}
      <div className="p-6">
        <div className="space-y-3">
          {order.items?.slice(0, 2).map((item, index) => (
            <div key={index} className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                {!imageErrors[index] && item.productVariant?.product?.images?.[0] ? (
                  <img
                    src={item.productVariant.product.images[0]}
                    alt={item.productVariant?.product?.name || 'Sản phẩm'}
                    className="w-full h-full object-cover"
                    onError={() => handleImageError(index)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <FaBox className="w-6 h-6" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 truncate">
                  {item.productVariant?.product?.name || 'Sản phẩm không xác định'}
                </h4>
                <div className="flex items-center justify-between mt-1">
                  <div className="text-xs text-gray-500">
                    {item.productVariant?.size?.name && `Size: ${item.productVariant.size.name}`}
                    {item.productVariant?.color?.name && ` - ${item.productVariant.color.name}`}
                    {` x${item.quantity}`}
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    {formatCurrency(item.totalPrice || 0)}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {(order.items?.length || 0) > 2 && (
            <div className="text-sm text-gray-500 text-center py-2">
              ... và {(order.items?.length || 0) - 2} sản phẩm khác
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center p-6 bg-gray-50 rounded-b-xl">
        <div className="flex flex-col">
          <span className="text-sm text-gray-600">Tổng cộng</span>
          <span className="text-lg font-bold text-gray-900">
            {formatCurrency(order.finalTotal || 0)}
          </span>
        </div>

        <div className="flex items-center space-x-3">
          {/* Action buttons based on order status */}
          {canTrack && onTrackOrder && (
            <button
              onClick={() => onTrackOrder(order._id)}
              className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <FaTruck className="inline w-3 h-3 mr-1" />
              Theo dõi
            </button>
          )}

          {canReview && onReview && (
            <button
              onClick={() => onReview(order._id)}
              className="px-3 py-1.5 text-sm font-medium text-yellow-600 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors"
            >
              <FaStar className="inline w-3 h-3 mr-1" />
              Đánh giá
            </button>
          )}

          {onDownloadInvoice && (
            <button
              onClick={() => onDownloadInvoice(order._id)}
              className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FaDownload className="inline w-3 h-3 mr-1" />
              Hóa đơn
            </button>
          )}

          {canReorder && onReorder && (
            <button
              onClick={() => onReorder(order)}
              className="px-3 py-1.5 text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
            >
              <FaReceipt className="inline w-3 h-3 mr-1" />
              Đặt lại
            </button>
          )}

          <button
            onClick={() => onViewDetails(order._id)}
            className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <FaEye className="inline w-3 h-3 mr-1" />
            Chi tiết
          </button>
        </div>
      </div>
    </div>
  );
}

// Order Statistics Component
interface OrderStatsProps {
  orders: OrderWithRefs[];
  loading?: boolean;
}

export function OrderStats({ orders, loading }: OrderStatsProps) {
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
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    totalSpent: orders.reduce((sum, order) => sum + (order.finalTotal || 0), 0)
  };

  const statCards = [
    {
      label: 'Tổng đơn hàng',
      value: stats.total,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      icon: <FaReceipt className="w-5 h-5" />
    },
    {
      label: 'Chờ xử lý',
      value: stats.pending + stats.processing,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      icon: <FaClock className="w-5 h-5" />
    },
    {
      label: 'Đã giao',
      value: stats.delivered,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      icon: <FaCheckCircle className="w-5 h-5" />
    },
    {
      label: 'Tổng chi tiêu',
      value: formatCurrency(stats.totalSpent),
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      icon: <FaReceipt className="w-5 h-5" />
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
                {typeof stat.value === 'number' && stat.label !== 'Tổng chi tiêu' 
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

export default EnhancedOrderCard;
