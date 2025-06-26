import React from "react";
import { Link } from "react-router-dom";
import {
  Github,
  Twitter,
  Instagram,
  Linkedin,
  EnvelopeFill,
  GeoAltFill,
  TelephoneFill,
  Globe2,
} from "react-bootstrap-icons";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  // Languages for the selector
  const languages = [{ code: "en", name: "English" }];

  return (
    <footer className="footer-container">
      <div className="footer-gradient-overlay"></div>

      {/* Main Footer Content */}
      <div className="container position-relative py-5">
        <div className="row g-4">
          {/* Company Info */}
          <div className="col-lg-4 col-md-6">
            <h5 className="text-white mb-3 fw-bold">FBA Tool</h5>
            <p className="text-light mb-3">
              Advanced Amazon FBA box content management solution for sellers
              worldwide.
            </p>
            <div className="d-flex social-icons">
              <a
                href="https://github.com"
                className="social-icon me-2"
                aria-label="GitHub"
              >
                <Github />
              </a>
              <a
                href="https://twitter.com"
                className="social-icon me-2"
                aria-label="Twitter"
              >
                <Twitter />
              </a>
              <a
                href="https://instagram.com"
                className="social-icon me-2"
                aria-label="Instagram"
              >
                <Instagram />
              </a>
              <a
                href="https://linkedin.com"
                className="social-icon"
                aria-label="LinkedIn"
              >
                <Linkedin />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-lg-2 col-md-6">
            <h6 className="text-white mb-3">Quick Links</h6>
            <ul className="list-unstyled footer-links">
              <li>
                <Link to="/">Home</Link>
              </li>
              <li>
                <Link to="/products">Products</Link>
              </li>
              <li>
                <Link to="/boxsummary">Box Summary</Link>
              </li>
              <li>
                <Link to="/export">Export</Link>
              </li>
            </ul>
          </div>

          {/* Contact Information */}
          <div className="col-lg-3 col-md-6">
            <h6 className="text-white mb-3">Contact Us</h6>
            <ul className="list-unstyled footer-contact">
              <li>
                <GeoAltFill className="me-2" />
                <span>123 Global Plaza, New York, NY</span>
              </li>
              <li>
                <EnvelopeFill className="me-2" />
                <a href="mailto:sweetdream0828@gmail.com">
                  sweetdream0828@gmail.com
                </a>
              </li>
              <li>
                <TelephoneFill className="me-2" />
                <a href="tel:+5515981355146">+1 (234) 567-8901</a>
              </li>
            </ul>
          </div>

          {/* Language & Newsletter */}
          <div className="col-lg-3 col-md-6">
            <h6 className="text-white mb-3">
              <Globe2 className="me-2" />
              Language
            </h6>
            <select className="form-select mb-3 bg-transparent text-light border-secondary">
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code} className="bg-dark">
                  {lang.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer-bottom">
        <div className="container">
          <div className="d-md-flex justify-content-between align-items-center py-3">
            <div className="text-center text-md-start mb-2 mb-md-0">
              <small>
                &copy; {currentYear} Eden Web, Inc. All rights reserved.
              </small>
            </div>
            <div className="text-center text-md-end">
              <a href="#terms" className="me-3 text-light small">
                Terms of Service
              </a>
              <a href="#privacy" className="text-light small">
                Privacy Policy
              </a>
            </div>
          </div>
        </div>
      </div>

      <style jsx="true">{`
        .footer-container {
          position: relative;
          background-color: #1a1a2e;
          color: #f0f0f0;
          overflow: hidden;
        }

        .footer-gradient-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, #1e2a4a 0%, #2d3a5f 100%);
          opacity: 0.95;
        }

        .footer-links li {
          margin-bottom: 8px;
        }

        .footer-links a {
          color: #d0d0d0;
          text-decoration: none;
          transition: color 0.3s ease;
        }

        .footer-links a:hover {
          color: #ffffff;
        }

        .footer-contact li {
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          color: #d0d0d0;
        }

        .footer-contact a {
          color: #d0d0d0;
          text-decoration: none;
          transition: color 0.3s ease;
        }

        .footer-contact a:hover {
          color: #ffffff;
        }

        .social-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background-color: rgba(255, 255, 255, 0.1);
          color: #ffffff;
          text-decoration: none;
          transition: background-color 0.3s ease;
        }

        .social-icon:hover {
          background-color: rgba(255, 255, 255, 0.2);
          color: #ffffff;
        }

        .form-select {
          color: #fff;
        }

        .form-select option {
          color: #fff;
        }

        .footer-bottom {
          background-color: rgba(0, 0, 0, 0.2);
          font-size: 0.9rem;
        }
      `}</style>
    </footer>
  );
};

export default Footer;
