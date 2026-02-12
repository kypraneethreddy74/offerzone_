import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  TrendingDown, 
  Layers, 
  AlertCircle, 
  Search, 
  LineChart, 
  BellRing, 
  ArrowRight,
  ChevronRight,
  Star,
  Zap,
  Shield,
  Users,
  ShoppingBag,
  Sparkles,
  CheckCircle2,
  Quote
} from "lucide-react";

import "./Home.css";
import Footer from "../components/Footer";


import useScrollAnimation from '../hooks/useScrollAnimation';

export default function Home() {
  const navigate = useNavigate();
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  
  // Scroll animation hooks - properly destructured
  const [heroRef, heroVisible] = useScrollAnimation(0.1);
  const [statsRef, statsVisible] = useScrollAnimation(0.2);
  const [problemRef, problemVisible] = useScrollAnimation(0.2);
  const [solutionRef, solutionVisible] = useScrollAnimation(0.2);
  const [howItWorksRef, howItWorksVisible] = useScrollAnimation(0.2);
  const [testimonialsRef, testimonialsVisible] = useScrollAnimation(0.2);
  const [ctaRef, ctaVisible] = useScrollAnimation(0.2);

  const testimonials = [
    {
      name: "Priya Sharma",
      role: "Tech Enthusiast",
      image: "https://randomuser.me/api/portraits/women/44.jpg",
      text: "Saved ₹15,000 on my new MacBook! OfferZone showed me the best time to buy.",
      rating: 5
    },
    {
      name: "Rahul Verma",
      role: "Gadget Lover",
      image: "https://randomuser.me/api/portraits/men/32.jpg",
      text: "The price alerts are a game-changer. Got my PS5 at the lowest price ever!",
      rating: 5
    },
    {
      name: "Ananya Patel",
      role: "Smart Shopper",
      image: "https://randomuser.me/api/portraits/women/68.jpg",
      text: "No more opening 20 tabs. Everything I need is in one beautiful dashboard.",
      rating: 5
    }
  ];

  const stats = [
    { number: "10K+", label: "Active Users", icon: Users },
    { number: "₹2Cr+", label: "Total Saved", icon: ShoppingBag },
    { number: "50K+", label: "Products Tracked", icon: Zap },
    { number: "99.9%", label: "Accuracy Rate", icon: Shield }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  return (
    <div className="home-container">
      {/* Animated Background */}
      <div className="animated-bg">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      {/* Floating Particles */}
      <div className="particles">
        {[...Array(20)].map((_, i) => (
          <div key={i} className={`particle particle-${i + 1}`}></div>
        ))}
      </div>

      {/* HERO SECTION */}
      <section 
        ref={heroRef} 
        className={`hero-section ${heroVisible ? 'visible' : ''}`}
      >
        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={16} />
            <span>Smart Shopping Made Simple</span>
            <div className="badge-glow"></div>
          </div>
          
          <h1 className="hero-title">
            <span className="title-line">Stop Hunting.</span>
            <span className="title-line">
              Start <span className="gradient-text">Saving.</span>
            </span>
          </h1>
          
          <p className="hero-description">
            Compare prices across <strong>Amazon</strong>, <strong>Flipkart</strong>, and <strong>Croma</strong> in real-time. 
            Join <span className="highlight">10,000+</span> smart shoppers who never overpay.
          </p>

          <div className="hero-actions">
            <button className="main-btn" onClick={() => navigate("/best-deals")}>
              <span>Find Best Deals</span>
              <ArrowRight size={20} />
              <div className="btn-shine"></div>
            </button>
            <button className="secondary-btn" onClick={() => navigate("/catalog")}>
              <span>Browse Catalog</span>
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Trust Badges */}
          <div className="trust-badges">
            <div className="trust-item">
              <CheckCircle2 size={18} />
              <span>Free Forever</span>
            </div>
            <div className="trust-item">
              <CheckCircle2 size={18} />
              <span>No Sign-up Required</span>
            </div>
            <div className="trust-item">
              <CheckCircle2 size={18} />
              <span>Real-time Data</span>
            </div>
          </div>
        </div>
        
        <div className="hero-visual-container">
          <div className="visual-wrapper">
            <img 
              src="https://illustrations.popsy.co/white/online-shopping.svg" 
              alt="OfferZone Hero" 
              className="hero-main-img"
            />
            
            {/* Floating UI Cards */}
            <div className="floating-card deal-card">
              <div className="card-pulse"></div>
              <div className="deal-icon">🔥</div>
              <div className="deal-content">
                <span className="deal-label">Best Deal Found!</span>
                <div className="deal-price">
                  <span className="current">₹42,999</span>
                  <span className="original">₹54,000</span>
                </div>
                <div className="deal-savings">
                  <span className="savings-badge">Save ₹11,001</span>
                </div>
                <div className="deal-platform">
                  <img src="/flipkart.png" alt="Flipkart" />
                  <span>Flipkart</span>
                </div>
              </div>
            </div>

            <div className="floating-card alert-card">
              <BellRing size={20} className="alert-icon" />
              <div className="alert-content">
                <span className="alert-title">Price Drop Alert!</span>
                <span className="alert-text">MacBook Pro dropped by 12%</span>
              </div>
            </div>

            <div className="floating-card rating-card">
              <div className="rating-stars">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} fill="#fbbf24" color="#fbbf24" />
                ))}
              </div>
              <span>4.9/5 from 2,400 reviews</span>
            </div>
          </div>
        </div>
      </section>

      {/* STATS SECTION */}
      <section 
        ref={statsRef} 
        className={`stats-section ${statsVisible ? 'visible' : ''}`}
      >
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div 
              key={index} 
              className={`stat-card ${statsVisible ? 'animate' : ''}`}
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              <div className="stat-icon">
                <stat.icon size={28} />
              </div>
              <div className="stat-number">{stat.number}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PROBLEM SECTION */}
      <section 
        ref={problemRef} 
        className={`info-section problem-section ${problemVisible ? 'visible' : ''}`}
      >
        <div className="section-header">
          <span className="section-badge red">
            <AlertCircle size={14} />
            The Problem
          </span>
          <h2 className="section-title">
            Shopping is <span className="text-gradient-red">broken</span> 😤
          </h2>
          <p className="section-subtitle">
            Traditional shopping wastes your time, money, and mental energy.
          </p>
        </div>
        
        <div className="feature-grid">
          {[
            {
              icon: TrendingDown,
              iconClass: 'red',
              title: 'Price Volatility',
              description: "Prices fluctuate hourly. Today's deal could be tomorrow's regret.",
              impact: '-₹5,000 avg. loss',
              image: 'https://illustrations.popsy.co/white/falling.svg'
            },
            {
              icon: Layers,
              iconClass: 'orange',
              title: 'Tab Overload',
              description: "10+ tabs open just to compare one product? That's exhausting.",
              impact: '30+ mins wasted',
              image: 'https://illustrations.popsy.co/white/shaking-hands.svg'
            },
            {
              icon: AlertCircle,
              iconClass: 'purple',
              title: 'Fake Discounts',
              description: "Inflated MRPs make you think you're saving when you're not.",
              impact: '40% fake deals',
              image: 'https://illustrations.popsy.co/white/abstract-art.svg'
            }
          ].map((card, index) => (
            <div 
              key={index}
              className={`feature-card problem-card ${problemVisible ? 'animate' : ''}`}
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <div className="card-bg-pattern"></div>
              <div className="card-image-wrap">
                <img src={card.image} alt={card.title} />
              </div>
              <div className={`icon-box ${card.iconClass}`}>
                <card.icon size={28} />
              </div>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
              <div className="card-footer">
                <span className="impact-badge">{card.impact}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SOLUTION SECTION */}
      <section 
        ref={solutionRef} 
        className={`info-section solution-section ${solutionVisible ? 'visible' : ''}`}
      >
        <div className="section-bg-decoration">
          <div className="decoration-circle circle-1"></div>
          <div className="decoration-circle circle-2"></div>
        </div>
        
        <div className="section-header">
          <span className="section-badge blue">
            <Zap size={14} />
            The Solution
          </span>
          <h2 className="section-title">
            The OfferZone <span className="text-gradient-blue">Edge</span> ⚡
          </h2>
          <p className="section-subtitle">
            Powerful tools that put you back in control of your shopping.
          </p>
        </div>

        <div className="feature-grid solution-grid">
          {[
            {
              icon: Search,
              iconClass: 'blue',
              glowClass: 'blue-glow',
              title: 'Smart Search',
              description: "One search, all platforms. We aggregate and compare so you don't have to.",
              features: ['Amazon, Flipkart, Croma', 'Real-time prices', 'Instant comparison'],
              image: 'https://illustrations.popsy.co/white/research.svg',
              featured: false
            },
            {
              icon: LineChart,
              iconClass: 'green',
              glowClass: 'green-glow',
              title: 'Price History',
              description: "See historical lows and know if you're getting a genuine deal.",
              features: ['90-day price graphs', 'All-time low alerts', 'Trend predictions'],
              image: 'https://illustrations.popsy.co/white/analytics.svg',
              featured: true
            },
            {
              icon: BellRing,
              iconClass: 'gold',
              glowClass: 'gold-glow',
              title: 'Smart Alerts',
              description: 'Get notified instantly when your favorite products drop in price.',
              features: ['Email & Push alerts', 'Custom price targets', 'Deal expiry warnings'],
              image: 'https://illustrations.popsy.co/white/digital-nomad.svg',
              featured: false
            }
          ].map((card, index) => (
            <div 
              key={index}
              className={`feature-card solution-card ${card.featured ? 'featured' : ''} ${solutionVisible ? 'animate' : ''}`}
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              {card.featured && <div className="featured-badge">Most Popular</div>}
              <div className={`card-glow ${card.glowClass}`}></div>
              <div className="card-image-wrap">
                <img src={card.image} alt={card.title} />
              </div>
              <div className={`icon-box ${card.iconClass}`}>
                <card.icon size={28} />
              </div>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
              <ul className="feature-list">
                {card.features.map((feature, fIndex) => (
                  <li key={fIndex}>
                    <CheckCircle2 size={16} />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section 
        ref={howItWorksRef} 
        className={`how-it-works-section ${howItWorksVisible ? 'visible' : ''}`}
      >
        <div className="section-header">
          <span className="section-badge purple">
            <Sparkles size={14} />
            How It Works
          </span>
          <h2 className="section-title">
            Three steps to <span className="text-gradient-purple">smarter</span> shopping
          </h2>
        </div>

        <div className="steps-container">
          {[
            { number: '01', icon: '🔍', title: 'Search', description: "Enter the product you want. We'll find it across all platforms." },
            { number: '02', icon: '📊', title: 'Compare', description: 'View prices, ratings, and history in one unified dashboard.' },
            { number: '03', icon: '💰', title: 'Save', description: 'Buy at the best price and keep more money in your pocket.' }
          ].map((step, index) => (
            <div 
              key={index}
              className={`step-card ${howItWorksVisible ? 'animate' : ''}`}
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <div className="step-number">{step.number}</div>
              <div className="step-icon">{step.icon}</div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
              {index < 2 && <div className="step-connector"></div>}
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section 
        ref={testimonialsRef} 
        className={`testimonials-section ${testimonialsVisible ? 'visible' : ''}`}
      >
        <div className="section-header">
          <span className="section-badge gold">
            <Star size={14} />
            Testimonials
          </span>
          <h2 className="section-title">
            Loved by <span className="text-gradient-gold">thousands</span>
          </h2>
        </div>

        <div className="testimonials-container">
          <div className="testimonial-main">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index} 
                className={`testimonial-card ${index === activeTestimonial ? 'active' : ''}`}
              >
                <Quote className="quote-icon" size={48} />
                <p className="testimonial-text">{testimonial.text}</p>
                <div className="testimonial-author">
                  <img src={testimonial.image} alt={testimonial.name} />
                  <div className="author-info">
                    <span className="author-name">{testimonial.name}</span>
                    <span className="author-role">{testimonial.role}</span>
                  </div>
                  <div className="testimonial-rating">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} size={16} fill="#fbbf24" color="#fbbf24" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="testimonial-dots">
            {testimonials.map((_, index) => (
              <button 
                key={index}
                className={`dot ${index === activeTestimonial ? 'active' : ''}`}
                onClick={() => setActiveTestimonial(index)}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section 
        ref={ctaRef} 
        className={`final-cta ${ctaVisible ? 'visible' : ''}`}
      >
        <div className="cta-container">
          <div className="cta-bg-effects">
            <div className="cta-orb cta-orb-1"></div>
            <div className="cta-orb cta-orb-2"></div>
          </div>
          
          <div className="cta-content">
            <img src="https://illustrations.popsy.co/white/success.svg" className="cta-illustration" alt="Success" />
            <h2>Ready to save <span className="cta-highlight">₹10,000+</span>?</h2>
            <p>Join 10,000+ smart shoppers already using OfferZone. It's free forever.</p>
            
            <div className="cta-actions">
              <button className="cta-btn primary" onClick={() => navigate("/best-deals")}>
                <span>Start Saving Now</span>
                <ArrowRight size={20} />
              </button>
              <button className="cta-btn secondary" onClick={() => navigate("/catalog")}>
                <span>Explore Catalog</span>
              </button>
            </div>

            <div className="cta-trust">
              <div className="trust-avatars">
                {[44, 32, 68, 75, 85].map((id, i) => (
                  <img 
                    key={i}
                    src={`https://randomuser.me/api/portraits/${i % 2 === 0 ? 'women' : 'men'}/${id}.jpg`}
                    alt="User"
                    style={{ zIndex: 5 - i }}
                  />
                ))}
              </div>
              <span>Join 10,000+ happy users</span>
            </div>
          </div>
        </div>
		
      </section>
	  <Footer />
    </div>
  );
}