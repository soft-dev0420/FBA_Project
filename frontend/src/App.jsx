import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Header0 from "./components/Header0";
import Footer from "./components/Footer";
import PrivateRoute from "./components/auth/PrivateRoute";
import SignIn from "./components/auth/SignIn";
import SignUp from "./components/auth/SignUp";
import Home0 from "./pages/Home0";
import ProductDetail0 from "./pages/ProductDetail0";
import ExportPage0 from "./pages/ExportPage0";
import BoxSummary0 from "./pages/BoxSummary0";
import ShipmentsPage from "./pages/ShipmentsPage";
import ImportSummary from "./pages/ImportSummary";
import MultiAdd from "./pages/MultiAdd";
import { ToastContainer } from "react-toastify";
import { BoxProvider } from "./context/TotalContent";
import { Provider } from "react-redux";
import { store } from "./redux/store";
import TablePage from "./pages/TablePage";
import "bootstrap/dist/css/bootstrap.min.css";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./App.css";

const App = () => {
  return (
    <Router>
      <Provider store={store}>
        <AuthProvider>
          <ToastContainer />
          <BoxProvider>
            <div className="app-background">
              <div className="app-overlay" />
              <div className="app-content">
                <Header0 />
                <Routes>
                  {/* Public routes */}
                  <Route path="/login" element={<SignIn />} />
                  <Route path="/signup" element={<SignUp />} />

                  {/* Protected routes - Each route individually wrapped */}
                  <Route
                    path="/"
                    element={
                      <PrivateRoute>
                        <Home0 />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/products0"
                    element={
                      <PrivateRoute>
                        <ProductDetail0 />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/export0"
                    element={
                      <PrivateRoute>
                        <ExportPage0 />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/boxsummary0"
                    element={
                      <PrivateRoute>
                        <BoxSummary0 />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/shipments"
                    element={
                      <PrivateRoute>
                        <ShipmentsPage />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/importSummary"
                    element={
                      <PrivateRoute>
                        <ImportSummary />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/multiAdd"
                    element={
                      <PrivateRoute>
                        <MultiAdd />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/graph"
                    element={
                      <PrivateRoute>
                        <TablePage />
                      </PrivateRoute>
                    }
                  />
                </Routes>
                <Footer />
              </div>
            </div>
          </BoxProvider>
        </AuthProvider>
      </Provider>
    </Router>
  );
};

export default App;
