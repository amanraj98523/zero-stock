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


Deploy link:- https://rad-faloodeh-6bda9f.netlify.app/


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
