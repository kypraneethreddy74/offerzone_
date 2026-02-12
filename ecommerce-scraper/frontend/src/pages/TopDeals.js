import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getBestDeals } from "../services/api";
import "./TopDeals.css";
import WishlistButton from "../components/WishlistButton";



const platformIcons = {
  amazon: "/amazon.jpg",
  flipkart: "/flipkart.png",
  croma: "/croma.png",
};

/* ===============================
   STAR RATING COMPONENT
================================ */
const StarRating = ({ rating }) => {
  const stars = [];
  const fullStars = Math.floor(rating || 0);
  const hasHalf = (rating || 0) - fullStars >= 0.5;

  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars.push(<span key={i} className="star filled">★</span>);
    } else if (i === fullStars && hasHalf) {
      stars.push(<span key={i} className="star half">★</span>);
    } else {
      stars.push(<span key={i} className="star empty">☆</span>);
    }
  }

  return <span className="star-rating">{stars}</span>;
};

/* ===============================
   IMAGE WITH FALLBACK
================================ */
const ProductImage = ({ src, alt }) => {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div className="product-image-placeholder">
        <span>📺</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className="product-image"
      onError={() => setHasError(true)}
    />
  );
};

/* ===============================
   PRODUCT CARD COMPONENT
================================ */
const ProductCard = ({ product, rank, onClick, onPriceHistory, onBestPriceTracker }) => {
  const savings = product.price_difference || 0;
  const savingsPercent = product.savings_percent || 0;

  const handleButtonClick = (e, action) => {
    e.stopPropagation();
    action();
  };

  // Rank badge colors
  const getRankStyle = (rank) => {
    if (rank === 1) return { background: "linear-gradient(135deg, #FFD700, #FFA500)", color: "#000" };
    if (rank === 2) return { background: "linear-gradient(135deg, #C0C0C0, #A8A8A8)", color: "#000" };
    if (rank === 3) return { background: "linear-gradient(135deg, #CD7F32, #B87333)", color: "#fff" };
    return { background: "linear-gradient(135deg, #ff9900, #ffb347)", color: "#000" };
  };

  return (
    <div className="top-deal-card" onClick={onClick}>
      {/* Rank Badge */}
      <div className="rank-badge" style={getRankStyle(rank)}>
        #{rank}
      </div>

      {/* Wishlist Button */}
      <div className="wishlist-btn-container">
        <WishlistButton modelId={product.model_id} />
      </div>

      {/* Hot Deal Badge for top 10 */}
      {rank <= 10 && (
        <span className="hot-deal-badge">🔥 Hot Deal</span>
      )}

      {/* Product Image */}
      <div className="product-image-container">
        <ProductImage src={product.image_url} alt={product.full_name} />
      </div>

      {/* Product Info */}
      <div className="product-info">
        <h3 className="product-name">{product.full_name}</h3>

        {/* Rating */}
        <div className="product-rating">
          <span className="rating-badge">
            {(product.avg_rating || 0).toFixed(1)} <StarRating rating={product.avg_rating} />
          </span>
        </div>

        {/* Specs */}
        <ul className="product-specs">
          <li><strong>{product.display_type || "LED"}</strong></li>
          <li>Model: <strong>{product.model_id}</strong></li>
          <li>Available on: <strong>{product.platform_count} platforms</strong></li>
        </ul>

        {/* Price Comparison */}
		<div className="price-comparison">
		  {product.platform_prices &&
			Object.entries(product.platform_prices).map(([platform, price]) => (
			  <div key={platform} className="platform-price">
				<span className="platform-name">
				  <img
					src={platformIcons[platform.toLowerCase()]}
					alt={platform}
					className="platform-icon"
				  />
				  {platform}
				</span>
				<span className="platform-price-value">
				  ₹{Number(price).toLocaleString("en-IN")}
				</span>
			  </div>
			))}
		</div>

        {/* Price Section */}
        <div className="product-price-section">
          <span className="current-price">₹{Number(product.min_price).toLocaleString("en-IN")}</span>
          {product.original_cost > product.min_price && (
            <>
              <span className="original-price">₹{Number(product.original_cost).toLocaleString("en-IN")}</span>
              <span className="discount-badge">{product.max_discount}% off</span>
            </>
          )}
        </div>

        {/* Savings Highlight */}
        {savings > 0 && (
          <div className="savings-highlight">
            <span className="savings-icon">💰</span>
            <span className="savings-text">
              Save ₹{Number(savings).toLocaleString("en-IN")} ({savingsPercent}%)
            </span>
          </div>
        )}

        {/* Stock Status */}
        <div className={`stock-status ${product.stock_status === "in_stock" ? "in-stock" : "out-stock"}`}>
          {product.stock_status === "in_stock" ? "✓ In Stock" : "Out of Stock"}
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button
            className="btn-price-history"
            onClick={(e) => handleButtonClick(e, onPriceHistory)}
          >
            <i className="bi bi-graph-up-arrow"></i>
            Price History
          </button>
          <button
            className="btn-best-price"
            onClick={(e) => handleButtonClick(e, onBestPriceTracker)}
          >
            <i className="bi bi-trophy-fill"></i>
            Best Price
          </button>
        </div>
      </div>
    </div>
  );
};

