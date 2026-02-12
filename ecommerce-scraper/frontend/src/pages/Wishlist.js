import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWishlist } from "../context/WishlistContext";
import WishlistButton from "../components/WishlistButton";
import PriceAlertButton from "../components/PriceAlertButton";
import "./Wishlist.css";

const Wishlist = () => {
  const navigate = useNavigate();
  const { user, isVerified } = useAuth();
  const { wishlist, loading, fetchWishlist } = useWishlist();

  useEffect(() => {
    if (user) {
      fetchWishlist();
    }
  }, [user, fetchWishlist]);

  // Not logged in
  if (!user) {
    return (
      <div className="wishlist-page">
        <div className="container">
          <div className="empty-state">
            <div className="empty-icon-wrapper">
              <span className="empty-icon">🔒</span>
            </div>
            <h3>Login Required</h3>
            <p>Please login to view and manage your wishlist</p>
            <Link to="/login" className="btn-primary">
              <span>🔑</span> Login to Continue
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Loading
  if (loading) {
    return (
      <div className="wishlist-page">
        <div className="container">
          <div className="loading-state">
            <div className="loader-animation">
              <span className="loader-heart">❤️</span>
            </div>
            <p>Loading your wishlist...</p>
          </div>
        </div>
      </div>
    );
  }

  // Empty wishlist
  if (wishlist.length === 0) {
    return (
      <div className="wishlist-page">
        <div className="container">
          <div className="page-header">
            <h1 className="page-title">
              <span className="title-icon">❤️</span>
              My Wishlist
            </h1>
          </div>
          <div className="empty-state">
            <div className="empty-icon-wrapper">
              <span className="empty-icon">💔</span>
            </div>
            <h3>Your wishlist is empty</h3>
            <p>Start adding TVs you love and track their prices!</p>
            <div className="empty-actions">
              <Link to="/compare" className="btn-primary">
                <span>🔍</span> Search TVs
              </Link>
              <Link to="/best-deals" className="btn-secondary">
                <span>🔥</span> Browse Deals
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wishlist-page">
      <div className="container">
        {/* ========== HEADER ========== */}
        <div className="page-header">
          <div className="header-content">
            <h1 className="page-title">
              <span className="title-icon">❤️</span>
              My Wishlist
            </h1>
            <p className="page-subtitle">
              Track prices and get alerts for your favorite TVs
            </p>
          </div>
          <div className="header-stats">
            <div className="stat-card">
              <span className="stat-icon">📺</span>
              <div className="stat-info">
                <span className="stat-value">{wishlist.length}</span>
                <span className="stat-label">Items</span>
              </div>
            </div>
          </div>
        </div>

        {/* ========== VERIFICATION WARNING ========== */}
        {!isVerified() && (
          <div className="verification-alert">
            <div className="alert-content">
              <span className="alert-icon">📧</span>
              <div className="alert-text">
                <strong>Verify your email</strong>
                <p>to enable price alerts for your wishlist items</p>
              </div>
            </div>
            <Link to="/resend-verification" className="btn-verify">
              Verify Now
            </Link>
          </div>
        )}

        {/* ========== WISHLIST GRID ========== */}
        <div className="wishlist-grid">
          {wishlist.map((item) => (
            <div key={item.id} className="wishlist-card">
              {/* Wishlist Remove Button */}
              <div className="card-remove">
                <WishlistButton modelId={item.model_id} size="sm" />
              </div>

              {/* Image */}
              <div 
                className="card-image"
                onClick={() => navigate(`/compare/${item.model_id}`)}
              >
                {item.image_url ? (
                  <img src={item.image_url} alt={item.product_name} />
                ) : (
                  <div className="placeholder-image">
                    <span>📺</span>
                  </div>
                )}
                {item.max_discount > 0 && (
                  <div className="discount-badge">
                    {item.max_discount}% OFF
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="card-content">
                <h3 
                  className="product-name"
                  onClick={() => navigate(`/compare/${item.model_id}`)}
                >
                  {item.product_name || item.model_id}
                </h3>

                <p className="brand">{item.brand}</p>

                {/* Price Info */}
                <div className="price-section">
                  {item.min_price ? (
                    <div className="price-info">
                      <span className="current-price">
                        ₹{item.min_price.toLocaleString("en-IN")}
                      </span>
                      <span className="price-label">Starting at</span>
                    </div>
                  ) : (
                    <span className="price-unavailable">Price unavailable</span>
                  )}
                </div>

                {/* Platform Info */}
                <div className="platform-info">
                  <span className="platform-icon">🛒</span>
                  <span>
                    Available on {item.platform_count} platform{item.platform_count !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="card-actions">
                  <button
                    className="btn-compare"
                    onClick={() => navigate(`/compare/${item.model_id}`)}
                  >
                    <span>⚖️</span> Compare Prices
                  </button>
                  <button
                    className="btn-history"
                    onClick={() => navigate(`/price-history/${item.model_id}`)}
                  >
                    <span>📈</span> History
                  </button>
                </div>

                {/* Price Alert Section */}
                <div className="alert-section">
                  <PriceAlertButton
                    modelId={item.model_id}
                    currentPrice={item.min_price}
                    productName={item.product_name}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Wishlist;