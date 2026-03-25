
const express = require("express");
const router = express.Router();
const inventory = require("../data/inventory.json");

router.get("/", (req, res) => {
  const { q, category, minPrice, maxPrice } = req.query;

  const min = minPrice !== undefined ? parseFloat(minPrice) : null;
  const max = maxPrice !== undefined ? parseFloat(maxPrice) : null;

  if (minPrice !== undefined && isNaN(min))
    return res.status(400).json({ error: "Invalid minPrice value" });
  if (maxPrice !== undefined && isNaN(max))
    return res.status(400).json({ error: "Invalid maxPrice value" });
  if (min !== null && max !== null && min > max)
    return res.status(400).json({ error: "minPrice cannot be greater than maxPrice" });

  let results = [...inventory];

  if (q && q.trim() !== "")
    results = results.filter((item) => item.name.toLowerCase().includes(q.trim().toLowerCase()));

  if (category && category.trim() !== "")
    results = results.filter((item) => item.category.toLowerCase() === category.trim().toLowerCase());

  if (min !== null) results = results.filter((item) => item.price >= min);
  if (max !== null) results = results.filter((item) => item.price <= max);

  return res.json({ count: results.length, results });
});

module.exports = router;
