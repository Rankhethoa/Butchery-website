import Order from "../models/Order.js"

export async function nextTicketNumber() {
    const count = await Order.countDocuments({});
    const n = count + 1;
    return `B-${String(n).padStart(4, "0")}`;
}
