const mongoose = require('mongoose');
require('./config/db');
const Order = require('./models/OrderSchema');

async function test() {
  try {
    console.log('Testing order data...');
    const order = await Order.findOne().sort({ createdAt: -1 }).populate('user').populate('address');
    console.log('Order Code:', order.orderCode);
    console.log('User:', order.user?.name, order.user?.email);  
    console.log('Address:', order.address?.fullName, order.address?.phone);
    console.log('Same name?', order.user?.name === order.address?.fullName);
    console.log('Same phone?', order.user?.phone === order.address?.phone);
  } catch (e) { 
    console.error('Error:', e.message); 
  }
  process.exit(0);
}
test();
