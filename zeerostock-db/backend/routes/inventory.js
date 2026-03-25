
const express = require("express");
const router  = express.Router();
const { getDb, save } = require("../db");

router.post("/", async (req, res) => {
  const { supplier_id, product_name, quantity, price } = req.body;

  if (!supplier_id || isNaN(parseInt(supplier_id)))
    return res.status(400).json({ error: "supplier_id is required and must be a number." });

  const qty = parseInt(quantity);
  const prc = parseFloat(price);

  if (isNaN(qty) || qty < 0)
    return res.status(400).json({ error: "quantity must be an integer >= 0." });
  if (isNaN(prc) || prc <= 0)
    return res.status(400).json({ error: "price must be a number > 0." });
  if (!product_name || product_name.trim() === "")
    return res.status(400).json({ error: "product_name is required." });

  try {
    const db = await getDb();

    const supplierCheck = db.exec(`SELECT id FROM suppliers WHERE id = ${parseInt(supplier_id)}`);
    if (!supplierCheck.length || !supplierCheck[0].values.length)
      return res.status(404).json({ error: `Supplier with id ${supplier_id} does not exist.` });

    db.run(
      "INSERT INTO inventory (supplier_id, product_name, quantity, price) VALUES (?, ?, ?, ?)",
      [parseInt(supplier_id), product_name.trim(), qty, prc]
    );

    const result = db.exec("SELECT * FROM inventory ORDER BY id DESC LIMIT 1");
    save();
    const row = result[0].values[0];
    return res.status(201).json({
      id: row[0], supplier_id: row[1], product_name: row[2], quantity: row[3], price: row[4]
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to create inventory item.", detail: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const db = await getDb();

    const result = db.exec(`
      SELECT
        s.id, s.name, s.city,
        SUM(i.quantity * i.price) AS total_value,
        i.id as iid, i.product_name, i.quantity, i.price
      FROM suppliers s
      JOIN inventory i ON i.supplier_id = s.id
      GROUP BY s.id, i.id
      ORDER BY total_value DESC
    `);

    if (!result.length) return res.json({ count: 0, data: [] });

    const rows = result[0].values;
    const map  = new Map();

    for (const row of rows) {
      const [sid, sname, scity, total_value, iid, product_name, quantity, price] = row;
      if (!map.has(sid)) {
        map.set(sid, {
          supplier_id:   sid,
          supplier_name: sname,
          supplier_city: scity,
          total_value:   parseFloat(total_value.toFixed(2)),
          items:         []
        });
      }
      map.get(sid).items.push({
        id: iid, product_name, quantity, price,
        item_value: parseFloat((quantity * price).toFixed(2))
      });
    }

    const data = Array.from(map.values()).sort((a, b) => b.total_value - a.total_value);
    return res.json({ count: data.length, data });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch inventory.", detail: err.message });
  }
});

module.exports = router;
