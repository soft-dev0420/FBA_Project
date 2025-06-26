import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CheckCircle, ArrowRight } from "react-bootstrap-icons";
import { Card, Container, Row, Col, Button } from "react-bootstrap";
import { getImportData } from "../utils/storage0"; // Import from storage0 instead
import { toast } from "react-toastify";

const ImportSummary = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [summary, setSummary] = useState({
    shipmentId: "",
    boxCount: 0,
    itemCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Create an async function inside useEffect
    const fetchData = async () => {
      try {
        // Get shipmentID from location state
        const shipmentID = location.state?.shipmentID;

        // If no shipmentID in state, try to get most recent shipment
        const importData = await getImportData(shipmentID);

        // Check if data exists
        if (!importData) {
          toast.error(
            "No import data found. Please import a file from the home page."
          );
          navigate("/");
          return;
        }

        // Calculate boxes and items in one go with the data
        let boxCount = 0;
        let itemCount = 0;

        // Calculate box count
        let box_location = 0;
        for (let i = 0; i < importData.mainJson.length; i++) {
          if (importData.mainJson[i][0] === "Name of box") {
            box_location = i;
            break;
          }
        }

        const boxArray = importData.mainJson[box_location];
        for (let i = 0; i < boxArray.length; i++) {
          if (boxArray[i] !== "" && boxArray[i] !== "Name of box") {
            boxCount++;
          }
        }

        // Calculate item count
        let lastItem = 0;
        for (let i = 5; i < importData.mainJson.length; i++) {
          if (importData.mainJson[i][0] === "") {
            lastItem = i;
            break;
          }
        }
        itemCount = lastItem > 5 ? lastItem - 5 : 0;

        // Set the summary data with all calculated values
        setSummary({
          // Use shipmentID from data object or from location state
          shipmentId:
            importData.shipmentID ||
            shipmentID ||
            "FBA-" + Math.random().toString(36).substring(2, 8).toUpperCase(),
          boxCount,
          itemCount,
        });

        // Only set loading to false after all calculations are complete
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching import data:", error);
        toast.error("Error loading import data. Please try again.");
        navigate("/");
      }
    };

    // Call the async function
    fetchData();
  }, [location.state, navigate]);

  if (isLoading) {
    return (
      <Container className="py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted">Loading import summary...</p>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      {/* Success Header */}
      <div className="text-center mb-5">
        <div className="bg-success bg-opacity-25 d-inline-flex align-items-center justify-content-center p-3 rounded-circle mb-3">
          <CheckCircle className="text-success" size={48} />
        </div>
        <h1 className="display-5 fw-bold">Import Successful!</h1>
        <p className="lead text-muted">
          Your box content file has been imported successfully. You can now
          review and edit the boxes.
        </p>
      </div>

      {/* Import Summary Card */}
      <Card className="shadow-sm mb-5">
        <Card.Body>
          <h5 className="mb-4">Import Summary</h5>
          <Row>
            <Col md={4} className="mb-3 mb-md-0">
              <div className="bg-light p-3 rounded">
                <small className="text-muted d-block">Shipment ID</small>
                <div className="fw-bold fs-5">{summary.shipmentId}</div>
              </div>
            </Col>
            <Col md={4} className="mb-3 mb-md-0">
              <div className="bg-light p-3 rounded">
                <small className="text-muted d-block">Boxes Imported</small>
                <div className="fw-bold fs-5">{summary.boxCount}</div>
              </div>
            </Col>
            <Col md={4}>
              <div className="bg-light p-3 rounded">
                <small className="text-muted d-block">Total Items</small>
                <div className="fw-bold fs-5">{summary.itemCount}</div>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Navigation Buttons */}
      <div className="d-flex flex-column flex-md-row justify-content-center gap-3 mt-5">
        <Button
          variant="dark"
          className="d-flex align-items-center justify-content-center"
          onClick={() => navigate("/shipments")}
        >
          View All Shipments <ArrowRight className="ms-2" />
        </Button>
        <Button variant="outline-secondary" onClick={() => navigate("/export")}>
          Export for Amazon
        </Button>
      </div>
    </Container>
  );
};

export default ImportSummary;
