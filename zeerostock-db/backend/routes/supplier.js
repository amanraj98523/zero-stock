
const express = require("express");
const cors    = require("cors");

const supplierRoutes  = require("./routes/supplier");
const inventoryRoutes = require("./routes/inventory");

const app  = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use("/supplier",  supplierRoutes);
app.use("/inventory", inventoryRoutes);

app.get("/health", (_, res) => res.json({ status: "ok" }));
app.use((req, res) => res.status(404).json({ error: `Route ${req.method} ${req.path} not found.` }));

app.listen(PORT, () => {
  console.log(`Zeerostock DB API running on http://localhost:${PORT}`);
});