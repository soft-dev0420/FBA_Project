import React, { useState } from "react";
import { Card, Form, Button, Alert, Container } from "react-bootstrap";
import { useAuth } from "../../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import {
  PersonFill,
  LockFill,
  BoxArrowInRight,
  EyeFill,
  EyeSlashFill,
  Amazon,
  BoxSeamFill,
} from "react-bootstrap-icons";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setError("");
      setLoading(true);
      await login(email, password);
      navigate("/");
    } catch (error) {
      setError("Failed to log in: " + error.message);
    }

    setLoading(false);
  }

  return (
    <>
      <Container fluid className="auth-container">
        <div className="auth-background">
          <div className="floating-shapes">
            <div className="shape shape-1"></div>
            <div className="shape shape-2"></div>
            <div className="shape shape-3"></div>
            <div className="shape shape-4"></div>
          </div>
        </div>

        <div className="auth-content">
          <Container>
            <div className="row justify-content-center align-items-center min-vh-100">
              <div className="col-md-6 col-lg-5 col-xl-4">
                <Card className="auth-card shadow-lg border-0">
                  <Card.Body className="p-5">
                    {/* Brand Header */}
                    <div className="text-center mb-4">
                      <div className="brand-logo mb-3">
                        <div className="logo-container">
                          <Amazon size={24} className="text-primary" />
                          <BoxSeamFill
                            size={20}
                            className="text-secondary ms-2"
                          />
                        </div>
                      </div>
                      <h2 className="auth-title">Welcome Back</h2>
                      <p className="auth-subtitle text-muted">
                        Sign in to your FBA Tool account
                      </p>
                    </div>

                    {error && (
                      <Alert variant="danger" className="auth-alert">
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        {error}
                      </Alert>
                    )}

                    <Form onSubmit={handleSubmit}>
                      <Form.Group className="mb-4">
                        <Form.Label className="auth-label">
                          Email Address
                        </Form.Label>
                        <div className="input-group-custom">
                          <div className="input-icon">
                            <PersonFill />
                          </div>
                          <Form.Control
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="auth-input"
                            placeholder="Enter your email"
                          />
                        </div>
                      </Form.Group>

                      <Form.Group className="mb-4">
                        <Form.Label className="auth-label">Password</Form.Label>
                        <div className="input-group-custom">
                          <div className="input-icon">
                            <LockFill />
                          </div>
                          <Form.Control
                            type={showPassword ? "text" : "password"}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="auth-input"
                            placeholder="Enter your password"
                          />
                          <button
                            type="button"
                            className="password-toggle"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeSlashFill /> : <EyeFill />}
                          </button>
                        </div>
                      </Form.Group>

                      <Button
                        disabled={loading}
                        className="auth-btn w-100 mb-4"
                        type="submit"
                      >
                        {loading ? (
                          <>
                            <span
                              className="spinner-border spinner-border-sm me-2"
                              role="status"
                            ></span>
                            Signing In...
                          </>
                        ) : (
                          <>
                            <BoxArrowInRight className="me-2" />
                            Sign In
                          </>
                        )}
                      </Button>
                    </Form>

                    <div className="auth-footer text-center">
                      <p className="mb-0">
                        Don't have an account?{" "}
                        <Link to="/signup" className="auth-link">
                          Create Account
                        </Link>
                      </p>
                    </div>
                  </Card.Body>
                </Card>
              </div>
            </div>
          </Container>
        </div>
      </Container>

      {/* Custom Styles */}
      <style>
        {`
          .auth-container {
            position: relative;
            min-height: 100vh;
            padding: 0;
          }

          .auth-background {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            z-index: -2;
          }

          .floating-shapes {
            position: absolute;
            width: 100%;
            height: 100%;
            overflow: hidden;
          }

          .shape {
            position: absolute;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 50%;
            animation: float 20s infinite ease-in-out;
          }

          .shape-1 {
            width: 80px;
            height: 80px;
            top: 10%;
            left: 10%;
            animation-delay: 0s;
          }

          .shape-2 {
            width: 120px;
            height: 120px;
            top: 70%;
            right: 15%;
            animation-delay: 5s;
          }

          .shape-3 {
            width: 60px;
            height: 60px;
            top: 40%;
            left: 80%;
            animation-delay: 10s;
          }

          .shape-4 {
            width: 100px;
            height: 100px;
            bottom: 20%;
            left: 20%;
            animation-delay: 15s;
          }

          @keyframes float {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            25% { transform: translateY(-20px) rotate(90deg); }
            50% { transform: translateY(20px) rotate(180deg); }
            75% { transform: translateY(-10px) rotate(270deg); }
          }

          .auth-content {
            position: relative;
            z-index: 1;
            padding: 2rem 0;
          }

          .auth-card {
            backdrop-filter: blur(20px);
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            animation: slideUp 0.8s ease-out;
          }

          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .brand-logo {
            display: flex;
            justify-content: center;
            align-items: center;
          }

          .logo-container {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            padding: 12px 20px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            box-shadow: 0 8px 20px rgba(240, 147, 251, 0.3);
          }

          .auth-title {
            font-weight: 700;
            color: #2c3e50;
            margin-bottom: 0.5rem;
          }

          .auth-subtitle {
            font-size: 0.95rem;
            margin-bottom: 0;
          }

          .auth-label {
            font-weight: 600;
            color: #34495e;
            margin-bottom: 0.5rem;
            font-size: 0.9rem;
          }

          .input-group-custom {
            position: relative;
            display: flex;
            align-items: center;
          }

          .input-icon {
            position: absolute;
            left: 15px;
            color: #7f8c8d;
            z-index: 5;
            font-size: 1.1rem;
          }

          .auth-input {
            padding: 12px 15px 12px 45px;
            border: 2px solid #e9ecef;
            border-radius: 12px;
            font-size: 0.95rem;
            transition: all 0.3s ease;
            background: #fff;
          }

          .auth-input:focus {
            border-color: #667eea;
            box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.15);
            background: #fff;
          }

          .password-toggle {
            position: absolute;
            right: 15px;
            background: none;
            border: none;
            color: #7f8c8d;
            cursor: pointer;
            z-index: 5;
            padding: 5px;
            border-radius: 4px;
            transition: color 0.3s ease;
          }

          .password-toggle:hover {
            color: #667eea;
          }

          .auth-btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
            padding: 12px 0;
            border-radius: 12px;
            font-weight: 600;
            font-size: 1rem;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
          }

          .auth-btn:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
            background: linear-gradient(135deg, #5a67d8 0%, #6b5b95 100%);
          }

          .auth-btn:disabled {
            opacity: 0.7;
            transform: none;
          }

          .auth-alert {
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
            border: none;
            border-radius: 12px;
            color: white;
            font-weight: 500;
            margin-bottom: 1.5rem;
          }

          .auth-link {
            color: #667eea;
            text-decoration: none;
            font-weight: 600;
            transition: color 0.3s ease;
          }

          .auth-link:hover {
            color: #5a67d8;
            text-decoration: underline;
          }

          .auth-footer {
            margin-top: 1rem;
            color: #6c757d;
            font-size: 0.9rem;
          }

          /* Mobile Responsiveness */
          @media (max-width: 768px) {
            .auth-content {
              padding: 1rem 0;
            }
            
            .auth-card .card-body {
              padding: 2rem !important;
            }
            
            .floating-shapes {
              display: none;
            }
          }

          /* Remove any conflicting Bootstrap styles */
          .auth-input.form-control:focus {
            box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.15);
            border-color: #667eea;
          }
        `}
      </style>
    </>
  );
}
