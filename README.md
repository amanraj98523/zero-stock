# Zeerostock — Inventory Search

Surplus inventory search across multiple suppliers. Filter by product name, category, and price range.

---

## Getting Started

### Backend

```bash
cd backend
npm install
npm run dev        # runs on http://localhost:4000
```

### Frontend

```bash
cd frontend
npm install
npm run dev        # runs on http://localhost:5173
```

---

```
Deploy link:- https://rad-faloodeh-6bda9f.netlify.app/
```

## API Reference

### `GET /search`

| Param      | Type   | Description                             |
| ---------- | ------ | --------------------------------------- |
| `q`        | string | Partial, case-insensitive name match    |
| `category` | string | Exact category match (case-insensitive) |
| `minPrice` | number | Minimum unit price                      |
| `maxPrice` | number | Maximum unit price                      |

**Example Requests**

```
GET /search                            → returns all 15 items
GET /search?q=steel                    → items with "steel" in name
GET /search?category=Metals            → all Metals items
GET /search?minPrice=50&maxPrice=500   → items priced $50–$500
GET /search?q=motor&minPrice=100       → combined filters
```

**Success Response**

```json
{
  "count": 3,
  "results": [
    {
      "id": 1,
      "name": "Industrial Steel Pipes",
      "category": "Metals",
      "price": 120,
      "quantity": 200,
      "supplier": "MetalWorks Co.",
      "sku": "MWC-SP-001"
    }
  ]
}
```

**Error Response (400)**

```json
{ "error": "minPrice cannot be greater than maxPrice" }
```

---

## Search Logic Explanation

Filters are applied sequentially on an in-memory array loaded once from `data/inventory.json` at server startup.

### Step-by-step flow

**1. Name search (`q`)**
The query string is trimmed and lowercased, then matched against each product name using `String.includes()`. This gives partial, case-insensitive matching — so `"steel"` matches both `"Industrial Steel Pipes"` and `"Stainless Steel Bolts M10"`.

```js
results = results.filter((item) =>
  item.name.toLowerCase().includes(q.trim().toLowerCase()),
);
```

**2. Category filter (`category`)**
Compared with lowercase equality. Completely independent of the name filter so both can be combined freely.

```js
results = results.filter(
  (item) => item.category.toLowerCase() === category.trim().toLowerCase(),
);
```

**3. Price range (`minPrice`, `maxPrice`)**
Both are parsed to floats. Invalid values (NaN) and inverted ranges (`min > max`) are rejected with a `400` error before any filtering begins.

```js
if (min !== null) results = results.filter((item) => item.price >= min);
if (max !== null) results = results.filter((item) => item.price <= max);
```

All filters are **opt-in** — omitting a param skips that filter entirely. An empty request returns the full dataset.

---

## Edge Cases Handled

| Case                  | Behaviour                                                         |
| --------------------- | ----------------------------------------------------------------- |
| Empty `q`             | Skipped — all products returned unless other filters apply        |
| Whitespace-only `q`   | Trimmed before use, treated as empty                              |
| Non-numeric price     | `400` → `"Invalid minPrice/maxPrice value"`                       |
| `minPrice > maxPrice` | `400` → `"minPrice cannot be greater than maxPrice"`              |
| No matches            | Returns `{ count: 0, results: [] }` — UI shows "No results found" |
| No filters at all     | Returns all 15 items                                              |

---

## Performance Improvement for Large Datasets

**Current approach:** linear scan of the in-memory array — O(n) per request. Fine for hundreds of records, but degrades at scale.

### Improvement: Full-text search index with MeiliSearch

