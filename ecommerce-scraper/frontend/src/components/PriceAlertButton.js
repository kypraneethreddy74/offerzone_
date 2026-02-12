import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { alertsAPI } from "../services/api";
import "./PriceAlertButton.css";

const PriceAlertButton = ({ 
  modelId, 
  currentPrice, 
  productName,
  size = "medium" // "small", "medium", "large"
}) => {
  const { user, isVerified } = useAuth();
  
  const [showModal, setShowModal] = useState(false);
  const [targetPrice, setTargetPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [hasAlert, setHasAlert] = useState(false);
  const [alertInfo, setAlertInfo] = useState(null);

  // Check if alert already exists for this model
  useEffect(() => {
    const checkExistingAlert = async () => {
      if (!user || !modelId) return;
      
      try {
        setChecking(true);
        const response = await alertsAPI.checkStatus(modelId);
        if (response.data.exists) {
          setHasAlert(true);
          setAlertInfo(response.data.alert);
          setTargetPrice(response.data.alert.target_price?.toString() || "");
        }
      } catch (err) {
        // No existing alert or error - that's fine
        console.log("No existing alert found");
      } finally {
        setChecking(false);
      }
    };

    checkExistingAlert();
  }, [user, modelId]);

  // Set default target price when modal opens
  useEffect(() => {
    if (showModal && !targetPrice && currentPrice) {
      setTargetPrice(Math.floor(currentPrice * 0.9).toString());
    }
  }, [showModal, currentPrice, targetPrice]);

  const handleClick = () => {
    if (!user) {
      // Redirect to login
      window.location.href = "/login?redirect=" + encodeURIComponent(window.location.pathname);
      return;
    }
    
    if (!isVerified || (typeof isVerified === 'function' && !isVerified())) {
      // Redirect to verification
      window.location.href = "/resend-verification";
      return;
    }
    
    setShowModal(true);
    setError("");
    setSuccess(false);
  };

  const handleClose = () => {
    setShowModal(false);
    setError("");
    setSuccess(false);
  };

  const handleSetAlert = async () => {
    const price = parseFloat(targetPrice);
  
    if (!price || price <= 0) {
      setError("Please enter a valid target price");
      return;
    }

    if (currentPrice && price >= currentPrice) {
      setError("Target price should be less than current price");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (hasAlert && alertInfo?.id) {
        await alertsAPI.updateAlert(alertInfo.id, { target_price: price });
      } else {
      // ✅ FIX: Pass two separate arguments
        await alertsAPI.createAlert(modelId, price);
      }
    
      setSuccess(true);
      setHasAlert(true);
      setAlertInfo({ ...alertInfo, target_price: price });
    
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      console.error("Alert error:", err.response?.data);
      setError(err.response?.data?.detail || err.response?.data?.message || "Failed to set alert. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAlert = async () => {
    if (!alertInfo?.id) return;
    
    setLoading(true);
    try {
      await alertsAPI.deleteAlert(alertInfo.id);
      setHasAlert(false);
      setAlertInfo(null);
      setTargetPrice("");
      handleClose();
    } catch (err) {
      setError("Failed to delete alert");
    } finally {
      setLoading(false);
    }
  };

  // Button text based on size and state
  const getButtonText = () => {
    if (checking) return "...";
    if (hasAlert) {
      if (size === "small") return `₹${alertInfo?.target_price?.toLocaleString("en-IN")}`;
      return `Alert: ₹${alertInfo?.target_price?.toLocaleString("en-IN")}`;
    }
    if (size === "small") return "Alert";
    return "Set Price Alert";
  };

  return (
    <>
      {/* Alert Button */}
      <button 
        className={`price-alert-btn size-${size} ${hasAlert ? 'has-alert' : ''}`}
        onClick={handleClick}
        disabled={checking}
        title={hasAlert ? `Alert set at ₹${alertInfo?.target_price?.toLocaleString("en-IN")}` : "Set Price Alert"}
      >
        <span className="alert-btn-icon">{hasAlert ? '🔔' : '🔕'}</span>
        <span className="alert-btn-text">{getButtonText()}</span>
      </button>

      {/* Modal */}
      {showModal && (
        <div className="price-alert-overlay" onClick={handleClose}>
          <div className="price-alert-modal" onClick={(e) => e.stopPropagation()}>
            {/* Close Button */}
            <button className="modal-close-btn" onClick={handleClose}>✕</button>
            
            {/* Modal Header */}
            <div className="modal-header">
              <span className="modal-header-icon">🔔</span>
              <h3>{hasAlert ? "Edit Price Alert" : "Set Price Alert"}</h3>
            </div>

            {/* Success State */}
            {success ? (
              <div className="modal-success">
                <span className="success-icon">✅</span>
                <p>Alert {hasAlert ? 'updated' : 'set'} successfully!</p>
                <span className="success-subtext">We'll notify you when the price drops</span>
              </div>
            ) : (
              <>
                {/* Modal Body */}
                <div className="modal-body">
                  {/* Product Name */}
                  {productName && (
                    <p className="modal-product-name">{productName}</p>
                  )}
                  
                  {/* Current Price */}
                  {currentPrice && (
                    <div className="current-price-display">
                      <span className="price-label">Current Best Price</span>
                      <span className="price-value">₹{currentPrice.toLocaleString("en-IN")}</span>
                    </div>
                  )}

                  {/* Target Price Input */}
                  <div className="target-price-input">
                    <label>Alert me when price drops to:</label>
                    <div className="input-container">
                      <span className="currency-symbol">₹</span>
                      <input
                        type="number"
                        value={targetPrice}
                        onChange={(e) => setTargetPrice(e.target.value)}
                        placeholder="Enter target price"
                        min="1"
                      />
                    </div>
                    
                    {/* Quick Options */}
                    {currentPrice && (
                      <div className="quick-options">
                        {[10, 15, 20, 25].map((percent) => (
                          <button
                            key={percent}
                            type="button"
                            className={`quick-option ${targetPrice === Math.floor(currentPrice * (1 - percent / 100)).toString() ? 'active' : ''}`}
                            onClick={() => setTargetPrice(Math.floor(currentPrice * (1 - percent / 100)).toString())}
                          >
                            -{percent}%
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="modal-error">
                      <span>⚠️</span> {error}
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="modal-footer">
                  {hasAlert && (
                    <button 
                      className="btn-delete-alert"
                      onClick={handleDeleteAlert}
                      disabled={loading}
                    >
                      🗑️ Delete
                    </button>
                  )}
                  <button 
                    className="btn-cancel"
                    onClick={handleClose}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn-set-alert"
                    onClick={handleSetAlert}
                    disabled={loading || !targetPrice}
                  >
                    {loading ? (
                      <>
                        <span className="btn-spinner"></span>
                        {hasAlert ? 'Updating...' : 'Setting...'}
                      </>
                    ) : (
                      <>🔔 {hasAlert ? 'Update Alert' : 'Set Alert'}</>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default PriceAlertButton;