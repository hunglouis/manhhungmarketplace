const orders = {};

function createOrder(order) {
  orders[order.orderId] = order;
}

function getOrder(orderId) {
  return orders[orderId];
}

function updateOrder(orderId, data) {
  if (orders[orderId]) {
    orders[orderId] = { ...orders[orderId], ...data };
  }
}

module.exports = {
  createOrder,
  getOrder,
  updateOrder
};
