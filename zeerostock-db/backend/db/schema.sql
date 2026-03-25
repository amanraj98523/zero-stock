
const path  = require("path");
const fs    = require("fs");
const initSqlJs = require("sql.js");

const DB_PATH = path.join(__dirname, "zeerostock.db");

let db;

async function getDb() {
  if (db) return db;
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`PRAGMA foreign_keys = ON;`);
  db.run(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id   INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT    NOT NULL,
      city TEXT    NOT NULL
    );
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS inventory (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      supplier_id  INTEGER NOT NULL,
      product_name TEXT    NOT NULL,
      quantity     INTEGER NOT NULL CHECK (quantity >= 0),
      price        REAL    NOT NULL CHECK (price > 0),
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    );
  `);
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_inventory_supplier ON inventory(supplier_id);
  `);

  save();
  return db;
}

function save() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

module.exports = { getDb, save };
