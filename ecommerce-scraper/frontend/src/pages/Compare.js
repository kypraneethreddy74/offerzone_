import React, { useEffect, useState, useCallback } from "react";
import { filterProducts, searchProducts } from "../services/api";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import WishlistButton from "../components/WishlistButton";

import "./Compare.css";

/* ===============================
   STORAGE KEYS
================================ */
const STORAGE_KEY = "compare_state";
const SCROLL_KEY = "compare_scrollPosition";
const SELECTED_KEY = "compare_selected_products";

/* ===============================
   TV IMAGE WITH FALLBACK
================================ */
const ImageWithFallback = ({ src, alt, size = "normal" }) => {
  const [hasError, setHasError] = useState(false);
  const dimensions = size === "small" ? { width: 60, height: 45 } : { width: 100, height: 75 };

  if (!src || hasError) {
    return (
      <div
        className="image-placeholder"
        style={{
          width: dimensions.width,
          height: dimensions.height,
        }}
      >
        <span>📺</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || "TV"}
      width={dimensions.width}
      height={dimensions.height}
      className="product-image"
      onError={() => setHasError(true)}
    />
  );
};

/* ===============================
   EXTRACT SCREEN SIZE
================================ */
const getScreenSize = (name) => {
  if (!name) return "";
  const inchMatch = name.match(/(\d{2,3})\s*inch/i);
  if (inchMatch) return `${inchMatch[1]}"`;
  const cmMatch = name.match(/(\d{2,3})\s*cm/i);
  if (cmMatch) {
    const inches = Math.round(parseInt(cmMatch[1]) / 2.54);
    return `${inches}"`;
  }
  return "";
};

/* ===============================
   REMOVE DUPLICATES
================================ */
const deduplicateModels = (data) => {
  const map = {};
  data.forEach((p) => {
    if (!map[p.model_id]) map[p.model_id] = p;
  });
  return Object.values(map);
};

