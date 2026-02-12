import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { alertsAPI } from "../services/api";
import "./Alerts.css";

const Alerts = () => {
  const navigate = useNavigate();
  const { user, isVerified } = useAuth();

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, triggered: 0 });
  const [editingId, setEditingId] = useState(null);
  const [editPrice, setEditPrice] = useState("");
  const [filter, setFilter] = useState("all"); // all, active, triggered

  useEffect(() => {
    if (user) {
      fetchAlerts();
    }
  }, [user]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await alertsAPI.getAlerts();
      setAlerts(response.data.alerts || []);
      setStats({
        total: response.data.total,
        active: response.data.active_count,
        triggered: response.data.triggered_count
      });
    } catch (err) {
      console.error("Failed to fetch alerts:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (alertId) => {
    try {
      await alertsAPI.toggleAlert(alertId);
      fetchAlerts();
    } catch (err) {
      console.error("Failed to toggle alert:", err);
    }
  };

  const handleDelete = async (alertId) => {
    if (!window.confirm("Remove this price alert?")) return;
    try {
      await alertsAPI.deleteAlert(alertId);
      fetchAlerts();
    } catch (err) {
      console.error("Failed to delete alert:", err);
    }
  };

  const handleEdit = (alert) => {
    setEditingId(alert.id);
    setEditPrice(alert.target_price.toString());
  };

  const handleSaveEdit = async (alertId) => {
    try {
      await alertsAPI.updateAlert(alertId, { target_price: parseFloat(editPrice) });
      setEditingId(null);
      fetchAlerts();
    } catch (err) {
      console.error("Failed to update alert:", err);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditPrice("");
  };

  // Filter alerts
  const filteredAlerts = alerts.filter(alert => {
    if (filter === "active") return alert.is_active && !alert.is_triggered;
    if (filter === "triggered") return alert.is_triggered;
    return true;
  });

  // Not logged in
  if (!user) {
    return (
      <div className="alerts-page">
        <div className="container">
          <div className="empty-state">
            <div className="empty-icon-wrapper">
              <span className="empty-icon">🔒</span>
            </div>
            <h3>Login Required</h3>
            <p>Please login to manage your price alerts</p>
            <Link to="/login" className="btn-primary">
              <span>🔑</span> Login to Continue
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Not verified
  if (!isVerified()) {
    return (
      <div className="alerts-page">
        <div className="container">
          <div className="empty-state verification">
            <div className="empty-icon-wrapper">
              <span className="empty-icon">📧</span>
            </div>
            <h3>Email Verification Required</h3>
            <p>Please verify your email to use price alerts and get notified when prices drop</p>
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
        {/* ========== HEADER ========== */}
        <div className="page-header">
          <div className="header-content">
            <h1 className="page-title">
              <span className="title-icon">🔔</span>
              Price Alerts
            </h1>
            <p className="page-subtitle">
              Get notified when prices drop on your favorite TVs
            </p>
          </div>
          
          {/* Stats Cards */}
          <div className="header-stats">
            <div 
              className={`stat-card ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              <span className="stat-icon">📋</span>
              <div className="stat-info">
                <span className="stat-value">{stats.total}</span>
                <span className="stat-label">Total</span>
              </div>
            </div>
            <div 
              className={`stat-card active-stat ${filter === 'active' ? 'active' : ''}`}
              onClick={() => setFilter('active')}
            >
              <span className="stat-icon">✅</span>
              <div className="stat-info">
                <span className="stat-value">{stats.active}</span>
                <span className="stat-label">Active</span>
              </div>
            </div>
            <div 
              className={`stat-card triggered-stat ${filter === 'triggered' ? 'active' : ''}`}
              onClick={() => setFilter('triggered')}
            >
              <span className="stat-icon">🎉</span>
              <div className="stat-info">
                <span className="stat-value">{stats.triggered}</span>
                <span className="stat-label">Triggered</span>
              </div>
            </div>
          </div>
        </div>

        {/* ========== LOADING ========== */}
        {loading && (
          <div className="loading-state">
            <div className="loader-animation">
              <span className="loader-bell">🔔</span>
            </div>
            <p>Loading your alerts...</p>
          </div>
        )}

        {/* ========== EMPTY STATE ========== */}
        {!loading && alerts.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon-wrapper">
              <span className="empty-icon">🔕</span>
            </div>
            <h3>No price alerts yet</h3>
            <p>Set alerts on products to get notified when prices drop!</p>
            <div className="empty-actions">
              <Link to="/compare" className="btn-primary">
                <span>🔍</span> Search TVs
              </Link>
              <Link to="/best-deals" className="btn-secondary">
                <span>🔥</span> Browse Deals
              </Link>
            </div>
          </div>
        )}

        {/* ========== NO FILTERED RESULTS ========== */}
        {!loading && alerts.length > 0 && filteredAlerts.length === 0 && (
          <div className="empty-state small">
            <span className="empty-icon-small">🔍</span>
            <h3>No {filter} alerts</h3>
            <button className="btn-text" onClick={() => setFilter('all')}>
              View all alerts
            </button>
          </div>
        )}

        {/* ========== ALERTS LIST ========== */}
        {!loading && filteredAlerts.length > 0 && (
          <div className="alerts-list">
            {filteredAlerts.map((alert) => (
              <div 
                key={alert.id} 
                className={`alert-card ${!alert.is_active ? "inactive" : ""} ${alert.is_triggered ? "triggered" : ""}`}
              >
                {/* Triggered Badge */}
                {alert.is_triggered && (
                  <div className="triggered-badge-top">
                    <span>🎉</span> Price Reached!
                  </div>
                )}

                {/* Alert Image */}
                <div 
                  className="alert-image"
                  onClick={() => navigate(`/compare/${alert.model_id}`)}
                >
                  {alert.image_url ? (
                    <img src={alert.image_url} alt={alert.product_name} />
                  ) : (
                    <div className="placeholder">
                      <span>📺</span>
                    </div>
                  )}
                </div>

                {/* Alert Content */}
                <div className="alert-content">
                  <h3 
                    className="alert-title"
                    onClick={() => navigate(`/compare/${alert.model_id}`)}
                  >
                    {alert.product_name || alert.model_id}
                  </h3>
                  <p className="alert-brand">{alert.brand}</p>

                  {/* Price Info */}
                  <div className="price-info">
                    {/* Current Price */}
                    <div className="price-block current">
                      <span className="price-label">Current Price</span>
                      <span className="price-value">
                        {alert.current_price 
                          ? `₹${alert.current_price.toLocaleString("en-IN")}`
                          : "N/A"
                        }
                      </span>
                    </div>

                    {/* Arrow */}
                    <div className="price-arrow">
                      <span>→</span>
                    </div>

                    {/* Target Price */}
                    <div className="price-block target">
                      <span className="price-label">Target Price</span>
                      {editingId === alert.id ? (
                        <div className="edit-price">
                          <div className="edit-input-wrapper">
                            <span className="currency">₹</span>
                            <input
                              type="number"
                              value={editPrice}
                              onChange={(e) => setEditPrice(e.target.value)}
                              autoFocus
                            />
                          </div>
                          <div className="edit-actions">
                            <button 
                              className="btn-save"
                              onClick={() => handleSaveEdit(alert.id)}
                            >
                              ✓
                            </button>
                            <button 
                              className="btn-cancel"
                              onClick={handleCancelEdit}
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ) : (
                        <span 
                          className="price-value editable"
                          onClick={() => handleEdit(alert)}
                        >
                          ₹{alert.target_price?.toLocaleString("en-IN")}
                          <i className="edit-icon">✏️</i>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Trigger Info */}
                  {alert.is_triggered && (
                    <div className="trigger-info">
                      <span className="trigger-icon">🎯</span>
                      <span>Triggered {alert.trigger_count}x</span>
                      {alert.last_triggered && (
                        <span className="trigger-date">
                          Last: {new Date(alert.last_triggered).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Alert Actions */}
                <div className="alert-actions">
                  {/* Toggle Switch */}
                  <div className="toggle-wrapper">
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={alert.is_active}
                        onChange={() => handleToggle(alert.id)}
                      />
                      <span className="slider"></span>
                    </label>
                    <span className="toggle-label">
                      {alert.is_active ? 'Active' : 'Paused'}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="action-buttons">
                    <button
                      className="btn-icon history"
                      onClick={() => navigate(`/price-history/${alert.model_id}`)}
                      title="View Price History"
                    >
                      <span>📈</span>
                    </button>
                    
                    <button
                      className="btn-icon compare"
                      onClick={() => navigate(`/compare/${alert.model_id}`)}
                      title="Compare Prices"
                    >
                      <span>⚖️</span>
                    </button>
                    
                    <button
                      className="btn-icon delete"
                      onClick={() => handleDelete(alert.id)}
                      title="Delete Alert"
                    >
                      <span>🗑️</span>
                    </button>
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
                <h4>How Price Alerts Work</h4>
                <p>When the price of a product drops to or below your target price, we'll send you an email notification. You can edit your target price anytime by clicking on it.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Alerts;