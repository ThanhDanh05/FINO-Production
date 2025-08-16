const mongoose = require('mongoose');

const OrderDetailsSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  productVariant: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant', required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  totalPrice: { type: Number, required: true }, 
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  orderCode: { 
    type: String, 
    unique: true, 
    required: true
  }, // Mã đơn hàng thân thiện: FINO2025071100001
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: [OrderDetailsSchema],
  address: { type: mongoose.Schema.Types.ObjectId, ref: 'Address', required: true }, // Địa chỉ giao hàng
  total: { type: Number }, // Tổng tiền trước khi áp dụng voucher và phí vận chuyển
  voucher: { type: mongoose.Schema.Types.ObjectId, ref: 'Voucher', default: null },
  discountAmount: { type: Number, default: 0 }, // Số tiền giảm giá từ voucher
  shippingFee: { type: Number, required: true }, // Phí vận chuyển (tính động)
  finalTotal: { type: Number }, // Tổng tiền sau khi áp dụng voucher và phí vận chuyển (total - discountAmount + shippingFee)
  status: { type: String, enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'], default: 'pending' },
  paymentMethod: { type: mongoose.Schema.Types.ObjectId, ref: 'PaymentMethod', required: true },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'cancelled'], default: 'pending' }, // Updated for VNPay
  
  // Delivery information
  deliveryPerson: {
    name: { type: String }, // Tên tài xế
    phone: { type: String }, // SĐT tài xế  
    company: { type: String, default: 'FINO Express' }, // Công ty vận chuyển
    vehicleNumber: { type: String }, // Biển số xe
    avatar: { type: String } // Avatar tài xế
  },
  trackingNumber: { type: String }, // Mã vận đơn
  estimatedDelivery: { type: Date }, // Thời gian dự kiến giao hàng
  shippedAt: { type: Date }, // Thời gian bắt đầu giao hàng
  deliveredAt: { type: Date }, // Thời gian giao hàng thành công
  
  paymentDetails: { // VNPay payment details
    transactionNo: { type: String }, // VNPay transaction number
    bankCode: { type: String }, // Bank code from VNPay
    payDate: { type: String }, // Payment date from VNPay
    responseCode: { type: String }, // VNPay response code
    paymentMethod: { type: String }, // Payment method (VNPay, COD, etc.)
    source: { type: String }, // 'callback' or 'IPN'
    paidAt: { type: Date }, // When payment was completed
    failedAt: { type: Date }, // When payment failed
    updatedAt: { type: Date } // Last update time
  }
}, { timestamps: true });

// Index để tối ưu truy vấn
OrderSchema.index({ user: 1, createdAt: -1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: -1 });

// Static method to generate order code
OrderSchema.statics.generateOrderCode = async function() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  
  // Format: FINO + YYYYMMDD + counter (5 digits)
  const prefix = `FINO${year}${month}${day}`;
  
  // Find last order of today to get counter
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  
  const lastOrder = await this.findOne({
    createdAt: { $gte: startOfDay, $lt: endOfDay }
  }).sort({ createdAt: -1 });
  
  let counter = 1;
  if (lastOrder && lastOrder.orderCode && lastOrder.orderCode.startsWith(prefix)) {
    // Extract counter from last order code 
    const lastCounterMatch = lastOrder.orderCode.match(/(\d{5})$/);
    if (lastCounterMatch) {
      counter = parseInt(lastCounterMatch[1]) + 1;
    }
  }
  
  // Counter với 5 chữ số: 00001, 00002, etc.
  const counterStr = counter.toString().padStart(5, '0');
  
  return `${prefix}${counterStr}`;
};

// Static method to create order from cart
OrderSchema.statics.createFromCart = async function(cart, orderDetails) {
  console.log('🏪 OrderSchema.createFromCart called');
  
  // Generate order code
  const orderCode = await this.generateOrderCode();
  console.log('📋 Generated order code:', orderCode);
  
  // Calculate totals using CURRENT PRODUCT PRICES (not stored cart prices)
  let total = 0;
  const orderItems = [];
  
  for (const item of cart.items) {
    // Get current price from product (salePrice || regularPrice)
    const salePrice = item.productVariant?.product?.salePrice;
    const regularPrice = item.productVariant?.product?.price;
    const currentPrice = salePrice || regularPrice;
    const itemTotal = currentPrice * item.quantity;
    
    total += itemTotal;
    
    orderItems.push({
      productVariant: item.productVariant,
      quantity: item.quantity,
      price: currentPrice, // Use current price, not stored cart price
      totalPrice: itemTotal // Calculate from current price
    });
  }
  
  const finalTotal = total - (orderDetails.discountAmount || 0) + (orderDetails.shippingFee || 0);
  
  // Create new order
  const orderData = {
    orderCode,
    user: cart.user,
    items: orderItems, // Use calculated items with current prices
    address: orderDetails.address,
    paymentMethod: orderDetails.paymentMethod,
    voucher: orderDetails.voucher || null,
    total,
    discountAmount: orderDetails.discountAmount || 0,
    shippingFee: orderDetails.shippingFee || 0,
    finalTotal,
    status: 'pending',
    paymentStatus: 'pending' // Updated to match enum values
  };
  
  console.log('💾 Creating order with data:', {
    orderCode: orderData.orderCode,
    user: orderData.user,
    total: orderData.total,
    finalTotal: orderData.finalTotal
  });
  
  const order = await this.create(orderData);
  console.log('✅ Order created in Order collection:', order._id);
  
  // Populate order details
  await order.populate([
    'user',
    'address', 
    'voucher', 
    'paymentMethod',
    {
      path: 'items.productVariant',
      populate: [
        { path: 'product', select: 'name description images' },
        { path: 'color', select: 'name isActive' },
        { path: 'size', select: 'name' }
      ]
    }
  ]);
  
  console.log('✅ Order populated and ready to return:', order._id);
  
  // Email processing will be handled by background job service for better performance
  console.log('📧 Email processing will be handled by background job service');
  
  return order;
};

module.exports = mongoose.models.Order || mongoose.model('Order', OrderSchema);
