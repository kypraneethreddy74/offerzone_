/**
 * Admin Scrapers & ETL Control Panel
 */

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { adminAPI } from "../services/api";
import "./AdminScrapers.css";

const AdminScrapers = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  
  const [jobs, setJobs] = useState({});
  const [loading, setLoading] = useState(true);
  const [runningAction, setRunningAction] = useState(null);

  // Scraper configurations
  const scrapers = [
    { id: "amazon", name: "Amazon", icon: "🛒", color: "#ff9900" },
    { id: "flipkart", name: "Flipkart", icon: "🛍️", color: "#2874f0" },
    { id: "croma", name: "Croma", icon: "🏪", color: "#0db7af" },
  ];

  const fetchStatus = useCallback(async () => {
    try {
      const response = await adminAPI.getScraperStatus();
      setJobs(response.data.jobs || {});
    } catch (err) {
      console.error("Failed to fetch status:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user || !isAdmin()) {
      navigate("/unauthorized");
      return;
    }
    fetchStatus();
    
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [user, isAdmin, navigate, fetchStatus]);

  const handleRunScraper = async (scraperId, scraperName) => {
    if (!window.confirm(`Run ${scraperName} scraper?`)) return;
    
    setRunningAction(scraperId);
    try {
      const response = await adminAPI.runScraper(scraperId);
      alert(`✅ ${scraperName} scraper started!\nJob ID: ${response.data.job_id}`);
      fetchStatus();
    } catch (err) {
      alert(`❌ Failed: ${err.response?.data?.detail || err.message}`);
    } finally {
      setRunningAction(null);
    }
  };

  const handleRunAllScrapers = async () => {
    if (!window.confirm("Run ALL scrapers (Amazon, Flipkart, Croma)?")) return;
    
    setRunningAction("all");
    try {
      const response = await adminAPI.runScraper("all");
      alert(`✅ All scrapers started!\nJob ID: ${response.data.job_id}`);
      fetchStatus();
    } catch (err) {
      alert(`❌ Failed: ${err.response?.data?.detail || err.message}`);
    } finally {
      setRunningAction(null);
    }
  };

  const handleRunETL = async () => {
    if (!window.confirm("Run ETL Pipeline?\n\nThis will process and transform scraped data.")) return;
    
    setRunningAction("etl");
    try {
      const response = await adminAPI.runETL();
      alert(`✅ ETL Pipeline started!\nJob ID: ${response.data.job_id}`);
      fetchStatus();
    } catch (err) {
      alert(`❌ Failed: ${err.response?.data?.detail || err.message}`);
    } finally {
      setRunningAction(null);
    }
  };

  const handleRunFullPipeline = async () => {
    if (!window.confirm("Run FULL Pipeline?\n\n1. All Scrapers\n2. ETL Processing\n\nThis may take 30+ minutes.")) return;
    
    setRunningAction("full");
    try {
      const response = await adminAPI.runFullPipeline();
      alert(`✅ Full pipeline started!\nJob ID: ${response.data.job_id}`);
      fetchStatus();
    } catch (err) {
      alert(`❌ Failed: ${err.response?.data?.detail || err.message}`);
    } finally {
      setRunningAction(null);
    }
  };

  const handleClearJobs = async () => {
    if (!window.confirm("Clear all completed/failed job history?")) return;
    
    try {
      const response = await adminAPI.clearCompletedJobs();
      alert(`Cleared ${response.data.cleared} jobs`);
      fetchStatus();
    } catch (err) {
      alert(`Failed: ${err.response?.data?.detail || err.message}`);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      running: { class: "running", icon: "⏳", text: "Running" },
      completed: { class: "completed", icon: "✅", text: "Completed" },
      failed: { class: "failed", icon: "❌", text: "Failed" },
      timeout: { class: "timeout", icon: "⏰", text: "Timeout" },
    };
    const badge = badges[status] || { class: "unknown", icon: "❓", text: status };
    return (
      <span className={`status-badge ${badge.class}`}>
        {badge.icon} {badge.text}
      </span>
    );
  };

  const isScraperRunning = (scraperId) => {
    return Object.values(jobs).some(
      job => job.status === "running" && 
      (job.script?.includes(scraperId) || (scraperId === "all" && job.script === "run_scrapers.py"))
    );
  };

  const isAnyRunning = Object.values(jobs).some(job => job.status === "running");

  if (loading) {
    return (
      <div className="admin-scrapers">
        <div className="container py-5">
          <div className="loading-container">
            <div className="spinner-border text-warning"></div>
            <p>Loading scraper status...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-scrapers">
      <div className="container py-4">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1>🔧 Scraper & ETL Control</h1>
            <p className="text-muted">Manage data collection and processing pipelines</p>
          </div>
          <div className="header-actions">
            <button 
              className="btn btn-outline-secondary"
              onClick={() => navigate("/admin")}
            >
              ← Back to Dashboard
            </button>
            <button 
              className="btn btn-outline-danger"
              onClick={handleClearJobs}
              disabled={isAnyRunning}
            >
              🗑️ Clear History
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <div className="action-card full-pipeline">
            <div className="action-icon">🚀</div>
            <div className="action-content">
              <h3>Full Pipeline</h3>
              <p>Run all scrapers followed by ETL processing</p>
              <button 
                className="btn btn-lg btn-warning"
                onClick={handleRunFullPipeline}
                disabled={isAnyRunning || runningAction === "full"}
              >
                {runningAction === "full" ? (
                  <><span className="spinner-border spinner-border-sm me-2"></span> Starting...</>
                ) : (
                  "▶️ Run Full Pipeline"
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Scrapers Grid */}
        <div className="section-header">
          <h2>📦 Individual Scrapers</h2>
          <button 
            className="btn btn-primary"
            onClick={handleRunAllScrapers}
            disabled={isAnyRunning || runningAction === "all"}
          >
            {runningAction === "all" ? (
              <><span className="spinner-border spinner-border-sm me-2"></span> Starting...</>
            ) : (
              "▶️ Run All Scrapers"
            )}
          </button>
        </div>

        <div className="scrapers-grid">
          {scrapers.map((scraper) => (
            <div 
              key={scraper.id} 
              className={`scraper-card ${isScraperRunning(scraper.id) ? "running" : ""}`}
              style={{ "--accent-color": scraper.color }}
            >
              <div className="scraper-icon">{scraper.icon}</div>
              <div className="scraper-info">
                <h3>{scraper.name}</h3>
                <p>TV Price Scraper</p>
                {isScraperRunning(scraper.id) && (
                  <div className="running-indicator">
                    <span className="pulse"></span> Running...
                  </div>
                )}
              </div>
              <button 
                className="btn btn-scraper"
                onClick={() => handleRunScraper(scraper.id, scraper.name)}
                disabled={isAnyRunning || runningAction === scraper.id}
              >
                {runningAction === scraper.id ? (
                  <span className="spinner-border spinner-border-sm"></span>
                ) : isScraperRunning(scraper.id) ? (
                  "Running..."
                ) : (
                  "▶️ Run"
                )}
              </button>
            </div>
          ))}
        </div>

        {/* ETL Section */}
        <div className="section-header">
          <h2>⚙️ ETL Pipeline</h2>
        </div>

        <div className="etl-card">
          <div className="etl-icon">🔄</div>
          <div className="etl-content">
            <h3>Data Transformation Pipeline</h3>
            <p>Process scraped data: Standardization → Unification → Master Tables → Analytics</p>
            <div className="etl-steps">
              <span className="step">db_connection</span>
              <span className="arrow">→</span>
              <span className="step">croma_std</span>
              <span className="arrow">→</span>
              <span className="step">flipkart_std</span>
              <span className="arrow">→</span>
              <span className="step">amazon_std</span>
              <span className="arrow">→</span>
              <span className="step">unify_tv</span>
              <span className="arrow">→</span>
              <span className="step">masters</span>
              <span className="arrow">→</span>
              <span className="step">analytics</span>
            </div>
          </div>
          <button 
            className="btn btn-lg btn-success"
            onClick={handleRunETL}
            disabled={isAnyRunning || runningAction === "etl"}
          >
            {runningAction === "etl" ? (
              <><span className="spinner-border spinner-border-sm me-2"></span> Starting...</>
            ) : (
              "▶️ Run ETL"
            )}
          </button>
        </div>

        {/* Jobs History */}
        <div className="section-header">
          <h2>📋 Job History</h2>
          <span className="job-count">{Object.keys(jobs).length} jobs</span>
        </div>

        <div className="jobs-table-container">
          {Object.keys(jobs).length === 0 ? (
            <div className="empty-state">
              <p>No jobs yet. Run a scraper or ETL to see history.</p>
            </div>
          ) : (
            <table className="jobs-table">
              <thead>
                <tr>
                  <th>Job ID</th>
                  <th>Script</th>
                  <th>Status</th>
                  <th>Started</th>
                  <th>Completed</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(jobs)
                  .sort((a, b) => new Date(b[1].started_at) - new Date(a[1].started_at))
                  .map(([jobId, job]) => (
                    <tr key={jobId} className={job.status}>
                      <td className="job-id">{jobId}</td>
                      <td className="script-name">{job.script}</td>
                      <td>{getStatusBadge(job.status)}</td>
                      <td className="timestamp">
                        {job.started_at ? new Date(job.started_at).toLocaleString() : "-"}
                      </td>
                      <td className="timestamp">
                        {job.completed_at ? new Date(job.completed_at).toLocaleString() : "-"}
                      </td>
                      <td className="details">
                        {job.error && (
                          <span className="error-text" title={job.error}>
                            ❌ {job.error.substring(0, 50)}...
                          </span>
                        )}
                        {job.stage && job.status === "running" && (
                          <span className="stage-text">Stage: {job.stage}</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminScrapers;