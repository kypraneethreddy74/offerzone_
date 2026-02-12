import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Filters.css";

/* BRAND OPTIONS */
const BRAND_OPTIONS = [
  { value: "", label: "All Brands", icon: "🏷️" },
  { value: "Samsung", label: "Samsung", icon: "📺" },
  { value: "LG", label: "LG", icon: "📺" },
  { value: "Sony", label: "Sony", icon: "📺" },
  { value: "TCL", label: "TCL", icon: "📺" },
  { value: "Xiaomi", label: "Xiaomi (Mi)", icon: "📺" },
  { value: "OnePlus", label: "OnePlus", icon: "📺" },
  { value: "Hisense", label: "Hisense", icon: "📺" },
  { value: "Vu", label: "Vu", icon: "📺" },
  { value: "Panasonic", label: "Panasonic", icon: "📺" },
  { value: "Toshiba", label: "Toshiba", icon: "📺" },
];

/* SCREEN SIZE OPTIONS */
const SCREEN_SIZES = [
  { value: "", label: "Any Size", icon: "📐" },
  { value: "32", label: '32"', subtitle: "Compact" },
  { value: "40", label: '40"', subtitle: "Medium" },
  { value: "43", label: '43"', subtitle: "Popular" },
  { value: "50", label: '50"', subtitle: "Large" },
  { value: "55", label: '55"', subtitle: "XL" },
  { value: "65", label: '65"', subtitle: "Premium" },
  { value: "75", label: '75"', subtitle: "Cinematic" },
  { value: "85", label: '85"', subtitle: "Ultra" },
];

/* DISPLAY TYPE OPTIONS */
const DISPLAY_TYPES = [
  { value: "", label: "All Types", icon: "🖥️", color: "#64748b" },
  { value: "LED", label: "LED", icon: "💡", color: "#f59e0b", desc: "Budget Friendly" },
  { value: "QLED", label: "QLED", icon: "✨", color: "#3b82f6", desc: "Vibrant Colors" },
  { value: "OLED", label: "OLED", icon: "🌟", color: "#8b5cf6", desc: "Perfect Blacks" },
  { value: "Mini LED", label: "Mini LED", icon: "🔆", color: "#10b981", desc: "High Brightness" },
  { value: "NanoCell", label: "NanoCell", icon: "🔬", color: "#ec4899", desc: "LG Premium" },
  { value: "LCD", label: "LCD", icon: "📟", color: "#6b7280", desc: "Classic" },
];

/* PRICE RANGES */
const PRICE_RANGES = [
  { min: "", max: "", label: "Any Price" },
  { min: "0", max: "20000", label: "Under ₹20,000" },
  { min: "20000", max: "35000", label: "₹20,000 - ₹35,000" },
  { min: "35000", max: "50000", label: "₹35,000 - ₹50,000" },
  { min: "50000", max: "75000", label: "₹50,000 - ₹75,000" },
  { min: "75000", max: "100000", label: "₹75,000 - ₹1,00,000" },
  { min: "100000", max: "", label: "Above ₹1,00,000" },
];

