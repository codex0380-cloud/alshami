const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.database();

/**
 * Validate order prices when a new order is created.
 * Recalculates total from the menu prices and rejects if mismatch.
 */
exports.validateOrder = functions.database
  .ref('/orders/{orderKey}')
  .onCreate(async (snapshot, context) => {
    const order = snapshot.val();
    const updates = {};

    if (order.status !== 'new') {
      updates['status'] = 'new';
    }

    const menuSnapshot = await db.ref('menu').once('value');
    const menu = menuSnapshot.val() || {};

    const couponsSnapshot = await db.ref('coupons').once('value');
    const coupons = couponsSnapshot.val() || {};

    let recalculatedSubtotal = 0;
    const validItems = [];

    for (const item of (order.items || [])) {
      const menuItem = Object.values(menu).find(m => m.name === item.name);
      let price = item.price;
      if (menuItem) {
        const isLarge = item.name.includes('(كبير)');
        price = isLarge && menuItem.priceL ? menuItem.priceL : menuItem.price;
      }
      const total = price * (item.qty || 1);
      recalculatedSubtotal += total;
      validItems.push({ name: item.name, qty: item.qty || 1, price, total });
    }

    let recalculatedDelivery = 0;
    if (order.method === 'delivery') {
      const settingsSnapshot = await db.ref('settings').once('value');
      const settings = settingsSnapshot.val() || {};
      const zones = settings.delivery_zones || [];
      const zoneId = order.zone?.id || 'default';
      const zone = zones.find(z => z.id === zoneId);
      recalculatedDelivery = zone ? zone.price : 10;
    }

    let recalculatedDiscount = 0;
    let appliedCoupon = '';
    if (order.coupon) {
      const coupon = coupons[order.coupon];
      if (coupon && recalculatedSubtotal >= (coupon.minOrder || 0)) {
        if (coupon.type === 'percent') {
          recalculatedDiscount = Math.round(recalculatedSubtotal * coupon.value / 100);
        } else {
          recalculatedDiscount = coupon.value;
        }
        appliedCoupon = order.coupon;
      }
    }

    const recalculatedTotal = Math.max(0, recalculatedSubtotal - recalculatedDiscount + recalculatedDelivery);

    if (Math.abs(order.total - recalculatedTotal) > 1 ||
        order.deliveryFee !== recalculatedDelivery ||
        order.discount !== recalculatedDiscount) {
      updates['subtotal'] = recalculatedSubtotal;
      updates['deliveryFee'] = recalculatedDelivery;
      updates['discount'] = recalculatedDiscount;
      updates['coupon'] = appliedCoupon;
      updates['total'] = recalculatedTotal;
      updates['items'] = validItems;
      updates['priceValidated'] = true;
      updates['validatedAt'] = new Date().toISOString();
    } else {
      updates['priceValidated'] = true;
    }

    return snapshot.ref.update(updates);
  });

/**
 * Send notification to admin when an order is cancelled.
 */
exports.notifyOrderCancelled = functions.database
  .ref('/orders/{orderKey}')
  .onUpdate(async (change, context) => {
    const before = change.before.val();
    const after = change.after.val();
    if (before.status !== 'cancelled' && after.status === 'cancelled') {
      console.log(`Order ${after.orderNumber} was cancelled`);
    }
    return null;
  });
