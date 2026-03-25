
import { useState, useCallback } from "react";
import SearchBar from "./components/SearchBar";
import Filters from "./components/Filters";
import ResultsTable from "./components/ResultsTable";

export default function App() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [results, setResults] = useState(null);
  const [count, setCount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = useCallback(async () => {
    const min = minPrice !== "" ? parseFloat(minPrice) : null;
    const max = maxPrice !== "" ? parseFloat(maxPrice) : null;
    if (min !== null && isNaN(min)) return setError("Min price must be a valid number.");
    if (max !== null && isNaN(max)) return setError("Max price must be a valid number.");
    if (min !== null && max !== null && min > max) return setError("Min price cannot be greater than max price.");

    setError(""); setLoading(true);
    const params = new URLSearchParams();
    if (query.trim()) params.append("q", query.trim());
    if (category) params.append("category", category);
    if (minPrice !== "") params.append("minPrice", minPrice);
    if (maxPrice !== "") params.append("maxPrice", maxPrice);

    try {
      const res = await fetch(`/search?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Something went wrong."); setResults(null); }
      else { setResults(data.results); setCount(data.count); }
    } catch {
      setError("Could not connect to the server. Make sure the backend is running.");
      setResults(null);
    } finally { setLoading(false); }
  }, [query, category, minPrice, maxPrice]);

  const handleReset = () => {
    setQuery(""); setCategory(""); setMinPrice(""); setMaxPrice("");
    setResults(null); setCount(null); setError("");
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="logo"><span className="logo-zero">ZERO</span><span className="logo-stock">STOCK</span></div>
          <p className="tagline">Surplus inventory. Instant search.</p>
        </div>
      </header>
      <main className="main">
        <section className="search-panel">
          <SearchBar value={query} onChange={setQuery} onSearch={handleSearch} />
          <Filters category={category} setCategory={setCategory} minPrice={minPrice} setMinPrice={setMinPrice} maxPrice={maxPrice} setMaxPrice={setMaxPrice} />
          {error && <div className="error-banner"><span className="error-icon">⚠</span> {error}</div>}
          <div className="action-row">
            <button className="btn-search" onClick={handleSearch} disabled={loading}>
              {loading ? <span className="spinner" /> : null}
              {loading ? "Searching…" : "Search Inventory"}
            </button>
            <button className="btn-reset" onClick={handleReset}>Reset</button>
          </div>
        </section>
        <section className="results-section">
          <ResultsTable results={results} count={count} loading={loading} />
        </section>
      </main>
      <footer className="footer"><p>Zeerostock · Surplus Search Platform · 2025</p></footer>
    </div>
  );
}
