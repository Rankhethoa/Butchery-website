import {Schema, model} from "mongoose";

const menuItemSchema = new Schema(
    {
        name: {type: String, required: true, trim: true},
        category:{
            type:String,
            enum: ["beef", "boerewors", "chicken", "lamb", "pork", "papa", "spinach", "sides", "chakalaka"],
            required: true,
        },
        description: {type: String, default: ""},
        pricingUnit: { type: String, enum: ["per_kg", "per_unit"], default: "per_kg" },
        price: {type: Number, required: true},
        minWeightKg: {type: Number, default: 0.5},
        cookMinutes: {type: Number, required: true},
        spiceLevel: {type: String, enum: ["none", "mild", "medium", "hot"], default: "none"},
        image: {type: String, default: ""},
        available: {type: Boolean, default: true},
    },
    { timestamps: true}
);

export default model('MenuItems', menuItemSchema);
