
const CATEGORIES = ["Metals","Electrical","Plastics","Machinery","Fasteners","Materials"];

export default function Filters({ category, setCategory, minPrice, setMinPrice, maxPrice, setMaxPrice }) {
  return (
    <div className="filters-grid">
      <div className="filter-field">
        <label className="field-label">Category</label>
        <select className="select-input" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="filter-field">
        <label className="field-label">Min Price ($)</label>
        <input type="number" className="price-input" placeholder="0" min="0" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
      </div>
      <div className="filter-field">
        <label className="field-label">Max Price ($)</label>
        <input type="number" className="price-input" placeholder="∞" min="0" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
      </div>
    </div>
  );
}
