import React, { useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { parseExcelFile } from "../utils/fileUtils0";
import { saveImportData } from "../utils/storage0";
import { Modal, Button, ProgressBar } from "react-bootstrap";
import { toast } from "react-toastify";
import {
  CloudUploadFill,
  FileEarmarkExcel,
  FileEarmarkText,
  ExclamationTriangle,
  TrashFill,
} from "react-bootstrap-icons";

const FileUpload0 = () => {
  const fileInput = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [showResetModal, setShowResetModal] = useState(false);
  const navigate = useNavigate();

  const clearAllData = async () => {
    localStorage.clear();
    sessionStorage.clear();
    return Promise.resolve();
  };

  // Simulated progress for better user experience
  const simulateProgress = useCallback(() => {
    setLoadingProgress(0);
    const interval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);
    return interval;
  }, []);

  // Consolidated file handling function
  const handleFile = async (file) => {
    setError("");

    // File type validation
    const validFileTypes = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv",
    ];

    if (!validFileTypes.includes(file.type)) {
      setError(
        "Invalid file type. Please upload .xlsx, .xls or .csv files only."
      );
      toast.error(
        "Invalid file type. Please upload .xlsx, .xls or .csv files only."
      );
      return;
    }

    // File size validation (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("File is too large. Maximum file size is 10MB.");
      toast.error("File is too large. Maximum file size is 10MB.");
      return;
    }

    // Set file info
    setFileName(file.name);
    setFileSize((file.size / 1024).toFixed(2) + " KB");

    // Start loading and progress simulation
    setIsLoading(true);
    const progressInterval = simulateProgress();

    try {
      // Parse Excel file
      const data = await parseExcelFile(file);

      // Generate a shipmentID
      const shipmentID = `FBA-${Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase()}`;

      const shipmentName = shipmentID;

      // Add the shipmentID to the data object
      data.shipmentID = shipmentID;
      data.shipmentName = shipmentName;

      // Update progress
      clearInterval(progressInterval);
      setLoadingProgress(100);

      // Save data with the enhanced storage system
      const savedShipmentID = await saveImportData(data, shipmentID);

      // Show success toast
      toast.success("File uploaded successfully! Redirecting to summary...");

      // Navigate after a brief delay
      setTimeout(() => {
        setIsLoading(false);
        // Pass shipmentID to the ImportSummary component
        navigate("/importSummary", { state: { shipmentID: savedShipmentID } });
      }, 1500);
    } catch (e) {
      clearInterval(progressInterval);
      setIsLoading(false);
      const errorMsg =
        "Failed to parse file. Please ensure you're uploading a valid Amazon box content file in .xlsx or .csv format.";
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragActive) setDragActive(true);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragActive) setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleResetData = async () => {
    try {
      await clearAllData();
      setShowResetModal(false);
      toast.info("All data has been cleared successfully.");
    } catch (e) {
      const errorMsg = "Failed to clear data. Please try again.";
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  return (
    <>
      <div className="card shadow-sm border-0 p-4 text-center">
        <div className="mb-3">
          <CloudUploadFill size={56} className="text-primary" />
        </div>

        <h4 className="mb-3 fw-bold">Upload Amazon Box Content File</h4>
        <p className="text-muted mb-4">
          Only .xlsx or .csv files generated by Amazon are supported.
          <br />
          <small>Maximum file size: 10MB</small>
        </p>

        <div
          className={`upload-area p-5 text-center border border-dashed rounded-4 
            ${
              dragActive
                ? "border-primary bg-light-blue"
                : "border-secondary bg-light"
            } 
            ${isLoading ? "opacity-50" : ""}`}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isLoading && fileInput.current.click()}
          style={{
            cursor: isLoading ? "default" : "pointer",
            transition: "all 0.2s ease",
          }}
        >
          <input
            ref={fileInput}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="d-none"
            onChange={handleFileChange}
            disabled={isLoading}
          />

          {isLoading ? (
            <div className="py-3">
              <div className="mb-3">
                <div className="d-flex align-items-center mb-2">
                  {fileName.endsWith(".csv") ? (
                    <FileEarmarkText
                      size={32}
                      className="text-secondary me-2"
                    />
                  ) : (
                    <FileEarmarkExcel size={32} className="text-success me-2" />
                  )}
                  <div className="text-start">
                    <p className="mb-0 fw-medium">{fileName}</p>
                    <small className="text-muted">{fileSize}</small>
                  </div>
                </div>
              </div>
              <ProgressBar
                animated
                now={loadingProgress}
                className="mb-3"
                variant={loadingProgress === 100 ? "success" : "primary"}
              />
              <p className="text-muted mb-0">
                {loadingProgress === 100
                  ? "Processing complete!"
                  : "Processing your file..."}
              </p>
            </div>
          ) : (
            <>
              <div className="upload-icon-container mb-3">
                <div className="upload-icon-circle">
                  <CloudUploadFill size={32} className="text-primary" />
                </div>
              </div>
              <h5 className="mb-2">Drag & Drop your file here</h5>
              <p className="text-muted mb-3">or</p>
              <button className="btn btn-primary py-2 px-4">
                Browse Files
              </button>
              <p className="mt-3 mb-0 small text-muted">
                Supported formats: .xlsx, .xls, .csv
              </p>
            </>
          )}
        </div>

        {error && (
          <div className="alert alert-danger mt-3 d-flex align-items-center">
            <ExclamationTriangle className="text-danger me-2" />
            <span>{error}</span>
          </div>
        )}

        {/* <div className="mt-4">
          <Button
            variant="outline-danger"
            size="sm"
            className="d-flex align-items-center mx-auto"
            onClick={() => setShowResetModal(true)}
          >
            <TrashFill className="me-2" /> Reset All Data
          </Button>
        </div> */}
      </div>

      {/* Reset Confirmation Modal */}
      <Modal
        show={showResetModal}
        onHide={() => setShowResetModal(false)}
        centered
      >
        <Modal.Header
          closeButton
          className="border-0 pb-0"
          style={{
            backgroundImage: "linear-gradient(to right, #f8f9fa, #e9ecef)",
            height: "5rem",
          }}
        >
          <Modal.Title style={{ color: "#212529", fontWeight: "bold" }}>
            <ExclamationTriangle className="me-2 text-danger" />
            Confirm Reset
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="px-4">
          <div className="text-center mb-4">
            <ExclamationTriangle size={50} className="text-danger mb-3" />
            <p>
              Are you sure you want to reset all saved data? This action cannot
              be undone.
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button
            variant="outline-secondary"
            onClick={() => setShowResetModal(false)}
          >
            Cancel
          </Button>
          <Button variant="danger" onClick={handleResetData}>
            Reset All Data
          </Button>
        </Modal.Footer>
      </Modal>

      <style>
        {`
          .border-dashed {
            border-style: dashed !important;
            border-width: 2px !important;
          }
          
          .bg-light-blue {
            background-color: rgba(13, 110, 253, 0.05) !important;
          }
          
          .upload-icon-circle {
            width: 70px;
            height: 70px;
            border-radius: 50%;
            background-color: rgba(13, 110, 253, 0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto;
          }
        `}
      </style>
    </>
  );
};

export default FileUpload0;