For large datasets (10,000+ records), replace the array scan with [MeiliSearch](https://www.meilisearch.com/):

- Product names are **tokenised and indexed at write time**, so name queries become O(log n) lookups instead of full scans.
- Category and price range map to MeiliSearch's **faceted filters**, which use pre-built bitmaps evaluated in constant time regardless of dataset size.
- Supports typo-tolerance and prefix matching natively — `"stell"` still finds `"Steel"`.
- Sub-10ms response times on millions of records.

```js
// Example — same API shape, far better performance at scale
const results = await meiliIndex.search(q, {
  filter: [
    category ? `category = "${category}"` : null,
    min !== null ? `price >= ${min}` : null,
    max !== null ? `price <= ${max}` : null,
  ].filter(Boolean),
});
```

**Simpler interim option (no external service):** build an **inverted index** in-memory at startup — a map of every word token → matching product IDs. This cuts name search from O(n) to O(1) with zero dependencies, and is a solid step before introducing a dedicated search engine.

////Assignment:-2

# Zeerostock — Inventory Database + APIs

Suppliers list surplus stock. Buyers browse inventory grouped by supplier.

---

## Getting Started

```bash
cd zeerostock-db/backend
npm install
npm run dev        # runs on http://localhost:4000
```

No external database setup needed — SQLite file is created automatically on first run.

---

## API Reference

### POST /supplier

Create a new supplier.

**Body**

```json
{ "name": "MetalWorks Co.", "city": "Mumbai" }
```

**Response 201**

```json
{ "id": 1, "name": "MetalWorks Co.", "city": "Mumbai" }
```

---

### POST /inventory

Add an inventory item. Supplier must exist.

**Body**

```json
{
  "supplier_id": 1,
  "product_name": "Steel Pipes",
  "quantity": 200,
  "price": 120.0
}
```

**Response 201**

```json
{
  "id": 1,
  "supplier_id": 1,
  "product_name": "Steel Pipes",
  "quantity": 200,
  "price": 120
}
```

**Validation errors (400)**

- `supplier_id` does not exist → 404
- `quantity < 0` → 400
- `price <= 0` → 400

---

### GET /inventory

Returns all inventory grouped by supplier, sorted by total inventory value (quantity × price) descending.

**Response**

```json
{
  "count": 2,
  "data": [
    {
      "supplier_id": 1,
      "supplier_name": "MetalWorks Co.",
      "supplier_city": "Mumbai",
      "total_value": 24000.0,
      "items": [
        {
          "id": 1,
          "product_name": "Steel Pipes",
          "quantity": 200,
          "price": 120,
          "item_value": 24000
        }
      ]
    }
  ]
}
```

---

## Database Schema Explanation

Two tables with a one-to-many relationship:

```
suppliers
  id    INTEGER  PRIMARY KEY AUTOINCREMENT
  name  TEXT     NOT NULL
  city  TEXT     NOT NULL

inventory
  id            INTEGER  PRIMARY KEY AUTOINCREMENT
  supplier_id   INTEGER  NOT NULL  → FK → suppliers.id
  product_name  TEXT     NOT NULL
  quantity      INTEGER  NOT NULL  CHECK (quantity >= 0)
  price         REAL     NOT NULL  CHECK (price > 0)
```

- `CHECK` constraints on quantity and price are enforced at the DB level — even if validation in the API is bypassed, the DB will reject bad data.
- `FOREIGN KEY (supplier_id) REFERENCES suppliers(id)` ensures no orphan inventory rows.
- `PRAGMA foreign_keys = ON` is set at runtime because SQLite disables FK enforcement by default.

---

## Why SQL (SQLite)?

This problem is a textbook relational use case:

- The relationship between suppliers and inventory is strict and well-defined (one-to-many).
- The required query — group by supplier, sort by aggregated value — is a natural SQL `GROUP BY` with `SUM()`. Doing this in NoSQL (e.g. MongoDB) requires a multi-stage aggregation pipeline that is more complex for no benefit here.
- `CHECK` constraints and `FOREIGN KEY` enforcement give data integrity guarantees out of the box.
- SQLite requires zero setup — no server, no credentials, just a file — making it ideal for this assignment while being trivially swappable for PostgreSQL in production.

**When NoSQL would make sense:** if inventory items had wildly different schemas per supplier (different attributes, nested specs), a document store like MongoDB would be a better fit.

---

## Indexing & Optimization Suggestion

**Index already added:**

```sql
CREATE INDEX idx_inventory_supplier ON inventory(supplier_id);
```

This makes the `JOIN` in `GET /inventory` fast — SQLite can jump directly to all rows for a given supplier instead of scanning the full table.

**Next optimization for scale:** add a partial or composite index on `(supplier_id, price, quantity)` to let the DB compute `SUM(quantity * price)` without fetching full rows:

```sql
CREATE INDEX idx_inventory_value ON inventory(supplier_id, quantity, price);
```

This turns the aggregation query into an **index-only scan** — the DB never touches the main table rows, just reads the index. On millions of rows this can be 10–50× faster than a full table scan.
