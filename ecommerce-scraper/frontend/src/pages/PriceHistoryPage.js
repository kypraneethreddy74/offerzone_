import React, { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import {
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Line,
  ComposedChart
} from "recharts";
import { getPriceHistoryData } from "../services/api";
import "./PriceHistoryPage.css";

const PLATFORM_COLORS = {
  amazon: { main: "#FF9900", gradient: ["#FF9900", "#FFB84D"], bg: "#FFF7E6" },
  Amazon: { main: "#FF9900", gradient: ["#FF9900", "#FFB84D"], bg: "#FFF7E6" },
  flipkart: { main: "#2874F0", gradient: ["#2874F0", "#5B9BF7"], bg: "#EBF3FF" },
  Flipkart: { main: "#2874F0", gradient: ["#2874F0", "#5B9BF7"], bg: "#EBF3FF" },
  CROMA: { main: "#00B0B9", gradient: ["#00B0B9", "#4DD4DB"], bg: "#E6FAFB" },
  Croma: { main: "#00B0B9", gradient: ["#00B0B9", "#4DD4DB"], bg: "#E6FAFB" },
  reliance: { main: "#E31837", gradient: ["#E31837", "#FF6B6B"], bg: "#FFEBEE" },
  Reliance: { main: "#E31837", gradient: ["#E31837", "#FF6B6B"], bg: "#FFEBEE" },
  vijay: { main: "#8B5CF6", gradient: ["#8B5CF6", "#A78BFA"], bg: "#F3EEFF" },
  Vijay: { main: "#8B5CF6", gradient: ["#8B5CF6", "#A78BFA"], bg: "#F3EEFF" },
  tatacliq: { main: "#E91E63", gradient: ["#E91E63", "#F48FB1"], bg: "#FCE4EC" },
  Tatacliq: { main: "#E91E63", gradient: ["#E91E63", "#F48FB1"], bg: "#FCE4EC" }
};


const platformIcons = {
  amazon: "/amazon.jpg",
  flipkart: "/flipkart.png",
  croma: "/croma.png",
};

const getColor = (platform) => 
  PLATFORM_COLORS[platform] || { main: "#6366F1", gradient: ["#6366F1", "#818CF8"], bg: "#EEF2FF" };

const formatPrice = (value) => `₹${value?.toLocaleString("en-IN") || 0}`;

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const formatShortDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

// Calculate price change
const getPriceChange = (data) => {
  if (!data || data.length < 2) return { change: 0, percent: 0, isUp: false };
  const first = data[0]?.price || 0;
  const last = data[data.length - 1]?.price || 0;
  const change = last - first;
  const percent = first ? ((change / first) * 100).toFixed(1) : 0;
  return { change, percent, isUp: change > 0 };
};

function PriceHistoryPage() {
  const { modelId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const initialTab = searchParams.get("tab") || "history";
  const productNameParam = searchParams.get("name") || "";
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const fetchData = useCallback(async () => {
    if (!modelId) return;
    
    setLoading(true);
    setError(null);
    try {
      const res = await getPriceHistoryData(modelId, days);
      setData(res.data);
    } catch (err) {
      setError("Failed to load price history. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [modelId, days]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label, platform }) => {
    if (!active || !payload?.length) return null;
    const price = payload[0]?.value;
    const colors = getColor(platform);
    
    return (
      <div className="custom-tooltip" style={{ borderColor: colors.main }}>
        <div className="tooltip-header" style={{ background: colors.main }}>
          <span className="tooltip-platform">{platform}</span>
          <span className="tooltip-date">{formatDate(label)}</span>
        </div>
        <div className="tooltip-body">
          <span className="tooltip-label">Price</span>
          <span className="tooltip-price" style={{ color: colors.main }}>{formatPrice(price)}</span>
        </div>
      </div>
    );
  };

  // Best Price Tooltip
  const BestPriceTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const point = payload[0]?.payload;
    const colors = getColor(point?.platform);
    
    return (
      <div className="custom-tooltip best-tooltip" style={{ borderColor: colors.main }}>
        <div className="tooltip-header" style={{ background: `linear-gradient(135deg, ${colors.gradient[0]}, ${colors.gradient[1]})` }}>
          <span className="tooltip-platform">🏆 {point?.platform}</span>
          <span className="tooltip-date">{formatDate(label)}</span>
        </div>
        <div className="tooltip-body">
          <span className="tooltip-label">Best Price</span>
          <span className="tooltip-price" style={{ color: colors.main }}>{formatPrice(point?.price)}</span>
        </div>
      </div>
    );
  };



  const timeRanges = [
    { label: "7D", value: 7 },
    { label: "14D", value: 14 },
    { label: "30D", value: 30 },
    { label: "90D", value: 90 },
    { label: "180D", value: 180 },
    { label: "1Y", value: 365 }
  ];

  return (
    <div className="price-history-page">
      {/* Header */}
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left"></i> Back
        </button>
        <div className="header-content">
          <h1>📊 Price Intelligence</h1>
          <p className="product-name">{data?.product_name || productNameParam || modelId}</p>
        </div>
      </div>

      {/* Product Info Bar */}
      {data && (
        <div className="product-info-bar">
          {data.image_url && (
            <img src={data.image_url} alt={data.product_name} className="product-thumb" />
          )}
          <div className="product-details">
            <span className="brand-badge">{data.brand}</span>
            <span className="model-id">Model: {modelId}</span>
            <span className="platforms-count">
              <i className="bi bi-shop"></i> {data.platforms?.length || 0} Platform{data.platforms?.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs-container">
        <button
          className={`tab-btn ${activeTab === "history" ? "active" : ""}`}
          onClick={() => setActiveTab("history")}
        >
          <i className="bi bi-graph-up"></i> Price History
        </button>
        <button
          className={`tab-btn ${activeTab === "best" ? "active" : ""}`}
          onClick={() => setActiveTab("best")}
        >
          <i className="bi bi-trophy"></i> Best Price Tracker
        </button>
      </div>

      {/* Time Range Selector */}
      <div className="time-range-selector">
        <span className="label">📅 Time Range:</span>
        <div className="time-buttons">
          {timeRanges.map((range) => (
            <button
              key={range.value}
              className={days === range.value ? "active" : ""}
              onClick={() => setDays(range.value)}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="page-content">
        {/* Loading State */}
        {loading && (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Analyzing price trends...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="error-container">
            <span className="error-icon">⚠️</span>
            <p>{error}</p>
            <button onClick={fetchData}>Retry</button>
          </div>
        )}

        {/* No Data */}
        {!loading && !error && (!data || !data.platforms?.length) && (
          <div className="no-data-container">
            <span className="icon">📊</span>
            <p>No price history available for this product</p>
          </div>
        )}

        {/* Price History Tab */}
        {!loading && !error && activeTab === "history" && data?.platforms_data && (
          <div className="charts-grid">
            {Object.entries(data.platforms_data).map(([platform, platformInfo]) => {
              const colors = getColor(platform);
              const priceChange = getPriceChange(platformInfo.data);
              
              return (
                <div key={platform} className="platform-chart-card" style={{ '--platform-color': colors.main }}>
                  {/* Platform Header */}
                  <div className="platform-header" style={{ background: `linear-gradient(135deg, ${colors.gradient[0]}15, ${colors.gradient[1]}08)` }}>
					<div className="platform-title">
					  <img 
						src={platformIcons[platform.toLowerCase()]} 
						alt={platform}
						className="platform-logo"
					  />
					  <h3 style={{ color: colors.main }}>{platform.toUpperCase()}</h3>
					</div>
                    <div className={`price-trend ${priceChange.isUp ? 'up' : 'down'}`}>
                      <span className="trend-icon">{priceChange.isUp ? '📈' : '📉'}</span>
                      <span className="trend-value">
                        {priceChange.isUp ? '+' : ''}{priceChange.percent}%
                      </span>
                    </div>
                  </div>

                  {/* Stats Cards */}
                  <div className="stats-cards">
                    <div className="stat-card current">
                      <div className="stat-icon">💰</div>
                      <div className="stat-content">
                        <span className="stat-label">Current Price</span>
                        <span className="stat-value">{formatPrice(platformInfo.stats.current)}</span>
                      </div>
                    </div>
                    <div className="stat-card lowest">
                      <div className="stat-icon">🏷️</div>
                      <div className="stat-content">
                        <span className="stat-label">Lowest Price</span>
                        <span className="stat-value">{formatPrice(platformInfo.stats.lowest)}</span>
                      </div>
                    </div>
                    <div className="stat-card highest">
                      <div className="stat-icon">📊</div>
                      <div className="stat-content">
                        <span className="stat-label">Highest Price</span>
                        <span className="stat-value">{formatPrice(platformInfo.stats.highest)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Chart */}
                  <div className="chart-container">
                    <ResponsiveContainer width="100%" height={350}>
                      <ComposedChart data={platformInfo.data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                        <defs>
                          <linearGradient id={`gradient-${platform}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={colors.main} stopOpacity={0.4} />
                            <stop offset="50%" stopColor={colors.main} stopOpacity={0.15} />
                            <stop offset="100%" stopColor={colors.main} stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        
                        <CartesianGrid 
                          strokeDasharray="3 3" 
                          stroke="#E5E7EB" 
                          vertical={false}
                        />
                        
                        <XAxis
                          dataKey="date"
                          tickFormatter={formatShortDate}
                          tick={{ fontSize: 11, fill: "#6B7280", fontWeight: 500 }}
                          axisLine={{ stroke: "#E5E7EB" }}
                          tickLine={false}
                          dy={10}
                        />
                        
                        <YAxis
                          tickFormatter={(v) => `₹${(v/1000).toFixed(0)}K`}
                          tick={{ fontSize: 11, fill: "#6B7280", fontWeight: 500 }}
                          axisLine={false}
                          tickLine={false}
                          dx={-10}
                          domain={[
                            dataMin => Math.floor(dataMin * 0.92),
                            dataMax => Math.ceil(dataMax * 1.08)
                          ]}
                        />
                        
                        <Tooltip content={<CustomTooltip platform={platform} />} />
                        
                        {/* Highest Price Reference */}
                        <ReferenceLine
                          y={platformInfo.stats.highest}
                          stroke="#EF4444"
                          strokeDasharray="8 4"
                          strokeWidth={2}
                          label={{
                            value: `High: ${formatPrice(platformInfo.stats.highest)}`,
                            position: 'right',
                            fill: '#EF4444',
                            fontSize: 11,
                            fontWeight: 600
                          }}
                        />
                        
                        {/* Lowest Price Reference */}
                        <ReferenceLine
                          y={platformInfo.stats.lowest}
                          stroke="#10B981"
                          strokeDasharray="8 4"
                          strokeWidth={2}
                          label={{
                            value: `Low: ${formatPrice(platformInfo.stats.lowest)}`,
                            position: 'right',
                            fill: '#10B981',
                            fontSize: 11,
                            fontWeight: 600
                          }}
                        />
                        
                        {/* Area Fill */}
                        <Area
                          type="monotone"
                          dataKey="price"
                          stroke="none"
                          fill={`url(#gradient-${platform})`}
                          isAnimationActive={true}
                          animationDuration={800}
                        />
                        
                        {/* Line */}
                        <Line
                          type="monotone"
                          dataKey="price"
                          stroke={colors.main}
                          strokeWidth={3}
                          dot={false}
                          activeDot={{ r: 6, fill: colors.main, stroke: '#fff', strokeWidth: 3 }}
                          isAnimationActive={true}
                          animationDuration={800}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Chart Footer */}
                  <div className="chart-footer">
                    <span className="footer-hint">
                      <i className="bi bi-hand-index"></i> Hover over the chart for detailed price information
                    </span>
                    <span className="data-period">
                      Data from {data.date_range?.start} to {data.date_range?.end}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Best Price Tracker Tab */}
        {!loading && !error && activeTab === "best" && data?.best_price_data && (
          <div className="best-price-section">
            {/* Best Price Card */}
            <div className="best-price-card">
              <div className="best-price-header">
                <div className="header-left">
                  <span className="trophy-icon">🏆</span>
                  <div>
                    <h3>Best Price Tracker</h3>
                    <p>Lowest price across all platforms over time</p>
                  </div>
                </div>
                {data.best_price_stats?.current_platform && (
                  <div 
                    className="current-best-badge"
                    style={{ background: getColor(data.best_price_stats.current_platform).main }}
                  >
                    Currently Best: {data.best_price_stats.current_platform}
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="best-stats-grid">
                <div className="best-stat-card current">
                  <div className="stat-emoji">💎</div>
                  <div className="stat-info">
                    <span className="label">Current Best</span>
                    <span className="value">{formatPrice(data.best_price_stats?.current)}</span>
                    <span 
                      className="platform-tag"
                      style={{ background: getColor(data.best_price_stats?.current_platform).main }}
                    >
                      {data.best_price_stats?.current_platform}
                    </span>
                  </div>
                </div>
                <div className="best-stat-card lowest">
                  <div className="stat-emoji">🎯</div>
                  <div className="stat-info">
                    <span className="label">All-Time Lowest</span>
                    <span className="value">{formatPrice(data.best_price_stats?.lowest)}</span>
                  </div>
                </div>
                <div className="best-stat-card highest">
                  <div className="stat-emoji">📈</div>
                  <div className="stat-info">
                    <span className="label">Period Highest</span>
                    <span className="value">{formatPrice(data.best_price_stats?.highest)}</span>
                  </div>
                </div>
                <div className="best-stat-card savings">
                  <div className="stat-emoji">💰</div>
                  <div className="stat-info">
                    <span className="label">Potential Savings</span>
                    <span className="value savings-value">
                      {formatPrice((data.best_price_stats?.highest || 0) - (data.best_price_stats?.lowest || 0))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Best Price Chart */}
              <div className="chart-container large">
                <ResponsiveContainer width="100%" height={420}>
                  <ComposedChart data={data.best_price_data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <defs>
                      <linearGradient id="bestGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" stopOpacity={0.4} />
                        <stop offset="50%" stopColor="#10B981" stopOpacity={0.15} />
                        <stop offset="100%" stopColor="#10B981" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatShortDate}
                      tick={{ fontSize: 11, fill: "#6B7280", fontWeight: 500 }}
                      axisLine={{ stroke: "#E5E7EB" }}
                      tickLine={false}
                      dy={10}
                    />
                    
                    <YAxis
                      tickFormatter={(v) => `₹${(v/1000).toFixed(0)}K`}
                      tick={{ fontSize: 11, fill: "#6B7280", fontWeight: 500 }}
                      axisLine={false}
                      tickLine={false}
                      dx={-10}
                      domain={[
                        dataMin => Math.floor(dataMin * 0.92),
                        dataMax => Math.ceil(dataMax * 1.08)
                      ]}
                    />
                    
                    <Tooltip content={<BestPriceTooltip />} />
                    
                    <ReferenceLine
                      y={data.best_price_stats?.highest}
                      stroke="#EF4444"
                      strokeDasharray="8 4"
                      strokeWidth={2}
                      label={{
                        value: `High: ${formatPrice(data.best_price_stats?.highest)}`,
                        position: 'right',
                        fill: '#EF4444',
                        fontSize: 11,
                        fontWeight: 600
                      }}
                    />
                    
                    <ReferenceLine
                      y={data.best_price_stats?.lowest}
                      stroke="#10B981"
                      strokeDasharray="8 4"
                      strokeWidth={2}
                      label={{
                        value: `Low: ${formatPrice(data.best_price_stats?.lowest)}`,
                        position: 'right',
                        fill: '#10B981',
                        fontSize: 11,
                        fontWeight: 600
                      }}
                    />
                    
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke="none"
                      fill="url(#bestGradient)"
                      isAnimationActive={true}
                      animationDuration={800}
                    />
                    
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="#10B981"
                      strokeWidth={3}
                      dot={({ cx, cy, payload }) => {
                        const colors = getColor(payload.platform);
                        return (
                          <circle
                            key={`dot-${cx}-${cy}`}
                            cx={cx}
                            cy={cy}
                            r={5}
                            fill={colors.main}
                            stroke="#fff"
                            strokeWidth={2}
                          />
                        );
                      }}
                      activeDot={{ r: 8, fill: '#10B981', stroke: '#fff', strokeWidth: 3 }}
                      isAnimationActive={true}
                      animationDuration={800}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-footer">
                <span className="footer-hint">
                  <i className="bi bi-info-circle"></i> Colored dots indicate which platform had the best price on each day
                </span>
              </div>
            </div>

            {/* Platform Comparison */}
            <div className="platform-comparison-card">
              <h3><i className="bi bi-bar-chart"></i> Platform Comparison</h3>
              <div className="comparison-grid">
                {data.platforms?.map((platform) => {
                  const pData = data.platforms_data[platform];
                  if (!pData) return null;
                  const colors = getColor(platform);
                  const isBest = platform === data.best_price_stats?.current_platform;
                  
                  return (
                    <div 
                      key={platform} 
                      className={`comparison-item ${isBest ? 'best' : ''}`}
                      style={{ '--platform-color': colors.main }}
                    >
                      {isBest && <span className="best-badge">👑 Best</span>}
                      <div className="platform-info">
                        <span className="platform-icon" style={{ background: colors.main }}>
                          {platform.charAt(0).toUpperCase()}
                        </span>
                        <span className="platform-name">{platform}</span>
                      </div>
                      <div className="price-grid">
                        <div className="price-item">
                          <span className="label">Current</span>
                          <span className="value">{formatPrice(pData.stats.current)}</span>
                        </div>
                        <div className="price-item low">
                          <span className="label">Lowest</span>
                          <span className="value">{formatPrice(pData.stats.lowest)}</span>
                        </div>
                        <div className="price-item high">
                          <span className="label">Highest</span>
                          <span className="value">{formatPrice(pData.stats.highest)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            
          </div>
        )}
      </div>
    </div>
  );
}

export default PriceHistoryPage;