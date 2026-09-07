import express from "express";
import Order from "../models/Order.js";
import { confirmOrderPayment } from "../utils/confirmPayment.js";
import {createToken, verifyToken} from "../utils/dpoClient.js";

const router = express.Router();

router.post("/dpo/initialize", async (req, res) => {
    try {
      const { orderId, email, phone } = req.body;
      const order = await Order.findById(orderId);
      if (!order) return res.status(404).json({ error: "Order not found." });
  
      const origin = process.env.CLIENT_ORIGIN || `${req.protocol}://${req.get("host")}`;
      const { transToken, redirectTo } = await createToken({
        order,
        email,
        phone,
        redirectUrl: `${origin}/html/track.html?ticket=${order.ticketNumber}`,
        backUrl: `${origin}/index.html`,
      });
  
      order.paymentReference = transToken;
      await order.save();
  
      res.json({ authorizationUrl: redirectTo, transToken });
    } catch (err) {
      res.status(502).json({ error: err.message || "Could not start the EFT payment." });
    }
});

router.post("/mobile-money/notify", async (req, res) => {
    try {
      const { orderId, reference } = req.body;
      if (!reference) return res.status(400).json({ error: "A mobile money confirmation code is required." });
      const order = await confirmOrderPayment(orderId, reference);
      res.json({ order });
    } catch (err) {
      res.status(400).json({ error: err.message || "Could not confirm the mobile money payment." });
    }
});

router.get("/dpo/verify/:transToken", async (req, res) => {
    try {
      const { transToken } = req.params;
      const verification = await verifyToken(transToken);
      if (!verification.success) {
        return res.status(402).json({ error: verification.explanation || "Payment was not successful." });
      }
      const order = await Order.findOne({ paymentReference: transToken });
      if (!order) return res.status(404).json({ error: "No order matches that transaction." });
      const confirmed = await confirmOrderPayment(order._id, transToken);
      res.json({ order: confirmed });
    } catch (err) {
      res.status(502).json({ error: err.message || "Could not verify the payment." });
    }
});

router.post("/cash/confirm", async(req,res) =>{
    try{
        const {orderId} = req.body;
        const order = await confirmOrderPayment(orderId, "cash");
        res.json({order});
    } catch (err){
        res.status(400).json({error: err.message || "Could bot confirm the cash order"});
    }
});

router.post("/pickup/confirm", async (req, res) => {
    try {
      const { orderId, method } = req.body;
      const order = await confirmOrderPayment(orderId, `paid-at-pickup:${method || "cash"}`);
      res.json({ order });
    } catch (err) {
      res.status(400).json({ error: err.message || "Could not confirm the pickup payment." });
    }
});
export default router;
