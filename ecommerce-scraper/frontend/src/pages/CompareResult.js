import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { compareByModel } from "../services/api";
import WishlistButton from "../components/WishlistButton";

import "./CompareResult.css";

/* ⭐ STAR RATING */
const StarRating = ({ rating, compact = false }) => {
  const stars = Math.round(rating || 0);
  return (
    <div className={`star-rating ${compact ? 'compact' : ''}`}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={i <= stars ? "star filled" : "star"}>★</span>
      ))}
      <span className="rating-value">{rating ? rating.toFixed(1) : "N/A"}</span>
    </div>
  );
};

/* PLATFORM CONFIG - Using images from public folder */
const PLATFORM_CONFIG = {
  amazon: { logo: "/amazon.jpg", color: "#FF9900", bg: "#FFF7E6", name: "AMAZON" },
  Amazon: { logo: "/amazon.jpg", color: "#FF9900", bg: "#FFF7E6", name: "AMAZON" },
  flipkart: { logo: "/flipkart.png", color: "#2874F0", bg: "#EBF3FF", name: "FLIPKART" },
  Flipkart: { logo: "/flipkart.png", color: "#2874F0", bg: "#EBF3FF", name: "FLIPKART" },
  croma: { logo: "/croma.png", color: "#00B0B9", bg: "#E6FAFB", name: "CROMA" },
  Croma: { logo: "/croma.png", color: "#00B0B9", bg: "#E6FAFB", name: "CROMA" },
  CROMA: { logo: "/croma.png", color: "#00B0B9", bg: "#E6FAFB", name: "CROMA" },
  reliance: { logo: null, color: "#E31837", bg: "#FFEBEE", name: "RELIANCE" },
  Reliance: { logo: null, color: "#E31837", bg: "#FFEBEE", name: "RELIANCE" },
  vijay: { logo: null, color: "#8B5CF6", bg: "#F3EEFF", name: "VIJAY" },
  Vijay: { logo: null, color: "#8B5CF6", bg: "#F3EEFF", name: "VIJAY" },
};

const getPlatformConfig = (platform) => 
  PLATFORM_CONFIG[platform] || { logo: null, color: "#6B7280", bg: "#F3F4F6", name: platform?.toUpperCase() || "STORE" };

