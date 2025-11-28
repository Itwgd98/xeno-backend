import express from "express";
import shopifyRoutes from "./routes/shopify.js";
import dotenv from "dotenv";
import cors from "cors";
import sequelize from "./utils/db.js";
import shopifyAuthRoutes from "./routes/shopifyAuth.js";



dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use("/", shopifyRoutes);
app.use("/auth", shopifyAuthRoutes);
// Test DB connection
sequelize.authenticate()
  .then(() => console.log("PostgreSQL Connected"))
  .catch(err => console.log("DB Error:", err));

// Test Route
app.get("/", (req, res) => {
  res.json({ message: "Xeno Backend Running 🚀" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