function Compare() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // ========== STATE ==========
  const [searchText, setSearchText] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // ========== STICKY SELECTION STATE ==========
  const [selectedProducts, setSelectedProducts] = useState(() => {
    const saved = sessionStorage.getItem(SELECTED_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [showSelected, setShowSelected] = useState(true);

  // ========== GET INITIAL STATE ==========
  const getInitialState = useCallback(() => {
    const urlSearch = searchParams.get("search");
    if (urlSearch) {
      return { searchText: urlSearch, products: [], fromUrl: true };
    }
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          searchText: parsed.searchText || "",
          products: parsed.products || [],
          fromUrl: false
        };
      } catch (e) {
        // Ignore
      }
    }
    return { searchText: "", products: [], fromUrl: false };
  }, [searchParams]);

  const initialState = getInitialState();

  // ========== SAVE STATE ==========
  const saveState = useCallback(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ searchText, products }));
  }, [searchText, products]);

  // ========== SAVE SELECTED PRODUCTS ==========
  useEffect(() => {
    sessionStorage.setItem(SELECTED_KEY, JSON.stringify(selectedProducts));
  }, [selectedProducts]);

  // ========== SCROLL RESTORATION ==========
  useEffect(() => {
    const savedPosition = sessionStorage.getItem(SCROLL_KEY);
    if (savedPosition && products.length > 0) {
      setTimeout(() => {
        window.scrollTo(0, parseInt(savedPosition, 10));
      }, 100);
    }
    return () => {
      sessionStorage.setItem(SCROLL_KEY, window.scrollY.toString());
    };
  }, [products.length]);

  // ========== UPDATE URL ==========
  useEffect(() => {
    if (searchText && isInitialized) {
      setSearchParams({ search: searchText }, { replace: true });
    }
  }, [searchText, isInitialized, setSearchParams]);

  // ========== SAVE STATE ON CHANGE ==========
  useEffect(() => {
    if (isInitialized) {
      saveState();
    }
  }, [isInitialized, saveState]);

  // ========== INITIAL LOAD ==========
  useEffect(() => {
    if (location.state) {
      const { brand, min_price, max_price, display_type, screen_size } = location.state;
      setSearchText(brand || "");
      setLoading(true);

      filterProducts({ brand, min_price, max_price, display_type })
        .then((res) => {
          let data = deduplicateModels(res.data);
          if (screen_size) {
            data = data.filter((p) =>
              p.full_name?.toLowerCase().includes(`${screen_size} inch`)
            );
          }
          setProducts(data);
          setIsInitialized(true);
        })
        .catch((err) => console.error("Filter error:", err))
        .finally(() => setLoading(false));
    } else if (initialState.fromUrl && initialState.searchText) {
      setSearchText(initialState.searchText);
      setLoading(true);
      searchProducts(initialState.searchText)
        .then((res) => {
          setProducts(deduplicateModels(res.data));
          setIsInitialized(true);
        })
        .catch((err) => console.error("Search error:", err))
        .finally(() => setLoading(false));
    } else if (initialState.products.length > 0) {
      setSearchText(initialState.searchText);
      setProducts(initialState.products);
      setIsInitialized(true);
    } else {
      setIsInitialized(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  /* Search handler */
  const searchTV = async () => {
    if (!searchText.trim()) return;
    setLoading(true);
    try {
      const res = await searchProducts(searchText);
      const data = deduplicateModels(res.data);
      setProducts(data);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  /* Enter key handler */
  const handleKeyPress = (e) => {
    if (e.key === "Enter") searchTV();
  };

  /* Toggle product selection */
  const toggleProductSelection = (product) => {
    setSelectedProducts(prev => {
      const isSelected = prev.some(p => p.model_id === product.model_id);
      if (isSelected) {
        return prev.filter(p => p.model_id !== product.model_id);
      } else {
        if (prev.length >= 4) {
          alert("You can compare up to 4 products at a time");
          return prev;
        }
        return [...prev, product];
      }
    });
  };

  /* Remove from selection */
  const removeFromSelection = (modelId) => {
    setSelectedProducts(prev => prev.filter(p => p.model_id !== modelId));
  };

  /* Clear all selections */
  const clearAllSelections = () => {
    setSelectedProducts([]);
  };

  /* Navigate to comparison */
  const handleCompare = () => {
    if (selectedProducts.length < 2) {
      alert("Please select at least 2 products to compare");
      return;
    }
    const modelIds = selectedProducts.map(p => p.model_id).join(",");
    navigate(`/compare-results?models=${modelIds}`);
  };

  /* Navigate to single product */
  const handleViewProduct = (modelId) => {
    saveState();
    sessionStorage.setItem(SCROLL_KEY, window.scrollY.toString());
    navigate(`/compare/${modelId}`);
  };

  /* Check if product is selected */
  const isProductSelected = (modelId) => {
    return selectedProducts.some(p => p.model_id === modelId);
  };

  return (
    <div className="compare-page">
      <div className="container">
        {/* ========== HEADER ========== */}
        <div className="page-header">
          <div className="header-content">
            <h1 className="page-title">
              <span className="title-icon">🔍</span>
              Compare TVs
            </h1>
            <p className="page-subtitle">
              Search and select up to 4 TVs to compare prices across platforms
            </p>
          </div>
          <button 
            className="btn-filters"
            onClick={() => navigate("/filters")}
          >
            <i className="bi bi-sliders"></i>
            Advanced Filters
          </button>
        </div>

        {/* ========== SEARCH BAR ========== */}
        <div className="search-section">
          <div className="search-container">
            <div className="search-icon">🔎</div>
            <input
              className="search-input"
              placeholder="Search TV by Brand, Model, or Name..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button
              className="search-btn"
              onClick={searchTV}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-sm"></span>
                  Searching...
                </>
              ) : (
                <>
                  <i className="bi bi-search"></i>
                  Search
                </>
              )}
            </button>
          </div>
          
          {/* Quick Search Tags */}
          
        </div>

        {/* ========== SELECTED PRODUCTS (STICKY) ========== */}
        {selectedProducts.length > 0 && (
          <div className={`selected-products-section ${showSelected ? 'expanded' : 'collapsed'}`}>
            <div className="selected-header" onClick={() => setShowSelected(!showSelected)}>
              <div className="selected-title">
                <span className="selected-icon">⚡</span>
                <h3>Selected for Comparison</h3>
                <span className="selected-count">{selectedProducts.length}/4</span>
              </div>
              <div className="selected-actions">
                <button className="btn-clear" onClick={(e) => { e.stopPropagation(); clearAllSelections(); }}>
                  Clear All
                </button>
                <button className="btn-toggle">
                  {showSelected ? '▲' : '▼'}
                </button>
              </div>
            </div>
            
            {showSelected && (
              <div className="selected-products-grid">
                {selectedProducts.map((product, index) => (
                  <div key={product.model_id} className="selected-product-card">
                    <div className="selected-number">{index + 1}</div>
                    <button 
                      className="btn-remove"
                      onClick={() => removeFromSelection(product.model_id)}
                    >
                      ✕
                    </button>
                    <ImageWithFallback src={product.image_url} alt={product.full_name} size="small" />
                    <div className="selected-info">
                      <h4>{product.full_name?.substring(0, 40)}...</h4>
                      <div className="selected-price">
                        ₹{product.sale_price?.toLocaleString("en-IN")}
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Empty Slots */}
                {[...Array(4 - selectedProducts.length)].map((_, i) => (
                  <div key={`empty-${i}`} className="selected-product-card empty">
                    <div className="empty-slot">
                      <span>+</span>
                      <p>Add TV</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Compare Button */}
            <div className="compare-action">
              <button 
                className={`btn-compare ${selectedProducts.length >= 2 ? 'active' : ''}`}
                onClick={handleCompare}
                disabled={selectedProducts.length < 2}
              >
                <span className="compare-icon">⚖️</span>
                Compare {selectedProducts.length} TVs
                <span className="arrow">→</span>
              </button>
            </div>
          </div>
        )}

        {/* ========== LOADING STATE ========== */}
        {loading && (
          <div className="loading-container">
            <div className="loader">
              <div className="loader-tv">📺</div>
              <div className="loader-text">Searching TVs...</div>
            </div>
          </div>
        )}

        {/* ========== EMPTY STATE ========== */}
        {!loading && products.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h3>Search for TVs to Compare</h3>
            <p>Enter a brand name, model number, or TV size to find products</p>
            
          </div>
        )}

        {/* ========== SEARCH RESULTS ========== */}
        {!loading && products.length > 0 && (
          <div className="results-section">
            <div className="results-header">
              <h2>
                <span>📋</span>
                Search Results
              </h2>
              <span className="results-count">{products.length} TVs found</span>
            </div>

            <div className="products-grid">
              {products.map((product) => {
                const selected = isProductSelected(product.model_id);
                return (
                  <div 
                    key={product.model_id} 
                    className={`product-card ${selected ? 'selected' : ''}`}
                  >
                    {/* Selection Checkbox */}
                    <div 
                      className={`selection-checkbox ${selected ? 'checked' : ''}`}
                      onClick={() => toggleProductSelection(product)}
                    >
                      {selected ? '✓' : '+'}
                    </div>

                    {/* Wishlist Button */}
                    <div className="card-wishlist">
                      <WishlistButton modelId={product.model_id} size="sm" />
                    </div>

                    {/* Image */}
                    <div 
                      className="card-image"
                      onClick={() => handleViewProduct(product.model_id)}
                    >
                      <ImageWithFallback src={product.image_url} alt={product.full_name} />
                      {product.discount > 0 && (
                        <div className="discount-badge">
                          {product.discount}% OFF
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="card-content">
                      <h3 
                        className="product-title"
                        onClick={() => handleViewProduct(product.model_id)}
                      >
                        {product.full_name}
                      </h3>

                      <div className="product-specs">
                        {getScreenSize(product.full_name) && (
                          <span className="spec-badge size">
                            📐 {getScreenSize(product.full_name)}
                          </span>
                        )}
                        {product.display_type && (
                          <span className="spec-badge display">
                            🖥️ {product.display_type}
                          </span>
                        )}
                      </div>

                      <div className="price-section">
                        <div className="current-price">
                          ₹{product.sale_price?.toLocaleString("en-IN")}
                        </div>
                        {product.mrp && product.mrp > product.sale_price && (
                          <div className="original-price">
                            <del>₹{product.mrp?.toLocaleString("en-IN")}</del>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="card-actions">
                        <button 
                          className={`btn-select ${selected ? 'selected' : ''}`}
                          onClick={() => toggleProductSelection(product)}
                        >
                          {selected ? (
                            <>✓ Selected</>
                          ) : (
                            <>+ Add to Compare</>
                          )}
                        </button>
                        
                        <button 
                          className="btn-view"
                          onClick={() => handleViewProduct(product.model_id)}
                        >
                          View Details
                        </button>
                      </div>

                      
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Compare;