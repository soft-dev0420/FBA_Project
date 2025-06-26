import React, { useEffect, useState, useMemo } from "react"; // Added useMemo for performance
import { useBoxActions } from "../context/TotalContent";
import { getImportData, saveImportData } from "../utils/storage0"; // Changed to storage0
import { useNavigate, useLocation } from "react-router-dom"; // Added useLocation
import ValidationAlerts from "../components/ValidationAlerts";
import {
  Modal,
  Button,
  Form,
  Card,
  Badge,
  Spinner,
  InputGroup,
  FloatingLabel,
  Tooltip,
  OverlayTrigger,
} from "react-bootstrap"; // Added more Bootstrap components
import {
  PencilFill,
  PlusLg,
  BoxSeam,
  TrashFill,
  BoxArrowRight,
  ExclamationTriangle,
  ExclamationCircle,
  ClockHistory,
  ArrowLeft,
} from "react-bootstrap-icons";
import { toast } from "react-toastify"; // Added toast notifications

function ProductDetail() {
  const [importData, setImportData] = useState(null);
  const [validation] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // Added loading state
  const navigate = useNavigate();
  const location = useLocation(); // Get location for shipmentID
  const shipmentID = location.state?.shipmentID; // Get shipmentID from route state
  const { setTotals } = useBoxActions(); // Add this to access context actions
  // Modal states
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);

  //For go to bottom and top flowing button
  const [showScrollButtons, setShowScrollButtons] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      const fullHeight = document.documentElement.scrollHeight;

      // Show buttons when scrolled at least 300px
      setShowScrollButtons(scrollPosition > 300);

      // Check if at top or bottom
      setIsAtTop(scrollPosition < 100);
      setIsAtBottom(scrollPosition + windowHeight >= fullHeight - 100);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initialize states

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "smooth",
    });
  };

  // Form data for adding/editing product
  const [formData, setFormData] = useState({
    sku: "",
    product_title: "",
    Id: "",
    ASIN: "",
    FNSKU: "",
    condition: "",
    prep_type: "",
    preps_units: "",
    labels_units: "",
    expected_quantity: "0",
  });

  const getBoxDistribution = (productIndex) => {
    if (!importData || !importData.mainJson) return [];

    let boxNameIndex = -1;
    // Find the "Name of box" row
    for (let i = 0; i < importData.mainJson.length; i++) {
      if (importData.mainJson[i][0] === "Name of box") {
        boxNameIndex = i;
        break;
      }
    }

    if (boxNameIndex === -1) return [];

    const boxNames = importData.mainJson[boxNameIndex];
    const productRow = importData.mainJson[productIndex];
    const distribution = [];

    // Start from column 12 (box columns typically start after the main product data)
    for (let i = 12; i < boxNames.length; i++) {
      if (boxNames[i] && boxNames[i] !== "") {
        const quantity = productRow[i] || "0";
        if (quantity !== "" && quantity !== "0") {
          distribution.push({
            boxName: boxNames[i],
            quantity: quantity,
          });
        }
      }
    }

    return distribution;
  };

  // Create tooltip content for box distribution
  const renderBoxDistributionTooltip = (productIndex) => (props) => {
    const distribution = getBoxDistribution(productIndex);

    if (distribution.length === 0) {
      return (
        <Tooltip id={`tooltip-${productIndex}`} {...props}>
          <div style={{ textAlign: "left" }}>
            <strong>Box Distribution:</strong>
            <br />
            No items in boxes yet
          </div>
        </Tooltip>
      );
    }

    return (
      <Tooltip id={`tooltip-${productIndex}`} {...props}>
        <div style={{ textAlign: "left" }}>
          <strong>Box Distribution:</strong>
          <br />
          {distribution.map((item, index) => (
            <div key={index}>
              {item.boxName}: {item.quantity}
            </div>
          ))}
        </div>
      </Tooltip>
    );
  };

  // Calculate total expected quantity and boxed quantity
  const totals = useMemo(() => {
    if (!importData) return { num: 0, expected: 0, boxed: 0 };

    // Safe parsing function
    const safeParseInt = (value) => {
      // If value is undefined, null, or empty string, return 0
      if (value === undefined || value === null || value === "") return 0;

      // Try to parse the value
      const parsed = parseInt(value, 10);

      // Check if the result is a valid number
      return isNaN(parsed) ? 0 : parsed;
    };

    return importData.mainJson.reduce(
      (acc, item) => {
        if (item[4] !== "") {
          acc.expected += safeParseInt(item[9]);
          acc.boxed += safeParseInt(item[10]);
          acc.num++;
        }
        return acc;
      },
      { expected: 0, boxed: 0, num: 0 }
    );
  }, [importData]);

  // Update context in useEffect - AFTER render is complete
  useEffect(() => {
    setTotals(totals);
  }, [totals, setTotals]);

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
    const fetchData = async () => {
      try {
        // Use shipmentID if available
        const data = await getImportData(shipmentID);
        if (!data) navigate("/");
        else {
          setImportData(data);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [navigate, shipmentID]);

  // Open add modal with reset form
  const handleAddClick = () => {
    setIsEditing(false);
    setFormData({
      sku: "",
      product_title: "",
      Id: "",
      ASIN: "",
      FNSKU: "",
      condition: "NewItem",
      prep_type: "Labeling",
      preps_units: "",
      labels_units: "By seller",
      expected_quantity: "0",
    });
    setShowAddEditModal(true);
  };

  // Open edit modal with prefilled data
  const handleEditClick = (index) => {
    const sku = importData.mainJson[index];
    setIsEditing(true);
    setCurrentIndex(index);

    setFormData({
      sku: sku[0] || "",
      product_title: sku[1] || "",
      Id: sku[2] || "",
      ASIN: sku[3] || "",
      FNSKU: sku[4] || "",
      condition: sku[5] || "",
      prep_type: sku[6] || "",
      preps_units: sku[7] || "",
      labels_units: sku[8] || "",
      expected_quantity: sku[9] || "0",
    });

    setShowAddEditModal(true);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Save product (add or update)
  const handleFormSubmit = async () => {
    let insertPlace = 0;
    for (let i = 0; i < importData.mainJson.length; i++) {
      if (importData.mainJson[i][0] === "Name of box") {
        insertPlace = i;
        break; // Add break to stop loop once found
      }
    }

    try {
      const newData = { ...importData };

      if (isEditing) {
        // Update existing product
        newData.mainJson[currentIndex][0] = formData.sku;
        newData.mainJson[currentIndex][1] = formData.product_title;
        newData.mainJson[currentIndex][2] = formData.Id;
        newData.mainJson[currentIndex][3] = formData.ASIN;
        newData.mainJson[currentIndex][4] = formData.FNSKU;
        newData.mainJson[currentIndex][5] = formData.condition;
        newData.mainJson[currentIndex][6] = formData.prep_type;
        newData.mainJson[currentIndex][7] = formData.preps_units;
        newData.mainJson[currentIndex][8] = formData.labels_units;
        newData.mainJson[currentIndex][9] = formData.expected_quantity;

        toast.success("Product updated successfully!");
      } else {
        // Add new product at insertPlace - 1
        const newRow = [
          formData.sku,
          formData.product_title,
          formData.Id,
          formData.ASIN,
          formData.FNSKU,
          formData.condition,
          formData.prep_type,
          formData.preps_units,
          formData.labels_units,
          formData.expected_quantity,
          "0", // Initialize boxed quantity as column 10
        ];

        for (let i = 0; i < newData.mainJson[4].length - 11; i++) {
          newRow.push(""); // Add empty columns for new product
        }

        // Insert at insertPlace-1 using splice instead of pushing to the end
        newData.mainJson.splice(insertPlace - 1, 0, newRow);
        toast.success("Product added successfully!");
      }

      setImportData(newData);
      await saveImportData(newData, shipmentID); // Pass shipmentID to update lastModifiedDate
      setShowAddEditModal(false);
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("Failed to save product. Please try again.");
    }
  };

  // Open delete confirmation modal
  const handleDeleteClick = (index) => {
    setCurrentIndex(index);
    setShowDeleteModal(true);
  };

  // Delete product after confirmation
  const handleDeleteConfirm = async () => {
    try {
      const newData = { ...importData };
      newData.mainJson.splice(currentIndex, 1);

      setImportData(newData);
      await saveImportData(newData, shipmentID); // Pass shipmentID to update lastModifiedDate
      setShowDeleteModal(false);
      toast.success("Product deleted successfully!");
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product. Please try again.");
    }
  };

  // Added loading state UI
  if (isLoading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "100vh" }}
      >
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  if (!importData) return null;

  return (
    <div className="container py-4">
      {/* Header Card - Improved visual appearance */}
      <Card className="shadow-sm mb-4 bg-light">
        <div
          className="position-relative"
          style={{ minHeight: "10rem", overflow: "hidden" }}
        >
          {/* Background Image */}
          <div
            style={{
              backgroundImage: "url('/images/Products.webp')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          ></div>
          {/* Content Container */}
          <div className="position-relative p-4 d-flex flex-column h-100">
            <div className="d-flex justify-content-between align-items-center">
              <h1 className="mb-0 d-flex align-items-center text-white">
                <BoxSeam style={{ marginRight: "12px" }} />
                {/* Display shipmentID */}
                {shipmentID && (
                  <Badge bg="light" text="dark" className="mt-2 px-3 py-2">
                    {shipmentID}
                  </Badge>
                )}
              </h1>
              <Button
                variant="dark"
                className="d-flex align-items-center mt-0"
                onClick={handleAddClick}
              >
                <PlusLg className="me-2" /> Add Product
              </Button>
            </div>

            {importData.lastModifiedDate && (
              <div className="text-white mt-2 small d-flex align-items-center">
                <ClockHistory className="me-1" /> Last Updated:{" "}
                {formatDate(importData.lastModifiedDate)}
              </div>
            )}

            <div className="d-flex justify-content-between mt-5">
              {/* Left Button - to Products */}
              <Button
                variant="dark"
                onClick={() =>
                  navigate("/boxsummary0", { state: { shipmentID } })
                }
                className="d-flex align-items-center"
              >
                <ArrowLeft className="me-2" /> BoxSummary
              </Button>
              {/* Right Button - to Export */}
              <Button
                variant="dark"
                onClick={() => navigate("/export0", { state: { shipmentID } })}
                className="d-flex align-items-center"
              >
                Export <BoxArrowRight className="ms-2" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
      {/* Added Summary Card - New feature */}
      <Card className="shadow-sm mb-4 bg-light">
        <Card.Body>
          <div className="row">
            <div className="col-md-4">
              <div className="d-flex align-items-center">
                <div className="me-3">
                  <span className="fs-5 fw-bold">{totals.num - 1}</span>
                </div>
                <div>
                  <span className="text-muted">Total Products</span>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="d-flex align-items-center">
                <div className="me-3">
                  <span className="fs-5 fw-bold">{totals.expected}</span>
                </div>
                <div>
                  <span className="text-muted">Expected Quantity</span>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="d-flex align-items-center">
                <div className="me-3">
                  <span className="fs-5 fw-bold">{totals.boxed}</span>
                </div>
                <div>
                  <span className="text-muted">Boxed Quantity</span>
                </div>
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Products Table - Enhanced styling */}
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <div className="table-responsive">
            <table className="table table-hover text-center">
              <tbody>
                {/* sku[4] : FNSKU */}
                {importData.mainJson.map(
                  (sku, index) =>
                    sku[4] !== "" && (
                      <tr key={index}>
                        <td className="align-middle">
                          <span className="text-primary fw-medium">
                            {sku[0]}
                          </span>
                        </td>
                        <td className="align-middle">{sku[1]}</td>
                        <td className="align-middle">
                          <small className="text-muted">{sku[2]}</small>
                        </td>
                        <td className="align-middle">{sku[3]}</td>
                        <td className="align-middle">{sku[4]}</td>
                        <td className="align-middle">{sku[9]}</td>
                        <td className="align-middle">
                          {/* Added color-coded badges */}
                          <OverlayTrigger
                            placement="top"
                            delay={{ show: 250, hide: 400 }}
                            overlay={renderBoxDistributionTooltip(index)}
                          >
                            <Badge
                              bg={
                                parseInt(sku[10] || 0) === parseInt(sku[9] || 0)
                                  ? "success"
                                  : parseInt(sku[10] || 0) === 0
                                  ? "danger"
                                  : "warning"
                              }
                            >
                              {index === 4
                                ? sku[10]
                                : importData.mainJson[index][10] || "0"}
                            </Badge>
                          </OverlayTrigger>
                        </td>
                        <td className="align-middle">
                          {index === 4 ? (
                            <span className="text-muted">Action</span>
                          ) : (
                            <div className="d-flex">
                              <Button
                                variant="light"
                                size="sm"
                                className="me-2 d-flex align-items-center"
                                onClick={() => handleEditClick(index)}
                              >
                                <PencilFill className="text-dark" />
                              </Button>
                              <Button
                                variant="light"
                                size="sm"
                                className="d-flex align-items-center"
                                onClick={() => handleDeleteClick(index)}
                              >
                                <TrashFill className="text-danger" />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                )}
                {/* Added empty state message */}
                {importData.mainJson.filter((sku) => sku[5] !== "").length ===
                  0 && (
                  <tr>
                    <td colSpan="8" className="text-center py-4 text-muted">
                      No products found. Click "Add Product" to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card.Body>
      </Card>

      {/* Improved Add/Edit Product Modal */}
      <Modal
        show={showAddEditModal}
        onHide={() => setShowAddEditModal(false)}
        centered
        size="lg"
      >
        <Modal.Header
          closeButton
          className="border-0 pb-0"
          style={{
            backgroundImage: "url('/images/Products.webp')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            minHeight: "10rem",
          }}
        >
          <Modal.Title style={{ color: "white" }}>
            {isEditing ? "Edit Product" : "Add New Product"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-3">
          <Form>
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <InputGroup className="mb-3">
                  <InputGroup.Text>
                    <i className="bi bi-upc-scan"></i>
                  </InputGroup.Text>
                  <FloatingLabel controlId="skuInput" label="SKU">
                    <Form.Control
                      type="text"
                      name="sku"
                      value={formData.sku}
                      onChange={handleInputChange}
                      placeholder="SKU"
                    />
                  </FloatingLabel>
                </InputGroup>
              </div>
              <div className="col-md-6">
                <InputGroup className="mb-3">
                  <InputGroup.Text>
                    <i className="bi bi-amazon"></i>
                  </InputGroup.Text>
                  <FloatingLabel controlId="asinInput" label="ASIN">
                    <Form.Control
                      type="text"
                      name="ASIN"
                      value={formData.ASIN}
                      onChange={handleInputChange}
                      placeholder="ASIN"
                    />
                  </FloatingLabel>
                </InputGroup>
              </div>
            </div>

            <InputGroup className="mb-3">
              <InputGroup.Text>
                <i className="bi bi-tag"></i>
              </InputGroup.Text>
              <FloatingLabel controlId="titleInput" label="Product Title">
                <Form.Control
                  type="text"
                  name="product_title"
                  value={formData.product_title}
                  onChange={handleInputChange}
                  placeholder="Product Title"
                />
              </FloatingLabel>
            </InputGroup>

            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <InputGroup className="mb-3">
                  <InputGroup.Text>
                    <i className="bi bi-hash"></i>
                  </InputGroup.Text>
                  <FloatingLabel controlId="idInput" label="ID">
                    <Form.Control
                      type="text"
                      name="Id"
                      value={formData.Id}
                      onChange={handleInputChange}
                      placeholder="ID"
                    />
                  </FloatingLabel>
                </InputGroup>
              </div>
              <div className="col-md-6">
                <InputGroup className="mb-3">
                  <InputGroup.Text>
                    <i className="bi bi-fingerprint"></i>
                  </InputGroup.Text>
                  <FloatingLabel controlId="fnskuInput" label="FNSKU">
                    <Form.Control
                      type="text"
                      name="FNSKU"
                      value={formData.FNSKU}
                      onChange={handleInputChange}
                      placeholder="FNSKU"
                    />
                  </FloatingLabel>
                </InputGroup>
              </div>
            </div>

            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <InputGroup className="mb-3">
                  <InputGroup.Text>
                    <i className="bi bi-clipboard-check"></i>
                  </InputGroup.Text>
                  <FloatingLabel controlId="conditionInput" label="Condition">
                    <Form.Control
                      type="text"
                      name="condition"
                      value={formData.condition}
                      onChange={handleInputChange}
                      placeholder="Condition"
                    />
                  </FloatingLabel>
                </InputGroup>
              </div>
              <div className="col-md-6">
                <InputGroup className="mb-3">
                  <InputGroup.Text>
                    <i className="bi bi-123"></i>
                  </InputGroup.Text>
                  <FloatingLabel
                    controlId="quantityInput"
                    label="Expected Quantity"
                  >
                    <Form.Control
                      type="number"
                      name="expected_quantity"
                      value={formData.expected_quantity}
                      onChange={handleInputChange}
                      placeholder="Expected Quantity"
                      min="0"
                    />
                  </FloatingLabel>
                </InputGroup>
              </div>
            </div>

            <div className="row g-3">
              <div className="col-md-4">
                <InputGroup className="mb-3">
                  <InputGroup.Text>
                    <i className="bi bi-tools"></i>
                  </InputGroup.Text>
                  <FloatingLabel controlId="prepTypeInput" label="Prep Type">
                    <Form.Control
                      type="text"
                      name="prep_type"
                      value={formData.prep_type}
                      onChange={handleInputChange}
                      placeholder="Prep Type"
                    />
                  </FloatingLabel>
                </InputGroup>
              </div>
              <div className="col-md-4">
                <InputGroup className="mb-3">
                  <InputGroup.Text>
                    <i className="bi bi-box-seam"></i>
                  </InputGroup.Text>
                  <FloatingLabel
                    controlId="prepsUnitsInput"
                    label="Preps Units"
                  >
                    <Form.Control
                      type="text"
                      name="preps_units"
                      value={formData.preps_units}
                      onChange={handleInputChange}
                      placeholder="Preps Units"
                    />
                  </FloatingLabel>
                </InputGroup>
              </div>
              <div className="col-md-4">
                <InputGroup className="mb-3">
                  <InputGroup.Text>
                    <i className="bi bi-tag-fill"></i>
                  </InputGroup.Text>
                  <FloatingLabel
                    controlId="labelsUnitsInput"
                    label="Labels Units"
                  >
                    <Form.Control
                      type="text"
                      name="labels_units"
                      value={formData.labels_units}
                      onChange={handleInputChange}
                      placeholder="Labels Units"
                    />
                  </FloatingLabel>
                </InputGroup>
              </div>
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button
            variant="outline-secondary"
            onClick={() => setShowAddEditModal(false)}
          >
            Cancel
          </Button>
          <Button variant="primary" onClick={handleFormSubmit}>
            {isEditing ? "Update Product" : "Add Product"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
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
            Confirm Delete
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="px-4">
          <div className="text-center mb-4">
            <ExclamationCircle size={50} className="text-danger mb-3" />
            <p>
              Are you sure you want to delete this product? This action cannot
              be undone.
            </p>
            {shipmentID && (
              <div className="text-muted mt-2">
                <small>Shipment ID: {shipmentID}</small>
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button
            variant="outline-secondary"
            onClick={() => setShowDeleteModal(false)}
          >
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirm}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
      {/* Scroll Navigation Buttons */}
      {showScrollButtons && (
        <div className="scroll-nav-buttons">
          {!isAtTop && (
            <Button
              variant="dark"
              className="scroll-button top-button"
              onClick={scrollToTop}
              aria-label="Scroll to top"
            >
              <i className="bi bi-arrow-up"></i>
            </Button>
          )}
          {!isAtBottom && (
            <Button
              variant="dark"
              className="scroll-button bottom-button"
              onClick={scrollToBottom}
              aria-label="Scroll to bottom"
            >
              <i className="bi bi-arrow-down"></i>
            </Button>
          )}
        </div>
      )}
      {/* CSS for the scroll buttons */}
      <style>
        {`
    .scroll-nav-buttons {
      position: fixed;
      right: 30px;
      bottom: 30px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      z-index: 1000;
    }
    
    .scroll-button {
      width: 45px;
      height: 45px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.8;
      transition: all 0.3s ease;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    }
    
    .scroll-button:hover {
      opacity: 1;
      transform: scale(1.1);
    }
    
    .top-button {
      animation: fadeIn 0.5s ease-in;
    }
    
    .bottom-button {
      animation: fadeIn 0.5s ease-in;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 0.8; transform: translateY(0); }
    }
  `}
      </style>
    </div>
  );
}

export default ProductDetail;
