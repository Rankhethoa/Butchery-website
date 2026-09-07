import Order from "../models/Order.js";
import { estimateReadyTime } from "./estimateWait.js";

export async function confirmOrderPayment(orderId, reference) {
    const order = await Order.findById(orderId);
    if (!order) {
        throw new Error("Order not found");
    }
    if (order.paymentStatus === "paid") {
        return order;
    }
    const activeOrders = await Order.find ({status: {$in: ["queued", "on_the_fire"]}}).sort({createdAt: 1,});
    const {estimatedReadyAt} = estimateReadyTime(order.totalCookMinutes, activeOrders);

    order.paymentStatus = "paid";
    order.paymentReference = reference || order.paymentReference;
    order.status = "queued";
    order.estimatedReadyAt = estimatedReadyAt;
    await order.save();
    return order;
}
