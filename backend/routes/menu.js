import express from "express";
import MenuItem from "../models/MenuItems.js";

const router = express.Router();

// GET /api/menu - all available items, grouped implicitly by category on the client
router.get ("/", async (req,res) =>{
    try{
        const items = await MenuItem.find({available: true}).sort({category: 1, name: 1});
        res.json (items);
    } catch (err){
        res.status(500).json({error: "Could not load the menu."});
    }
});

router.post("/", async (req,res) => {
    try{
        const item = await MenuItem.create(req.body);
        res.status(201).json(item);
    } catch(err){
        res.status(400).json({error: err.message});
    }
});

// PATCH /api/menu/:id - update price, availability, cook time, etc.
router.patch ("/:id", async (req,res) =>{
    try{
        const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, {new: true});
        if (!item) return res.status(404).json({error: "Item not found"});
        res.json(item);
    } catch(err){
        res.status(400).json({error: err.message});
    }
});

export default router;