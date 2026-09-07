import {Schema, model, mongoose} from "mongoose";

const orderLineSchema = new Schema(
    {
        menuItem: {type: mongoose.Schema.Types.ObjectId, ref: "MenuItem", required: true},
        name: {type: String, required: true},
        pricingUnit: {type: String, enum: ["per_kg"], required: true},
        quantity: {type: Number, required: true},
        unitPrice: {type: Number, required: true},
        lineTotal: {type: Number, required: true},
        lineCookMinutes: {type: Number, required: true},
        spiceLevel: { type: String, enum: ["none", "mild", "medium", "hot"], default: "none" },
        notes: { type: String, default: "" }, 
    },
    {_id: false}
);

const orderSchema = new Schema(
    {
        ticketNumber: {type: String, required: true, unique: true},
        customerName: {type: String, required: true},
        phone: {type: String, required: true},
        items: [orderLineSchema],
        subtotal: {type: Number, required: true},
        totalAmount: {type: Number, required: true},
        currency: {type: String, default: "ZAR"},
        requestedTime: {type: Date, default: null},

        status: {
            type: String,
            enum: [
                "awaiting_payment",
                "queued",
                "on_the_fire",
                "ready",
                "completed",
                "cancelled",
            ],
            default: "awaiting_payment",
        },

        paymentMethod: {
            type: String,
            enum: [
                "bank_card",
                "bank_eft",
                "mobile_money",
                "cash"
            ],
            required: true,
        },
        paymentStatus: {type: String, enum: ["pending", "paid", "failed"], default: "pending"},
        paymentReference: {type: String, default: ""},

        estimatedReadyAt: {type: Date, default: null},
        totalCookMinutes: {type: Number, default: 0},
        grillStartedAt: {type: Date, default: null},
        readyAt: {type: Date, default: null},
    },
    {timestamps: true}
);

export default model('Order', orderSchema);