function Filters() {
  const navigate = useNavigate();

  const [brand, setBrand] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [screenSize, setScreenSize] = useState("");
  const [displayType, setDisplayType] = useState("");
  const [priceRangeIndex, setPriceRangeIndex] = useState(0);

  /* Handle price range selection */
  const handlePriceRange = (index) => {
    setPriceRangeIndex(index);
    setMinPrice(PRICE_RANGES[index].min);
    setMaxPrice(PRICE_RANGES[index].max);
  };

  /* Apply filters */
  const applyFilters = () => {
    navigate("/compare", {
      state: {
        brand: brand || null,
        min_price: minPrice || null,
        max_price: maxPrice || null,
        screen_size: screenSize || null,
        display_type: displayType || null,
      },
    });
  };

  /* Reset all filters */
  const resetFilters = () => {
    setBrand("");
    setMinPrice("");
    setMaxPrice("");
    setScreenSize("");
    setDisplayType("");
    setPriceRangeIndex(0);
  };

  /* Count active filters */
  const activeFilterCount = [brand, minPrice || maxPrice, screenSize, displayType].filter(Boolean).length;

  return (
    <div className="filters-page">
      <div className="container">
        {/* ========== HEADER ========== */}
        <div className="page-header">
          <div className="header-content">
            <h1 className="page-title">
              <span className="title-icon">🎛️</span>
              Advanced Filters
            </h1>
            <p className="page-subtitle">
              Narrow down your search to find the perfect TV
            </p>
          </div>
          {activeFilterCount > 0 && (
            <button className="btn-reset" onClick={resetFilters}>
              <i className="bi bi-arrow-counterclockwise"></i>
              Reset All ({activeFilterCount})
            </button>
          )}
        </div>

        {/* ========== FILTERS CONTAINER ========== */}
        <div className="filters-container">
          
          {/* BRAND FILTER */}
          <div className="filter-section">
            <h2 className="filter-title">
              <span>🏷️</span> Brand
            </h2>
            <div className="brand-grid">
              {BRAND_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  className={`brand-option ${brand === option.value ? 'selected' : ''}`}
                  onClick={() => setBrand(option.value)}
                >
                  <span className="brand-icon">{option.icon}</span>
                  <span className="brand-label">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* SCREEN SIZE FILTER */}
          <div className="filter-section">
            <h2 className="filter-title">
              <span>📐</span> Screen Size
            </h2>
            <div className="size-grid">
              {SCREEN_SIZES.map((size) => (
                <button
                  key={size.value}
                  className={`size-option ${screenSize === size.value ? 'selected' : ''}`}
                  onClick={() => setScreenSize(size.value)}
                >
                  <span className="size-value">{size.label}</span>
                  {size.subtitle && <span className="size-subtitle">{size.subtitle}</span>}
                </button>
              ))}
            </div>
          </div>

          {/* DISPLAY TYPE FILTER */}
          <div className="filter-section">
            <h2 className="filter-title">
              <span>🖥️</span> Display Type
            </h2>
            <div className="display-grid">
              {DISPLAY_TYPES.map((type) => (
                <button
                  key={type.value}
                  className={`display-option ${displayType === type.value ? 'selected' : ''}`}
                  style={{ '--type-color': type.color }}
                  onClick={() => setDisplayType(type.value)}
                >
                  <span className="display-icon">{type.icon}</span>
                  <div className="display-info">
                    <span className="display-label">{type.label}</span>
                    {type.desc && <span className="display-desc">{type.desc}</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* PRICE FILTER */}
          <div className="filter-section">
            <h2 className="filter-title">
              <span>💰</span> Price Range
            </h2>
            
            {/* Quick Price Ranges */}
            <div className="price-ranges">
              {PRICE_RANGES.map((range, index) => (
                <button
                  key={index}
                  className={`price-range-option ${priceRangeIndex === index ? 'selected' : ''}`}
                  onClick={() => handlePriceRange(index)}
                >
                  {range.label}
                </button>
              ))}
            </div>

            {/* Custom Price Input */}
            <div className="custom-price">
              <p className="custom-label">Or enter custom range:</p>
              <div className="price-inputs">
                <div className="price-input-wrapper">
                  <span className="currency">₹</span>
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => {
                      setMinPrice(e.target.value);
                      setPriceRangeIndex(-1);
                    }}
                  />
                </div>
                <span className="price-separator">to</span>
                <div className="price-input-wrapper">
                  <span className="currency">₹</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => {
                      setMaxPrice(e.target.value);
                      setPriceRangeIndex(-1);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========== FILTER SUMMARY ========== */}
        {activeFilterCount > 0 && (
          <div className="filter-summary">
            <div className="summary-header">
              <span className="summary-icon">✨</span>
              <h3>Active Filters</h3>
            </div>
            <div className="summary-tags">
              {brand && (
                <span className="summary-tag">
                  Brand: {brand}
                  <button onClick={() => setBrand("")}>✕</button>
                </span>
              )}
              {screenSize && (
                <span className="summary-tag">
                  Size: {screenSize}"
                  <button onClick={() => setScreenSize("")}>✕</button>
                </span>
              )}
              {displayType && (
                <span className="summary-tag">
                  Display: {displayType}
                  <button onClick={() => setDisplayType("")}>✕</button>
                </span>
              )}
              {(minPrice || maxPrice) && (
                <span className="summary-tag">
                  Price: {minPrice ? `₹${parseInt(minPrice).toLocaleString()}` : '₹0'} - {maxPrice ? `₹${parseInt(maxPrice).toLocaleString()}` : 'Any'}
                  <button onClick={() => { setMinPrice(""); setMaxPrice(""); setPriceRangeIndex(0); }}>✕</button>
                </span>
              )}
            </div>
          </div>
        )}

        {/* ========== ACTION BUTTONS ========== */}
        <div className="action-buttons">
          <button className="btn-secondary" onClick={() => navigate(-1)}>
            <i className="bi bi-arrow-left"></i>
            Back
          </button>
          <button className="btn-apply" onClick={applyFilters}>
            <span className="btn-icon">🔍</span>
            Apply Filters & Search
            <span className="btn-arrow">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Filters;