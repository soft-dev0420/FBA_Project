import React, { useState, useEffect } from "react";
import { Modal, Button, Alert, ProgressBar, ListGroup } from "react-bootstrap";
import { useAuth } from "../context/AuthContext";
import {
  migrateUserData,
  verifyUserMigration,
} from "../services/migrationService";
import useOnlineStatus from "../hooks/useOnlineStatus";
import {
  CloudArrowUp,
  CheckCircle,
  ExclamationTriangle,
  WifiOff,
  Wifi,
} from "react-bootstrap-icons";

const MigrationModal = ({ show, onHide, onMigrationComplete }) => {
  const { currentUser } = useAuth();
  const isOnline = useOnlineStatus();
  const [migrationState, setMigrationState] = useState("idle");
  const [migrationResult, setMigrationResult] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [progress, setProgress] = useState(0);

  // Reset state when modal opens or closes
  useEffect(() => {
    if (!show) {
      // Reset all state when modal is hidden
      resetMigrationState();
    }
  }, [show]);

  const resetMigrationState = () => {
    setMigrationState("idle");
    setMigrationResult(null);
    setVerificationResult(null);
    setProgress(0);
  };

  const handleMigration = async () => {
    if (!currentUser) {
      alert("You must be logged in to migrate data");
      return;
    }

    if (!isOnline) {
      alert("You must be online to migrate data to Firebase");
      return;
    }

    setMigrationState("migrating");
    setProgress(25);

    try {
      setProgress(50);
      const result = await migrateUserData(currentUser.email);
      setMigrationResult(result);

      if (result.success) {
        setProgress(75);

        const verification = await verifyUserMigration(currentUser.email);
        setVerificationResult(verification);
        setProgress(100);

        setMigrationState("completed");

        if (onMigrationComplete) {
          onMigrationComplete(result);
        }
      } else {
        setMigrationState("error");
      }
    } catch (error) {
      console.error("Migration error:", error);
      setMigrationResult({
        success: false,
        message: `Migration failed: ${error.message}`,
        userEmail: currentUser.email,
      });
      setMigrationState("error");
    }
  };

  // Enhanced close handler that resets state
  const handleClose = () => {
    resetMigrationState();
    onHide();
  };

  const handleTryAgain = () => {
    resetMigrationState();
  };

  return (
    <Modal show={show} onHide={handleClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <CloudArrowUp className="me-2" />
          Migrate Data to Firebase
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {/* Online Status Indicator */}
        <Alert variant={isOnline ? "success" : "warning"} className="mb-3">
          {isOnline ? (
            <>
              <Wifi className="me-2" />
              <strong>Online</strong> - Ready to migrate to Firebase
            </>
          ) : (
            <>
              <WifiOff className="me-2" />
              <strong>Offline</strong> - Internet connection required for
              migration
            </>
          )}
        </Alert>

        {migrationState === "idle" && (
          <div>
            <Alert variant="info">
              <strong>Data Migration for {currentUser?.email}</strong>
              <p className="mb-0 mt-2">
                This will migrate all your shipment data from local storage
                (IndexedDB/localStorage) to Firebase cloud storage. Your data
                will be securely stored under your email account and accessible
                across devices.
              </p>
            </Alert>

            <div className="mb-3">
              <h6>What will be migrated:</h6>
              <ListGroup variant="flush">
                <ListGroup.Item>
                  ✅ All shipment data and configurations
                </ListGroup.Item>
                <ListGroup.Item>
                  ✅ Creation and modification timestamps
                </ListGroup.Item>
                <ListGroup.Item>✅ Box and item information</ListGroup.Item>
                <ListGroup.Item>
                  ✅ Product details and quantities
                </ListGroup.Item>
                <ListGroup.Item>
                  🔐 Data will be stored under:{" "}
                  <code>{currentUser?.email}</code>
                </ListGroup.Item>
              </ListGroup>
            </div>

            <Alert variant="warning">
              <strong>Important:</strong>
              <ul className="mb-0 mt-2">
                <li>Ensure you have a stable internet connection</li>
                <li>
                  Your data will be organized by your email address in Firebase
                </li>
                <li>
                  After successful migration, local data will remain as backup
                </li>
              </ul>
            </Alert>
          </div>
        )}

        {migrationState === "migrating" && (
          <div>
            <div className="text-center mb-3">
              <h5>Migrating data for {currentUser?.email}...</h5>
              <p className="text-muted">Please don't close this window</p>
            </div>
            <ProgressBar animated now={progress} label={`${progress}%`} />
            <div className="mt-2 text-center">
              {progress === 25 && "Preparing migration..."}
              {progress === 50 && "Extracting local data..."}
              {progress === 75 && "Uploading to Firebase..."}
              {progress === 100 && "Verifying migration..."}
            </div>
          </div>
        )}

        {migrationState === "completed" && migrationResult && (
          <div>
            <Alert variant="success">
              <CheckCircle className="me-2" />
              <strong>Migration Completed Successfully!</strong>
              <p className="mb-0 mt-2">{migrationResult.message}</p>
            </Alert>

            {verificationResult && (
              <Alert
                variant={verificationResult.isValid ? "success" : "warning"}
              >
                <strong>Verification Results:</strong>
                <p className="mb-1">{verificationResult.message}</p>
                <small>
                  Local: {verificationResult.localCount} shipments | Firebase:{" "}
                  {verificationResult.firebaseCount} shipments
                </small>
              </Alert>
            )}

            <div className="text-center">
              <p>
                Your data is now safely stored in Firebase under your email
                account
                <strong> {currentUser?.email}</strong> and will sync across all
                your devices!
              </p>
            </div>
          </div>
        )}

        {migrationState === "error" && migrationResult && (
          <div>
            <Alert variant="danger">
              <ExclamationTriangle className="me-2" />
              <strong>Migration Failed</strong>
              <p className="mb-0 mt-2">{migrationResult.message}</p>
            </Alert>

            <p>
              Please check your internet connection and try again, or contact
              support if the problem persists.
            </p>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        {migrationState === "idle" && (
          <>
            <Button variant="outline-secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleMigration}
              disabled={!isOnline || !currentUser}
            >
              <CloudArrowUp className="me-2" />
              {!isOnline ? "Offline - Cannot Migrate" : "Start Migration"}
            </Button>
          </>
        )}

        {migrationState === "migrating" && (
          <Button variant="secondary" disabled>
            Migrating...
          </Button>
        )}

        {(migrationState === "completed" || migrationState === "error") && (
          <>
            {migrationState === "error" && (
              <Button
                variant="outline-primary"
                onClick={handleTryAgain}
                disabled={!isOnline}
              >
                Try Again
              </Button>
            )}
            <Button variant="success" onClick={handleClose}>
              Close
            </Button>
          </>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default MigrationModal;
