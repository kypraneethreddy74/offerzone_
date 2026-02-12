import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { alertsAPI } from "../services/api";
import "./StoreAlerts.css";

const StoreAlerts = () => {
  const navigate = useNavigate();
  const { user, isVerified } = useAuth();

  // State
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({ total: 0, active: 0, triggered: 0, paused: 0 });
  const [filter, setFilter] = useState("all"); // all, active, triggered, paused
  const [editingId, setEditingId] = useState(null);
  const [editPrice, setEditPrice] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  // Fetch alerts
  const fetchAlerts = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError("");
      const response = await alertsAPI.getAlerts();
      const alertsData = response.data.alerts || response.data || [];
      
      setAlerts(alertsData);
      
      // Calculate stats
      const total = alertsData.length;
      const active = alertsData.filter(a => a.is_active && !a.is_triggered).length;
      const triggered = alertsData.filter(a => a.is_triggered).length;
      const paused = alertsData.filter(a => !a.is_active).length;
      
      setStats({ total, active, triggered, paused });
    } catch (err) {
      console.error("Failed to fetch alerts:", err);
      setError("Failed to load alerts. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Toggle alert active status
  const handleToggle = async (alertId, currentStatus) => {
    setActionLoading(alertId);
    try {
      await alertsAPI.toggleAlert(alertId);
      // Update local state
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, is_active: !currentStatus }
          : alert
      ));
      // Recalculate stats
      fetchAlerts();
    } catch (err) {
      console.error("Failed to toggle alert:", err);
    } finally {
      setActionLoading(null);
    }
  };

  // Delete alert
  const handleDelete = async (alertId) => {
    if (!window.confirm("Are you sure you want to delete this price alert?")) return;
    
    setActionLoading(alertId);
    try {
      await alertsAPI.deleteAlert(alertId);
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
      // Recalculate stats
      const newAlerts = alerts.filter(alert => alert.id !== alertId);
      setStats({
        total: newAlerts.length,
        active: newAlerts.filter(a => a.is_active && !a.is_triggered).length,
        triggered: newAlerts.filter(a => a.is_triggered).length,
        paused: newAlerts.filter(a => !a.is_active).length
      });
    } catch (err) {
      console.error("Failed to delete alert:", err);
    } finally {
      setActionLoading(null);
    }
  };

  // Start editing
  const handleStartEdit = (alert) => {
    setEditingId(alert.id);
    setEditPrice(alert.target_price?.toString() || "");
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditPrice("");
  };

  // Save edited price
  const handleSaveEdit = async (alertId) => {
    const newPrice = parseFloat(editPrice);
    if (!newPrice || newPrice <= 0) {
      alert("Please enter a valid price");
      return;
    }

    setActionLoading(alertId);
    try {
      await alertsAPI.updateAlert(alertId, { target_price: newPrice });
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, target_price: newPrice }
          : alert
      ));
      setEditingId(null);
      setEditPrice("");
    } catch (err) {
      console.error("Failed to update alert:", err);
    } finally {
      setActionLoading(null);
    }
  };

  // Filter alerts
  const filteredAlerts = alerts.filter(alert => {
    if (filter === "active") return alert.is_active && !alert.is_triggered;
    if (filter === "triggered") return alert.is_triggered;
    if (filter === "paused") return !alert.is_active;
    return true;
  });

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  // Not logged in
  if (!user) {
    return (
      <div className="alerts-page">
        <div className="container">
          <div className="auth-required-card">
            <div className="auth-icon">🔒</div>
            <h2>Login Required</h2>
            <p>Please login to view and manage your price alerts</p>
            <Link to="/login" className="btn-primary">
              <span>🔑</span> Login to Continue
            </Link>
            <p className="auth-subtext">
              Don't have an account? <Link to="/register">Sign up</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Email not verified
  if (isVerified && typeof isVerified === 'function' && !isVerified()) {
    return (
      <div className="alerts-page">
        <div className="container">
          <div className="auth-required-card verification">
            <div className="auth-icon">📧</div>
            <h2>Email Verification Required</h2>
            <p>Please verify your email address to use price alerts</p>
            <Link to="/resend-verification" className="btn-primary">
              <span>✉️</span> Resend Verification Email
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="alerts-page">
      <div className="container">
        {/* ========== PAGE HEADER ========== */}
        <div className="page-header">
          <div className="header-left">
            <h1 className="page-title">
              <span className="title-icon">🔔</span>
              My Price Alerts
            </h1>
            <p className="page-subtitle">
              Get notified when prices drop on your favorite TVs
            </p>
          </div>
          
          <Link to="/compare" className="btn-add-alert">
            <span>+</span> Add New Alert
          </Link>
        </div>

        {/* ========== STATS CARDS ========== */}
        <div className="stats-grid">
          <div 
            className={`stat-card ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            <div className="stat-icon all">📋</div>
            <div className="stat-info">
              <span className="stat-value">{stats.total}</span>
              <span className="stat-label">Total Alerts</span>
            </div>
          </div>
          
          <div 
            className={`stat-card ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            <div className="stat-icon active-icon">✅</div>
            <div className="stat-info">
              <span className="stat-value">{stats.active}</span>
              <span className="stat-label">Active</span>
            </div>
          </div>
          
          <div 
            className={`stat-card ${filter === 'triggered' ? 'active' : ''}`}
            onClick={() => setFilter('triggered')}
          >
            <div className="stat-icon triggered">🎉</div>
            <div className="stat-info">
              <span className="stat-value">{stats.triggered}</span>
              <span className="stat-label">Triggered</span>
            </div>
          </div>
          
          <div 
            className={`stat-card ${filter === 'paused' ? 'active' : ''}`}
            onClick={() => setFilter('paused')}
          >
            <div className="stat-icon paused">⏸️</div>
            <div className="stat-info">
              <span className="stat-value">{stats.paused}</span>
              <span className="stat-label">Paused</span>
            </div>
          </div>
        </div>

        {/* ========== LOADING STATE ========== */}
        {loading && (
          <div className="loading-state">
            <div className="loader-animation">
              <span className="loader-icon">🔔</span>
            </div>
            <p>Loading your alerts...</p>
          </div>
        )}

        {/* ========== ERROR STATE ========== */}
        {error && !loading && (
          <div className="error-state">
            <span className="error-icon">⚠️</span>
            <h3>Something went wrong</h3>
            <p>{error}</p>
            <button className="btn-retry" onClick={fetchAlerts}>
              🔄 Try Again
            </button>
          </div>
        )}

        {/* ========== EMPTY STATE ========== */}
        {!loading && !error && alerts.length === 0 && (
          <div className="empty-state">
            <div className="empty-illustration">
              <span>🔕</span>
            </div>
            <h3>No Price Alerts Yet</h3>
            <p>Start tracking prices on your favorite TVs and get notified when they drop!</p>
            <div className="empty-actions">
              <Link to="/compare" className="btn-primary">
                <span>🔍</span> Search TVs
              </Link>
              <Link to="/best-deals" className="btn-secondary">
                <span>🔥</span> Browse Deals
              </Link>
            </div>
            
            <div className="how-it-works">
              <h4>How Price Alerts Work</h4>
              <div className="steps">
                <div className="step">
                  <span className="step-icon">1️⃣</span>
                  <p>Find a TV you like</p>
                </div>
                <div className="step">
                  <span className="step-icon">2️⃣</span>
                  <p>Set your target price</p>
                </div>
                <div className="step">
                  <span className="step-icon">3️⃣</span>
                  <p>Get email when price drops</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========== NO FILTERED RESULTS ========== */}
        {!loading && !error && alerts.length > 0 && filteredAlerts.length === 0 && (
          <div className="no-results-state">
            <span className="no-results-icon">🔍</span>
            <h3>No {filter} alerts found</h3>
            <button className="btn-text" onClick={() => setFilter('all')}>
              View all alerts →
            </button>
          </div>
        )}

        {/* ========== ALERTS LIST ========== */}
        {!loading && !error && filteredAlerts.length > 0 && (
          <div className="alerts-list">
            {filteredAlerts.map((alert) => (
              <div 
                key={alert.id} 
                className={`alert-card ${!alert.is_active ? 'paused' : ''} ${alert.is_triggered ? 'triggered' : ''}`}
              >
                {/* Triggered Banner */}
                {alert.is_triggered && (
                  <div className="triggered-banner">
                    <span>🎉</span> Price target reached!
                  </div>
                )}

                {/* Alert Content */}
                <div className="alert-content">
                  {/* Product Image */}
                  <div 
                    className="alert-image"
                    onClick={() => navigate(`/compare/${alert.model_id}`)}
                  >
                    {alert.image_url ? (
                      <img src={alert.image_url} alt={alert.product_name} />
                    ) : (
                      <div className="image-placeholder">
                        <span>📺</span>
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="alert-info">
                    <h3 
                      className="product-name"
                      onClick={() => navigate(`/compare/${alert.model_id}`)}
                    >
                      {alert.product_name || alert.model_id}
                    </h3>
                    
                    {alert.brand && (
                      <span className="product-brand">{alert.brand}</span>
                    )}

                    {/* Price Comparison */}
                    <div className="price-comparison">
                      {/* Current Price */}
                      <div className="price-block current">
                        <span className="price-label">Current Price</span>
                        <span className="price-value">
                          {alert.current_price 
                            ? `₹${alert.current_price.toLocaleString("en-IN")}`
                            : "Checking..."
                          }
                        </span>
                        {alert.current_price && alert.target_price && alert.current_price <= alert.target_price && (
                          <span className="price-hit-badge">🎯 Target Hit!</span>
                        )}
                      </div>

                      {/* Arrow */}
                      <div className="price-arrow">
                        <span>→</span>
                      </div>

                      {/* Target Price */}
                      <div className="price-block target">
                        <span className="price-label">Target Price</span>
                        {editingId === alert.id ? (
                          <div className="edit-price-form">
                            <div className="edit-input-wrapper">
                              <span className="currency">₹</span>
                              <input
                                type="number"
                                value={editPrice}
                                onChange={(e) => setEditPrice(e.target.value)}
                                autoFocus
                                onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit(alert.id)}
                              />
                            </div>
                            <div className="edit-actions">
                              <button 
                                className="btn-save"
                                onClick={() => handleSaveEdit(alert.id)}
                                disabled={actionLoading === alert.id}
                              >
                                ✓
                              </button>
                              <button 
                                className="btn-cancel-edit"
                                onClick={handleCancelEdit}
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ) : (
                          <span 
                            className="price-value editable"
                            onClick={() => handleStartEdit(alert)}
                            title="Click to edit"
                          >
                            ₹{alert.target_price?.toLocaleString("en-IN")}
                            <span className="edit-hint">✏️</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Alert Meta */}
                    <div className="alert-meta">
                      {alert.created_at && (
                        <span className="meta-item">
                          <span className="meta-icon">📅</span>
                          Created: {formatDate(alert.created_at)}
                        </span>
                      )}
                      {alert.trigger_count > 0 && (
                        <span className="meta-item triggered-count">
                          <span className="meta-icon">🔔</span>
                          Triggered {alert.trigger_count}x
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Alert Actions */}
                  <div className="alert-actions">
                    {/* Toggle Switch */}
                    <div className="toggle-container">
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={alert.is_active}
                          onChange={() => handleToggle(alert.id, alert.is_active)}
                          disabled={actionLoading === alert.id}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                      <span className="toggle-label">
                        {alert.is_active ? 'Active' : 'Paused'}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="action-buttons">
                      <button
                        className="btn-action view"
                        onClick={() => navigate(`/compare/${alert.model_id}`)}
                        title="View Product"
                      >
                        👁️
                      </button>
                      
                      <button
                        className="btn-action history"
                        onClick={() => navigate(`/price-history/${alert.model_id}`)}
                        title="Price History"
                      >
                        📈
                      </button>
                      
                      <button
                        className="btn-action delete"
                        onClick={() => handleDelete(alert.id)}
                        title="Delete Alert"
                        disabled={actionLoading === alert.id}
                      >
                        {actionLoading === alert.id ? '...' : '🗑️'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ========== HELP SECTION ========== */}
        {!loading && alerts.length > 0 && (
          <div className="help-section">
            <div className="help-card">
              <span className="help-icon">💡</span>
              <div className="help-content">
                <h4>Pro Tips</h4>
                <ul>
                  <li>Set target prices 10-20% below current price for realistic alerts</li>
                  <li>Check price history to see the lowest price a product has been</li>
                  <li>Prices usually drop during festive seasons and sales events</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreAlerts;