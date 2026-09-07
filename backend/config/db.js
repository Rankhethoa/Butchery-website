import mongoose from "mongoose"

let db;
export async function connectDB(){
    const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/butchery";
    try{
        await mongoose.connect(uri);
        console.log(`[db] connected -> ${uri}`);
    } catch (err){
        console.error("[db] connected failed:", err.message);
        process.exit(1);
    }
}
