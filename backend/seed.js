import {connectDB} from "./config/db.js";
import MenuItem from "./models/MenuItems.js";

const items = [
  {
    name: "T-Bone Steak",
    category: "beef",
    description: "Thick-cut T-bone, dry-rubbed and grilled to order.",
    pricingUnit: "per_kg",
    price: 189.99,
    minWeightKg: 0.4,
    cookMinutes: 18,
    spiceLevel: "none",
  },
  {
    name: "Boerewors",
    category: "boerewors",
    description: "Traditional coiled beef-and-pork wors, coarsely spiced.",
    pricingUnit: "per_kg",
    price: 129.99,
    minWeightKg: 0.5,
    cookMinutes: 14,
    spiceLevel: "mild",
  },
  {
    name: "Peri-Peri Chicken",
    category: "chicken",
    description: "Flame-grilled chicken pieces, basted in a sauce of your choosing.",
    pricingUnit: "per_kg",
    price: 89.99,
    cookMinutes: 25,
    spiceLevel: "hot",
  },
  {
    name: "Lamb Chops",
    category: "lamb",
    description: "Rosemary-marinated rib chops.",
    pricingUnit: "per_kg",
    price: 219.99,
    minWeightKg: 0.4,
    cookMinutes: 16,
    spiceLevel: "mild",
  },
  {
    name: "Pork Ribs",
    category: "pork",
    description: "Slow-basted spare ribs, sticky-glazed on the fire.",
    pricingUnit: "per_kg",
    price: 159.99,
    minWeightKg: 0.5,
    cookMinutes: 30,
    spiceLevel: "medium",
  },
  {
    name: "Papa",
    category: "sides",
    description: "White pap.",
    pricingUnit: "per_unit",
    price: 1.0,
    cookMinutes: 20,
    spiceLevel: "none",
  },
  {
    name: "Chakalaka",
    category: "sides",
    description: "Spiced tomato relish.",
    pricingUnit: "per_unit",
    price: 15.0,
    cookMinutes: 10,
    spiceLevel: "medium",
  },
  {
    name: "Spinach",
    category: "sides",
    description: "Fresh green spinach.",
    pricingUnit: "per_unit",
    price: 5.0,
    cookMinutes: 3,
    spiceLevel: "none",
  },
];

(async () => {
  await connectDB();
  await MenuItem.deleteMany({});
  await MenuItem.insertMany(items);
  console.log(`[seed] inserted ${items.length} menu items`);
  process.exit(0);
})();
