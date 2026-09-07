import express from "express";
import MenuItem from "../models/MenuItems.js";
import Order from "../models/Order.js";
import { nextTicketNumber } from "../utils/ticketNumber.js";
import { estimateReadyTime } from "../utils/estimateWait.js";
import { confirmOrderPayment } from "../utils/confirmPayment.js";

const router = express.Router ();
async function getActiveOrders(){
    return Order.find({status: {$in: ["queued", "on_the_fire"]}}).sort({createdAt: 1});
}
router.post ("/", async (req, res) => {
    try{
        const {customerName, phone, items, requestedTime, paymentMethod} = req.body; 
        if (!customerName || !phone)
            return res.status(400).json({error: "Name and phone are required"});
        if (!Array.isArray(items) || items.length === 0){
            return res.status (400).json({error: "Your order needs at least one item"});
        }

        let subtotal = 0;
        let totalCookMinutes = 0;
        const lines = [];

        for (const raw of items){
            const menuItem = await MenuItem.findById(raw.menuItemId);
            if (!menuItem || !menuItem.available){
                return res.status (400).json({error: `"${raw.menuItemId}" is not available right now`});
            }
            const quantity = Number (raw.quantity);
            if (!quantity || quantity <=0){
                return res.status(400).json({error: `Enter a valid quantity for ${menuItem.name}.`});
            }
            if (menuItem.pricingUnit === "per_kg" && quantity < menuItem.minWeightKg){
                return res.status(400).json({
                    error: `${menuItem.name} has a minimum order of ${menuItem.minWeightKg}kg.`,
                });
            }
            const spiceLevel = ["none", "mild", "medium", "hot"].includes(raw.spiceLevel)
            ? raw.spiceLevel
            : "none";
            const lineTotal = Math.round (menuItem.price * quantity * 100)/100;
            const lineCookMinutes = Math.ceil (menuItem.cookMinutes * quantity);

            subtotal += lineTotal;
            totalCookMinutes += lineCookMinutes;

            lines.push({
                menuItem: menuItem._id,
                name: menuItem.name,
                pricingUnit: menuItem.pricingUnit,
                quantity,
                unitPrice: menuItem.price,
                lineTotal,
                lineCookMinutes,
                spiceLevel,
                notes: raw.notes || "",
            });
        }

        const ticketNumber = await nextTicketNumber();

        const payAtPickup = ["cash", "bank_card"].includes(paymentMethod);
        const activeOrdersBefore = await getActiveOrders();
        const preview = estimateReadyTime(totalCookMinutes, activeOrdersBefore);

        const order = await Order.create({
            ticketNumber,
            customerName,
            phone,
            items: lines,
            subtotal,
            totalAmount: subtotal,
            requestedTime: requestedTime || null,
            paymentMethod,
            totalCookMinutes,
            status: payAtPickup ? "queued" : "awaiting_payment",
            estimatedReadyAt: payAtPickup ? preview.estimatedReadyAt : null,
        });

        res.status (201).json ({order, previewEstimate: preview});
    } catch (err) {
        console.error (err);
        res.status(500).json({error: "Could not place the order"});
    }
} );

router.post ("/:id/confirm-payment", async (req,res) =>{
    try{
        const order = await confirmOrderPayment (req.params.id, req.body.reference);
        res.json ({order});
    } catch (err){
        res.status(400).json({error: err.message || "Could not confirm payment"});
    }
});

router.get ("/board", async (req,res) => {
    try{
        const activeOrders = await getActiveOrders();
        const board = activeOrders.map((o) => ({
            ticketNumber: o.ticketNumber,
            status: o.status,
            estimatedReadyAt: o.estimatedReadyAt,
            itemCount: o.items.length,
        }));
        res.json(board);
    } catch (err){
        res.status(500).json({error: "Could not load the queue board"});
    }
});

router.get ("/track", async (req,res) =>{
    try{
        const {ticketNumber, phone} = req.query;
        if (!ticketNumber || !phone){
            return res.status(400).json({error: "Ticket number and phone number are required"});
        }
        const order = await Order.findOne({ticketNumber, phone});
        if (!order)
            return res.status(404).json({error: "No matching orders found"});

        let position = null;
        if (order.status === "queued"){
            const ahead = await Order.countDocuments({
                status: {$in: ["queued", "on_the_fire"]},
                createdAt: {$lt: order.createdAt},
            });
            position = ahead + 1;
        }
        res.json ({order, position});
    } catch (err) {
        res.status(500).json({error: "Could not look up that order"});
    }
});

router.patch ("/:id/status", async (req,res) => {
    try{
        const {status} = req.body;
        const valid = ["queued", "on_the_fire", "ready", "completed", "cancelled"];
        if (!valid.includes(status))
            return res.status(400).json({error: "Invalid status"});

        const order = await Order.findById(req.params.id);
        if (!order)
            return res.status(404).json({error: "Order not found"});

        order.status = status;
        if (status === "on_the_fire") order.grillStartedAt = new Date();
        if (status === "ready") order.readyAt = new Date();
        await order.save();

        res.json({order});
    }catch (err){
        res.status(500).json({error: "Could not update order status"});
    }
});

export default router;