/* ===============================
   MAIN TOP DEALS PAGE
================================ */
function TopDeals() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load top 48 deals
  useEffect(() => {
    const fetchTopDeals = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getBestDeals({
          page: 1,
          page_size: 48,
          sort_by: "savings_percent",
          order: "desc",
        });
        setProducts(res.data);
      } catch (err) {
        console.error("Error loading top deals:", err);
        setError("Failed to load top deals. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchTopDeals();
  }, []);

  // Navigation handlers
  const handleNavigate = (path) => {
    navigate(path);
  };

  const handlePriceHistory = (product) => {
    const params = new URLSearchParams({
      tab: "history",
      name: product.full_name
    });
    navigate(`/price-history/${product.model_id}?${params.toString()}`);
  };

  const handleBestPriceTracker = (product) => {
    const params = new URLSearchParams({
      tab: "best",
      name: product.full_name
    });
    navigate(`/price-history/${product.model_id}?${params.toString()}`);
  };

  return (
    <div className="top-deals-page">
      {/* Hero Header */}
      <div className="top-deals-header">
        <div className="header-content">
          <div className="header-icon">🏆</div>
          <div className="header-text">
            <h1>Top Deals</h1>
            <p>Top 48 TV deals with the best savings - Updated daily</p>
          </div>
          
        </div>
      </div>

      {/* Stats Bar */}
      {!loading && products.length > 0 && (
        <div className="stats-bar">
          <div className="stat-item">
            <span className="stat-value">{products.length}</span>
            <span className="stat-label">Top Deals</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">
              ₹{Math.max(...products.map(p => p.price_difference || 0)).toLocaleString("en-IN")}
            </span>
            <span className="stat-label">Max Savings</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">
              {Math.max(...products.map(p => p.savings_percent || 0))}%
            </span>
            <span className="stat-label">Best Discount</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">
              {new Set(products.map(p => p.brand)).size}
            </span>
            <span className="stat-label">Brands</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="top-deals-content">
        {/* Loading State */}
        {loading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Finding the best deals for you...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="error-container">
            <span className="error-icon">⚠️</span>
            <h3>Oops! Something went wrong</h3>
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>Try Again</button>
          </div>
        )}

        {/* Products Grid */}
        {!loading && !error && products.length > 0 && (
          <div className="top-deals-grid">
            {products.map((product, index) => (
              <ProductCard
                key={product.model_id}
                product={product}
                rank={index + 1}
                onClick={() => handleNavigate(`/compare/${product.model_id}`)}
                onPriceHistory={() => handlePriceHistory(product)}
                onBestPriceTracker={() => handleBestPriceTracker(product)}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && products.length === 0 && (
          <div className="empty-container">
            <span className="empty-icon">🔍</span>
            <h3>No deals found</h3>
            <p>Check back later for amazing deals!</p>
          </div>
        )}
      </div>

      {/* Footer CTA */}
      {!loading && products.length > 0 && (
        <div className="footer-cta">
          <p>Want more options with filters?</p>
          <button onClick={() => navigate("/best-deals")}>
            Browse All Deals →
          </button>
        </div>
      )}
    </div>
  );
}

export default TopDeals;