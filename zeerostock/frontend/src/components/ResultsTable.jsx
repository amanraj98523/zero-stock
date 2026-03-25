
const CAT_BG = { Metals:"#e8f4f0",Electrical:"#fef3e2",Plastics:"#e8f0fe",Machinery:"#fce8e8",Fasteners:"#f3e8fe",Materials:"#e8fef3" };
const CAT_TX = { Metals:"#1a6b4a",Electrical:"#b45309",Plastics:"#1a47b8",Machinery:"#b91c1c",Fasteners:"#7c3aed",Materials:"#065f46" };

export default function ResultsTable({ results, count, loading }) {
  if (loading) return (
    <div className="results-placeholder">
      <div className="skeleton-rows">
        {[...Array(5)].map((_,i) => <div key={i} className="skeleton-row" style={{opacity: 1 - i * 0.15}} />)}
      </div>
    </div>
  );
  if (results === null) return (
    <div className="results-placeholder empty-state">
      <div className="empty-icon"><svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg></div>
      <p className="empty-title">Ready to search</p>
      <p className="empty-sub">Enter a product name or select filters, then click Search.</p>
    </div>
  );
  if (results.length === 0) return (
    <div className="results-placeholder empty-state">
      <div className="empty-icon no-results-icon"><svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg></div>
      <p className="empty-title">No results found</p>
      <p className="empty-sub">Try adjusting your search terms or filters.</p>
    </div>
  );
  return (
    <div className="results-container">
      <div className="results-header"><span className="results-count"><strong>{count}</strong> item{count !== 1 ? "s" : ""} found</span></div>
      <div className="table-wrapper">
        <table className="results-table">
          <thead><tr><th>SKU</th><th>Product</th><th>Category</th><th>Supplier</th><th className="text-right">Price</th><th className="text-right">Qty</th></tr></thead>
          <tbody>
            {results.map((item, i) => (
              <tr key={item.id} className="result-row" style={{animationDelay:`${i*40}ms`}}>
                <td className="sku-cell">{item.sku}</td>
                <td className="name-cell">{item.name}</td>
                <td><span className="category-badge" style={{background:CAT_BG[item.category]||"#f0f0f0",color:CAT_TX[item.category]||"#333"}}>{item.category}</span></td>
                <td className="supplier-cell">{item.supplier}</td>
                <td className="text-right price-cell">${item.price.toLocaleString()}</td>
                <td className="text-right qty-cell">{item.quantity.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
