import React from "react";
import { Modal, ProgressBar, Alert, Button } from "react-bootstrap";
import {
  CloudArrowDown,
  CheckCircle,
  ExclamationTriangle,
  Grid3x3GapFill,
} from "react-bootstrap-icons";

const LoadingDataModal = ({
  show,
  onHide,
  isLoading,
  isComplete,
  progress,
  message,
  error,
  downloadResult,
  onNavigateToShipments,
  onRetry,
}) => {
  const handleClose = () => {
    if (!isLoading) {
      onHide();
    }
  };

  return (
    <Modal
      show={show}
      onHide={handleClose}
      centered
      size="lg"
      backdrop={isLoading ? "static" : true}
      keyboard={!isLoading}
    >
      <Modal.Header closeButton={!isLoading}>
        <Modal.Title>
          <CloudArrowDown className="me-2" />
          Loading Your Shipments
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-4">
        {isLoading && (
          <div className="text-center">
            <div className="loading-animation mb-4">
              <CloudArrowDown size={48} className="text-primary loading-icon" />
            </div>
            <h5 className="mb-3">Downloading Your Data...</h5>
            <p className="text-muted mb-4">{message}</p>

            <ProgressBar
              now={progress}
              label={`${progress}%`}
              animated
              className="mb-3"
              style={{ height: "20px" }}
            />

            <div className="loading-steps">
              <small className="text-muted">
                Please don't close this window while data is loading...
              </small>
            </div>
          </div>
        )}

        {isComplete && downloadResult?.success && !error && (
          <div className="text-center">
            <CheckCircle size={48} className="text-success mb-3" />
            <h5 className="text-success mb-3">Download Completed!</h5>
            <p className="mb-4">{message}</p>

            {downloadResult.downloadedCount > 0 ? (
              <Alert variant="info" className="mb-4">
                <strong>Downloaded:</strong> {downloadResult.downloadedCount}{" "}
                shipments to local storage
              </Alert>
            ) : (
              <Alert variant="warning" className="mb-4">
                <strong>No Data Found:</strong> No shipments were found in your
                Firebase account. You can start by creating new shipments.
              </Alert>
            )}
          </div>
        )}

        {isComplete && error && (
          <div className="text-center">
            <ExclamationTriangle size={48} className="text-danger mb-3" />
            <h5 className="text-danger mb-3">Download Failed</h5>
            <Alert variant="danger" className="mb-4">
              <strong>Error:</strong> {error}
            </Alert>

            {downloadResult?.downloadedCount > 0 && (
              <Alert variant="warning" className="mb-4">
                <strong>Partial Success:</strong>{" "}
                {downloadResult.downloadedCount} out of{" "}
                {downloadResult.totalShipments} shipments were downloaded.
              </Alert>
            )}
          </div>
        )}
      </Modal.Body>

      <Modal.Footer>
        {isLoading && (
          <Button variant="secondary" disabled>
            Downloading...
          </Button>
        )}

        {isComplete && downloadResult?.success && (
          <>
            <Button variant="outline-secondary" onClick={handleClose}>
              Close
            </Button>
            <Button variant="primary" onClick={onNavigateToShipments}>
              <Grid3x3GapFill className="me-2" />
              View Shipments
            </Button>
          </>
        )}

        {isComplete && error && (
          <>
            <Button variant="outline-primary" onClick={onRetry}>
              Try Again
            </Button>
            <Button variant="outline-secondary" onClick={handleClose}>
              Close
            </Button>
            {downloadResult?.downloadedCount > 0 && (
              <Button variant="success" onClick={onNavigateToShipments}>
                View Downloaded Data
              </Button>
            )}
          </>
        )}
      </Modal.Footer>

      <style>
        {`
          .loading-icon {
            animation: bounce 1.5s ease-in-out infinite;
          }

          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }

          .loading-steps {
            background: rgba(13, 110, 253, 0.1);
            padding: 10px;
            border-radius: 8px;
            border-left: 3px solid #0d6efd;
          }
        `}
      </style>
    </Modal>
  );
};

export default LoadingDataModal;
