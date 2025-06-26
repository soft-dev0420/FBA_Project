import React, { useEffect, useState } from "react";
import { getImportData } from "../utils/storage0"; // Updated to storage0
import { exportAmazonFormat, exportBoxSummary } from "../utils/fileUtils0";
import { Card, Row, Col, Alert, Badge } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom"; // Added useNavigate
import {
  CloudDownloadFill,
  FileEarmarkText,
  BoxSeamFill,
  ArrowLeft,
} from "react-bootstrap-icons";
import { toast } from "react-toastify";

const ExportPage0 = () => {
  const location = useLocation();
  const navigate = useNavigate(); // Added for navigation
  const shipmentID = location.state?.shipmentID;
  const [importData, setImportData] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Changed to true initially

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid date";

    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  useEffect(() => {
    // Get data for the specific shipmentID
    const fetchData = async () => {
      try {
        const data = await getImportData(shipmentID);
        setImportData(data);
        if (!data && shipmentID) {
          toast.error(`No data found for shipment ${shipmentID}`);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load shipment data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [shipmentID]);

  // Export Amazon format for the selected shipment
  const handleExportAmazon = () => {
    if (!importData) {
      toast.error(
        "No data available to export. Please upload or add data first."
      );
      return;
    }

    setIsLoading(true);
    try {
      // Pass the shipment data to the export function
      exportAmazonFormat(importData, shipmentID);
      toast.success(
        `Amazon format file for shipment ${
          shipmentID || "default"
        } exported successfully!`
      );
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export Amazon format file. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Export Box Summary for the selected shipment
  const handleExportSummary = () => {
    if (!importData) {
      toast.error(
        "No data available to export. Please upload or add data first."
      );
      return;
    }

    setIsLoading(true);
    try {
      // Pass the shipment data to the export function
      exportBoxSummary(importData, shipmentID);
      toast.success(
        `Box summary for shipment ${
          shipmentID || "default"
        } exported successfully!`
      );
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export box summary. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Navigate back to shipments
  const handleNavigateToShipments = () => {
    navigate("/shipments");
  };

  return (
    <div className="container py-5">
      <Card className="border-0 shadow-sm mb-4">
        <div className="position-relative">
          <div
            className="bg-gradient position-absolute w-100 h-100"
            style={{
              background: "linear-gradient(45deg, #f8f9fa 0%, #e9ecef 100%)",
              borderRadius: "0.375rem",
            }}
          ></div>
          <Card.Body className="position-relative p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div className="d-flex align-items-center">
                <CloudDownloadFill size={32} className="text-primary me-3" />
                <div>
                  <h2 className="mb-0">Export Box Content</h2>
                  <p className="text-muted mb-0 mt-1">
                    Download your box content data in your preferred format
                  </p>
                </div>
              </div>

              <button
                className="btn btn-outline-primary d-flex align-items-center"
                onClick={handleNavigateToShipments}
              >
                <ArrowLeft className="me-2" /> Back to Shipments
              </button>
            </div>

            {shipmentID && importData && (
              <div className="mb-4">
                <div className="bg-light p-3 rounded">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <Badge bg="primary" className="mb-2">
                        Shipment ID
                      </Badge>
                      <h5 className="mb-0">{shipmentID}</h5>
                    </div>
                    {importData.createdDate && (
                      <div className="text-end">
                        <div className="small text-muted">
                          Created: {formatDate(importData.createdDate)}
                        </div>
                        {importData.lastModifiedDate && (
                          <div className="small text-muted">
                            Last Updated:{" "}
                            {formatDate(importData.lastModifiedDate)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {!importData && !isLoading && (
              <Alert variant="warning" className="d-flex align-items-center">
                <BoxSeamFill className="me-2" />
                No box content data available. Please select a shipment to
                export.
              </Alert>
            )}

            {isLoading && (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3 text-muted">Loading shipment data...</p>
              </div>
            )}

            {importData && !isLoading && (
              <Row className="mt-4 g-4">
                <Col md={6}>
                  <Card className="h-100 border-0 shadow-sm">
                    <Card.Body className="p-4 text-center">
                      <div
                        className="export-icon-circle bg-primary text-white mx-auto mb-3"
                        style={{
                          width: "70px",
                          height: "70px",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <FileEarmarkText size={32} />
                      </div>
                      <h4>Amazon Format</h4>
                      <p className="text-muted mb-4">
                        Export your data in the standard Amazon format for FBA
                        shipments
                      </p>
                      <button
                        className="btn btn-primary btn-lg px-4 py-2"
                        onClick={handleExportAmazon}
                        disabled={isLoading}
                      >
                        <CloudDownloadFill className="me-2" />
                        {isLoading ? "Exporting..." : "Export Amazon File"}
                      </button>
                    </Card.Body>
                  </Card>
                </Col>

                <Col md={6}>
                  <Card className="h-100 border-0 shadow-sm">
                    <Card.Body className="p-4 text-center">
                      <div
                        className="export-icon-circle bg-secondary text-white mx-auto mb-3"
                        style={{
                          width: "70px",
                          height: "70px",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <BoxSeamFill size={32} />
                      </div>
                      <h4>Box Summary</h4>
                      <p className="text-muted mb-4">
                        Export a comprehensive summary of all your boxes and
                        their contents
                      </p>
                      <button
                        className="btn btn-secondary btn-lg px-4 py-2"
                        onClick={handleExportSummary}
                        disabled={isLoading}
                      >
                        <CloudDownloadFill className="me-2" />
                        {isLoading ? "Exporting..." : "Export Box Summary"}
                      </button>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )}
          </Card.Body>
        </div>
      </Card>

      {importData && !isLoading && (
        <Card className="border-0 shadow-sm">
          <Card.Body className="p-4">
            <h5 className="mb-3">Export Instructions</h5>
            <ul className="mb-0">
              <li className="mb-2">
                <strong>Amazon Format:</strong> Use this file for uploading to
                Amazon's Seller Central platform.
              </li>
              <li className="mb-2">
                <strong>Box Summary:</strong> Useful for your internal records
                and inventory management.
              </li>
              <li className="mb-2">
                All exports will download automatically to your device.
              </li>
              <li className="mb-2">
                <strong>Note:</strong> This export includes data only for
                shipment {shipmentID || "default"}.
              </li>
            </ul>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default ExportPage0;
