import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getPlatformList,
  getBrandsByPlatform,
  getModelsByPlatformBrand
} from "../services/api";
import "./Catalog.css";

export default function Catalog() {
  const navigate = useNavigate();

  const [platforms, setPlatforms] = useState([]);
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);

  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState({ platforms: true, brands: false, models: false });

  const pageSize = 20;

  // Fetch platforms
  useEffect(() => {
    getPlatformList()
      .then(res => {
        setPlatforms(res.data);
        setLoading(prev => ({ ...prev, platforms: false }));
      })
      .catch(() => setLoading(prev => ({ ...prev, platforms: false })));
  }, []);

  // Select platform
  const selectPlatform = async (platform) => {
    setSelectedPlatform(platform);
    setSelectedBrand(null);
    setModels([]);
    setPage(1);
    setLoading(prev => ({ ...prev, brands: true }));

    try {
      const res = await getBrandsByPlatform(platform);
      setBrands(res.data);
    } catch {
      setBrands([]);
    } finally {
      setLoading(prev => ({ ...prev, brands: false }));
    }
  };

  // Select brand
  const selectBrand = async (brand) => {
    setSelectedBrand(brand);
    setPage(1);
    setLoading(prev => ({ ...prev, models: true }));

    try {
      const res = await getModelsByPlatformBrand(selectedPlatform, brand, 1, pageSize);
      setModels(res.data);
    } catch {
      setModels([]);
    } finally {
      setLoading(prev => ({ ...prev, models: false }));
    }
  };

  // Change page
  const changePage = async (newPage) => {
    setPage(newPage);
    setLoading(prev => ({ ...prev, models: true }));

    try {
      const res = await getModelsByPlatformBrand(selectedPlatform, selectedBrand, newPage, pageSize);
      setModels(res.data);
    } catch {
      setModels([]);
    } finally {
      setLoading(prev => ({ ...prev, models: false }));
    }
  };

  // Format price
  const formatPrice = (price) => {
    if (!price) return "N/A";
    return `₹${Number(price).toLocaleString('en-IN')}`;
  };

  return (
    <div className="tv-cat-container">
      {/* ==================== HEADER ==================== */}
      <div className="tv-cat-header">
        <div className="tv-cat-header-left">
          <h1>📚 TV Catalog</h1>
          <p>Browse TVs by platform and brand</p>
        </div>
        <div className="tv-cat-stats-row">
          <div className="tv-cat-stat-box">
            <span className="tv-cat-stat-num">{platforms.length}</span>
            <span className="tv-cat-stat-label">Platforms</span>
          </div>
          <div className="tv-cat-stat-box">
            <span className="tv-cat-stat-num">{brands.length}</span>
            <span className="tv-cat-stat-label">Brands</span>
          </div>
          <div className="tv-cat-stat-box">
            <span className="tv-cat-stat-num">{models.length}</span>
            <span className="tv-cat-stat-label">Models</span>
          </div>
        </div>
      </div>

      {/* ==================== PLATFORMS ==================== */}
      <div className="tv-cat-platforms-section">
        <h3>Select Platform:</h3>
        <div className="tv-cat-platforms-list">
          {loading.platforms ? (
            <span className="tv-cat-loading-text">Loading platforms...</span>
          ) : (
            platforms.map(p => (
              <button
                key={p}
                className={`tv-cat-platform-btn ${selectedPlatform === p ? 'active' : ''}`}
                onClick={() => selectPlatform(p)}
              >
                {p}
              </button>
            ))
          )}
        </div>
      </div>

      {/* ==================== MAIN CONTENT ==================== */}
      <div className="tv-cat-main-grid">
        {/* BRANDS SIDEBAR */}
        <div className="tv-cat-brands-panel">
          <h3>🏷️ Brands {brands.length > 0 && `(${brands.length})`}</h3>

          {!selectedPlatform ? (
            <div className="tv-cat-msg-empty">
              <p>👆 Select a platform first</p>
            </div>
          ) : loading.brands ? (
            <div className="tv-cat-loading-text">Loading brands...</div>
          ) : brands.length === 0 ? (
            <div className="tv-cat-msg-empty">
              <p>No brands found</p>
            </div>
          ) : (
            <div className="tv-cat-brands-list">
              {brands.map(b => (
                <button
                  key={b}
                  className={`tv-cat-brand-btn ${selectedBrand === b ? 'active' : ''}`}
                  onClick={() => selectBrand(b)}
                >
                  {b}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* MODELS TABLE */}
        <div className="tv-cat-models-panel">
          <div className="tv-cat-models-header">
            <h3>📺 TV Models {selectedBrand && `- ${selectedBrand}`}</h3>
          </div>

          {!selectedBrand ? (
            <div className="tv-cat-state-empty">
              <span className="tv-cat-icon-large">👈</span>
              <h4>Select a Brand</h4>
              <p>Choose a platform and brand to see available TV models</p>
            </div>
          ) : loading.models ? (
            <div className="tv-cat-state-loading">
              <div className="tv-cat-spinner"></div>
              <p>Loading models...</p>
            </div>
          ) : models.length === 0 ? (
            <div className="tv-cat-state-empty">
              <span className="tv-cat-icon-large">📭</span>
              <h4>No Models Found</h4>
              <p>No TVs available for this selection</p>
            </div>
          ) : (
            <>
              {/* Models Table */}
              <div className="tv-cat-table-wrapper">
                <table className="tv-cat-table">
                  <thead>
                    <tr>
                      <th width="40%">Product</th>
                      <th>Price</th>
                      <th>Rating</th>
                      <th>Stock</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {models.map((m, idx) => (
                      <tr key={`${m.model_id}-${idx}`}>
                        <td className="tv-cat-cell-product">
                          <div className="tv-cat-prod-info">
                            {m.image_url && (
                              <img src={m.image_url} alt="" className="tv-cat-prod-thumb" />
                            )}
                            <div>
                              {/* UNIQUE CLASS NAME HERE PREVENTS CONFLICT */}
                              <span className="tv-cat-prod-name">{m.full_name}</span>
                              {m.display_type && (
                                <span className="tv-cat-prod-type">{m.display_type}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="tv-cat-cell-price">
                          <span className="tv-cat-price-val">{formatPrice(m.sale_price)}</span>
                          {m.discount > 0 && (
                            <span className="tv-cat-discount-val">{m.discount}% off</span>
                          )}
                        </td>
                        <td className="tv-cat-cell-rating">
                          {m.rating > 0 ? (
                            <span className="tv-cat-rating-badge">⭐ {m.rating.toFixed(1)}</span>
                          ) : (
                            <span className="tv-cat-rating-none">-</span>
                          )}
                        </td>
                        <td className="tv-cat-cell-stock">
                          <span className={`tv-cat-stock-badge ${m.stock_status === 'in_stock' ? 'in' : 'out'}`}>
                            {m.stock_status === 'in_stock' ? 'In Stock' : 'Out'}
                          </span>
                        </td>
                        <td className="tv-cat-cell-action">
                          <button
                            className="tv-cat-compare-btn"
                            onClick={() => navigate(`/compare/${m.model_id}`)}
                          >
                            Compare →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="tv-cat-pagination">
                <button
                  disabled={page === 1}
                  onClick={() => changePage(page - 1)}
                >
                  ← Previous
                </button>
                <span className="tv-cat-page-num">Page {page}</span>
                <button
                  disabled={models.length < pageSize}
                  onClick={() => changePage(page + 1)}
                >
                  Next →
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}