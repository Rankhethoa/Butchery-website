import express from "express";
import cors from "cors";
import path from 'path';
import {connectDB} from "./backend/config/db.js";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

import menuRouter from "./backend/routes/menu.js";
import orderRouter from "./backend/routes/orders.js";
import paymentRouter from "./backend/routes/payments.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
dotenv.config();

app.use("/api", (req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
});

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "*" }));
app.use(express.json());

app.use("/api/menu", menuRouter);
app.use("/api/orders", orderRouter);
app.use("/api/payments", paymentRouter);


app.get("/api/config" , (req,res) =>{
    res.json({
        paystackPublicKey: process.env.PAYSTACK_PUBLIC_KEY || "",
        currency: process.env.CURRENCY || "ZAR",
        grillStations: parseInt(process.env.GRILL_STATIONS, 10) || 3,
    });
});

app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, 'frontend')));

const PORT = process.env.PORT || 5001;

connectDB().then(() =>{
    app.listen(PORT, () => {
        console.log(`Running on http://localhost:${PORT}`);
    });
}).catch((err) =>{
    console.error("[server] failed to start:", err.message);
    process.exit(1);
});

