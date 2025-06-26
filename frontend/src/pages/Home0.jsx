import React from "react";
import FileUpload0 from "../components/FileUpload0";
import {
  BoxSeam,
  Box,
  GearFill,
  FileEarmarkText,
  Amazon,
  BoxSeamFill,
} from "react-bootstrap-icons";
import { Link } from "react-router-dom";

const Home0 = () => {
  return (
    <div className="fba-manager-app">
      {/* Main Content */}
      <div className="container position-relative py-5 row justify-content-center ">
        <div className="mb-4">
          <h1 className="display-5 fw-bold text-primary mb-2 d-flex align-items-center justify-content-center">
            <BoxSeam className="me-3" size={45} />
            Amazon FBA Box Content Tool
          </h1>
          <p className="lead text-secondary text-center">
            Streamline your Amazon FBA shipping process with our powerful box
            content management tool
          </p>
        </div>

        <div className="row g-4">
          {/* Left Column - Import Section */}
          <div className="col-md-12">
            <h5 className="mb-4">
              <Amazon className="me-2" size={20} />
              <span>Upload Box Content File</span>
            </h5>
            <div className="upload-area rounded text-center">
              <FileUpload0 />
            </div>
          </div>

          {/* Right Column - Quick Actions */}
          {/* <div className="col-md-6">
            <h5 className="mb-4">Quick Actions</h5>
            <div className="row g-3">
              <div className="col-md-6">
                <div className="card h-100 border-0 shadow-sm">
                  <div className="card-body p-4">
                    <div className="d-flex align-items-center mb-3">
                      <div className="icon-wrapper rounded-circle bg-light p-2 me-3">
                        <Box size={22} />
                      </div>
                      <h6 className="card-title mb-0">Shipments</h6>
                    </div>
                    <p className="card-text small text-secondary">
                      View and manage all your FBA shipments
                    </p>
                    <Link
                      to="/shipments"
                      className="btn btn-outline-dark mt-2 w-100"
                    >
                      View Shipments
                    </Link>
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <div className="card h-100 border-0 shadow-sm">
                  <div className="card-body p-4">
                    <div className="d-flex align-items-center mb-3">
                      <div className="icon-wrapper rounded-circle bg-light p-2 me-3">
                        <BoxSeam size={22} />
                      </div>
                      <h6 className="card-title mb-0">Export</h6>
                    </div>
                    <p className="card-text small text-secondary">
                      Export box contents for Amazon
                    </p>
                    <Link
                      to="/export"
                      className="btn btn-outline-dark mt-2 w-100"
                    >
                      Export Data
                    </Link>
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <div className="card h-100 border-0 shadow-sm">
                  <div className="card-body p-4">
                    <div className="d-flex align-items-center mb-3">
                      <div className="icon-wrapper rounded-circle bg-light p-2 me-3">
                        <GearFill size={22} />
                      </div>
                      <h6 className="card-title mb-0">Settings</h6>
                    </div>
                    <p className="card-text small text-secondary">
                      Configure application settings
                    </p>
                    <Link
                      to="/settings"
                      className="btn btn-outline-dark mt-2 w-100"
                    >
                      Settings
                    </Link>
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <div className="card h-100 border-0 shadow-sm">
                  <div className="card-body p-4">
                    <div className="d-flex align-items-center mb-3">
                      <div className="icon-wrapper rounded-circle bg-light p-2 me-3">
                        <FileEarmarkText size={22} />
                      </div>
                      <h6 className="card-title mb-0">Documentation</h6>
                    </div>
                    <p className="card-text small text-secondary">
                      Learn how to use the application
                    </p>
                    <Link
                      to="/docs"
                      className="btn btn-outline-dark mt-2 w-100"
                    >
                      View Docs
                    </Link>
                  </div>
                </div>
              </div>

              <div className="mt-4 m-5">
                <h6>File Format Requirements</h6>
                <ul className="ps-3 small text-secondary">
                  <li className="mb-2">Excel (.xlsx) file format</li>
                  <li className="mb-2">
                    Must use Amazon's Box Content template
                  </li>
                  <li className="mb-2">
                    Required columns: Box ID, SKU, Quantity
                  </li>
                  <li>Optional columns: FNSKU, Description</li>
                </ul>
              </div>
            </div>
          </div> */}
        </div>
      </div>

      {/* CSS for styling */}
      <style>{`
        .fba-manager-app {
          position: relative;
          min-height: 100vh;
          padding: 20px 0;
        }
        
        .navbar {
          padding: 0.75rem 1rem;
        }
        
        .navbar-brand {
          font-weight: 600;
        }
        
        .nav-link {
          color: rgba(255,255,255,0.7);
        }
        
        .nav-link.active {
          color: white;
        }
        
        .connection-status {
          display: flex;
          align-items: center;
          font-size: 0.875rem;
        }
        
        .upload-area {
          border-color: #dee2e6 !important;
          background-color: white;
        }
        
        .upload-icon-wrapper {
          width: 64px;
          height: 64px;
        }
        
        .icon-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .card {
          transition: transform 0.2s ease-in-out;
        }
        
        .card:hover {
          transform: translateY(-5px);
        }

                .feature-item {
          padding: 20px 10px;
          text-align: center;
          transition: all 0.3s ease;
        }
        
        .feature-icon {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 15px;
        }
      `}</style>
    </div>
  );
};

export default Home0;
