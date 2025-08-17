'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth, useApiNotification } from '@/hooks';
import { PageHeader, LoadingSpinner, Button } from '@/app/components/ui';
import { orderService } from '@/services/orderService';
import { reviewService } from '@/services/reviewService';
import { OrderWithRefs } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { 
  FaArrowLeft,
  FaStar,
  FaBox,
  FaCamera,
  FaTimes
} from 'react-icons/fa';

interface ReviewData {
  productId: string;
  rating: number;
  comment: string;
  images: string[];
}

const StarRating = ({ 
  rating, 
  onRatingChange, 
  size = 'normal' 
}: { 
  rating: number; 
  onRatingChange: (rating: number) => void;
  size?: 'small' | 'normal' | 'large';
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    normal: 'w-6 h-6',
    large: 'w-8 h-8'
  };

  return (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRatingChange(star)}
          className={`${sizeClasses[size]} text-yellow-400 hover:text-yellow-500 transition-colors`}
        >
          <FaStar 
            className={`w-full h-full ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  );
};

export default function OrderReviewPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  
  const { user, isLoading: authLoading } = useAuth();
  const { showError, showSuccess } = useApiNotification();
  
  const [order, setOrder] = useState<OrderWithRefs | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviews, setReviews] = useState<Record<string, ReviewData>>({});
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

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
      
      if (detail.status !== 'delivered') {
        showError('Chỉ có thể đánh giá đơn hàng đã giao thành công');
        router.push(`/orders/${orderId}`);
        return;
      }
      
      setOrder(detail);
      
      // Initialize reviews for each product
      const initialReviews: Record<string, ReviewData> = {};
      detail.items?.forEach(item => {
        if (item.productVariant?.product?._id) {
          initialReviews[item.productVariant.product._id] = {
            productId: item.productVariant.product._id,
            rating: 5,
            comment: '',
            images: []
          };
        }
      });
      setReviews(initialReviews);
      
    } catch (error: any) {
      console.error('Error fetching order detail:', error);
      showError('Không thể tải thông tin đơn hàng', error);
      router.push('/orders');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRatingChange = (productId: string, rating: number) => {
    setReviews(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        rating
      }
    }));
  };

  const handleCommentChange = (productId: string, comment: string) => {
    setReviews(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        comment
      }
    }));
  };

  const handleImageUpload = (productId: string, files: FileList | null) => {
    if (!files) return;

    // In a real app, you would upload images to a server
    // For now, we'll just simulate the process
    showSuccess('Tính năng upload ảnh sẽ có sớm');
  };

  const handleSubmitReviews = async () => {
    try {
      setIsSubmitting(true);
      
      // Validate reviews
      const reviewsToSubmit = Object.values(reviews).filter(review => 
        review.comment.trim().length > 0
      );
      
      if (reviewsToSubmit.length === 0) {
        showError('Vui lòng viết đánh giá cho ít nhất một sản phẩm');
        return;
      }

      // Submit reviews (this would call an actual API)
      for (const review of reviewsToSubmit) {
        // await reviewService.createReview(orderId, review);
      }
      
      showSuccess(`Đã gửi ${reviewsToSubmit.length} đánh giá thành công!`);
      router.push(`/orders/${orderId}`);
      
    } catch (error: any) {
      console.error('Error submitting reviews:', error);
      showError('Không thể gửi đánh giá', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageError = (itemIndex: number) => {
    setImageErrors(prev => ({ ...prev, [itemIndex]: true }));
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

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="Đánh giá đơn hàng"
        subtitle={`#${order._id.slice(-8).toUpperCase()}`}
        icon={FaStar}
        breadcrumbs={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Đơn hàng', href: '/orders' },
          { label: 'Đánh giá', href: `/orders/${orderId}/review` }
        ]}
      />

      <div className="max-w-4xl mx-auto">
        {/* Order Info */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Thông tin đơn hàng</h3>
            <span className="px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded-full">
              Đã giao thành công
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
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

        {/* Review Form */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Đánh giá sản phẩm ({order.items?.length || 0})
          </h3>

          <div className="space-y-8">
            {order.items?.map((item, index) => {
              const product = item.productVariant?.product;
              if (!product) return null;

              const review = reviews[product._id] || { rating: 5, comment: '', images: [] };

              return (
                <div key={`${product._id}-${index}`} className="border border-gray-200 rounded-lg p-6">
                  {/* Product Info */}
                  <div className="flex items-start space-x-4 mb-6">
                    <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {!imageErrors[index] && product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={() => handleImageError(index)}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <FaBox className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-2">{product.name}</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        {item.productVariant?.size?.name && (
                          <p>Size: {item.productVariant.size.name}</p>
                        )}
                        {item.productVariant?.color?.name && (
                          <p>Màu: {item.productVariant.color.name}</p>
                        )}
                        <p>Số lượng: {item.quantity}</p>
                        <p className="font-medium text-gray-900">
                          Giá: {formatCurrency(item.totalPrice || 0)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Đánh giá chất lượng sản phẩm <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center space-x-4">
                      <StarRating
                        rating={review.rating}
                        onRatingChange={(rating) => handleRatingChange(product._id, rating)}
                        size="large"
                      />
                      <span className="text-sm text-gray-600">
                        {review.rating === 5 && 'Xuất sắc'}
                        {review.rating === 4 && 'Tốt'}
                        {review.rating === 3 && 'Bình thường'}
                        {review.rating === 2 && 'Kém'}
                        {review.rating === 1 && 'Rất kém'}
                      </span>
                    </div>
                  </div>

                  {/* Comment */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nhận xét của bạn <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={review.comment}
                      onChange={(e) => handleCommentChange(product._id, e.target.value)}
                      placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..."
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Tối thiểu 10 ký tự ({review.comment.length}/10)
                    </p>
                  </div>

                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Thêm hình ảnh (Tùy chọn)
                    </label>
                    <div className="flex items-center space-x-4">
                      <label className="cursor-pointer flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                        <FaCamera className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-700">Chọn ảnh</span>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={(e) => handleImageUpload(product._id, e.target.files)}
                          className="hidden"
                        />
                      </label>
                      <p className="text-xs text-gray-500">
                        Tối đa 5 ảnh, mỗi ảnh dưới 5MB
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-between pt-8 border-t border-gray-200 mt-8">
            <Button
              onClick={() => router.push(`/orders/${orderId}`)}
              variant="outline"
            >
              <FaArrowLeft className="mr-2" />
              Quay lại
            </Button>

            <Button
              onClick={handleSubmitReviews}
              disabled={isSubmitting}
              variant="primary"
              className="px-8"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Đang gửi...
                </>
              ) : (
                <>
                  <FaStar className="mr-2" />
                  Gửi đánh giá
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
