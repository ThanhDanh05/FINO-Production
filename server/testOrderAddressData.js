const mongoose = require('mongoose');
require('./config/db');

// Import models
const OrderSchema = require('./models/OrderSchema');
const AddressSchema = require('./models/AddressSchema');
const UserSchema = require('./models/UserSchema');

async function testOrderAddressData() {
  try {
    console.log('🔍 Testing Order Address Data...\n');

    // Get the latest order
    const latestOrder = await OrderSchema.findOne()
      .sort({ createdAt: -1 })
      .populate('user', 'name email phone')
      .populate('address');

    if (!latestOrder) {
      console.log('❌ No orders found');
      return;
    }

    console.log('📦 Latest Order:', latestOrder.orderCode);
    console.log('📅 Created:', latestOrder.createdAt);
    
    console.log('\n👤 User Info (Thông tin tài khoản):');
    console.log('- Name:', latestOrder.user.name);
    console.log('- Email:', latestOrder.user.email);
    console.log('- Phone:', latestOrder.user.phone);

    console.log('\n📍 Address Info (Thông tin giao hàng):');
    if (latestOrder.address) {
      console.log('- Full Name:', latestOrder.address.fullName);
      console.log('- Phone:', latestOrder.address.phone);
      console.log('- Address:', latestOrder.address.addressLine);
      console.log('- Ward:', latestOrder.address.ward);
      console.log('- District:', latestOrder.address.district);
      console.log('- City:', latestOrder.address.city);
      console.log('- Is Default:', latestOrder.address.isDefault);
    } else {
      console.log('❌ No address populated');
    }

    console.log('\n🔍 Analysis:');
    if (latestOrder.user.name !== latestOrder.address?.fullName) {
      console.log('✅ CORRECT: User name ≠ Address fullName (different delivery info)');
      console.log(`   User: "${latestOrder.user.name}" vs Address: "${latestOrder.address?.fullName}"`);
    } else {
      console.log('⚠️ WARNING: User name = Address fullName (same info)');
    }

    if (latestOrder.user.phone !== latestOrder.address?.phone) {
      console.log('✅ CORRECT: User phone ≠ Address phone (different contact)');
      console.log(`   User: "${latestOrder.user.phone}" vs Address: "${latestOrder.address?.phone}"`);
    } else {
      console.log('⚠️ WARNING: User phone = Address phone (same contact)');
    }

    console.log('\n💡 Frontend should display:');
    console.log('- Customer Info: order.user.name, order.user.email (tài khoản đặt hàng)');  
    console.log('- Delivery Info: order.address.fullName, order.address.phone (thông tin nhận hàng)');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

testOrderAddressData();
