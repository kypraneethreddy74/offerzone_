import React from "react";
import { Mail, ShieldCheck, Zap, Github, Linkedin, Twitter } from "lucide-react";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="offerzone-footer">
      <div className="footer-grid">

        <div className="footer-brand">
          <h2>OfferZone</h2>
          <p>India’s smartest price comparison platform. Never overpay again.</p>
          <div className="footer-socials">
            <a href="#"><Github /></a>
            <a href="#"><Linkedin /></a>
            <a href="#"><Twitter /></a>
          </div>
        </div>

        <div>
          <h4>Product</h4>
          <a href="/catalog">Catalog</a>
          <a href="/best-deals">Best Deals</a>
          <a href="/compare">Compare</a>
          <a href="/graphs">Price History</a>
        </div>

        <div>
          <h4>Features</h4>
          <a>Smart Search</a>
          <a>Price Alerts</a>
          <a>Wishlist</a>
          <a>Analytics</a>
        </div>

        <div>
          <h4>Trust</h4>
          <div className="trust-item"><ShieldCheck /> Secure Data</div>
          <div className="trust-item"><Zap /> Real-time Prices</div>
          <div className="trust-item"><Mail /> support@offerzone.in</div>
        </div>

      </div>

      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} OfferZone. All rights reserved.</span>
      </div>
    </footer>
  );
}
