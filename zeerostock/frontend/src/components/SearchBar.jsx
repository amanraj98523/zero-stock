
export default function SearchBar({ value, onChange, onSearch }) {
  return (
    <div className="search-bar-wrapper">
      <label className="field-label">Product Name</label>
      <div className="search-input-row">
        <span className="search-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
        <input type="text" className="search-input" placeholder="e.g. steel pipe, copper wire…"
          value={value} onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearch()} />
      </div>
    </div>
  );
}
