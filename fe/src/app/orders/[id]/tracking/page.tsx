'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth, useApiNotification } from '@/hooks';
import { PageHeader, LoadingSpinner, Button } from '@/app/components/ui';
import { orderService } from '@/services/orderService';
import { OrderWithRefs } from '@/types';
import { 
  FaArrowLeft,
  FaTruck,
  FaClock,
  FaCheckCircle,
  FaBox,
  FaMapMarkerAlt
} from 'react-icons/fa';

const trackingSteps = [
  { id: 'pending', label: 'Chờ xác nhận', icon: FaClock },
  { id: 'processing', label: 'Đang chuẩn bị', icon: FaBox },
  { id: 'shipped', label: 'Đang vận chuyển', icon: FaTruck },
  { id: 'delivered', label: 'Đã giao hàng', icon: FaCheckCircle }
];

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  
  const { user, isLoading: authLoading } = useAuth();
  const { showError } = useApiNotification();
  
  const [order, setOrder] = useState<OrderWithRefs | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/orders');
      return;
    }

    if (user && orderId) {
      fetchOrderDetail();
    }
  }, [user, authLoading, orderId]);

  const fetchOrderDetail = async () => {
    try {
      setIsLoading(true);
      const detail = await orderService.getOrderById(orderId);
      setOrder(detail);
    } catch (error: any) {
      console.error('Error fetching order detail:', error);
      showError('Không thể tải thông tin đơn hàng', error);
      router.push('/orders');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Không tìm thấy đơn hàng</h2>
        <Button onClick={() => router.push('/orders')}>
          <FaArrowLeft className="mr-2" />
          Về danh sách đơn hàng
        </Button>
      </div>
    );
  }

  const currentStepIndex = trackingSteps.findIndex(step => step.id === order.status);

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="Theo dõi đơn hàng"
        subtitle={`#${order._id.slice(-8).toUpperCase()}`}
        icon={FaTruck}
        breadcrumbs={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Đơn hàng', href: '/orders' },
          { label: 'Theo dõi', href: `/orders/${orderId}/tracking` }
        ]}
      />

      <div className="max-w-4xl mx-auto">
        {/* Order Info */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Thông tin đơn hàng</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Mã đơn hàng: </span>
                  <span className="font-mono font-medium">#{order._id.slice(-8).toUpperCase()}</span>
                </div>
                <div>
                  <span className="text-gray-600">Ngày đặt: </span>
                  <span>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
                <div>
                  <span className="text-gray-600">Tổng tiền: </span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(order.finalTotal || 0)}
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Địa chỉ giao hàng</h3>
              {order.address && (
                <div className="space-y-1 text-sm">
                  <p className="font-medium">{order.address.fullName}</p>
                  <p className="text-gray-600">{order.address.phone}</p>
                  <div className="text-gray-600">
                    <FaMapMarkerAlt className="inline w-3 h-3 mr-1" />
                    {order.address.addressLine}, {order.address.ward}, {order.address.district}, {order.address.city}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tracking Timeline */}
        <div className="bg-white rounded-xl shadow-sm border p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-8 text-center">
            Trạng thái đơn hàng
          </h3>

          {order.status === 'cancelled' ? (
            <div className="text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xl">❌</span>
                </div>
              </div>
              <h4 className="text-lg font-semibold text-red-900 mb-2">Đơn hàng đã bị hủy</h4>
              <p className="text-red-700">Đơn hàng này đã được hủy bởi khách hàng hoặc cửa hàng</p>
            </div>
          ) : (
            <div className="relative">
              {/* Progress bar */}
              <div className="absolute top-10 left-0 right-0 h-1 bg-gray-200 rounded-full">
                <div 
                  className="h-full bg-green-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(0, (currentStepIndex) * 33.33)}%` }}
                />
              </div>

              {/* Steps */}
              <div className="relative flex justify-between">
                {trackingSteps.map((step, index) => {
                  const isCompleted = index < currentStepIndex;
                  const isCurrent = index === currentStepIndex;
                  const IconComponent = step.icon;

                  return (
                    <div key={step.id} className="flex flex-col items-center">
                      <div 
                        className={`
                          w-20 h-20 rounded-full flex items-center justify-center border-4 transition-all duration-300
                          ${isCurrent 
                            ? 'bg-blue-500 border-blue-500 text-white shadow-lg scale-110' 
                            : isCompleted 
                            ? 'bg-green-500 border-green-500 text-white' 
                            : 'bg-white border-gray-300 text-gray-400'
                          }
                        `}
                      >
                        <IconComponent className="w-8 h-8" />
                      </div>
                      
                      <div className="mt-4 text-center">
                        <h4 className={`font-medium text-sm ${
                          isCurrent 
                            ? 'text-blue-900' 
                            : isCompleted 
                            ? 'text-green-900' 
                            : 'text-gray-500'
                        }`}>
                          {step.label}
                        </h4>
                        
                        {isCurrent && (
                          <div className="mt-2">
                            <span className="inline-block px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                              Đang thực hiện
                            </span>
                          </div>
                        )}
                        
                        {isCompleted && (
                          <div className="mt-2">
                            <span className="text-xs text-green-600 font-medium">Hoàn thành</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Current Status Description */}
          <div className="mt-12 p-6 bg-gray-50 rounded-lg">
            <div className="text-center">
              <h4 className="font-semibold text-gray-900 mb-2">
                {order.status === 'pending' && 'Đơn hàng đang chờ được xác nhận'}
                {order.status === 'processing' && 'Đơn hàng đang được chuẩn bị và đóng gói'}
                {order.status === 'shipped' && 'Đơn hàng đang được vận chuyển đến bạn'}
                {order.status === 'delivered' && 'Đơn hàng đã được giao thành công'}
                {order.status === 'cancelled' && 'Đơn hàng đã bị hủy'}
              </h4>
              <p className="text-gray-600 text-sm">
                {order.status === 'pending' && 'Chúng tôi đang xem xét và xác nhận đơn hàng của bạn. Thời gian xử lý thường từ 1-2 giờ trong giờ làm việc.'}
                {order.status === 'processing' && 'Đơn hàng của bạn đang được chuẩn bị và đóng gói cẩn thận. Chúng tôi sẽ sớm chuyển cho đơn vị vận chuyển.'}
                {order.status === 'shipped' && 'Đơn hàng đang trên đường đến địa chỉ của bạn. Bạn có thể theo dõi thêm qua số điện thoại đã đăng ký.'}
                {order.status === 'delivered' && 'Cảm ơn bạn đã mua hàng! Nếu có bất kỳ vấn đề nào, vui lòng liên hệ với chúng tôi.'}
                {order.status === 'cancelled' && 'Đơn hàng đã được hủy. Nếu bạn có thắc mắc, vui lòng liên hệ với bộ phận chăm sóc khách hàng.'}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 text-center">
          <Button 
            onClick={() => router.push('/orders')}
            variant="outline"
            className="mr-4"
          >
            <FaArrowLeft className="mr-2" />
            Về danh sách đơn hàng
          </Button>
          
          <Button 
            onClick={() => router.push(`/orders/${orderId}`)}
            variant="primary"
          >
            Xem chi tiết đơn hàng
          </Button>
        </div>
      </div>
    </div>
  );
}
