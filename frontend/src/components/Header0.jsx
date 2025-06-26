import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useFirebaseDataDownload } from "../hooks/useFirebaseDataDownload";
import MigrationModal from "./MigrationModal";
import LoadingDataModal from "./LoadingDataModal";
import useOnlineStatus from "../hooks/useOnlineStatus";
import {
  CloudUploadFill,
  CloudDownloadFill,
  BoxSeamFill,
  FileEarmarkArrowDownFill,
  GearFill,
  BoxSeam,
  Grid3x3GapFill,
  Wifi,
  WifiOff,
  GraphUp,
  Amazon,
  PersonFill,
  BoxArrowRight,
  CloudArrowUp,
} from "react-bootstrap-icons";

const Header0 = () => {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const { currentUser, logout } = useAuth();
  const isOnline = useOnlineStatus();

  // Data download hook
  const {
    isLoading,
    isComplete,
    progress,
    message,
    error,
    downloadResult,
    startDownload,
    resetDownload,
  } = useFirebaseDataDownload();

  // Add scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Check if link is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  // Handle migration completion
  const handleMigrationComplete = (result) => {
    console.log("Migration completed:", result);
  };

  // Handle loading data button click
  const handleLoadingData = async () => {
    if (!currentUser || !isOnline) return;

    setShowLoadingModal(true);
    const result = await startDownload(currentUser.email);

    // Auto-redirect to shipments if data was downloaded successfully
    if (result.success && result.hasData) {
      setTimeout(() => {
        navigate("/shipments");
        setShowLoadingModal(false);
        resetDownload();
      }, 2000);
    }
  };

  // Handle navigation to shipments
  const handleNavigateToShipments = () => {
    navigate("/shipments");
    setShowLoadingModal(false);
    resetDownload();
  };

  // Handle retry download
  const handleRetryDownload = () => {
    resetDownload();
    handleLoadingData();
  };

  // Handle close loading modal
  const handleCloseLoadingModal = () => {
    if (!isLoading) {
      setShowLoadingModal(false);
      resetDownload();
    }
  };

  return (
    <>
      <nav
        className={`navbar navbar-expand-lg sticky-top ${scrolled ? "navbar-scrolled shadow-sm" : ""
          }`}
        style={{
          background: "linear-gradient(135deg, #1e2a4a 0%, #2d3a5f 100%)",
        }}
      >
        <div className="container">
          <Link className="navbar-brand d-flex align-items-center" to="/">
            <div className="brand-icon me-2">
              <div className="cube-wrapper">
                <div className="cube">
                  <div className="cube-face front">
                    <Amazon size={20} color="white" />
                  </div>
                  <div className="cube-face back">
                    <BoxSeamFill size={20} color="white" />
                  </div>
                  <div className="cube-face top">
                    <BoxSeamFill size={20} color="white" />
                  </div>
                  <div className="cube-face bottom">
                    <BoxSeamFill size={20} color="white" />
                  </div>
                </div>
              </div>
            </div>
            <span className="fw-bold text-white">FBA Tool</span>
          </Link>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            style={{ border: "none" }}
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <Link
                  className={`nav-link ${isActive("/") ? "active" : ""}`}
                  to="/"
                >
                  <CloudUploadFill className="nav-icon" />
                  Dashboard
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  className={`nav-link ${isActive("/shipments") ? "active" : ""
                    }`}
                  to="/shipments"
                >
                  <Grid3x3GapFill className="nav-icon" /> Shipments
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  className={`nav-link ${isActive("/multiAdd") ? "active" : ""
                    }`}
                  to="/multiAdd"
                >
                  <BoxSeam className="nav-icon" />
                  Multi Add
                </Link>
              </li>

              <li className="nav-item">
                <Link
                  className={`nav-link ${isActive("/multiAdd") ? "active" : ""
                    }`}
                  to="/graph"
                >
                  <GraphUp className="nav-icon" />
                  FBA Graph
                </Link>
              </li>
            </ul>

            {/* Login/Logout Button */}
            <div className="auth-section ms-3">
              {currentUser ? (
                <div className="d-flex align-items-center">
                  {/* Loading Button - Only show when logged in */}
                  <button
                    className={`auth-button loading-button me-2 ${!isOnline ? "offline" : ""
                      }`}
                    onClick={handleLoadingData}
                    disabled={!isOnline || isLoading}
                    title={
                      !isOnline
                        ? "Offline - Cannot load data"
                        : "Load data from Firebase"
                    }
                  >
                    {isLoading ? (
                      <div
                        className="spinner-border spinner-border-sm me-1"
                        role="status"
                      ></div>
                    ) : isOnline ? (
                      <CloudDownloadFill className="me-1" />
                    ) : (
                      <WifiOff className="me-1" />
                    )}
                    {isLoading
                      ? "Loading..."
                      : isOnline
                        ? "Load Data"
                        : "Offline"}
                  </button>

                  {/* Migration Button - Only show when logged in */}
                  <button
                    className={`auth-button migration-button me-2 ${!isOnline ? "offline" : ""
                      }`}
                    onClick={() => setShowMigrationModal(true)}
                    disabled={!isOnline}
                    title={
                      !isOnline
                        ? "Offline - Cannot migrate"
                        : "Migrate data to Firebase"
                    }
                  >
                    {isOnline ? (
                      <CloudArrowUp className="me-1" />
                    ) : (
                      <WifiOff className="me-1" />
                    )}
                    {isOnline ? "Migrate" : "Offline"}
                  </button>

                  <span className="user-info me-3">
                    <PersonFill className="me-1" />
                    {currentUser.displayName || currentUser.email}
                  </span>

                  <button
                    className="auth-button logout-button"
                    onClick={handleLogout}
                  >
                    <BoxArrowRight className="me-1" />
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  className="auth-button login-button"
                  onClick={() => navigate("/login")}
                >
                  <PersonFill className="me-1" />
                  Login
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Updated CSS styles */}
        <style>
          {`
            .navbar {
              padding: 15px 0;
              transition: all 0.3s ease;
            }
            
            .navbar-scrolled {
              padding: 8px 0;
              background: linear-gradient(135deg, #172042 0%, #2a3561 100%) !important;
            }

            .navbar .nav-links {
              display: flex;
              align-items: center;
            }
            
            .navbar .nav-link {
              color: rgba(255, 255, 255, 0.8);
              font-weight: 500;
              margin: 0 5px;
              padding: 8px 16px;
              border-radius: 6px;
              transition: all 0.3s ease;
              position: relative;
            }
            
            .navbar .nav-link:hover {
              color: white;
              background-color: rgba(255, 255, 255, 0.1);
            }
            
            .navbar .nav-link.active {
              color: white;
              background-color: rgba(255, 255, 255, 0.15);
            }

            .navbar .nav-link.active::after {
              content: '';
              position: absolute;
              bottom: 0;
              left: 50%;
              transform: translateX(-50%);
              width: 20px;
              height: 3px;
              background-color: #ffffff;
              border-radius: 3px;
            }
            
            /* Auth Button Styles */
            .auth-section {
              display: flex;
              align-items: center;
            }
            
            .auth-button {
              background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%);
              border: 1px solid rgba(255, 255, 255, 0.2);
              color: white;
              padding: 8px 16px;
              border-radius: 6px;
              font-weight: 500;
              font-size: 0.9rem;
              transition: all 0.3s ease;
              cursor: pointer;
              display: flex;
              align-items: center;
              text-decoration: none;
            }
            
            .auth-button:hover {
              background: linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.15) 100%);
              border-color: rgba(255, 255, 255, 0.3);
              color: white;
              transform: translateY(-1px);
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            }
            
            .login-button {
              background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
              border-color: #3498db;
            }
            
            .login-button:hover {
              background: linear-gradient(135deg, #5dade2 0%, #3498db 100%);
              border-color: #5dade2;
            }
            
            .loading-button {
              background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
              border-color: #17a2b8;
            }
            
            .loading-button:hover:not(:disabled) {
              background: linear-gradient(135deg, #20c997 0%, #17a2b8 100%);
              border-color: #20c997;
            }
            
            .migration-button {
              background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
              border-color: #27ae60;
            }
            
            .migration-button:hover:not(:disabled) {
              background: linear-gradient(135deg, #2ecc71 0%, #58d68d 100%);
              border-color: #2ecc71;
            }
            
            .auth-button.offline {
              background: linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%);
              border-color: #95a5a6;
              cursor: not-allowed;
              opacity: 0.6;
            }

            .auth-button.offline:hover {
              background: linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%);
              transform: none;
              box-shadow: none;
            }
            
            .auth-button:disabled {
              opacity: 0.7;
              cursor: not-allowed;
              transform: none;
            }
            
            .logout-button:hover {
              background: linear-gradient(135deg, rgba(231, 76, 60, 0.8) 0%, rgba(192, 57, 43, 0.8) 100%);
              border-color: rgba(231, 76, 60, 0.8);
            }
            
            .user-info {
              color: rgba(255, 255, 255, 0.9);
              font-size: 0.85rem;
              font-weight: 500;
              display: flex;
              align-items: center;
            }
            
            .connection-status {
              font-size: 0.9rem;
            }
            
            .brand-icon {
              width: 32px;
              height: 32px;
              background: rgba(255, 255, 255, 0.2);
              border-radius: 6px;
              display: flex;
              align-items: center;
              justify-content: center;
              overflow: hidden;
            }
            
            .cube-wrapper {
              position: relative;
              width: 20px;
              height: 20px;
              perspective: 100px;
            }
            
            .cube {
              width: 100%;
              height: 100%;
              position: relative;
              transform-style: preserve-3d;
              transform: translateZ(-10px) rotateX(-15deg) rotateY(15deg);
              animation: rotate 10s infinite linear;
            }
            
            .cube-face {
              position: absolute;
              width: 20px;
              height: 20px;
              background: rgba(52, 152, 219, 0.8);
              display: flex;
              align-items: center;
              justify-content: center;
            }
            
            .front {
              transform: rotateY(0deg) translateZ(10px);
              background: rgba(52, 152, 219, 0.8);
            }
            
            .back {
              transform: rotateY(180deg) translateZ(10px);
              background: rgba(41, 128, 185, 0.8);
            }
            
            .top {
              transform: rotateX(90deg) translateZ(10px);
              background: rgba(41, 128, 185, 0.8);
            }
            
            .bottom {
              transform: rotateX(-90deg) translateZ(10px);
              background: rgba(52, 152, 219, 0.8);
            }
            
            @keyframes rotate {
              0% {
                transform: translateZ(-10px) rotateX(-15deg) rotateY(0deg);
              }
              100% {
                transform: translateZ(-10px) rotateX(-15deg) rotateY(360deg);
              }
            }
            
            .nav-icon {
              margin-right: 6px;
              font-size: 1rem;
              vertical-align: -2px;
            }
            
            @media (max-width: 991px) {
              .navbar .nav-link {
                margin: 5px 0;
              }
              
              .navbar .nav-link.active::after {
                width: 40px;
              }
              
              .auth-section {
                margin-top: 10px;
                width: 100%;
                flex-direction: column;
                gap: 10px;
              }
              
              .auth-button {
                width: 100%;
                justify-content: center;
              }
              
              .user-info {
                margin-bottom: 10px;
                justify-content: center;
              }
              
              .d-flex.align-items-center {
                flex-direction: column;
                width: 100%;
                gap: 10px;
              }
            }

            /* Add these styles for sticky behavior */
            .sticky-top {
              position: sticky;
              top: 0;
              z-index: 1030;
              transition: all 0.3s ease;
            }
            
            /* Optional: Add padding to body to prevent content jump when header becomes sticky */
            body {
              scroll-padding-top: 70px; /* Approximately the height of your header */
            }

            /* Navbar toggler styles */
            .navbar-toggler {
              background: rgba(255, 255, 255, 0.1);
              border-radius: 4px;
              padding: 4px 8px;
            }

            .navbar-toggler-icon {
              background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 30'%3e%3cpath stroke='rgba%28255, 255, 255, 0.8%29' stroke-linecap='round' stroke-miterlimit='10' stroke-width='2' d='m4 7h22M4 15h22M4 23h22'/%3e%3c/svg%3e");
              width: 20px;
              height: 20px;
            }
          `}
        </style>
      </nav>

      {/* Migration Modal */}
      <MigrationModal
        show={showMigrationModal}
        onHide={() => setShowMigrationModal(false)}
        onMigrationComplete={handleMigrationComplete}
      />

      {/* Loading Data Modal */}
      <LoadingDataModal
        show={showLoadingModal}
        onHide={handleCloseLoadingModal}
        isLoading={isLoading}
        isComplete={isComplete}
        progress={progress}
        message={message}
        error={error}
        downloadResult={downloadResult}
        onNavigateToShipments={handleNavigateToShipments}
        onRetry={handleRetryDownload}
      />
    </>
  );
};

export default Header0;