/* PLATFORM LOGO COMPONENT */
const PlatformLogo = ({ platform, size = "normal" }) => {
  const config = getPlatformConfig(platform);
  const [imgError, setImgError] = useState(false);
  
  const sizeClass = size === "small" ? "logo-small" : size === "tiny" ? "logo-tiny" : "";
  
  if (config.logo && !imgError) {
    return (
      <div className={`platform-logo-wrapper ${sizeClass}`} style={{ background: config.bg }}>
        <img 
          src={config.logo} 
          alt={config.name}
          className="platform-logo-img"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }
  
  // Fallback to letter
  return (
    <div 
      className={`platform-logo-wrapper fallback ${sizeClass}`}
      style={{ background: config.color }}
    >
      <span>{config.name.charAt(0)}</span>
    </div>
  );
};

/* IMAGE FALLBACK */
const ImageWithFallback = ({ src, alt, className }) => {
  const [hasError, setHasError] = useState(false);
  
  if (!src || hasError) {
    return (
      <div className={`image-placeholder ${className || ''}`}>
        <span>📺</span>
      </div>
    );
  }
  
  return (
    <img 
      src={src} 
      alt={alt} 
      className={className}
      onError={() => setHasError(true)}
    />
  );
};

function CompareResult() {
  const { modelId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Get model IDs
  const modelsFromQuery = searchParams.get("models");
  const modelIds = modelsFromQuery 
    ? modelsFromQuery.split(",").filter(Boolean)
    : (modelId ? [modelId] : []);

  const isMultiCompare = modelIds.length > 1;
  const productCount = modelIds.length;

  useEffect(() => {
    const fetchData = async () => {
      if (!modelIds.length || modelIds[0] === "undefined") {
        setError("No TVs selected for comparison. Please go back and select TVs.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const results = await Promise.all(
          modelIds.map(async (id) => {
            try {
              const res = await compareByModel(id);
              return { modelId: id, data: res.data, error: null };
            } catch (err) {
              return { modelId: id, data: [], error: err.message };
            }
          })
        );

        const processedProducts = results
          .filter(r => r.data.length > 0)
          .map(r => {
            const prices = r.data.filter(p => p.sale_price).map(p => p.sale_price);
            const bestPrice = prices.length > 0 ? Math.min(...prices) : null;
            const bestPlatform = r.data.find(p => p.sale_price === bestPrice);
            
            return {
              modelId: r.modelId,
              productInfo: r.data[0],
              platforms: r.data,
              bestPrice,
              bestPlatform: bestPlatform?.platform,
              platformCount: r.data.length
            };
          });

        if (processedProducts.length === 0) {
          setError("No comparison data found for the selected TVs.");
        } else {
          setProducts(processedProducts);
        }
      } catch (err) {
        setError("Failed to load comparison data. Please try again.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [modelId, modelsFromQuery]);

  // Loading
  if (loading) {
    return (
      <div className="compare-result-page">
        <div className="container">
          <div className="loading-state">
            <div className="loader-animation">
              <span className="loader-icon">⚖️</span>
            </div>
            <p>Comparing prices across platforms...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="compare-result-page">
        <div className="container">
          <button className="btn-back" onClick={() => navigate(-1)}>
            ← Back
          </button>
          <div className="error-state">
            <span className="error-icon">⚠️</span>
            <h3>Oops!</h3>
            <p>{error}</p>
            <button className="btn-primary" onClick={() => navigate("/compare")}>
              Search TVs Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const overallBestPrice = Math.min(
    ...products.filter(p => p.bestPrice).map(p => p.bestPrice)
  );

  return (
    <div className="compare-result-page">
      <div className="container">
        {/* HEADER */}
        <div className="page-header">
          <button className="btn-back" onClick={() => navigate(-1)}>
            ← Back
          </button>
          <div className="header-content">
            <h1>
              <span>⚖️</span> 
              {isMultiCompare ? `Comparing ${products.length} TVs` : 'Price Comparison'}
            </h1>
          </div>
        </div>

        {/* MULTI-COMPARE GRID */}
        {isMultiCompare && (
          <div className={`multi-compare-grid count-${productCount}`}>
            {products.map((product, index) => (
              <div 
                key={product.modelId} 
                className={`compare-product-card ${product.bestPrice === overallBestPrice ? 'best-overall' : ''}`}
              >
                {/* Best Badge */}
                {product.bestPrice === overallBestPrice && (
                  <div className="best-overall-badge">🏆 Best Value</div>
                )}

                {/* Product Header */}
                <div className="product-header">
                  <div className="product-number">{index + 1}</div>
                  <div className="product-image">
                    <ImageWithFallback 
                      src={product.productInfo?.image_url} 
                      alt={product.productInfo?.full_name}
                    />
                  </div>
                  <div className="product-actions-top">
                    <WishlistButton modelId={product.modelId} size="sm" />
                  </div>
                </div>

                {/* Product Info */}
                <div className="product-info">
                  <h3 
                    className="product-title"
                    onClick={() => navigate(`/compare/${product.modelId}`)}
                  >
                    {product.productInfo?.full_name}
                  </h3>
                  
                  <div className="product-meta">
                    {product.productInfo?.display_type && (
                      <span className="meta-badge">{product.productInfo.display_type}</span>
                    )}
                  </div>

                  <StarRating rating={product.productInfo?.rating} compact={productCount >= 4} />
                </div>

                {/* Best Price */}
                <div className="best-price-section">
                  <div className="best-price-row">
                    <span className="label">Best Price</span>
                    <PlatformLogo platform={product.bestPlatform} size={productCount >= 4 ? "tiny" : "small"} />
                  </div>
                  <div className="best-price-amount">
                    ₹{product.bestPrice?.toLocaleString("en-IN")}
                  </div>
                </div>

                {/* Platform Prices - Compact List */}
                <div className="platform-prices-compact">
                  {product.platforms.map((p, i) => {
                    const config = getPlatformConfig(p.platform);
                    const isBest = p.sale_price === product.bestPrice;
                    return (
                      <a 
                        key={i}
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer" 
                        className={`platform-row-compact ${isBest ? 'best' : ''}`}
                      >
                        <PlatformLogo platform={p.platform} size="tiny" />
                        <span className="platform-name">{config.name}</span>
                        {isBest && <span className="best-tag">Best</span>}
                        <span className="platform-price">
                          ₹{p.sale_price?.toLocaleString("en-IN")}
                        </span>
                      </a>
                    );
                  })}
                </div>

                {/* Actions */}
                <div className="card-actions-compact">
                  <button
                    className="btn-history-sm"
                    onClick={() => navigate(`/price-history/${product.modelId}`)}
                  >
                    📈 History
                  </button>
                  
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SINGLE MODEL VIEW */}
        {!isMultiCompare && products.length > 0 && (
          <>
            {/* Product Info Card */}
            <div className="product-info-card">
              <div className="product-image-wrapper">
                <ImageWithFallback 
                  src={products[0].productInfo?.image_url}
                  alt={products[0].productInfo?.full_name}
                  className="product-main-image"
                />
              </div>
              <div className="product-details">
                <h2 className="product-name">{products[0].productInfo?.full_name}</h2>
                <div className="product-meta">
                  {products[0].productInfo?.display_type && (
                    <span className="meta-badge display">🖥️ {products[0].productInfo.display_type}</span>
                  )}
                  <span className="meta-badge model">🏷️ {products[0].modelId}</span>
                </div>
                <StarRating rating={products[0].productInfo?.rating} />
                
                <div className="product-actions">
                  <WishlistButton modelId={products[0].modelId} />
                  <button 
                    className="btn-history"
                    onClick={() => navigate(`/price-history/${products[0].modelId}`)}
                  >
                    📈 Price History
                  </button>
                </div>
              </div>
              
              <div className="best-price-highlight">
                <div className="best-label">🏆 Best Price</div>
                <div className="best-amount">₹{products[0].bestPrice?.toLocaleString("en-IN")}</div>
                <PlatformLogo platform={products[0].bestPlatform} size="small" />
              </div>
            </div>

            {/* ALL PLATFORMS Section */}
            <div className="platforms-section">
              <h2 className="section-title">ALL PLATFORMS</h2>
              
              <div className="platforms-list">
                {products[0].platforms
                  .sort((a, b) => (a.sale_price || 999999) - (b.sale_price || 999999))
                  .map((item, index) => {
                    const config = getPlatformConfig(item.platform);
                    const isBest = item.sale_price === products[0].bestPrice;
                    
                    return (
                      <a 
                        key={index}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`platform-card-new ${isBest ? 'best' : ''}`}
                      >
                        <div className="platform-left">
                          <PlatformLogo platform={item.platform} />
                          <span className="platform-name-text">{config.name}</span>
                          {isBest && <span className="best-badge-inline">Best</span>}
                        </div>
                        
                        <div className="platform-right">
                          <span className="price-text">
                            ₹{item.sale_price?.toLocaleString("en-IN")}
                          </span>
                        </div>
                      </a>
                    );
                  })}
              </div>

              {/* Action Buttons */}
              <div className="bottom-actions">
                <button
                  className="btn-action history full-width"
                  onClick={() => navigate(`/price-history/${products[0].modelId}`)}
                >
                  <span className="btn-icon">📈</span>
                  <span className="btn-text">Price History</span>
                </button>
              
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default CompareResult;