import React, { useState, useEffect } from "react";
import { Container, Card, Form, Button, Alert, Badge } from "react-bootstrap";
import {
  BoxSeamFill,
  Plus,
  Check2Circle,
  InfoCircleFill,
  Upc,
  Calculator,
} from "react-bootstrap-icons";
import { toast } from "react-toastify";
import { getImportData, saveImportData } from "../utils/storage0";
import { useNavigate, useLocation } from "react-router-dom";

const MultiAdd = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const shipmentID = location.state?.shipmentID;

  // Form data
  const [formData, setFormData] = useState({
    sku: "",
    quantity: 1,
    boxNumbers: "",
    addToMultiple: true,
    fnsku: "", // === MODIFIED: Added fnsku field ===
  });

  // Validation and state
  const [errors, setErrors] = useState({});
  const [parsedBoxes, setParsedBoxes] = useState([]);
  const [availableSKUs, setAvailableSKUs] = useState([]);
  const [availableBoxes, setAvailableBoxes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [importData, setImportData] = useState(null);
  const [matchedSku, setMatchedSku] = useState(null);

  // Load data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getImportData(shipmentID);
        if (!data) {
          toast.error("No shipment data found");
          navigate("/shipments");
          return;
        }

        setImportData(data);
        setAvailableSKUs(getAvailableSKUs(data));
        // Store full box details and numbers
        const boxData = getAvailableBoxes(data);
        setAvailableBoxes(boxData);
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load shipment data");
        navigate("/shipments");
      }
    };

    fetchData();
  }, [shipmentID, navigate]);

  // Get available SKUs
  const getAvailableSKUs = (data) => {
    if (!data || !data.mainJson) return [];

    const skus = [];
    // Find FNSKU rows in the data (starting after header rows)
    for (let i = 5; i < data.mainJson.length; i++) {
      const row = data.mainJson[i];
      // Skip empty rows or rows without FNSKU
      if (!row || !row[4]) continue;

      // Calculate remaining quantity (expected - boxed)
      const expectedQty = parseInt(row[9] || "0");
      const boxedQty = parseInt(row[10] || "0");
      const availableQty = Math.max(0, expectedQty - boxedQty);

      // Only include SKUs that have available quantity
      if (availableQty > 0) {
        skus.push({
          id: i, // Row index (for referencing)
          sku: row[0] || "", // SKU
          title: row[1] || "", // Title
          asin: row[3] || "", // ASIN
          fnsku: row[4] || "", // FNSKU
          availableQty: availableQty, // Amount available to add to boxes
          expectedQty: expectedQty,
          boxedQty: boxedQty,
        });
      }
    }

    return skus;
  };

  // Get available box numbers
  const getAvailableBoxes = (data) => {
    if (!data || !data.mainJson) return { boxDetails: [], boxNumbers: [] };

    const boxDetails = [];
    const boxNumbers = [];
    let boxNameId = 0;

    // Find box name row index
    for (let i = 0; i < data.mainJson.length; i++) {
      if (data.mainJson[i][0] === "Name of box") {
        boxNameId = i;
        break;
      }
    }

    // If no boxes found, return empty array
    if (boxNameId === 0) return { boxDetails: [], boxNumbers: [] };

    // Start from index 1 to skip header
    for (let i = 1; i < data.mainJson[boxNameId].length; i++) {
      const boxName = data.mainJson[boxNameId][i];
      if (boxName && boxName !== "") {
        // Extract the box number from the end of the name (e.g., "P1 - B4" → 4)
        const boxNumberMatch = boxName.match(/B(\d+)$/);
        let boxNumber = null;

        if (boxNumberMatch && boxNumberMatch[1]) {
          boxNumber = parseInt(boxNumberMatch[1], 10);
          boxNumbers.push(boxNumber);
        }

        boxDetails.push({
          index: i, // Original index in the array
          name: boxName, // Full box name e.g. "P1 - B4"
          boxNumber: boxNumber, // Extracted number e.g. 4
        });
      }
    }

    return { boxDetails, boxNumbers };
  };

  // === MODIFIED: Enhanced matching function to check FNSKU, ASIN, and SKU ===
  const findMatchingProduct = (inputValue) => {
    if (!inputValue || !availableSKUs.length) return null;

    // Find matching SKU by FNSKU, ASIN, or SKU
    const matched = availableSKUs.find(
      (item) =>
        item.fnsku === inputValue || // FNSKU
        item.asin === inputValue || // ASIN
        item.sku === inputValue // SKU
    );

    return matched || null;
  };

  // === MODIFIED: Check for matching FNSKU/ASIN/SKU when input changes ===
  useEffect(() => {
    const matched = findMatchingProduct(formData.fnsku);
    setMatchedSku(matched);

    // If matched, clear error
    if (matched) {
      setErrors((prev) => ({ ...prev, fnsku: null }));
    }
  }, [formData.fnsku, availableSKUs]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });

    // Clear error for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null,
      });
    }
  };

  // Parse box numbers from input
  useEffect(() => {
    if (!formData.boxNumbers.trim() || !formData.addToMultiple) {
      setParsedBoxes([]);
      return;
    }

    try {
      const boxes = [];
      // Split by comma
      const parts = formData.boxNumbers.split(",").map((part) => part.trim());

      parts.forEach((part) => {
        if (part.includes("-")) {
          // Handle range (e.g., "5-10")
          const [start, end] = part
            .split("-")
            .map((num) => parseInt(num.trim(), 10));
          if (isNaN(start) || isNaN(end)) {
            throw new Error("Invalid range format");
          }

          // Add all numbers in the range
          for (let i = start; i <= end; i++) {
            if (!boxes.includes(i)) boxes.push(i);
          }
        } else {
          // Handle single number
          const num = parseInt(part, 10);
          if (isNaN(num)) {
            throw new Error("Invalid number");
          }

          if (!boxes.includes(num)) boxes.push(num);
        }
      });

      // Sort boxes numerically
      boxes.sort((a, b) => a - b);
      setParsedBoxes(boxes);

      // Validate that box numbers exist in available boxes
      // Now comparing against the extracted box numbers
      const invalidBoxes = boxes.filter(
        (box) =>
          !availableBoxes.boxNumbers || !availableBoxes.boxNumbers.includes(box)
      );

      if (invalidBoxes.length > 0) {
        setErrors((prev) => ({
          ...prev,
          boxNumbers: `Box numbers not found: ${invalidBoxes.join(", ")}`,
        }));
      } else {
        setErrors((prev) => ({
          ...prev,
          boxNumbers: null,
        }));
      }
    } catch (error) {
      setParsedBoxes([]);
      setErrors((prev) => ({
        ...prev,
        boxNumbers:
          'Invalid format. Use numbers separated by commas or ranges (e.g., "5-10, 12, 15-17")',
      }));
    }
  }, [formData.boxNumbers, formData.addToMultiple, availableBoxes]);

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!matchedSku) {
      newErrors.fnsku = "Please enter a valid FNSKU, ASIN, or SKU"; // === MODIFIED: Updated error message ===
    }

    if (!formData.quantity || formData.quantity < 1) {
      newErrors.quantity = "Quantity must be at least 1";
    }

    if (
      formData.addToMultiple &&
      (!formData.boxNumbers || parsedBoxes.length === 0)
    ) {
      newErrors.boxNumbers = "Please enter valid box numbers";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // Use matched SKU's ID instead of form data sku
      const skuId = matchedSku.id;
      const quantity = parseInt(formData.quantity);

      // Create a deep copy of the import data
      const updatedData = JSON.parse(JSON.stringify(importData));

      // Get the row that contains the selected SKU
      const skuRow = skuId;

      // Calculate total quantity needed
      const totalQtyNeeded = parsedBoxes.length * quantity;

      // Check if enough quantity is available
      const expectedQty = parseInt(updatedData.mainJson[skuRow][9] || "0");
      const boxedQty = parseInt(updatedData.mainJson[skuRow][10] || "0");
      const availableQty = Math.max(0, expectedQty - boxedQty);

      if (availableQty < totalQtyNeeded) {
        toast.error(
          `Not enough quantity available. Only ${availableQty} units available.`
        );
        setIsLoading(false);
        return;
      }

      // Add the quantity to each specified box
      let boxesUpdated = 0;

      // Process each box number (e.g., 4 for "P1 - B4")
      for (const boxNum of parsedBoxes) {
        // Find matching box detail with this number
        const boxDetail = availableBoxes.boxDetails.find(
          (detail) => detail.boxNumber === boxNum
        );

        if (!boxDetail) continue; // Skip if not found

        const boxIndex = boxDetail.index; // Get the actual array index

        // If the cell is empty, set it to the quantity, otherwise add to it
        if (
          !updatedData.mainJson[skuRow][boxIndex] ||
          updatedData.mainJson[skuRow][boxIndex] === ""
        ) {
          updatedData.mainJson[skuRow][boxIndex] = quantity.toString();
        } else {
          const currentQty = parseInt(updatedData.mainJson[skuRow][boxIndex]);
          updatedData.mainJson[skuRow][boxIndex] = (
            currentQty + quantity
          ).toString();
        }

        boxesUpdated++;
      }

      // Update the boxed quantity
      updatedData.mainJson[skuRow][10] = (
        boxedQty +
        boxesUpdated * quantity
      ).toString();

      // Save the updated data
      await saveImportData(updatedData, shipmentID);

      toast.success(
        `Added ${quantity} units of ${
          updatedData.mainJson[skuRow][0] || "SKU"
        } to ${boxesUpdated} boxes`
      );

      // Redirect to box summary
      navigate("/boxsummary0", { state: { shipmentID } });
    } catch (error) {
      console.error("Error adding to multiple boxes:", error);
      toast.error("Failed to add items to boxes: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // UI rendering
  return (
    <Container className="py-4">
      <Card className="shadow-sm">
        <Card.Header className="bg-primary text-white">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              <BoxSeamFill className="me-2" />
              Add to Multiple Boxes
            </h5>
            {shipmentID && (
              <small className="opacity-75">Shipment: {shipmentID}</small>
            )}
          </div>
        </Card.Header>

        <Card.Body>
          {/* Buttons */}
          <div className="d-flex justify-content-between mb-4">
            {/* Left-aligned Previous button */}
            <Button
              variant="outline-secondary"
              onClick={() => navigate(-1)}
              disabled={isLoading}
              className="d-flex align-items-center"
            >
              Previous
            </Button>

            {/* Right-aligned action buttons */}
            <div className="d-flex gap-2">
              <Button
                variant="outline-primary"
                onClick={() =>
                  navigate("/boxsummary0", { state: { shipmentID } })
                }
                disabled={isLoading}
              >
                BoxSummary
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary mb-3" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <div>Loading data...</div>
            </div>
          ) : (
            <Form onSubmit={handleSubmit}>
              {/* === MODIFIED: FNSKU/ASIN/SKU Input Field === */}
              <Form.Group className="mb-3">
                <Form.Label>
                  <Upc className="me-2" /> Enter FNSKU/ASIN/Merchant SKU
                </Form.Label>
                <Form.Control
                  type="text"
                  name="fnsku"
                  placeholder="Enter FNSKU (e.g., X004B0UKXN), ASIN, or Merchant SKU"
                  value={formData.fnsku}
                  onChange={handleInputChange}
                  isInvalid={!!errors.fnsku}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.fnsku}
                </Form.Control.Feedback>
              </Form.Group>

              {/* === MODIFIED: Display matched SKU info === */}
              {formData.fnsku && (
                <>
                  {matchedSku ? (
                    <Alert variant="info" className="mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <strong>FNSKU: {matchedSku.fnsku}</strong>
                        <Badge bg="success">
                          Available: {matchedSku.availableQty}
                        </Badge>
                      </div>
                      <div>
                        <strong>Title:</strong> {matchedSku.title}
                      </div>
                      <div>
                        <strong>SKU:</strong> {matchedSku.sku}
                      </div>
                      <div>
                        <strong>ASIN:</strong> {matchedSku.asin}
                      </div>
                      <div className="d-flex justify-content-between mt-2">
                        <div>
                          <strong>Expected:</strong> {matchedSku.expectedQty}
                        </div>
                        <div>
                          <strong>Boxed:</strong> {matchedSku.boxedQty}
                        </div>
                      </div>
                      {/* === MODIFIED: Show which field was matched === */}
                      <div className="mt-2">
                        <small className="text-muted">
                          Matched by:{" "}
                          {matchedSku.fnsku === formData.fnsku
                            ? "FNSKU"
                            : matchedSku.asin === formData.fnsku
                            ? "ASIN"
                            : matchedSku.sku === formData.fnsku
                            ? "SKU"
                            : "Unknown"}
                        </small>
                      </div>
                    </Alert>
                  ) : (
                    <Alert variant="warning" className="mb-3">
                      <InfoCircleFill className="me-2" />
                      No matching FNSKU, ASIN, or SKU found. Please enter a
                      valid identifier.
                    </Alert>
                  )}
                </>
              )}

              {/* Quantity Input */}
              <Form.Group className="mb-3">
                <Form.Label>
                  <Calculator className="me-2" /> Quantity
                </Form.Label>
                <Form.Control
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  min="1"
                  isInvalid={!!errors.quantity}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.quantity}
                </Form.Control.Feedback>
              </Form.Group>

              {/* Add to Multiple Boxes Checkbox */}
              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  name="addToMultiple"
                  label="Add to Multiple Boxes"
                  checked={formData.addToMultiple}
                  onChange={handleInputChange}
                />
              </Form.Group>

              {/* Box Numbers Input */}
              {formData.addToMultiple && (
                <Form.Group className="mb-3">
                  <Form.Label>Box Numbers</Form.Label>
                  <Form.Control
                    type="text"
                    name="boxNumbers"
                    placeholder="e.g., 1-5, 8, 10-12"
                    value={formData.boxNumbers}
                    onChange={handleInputChange}
                    isInvalid={!!errors.boxNumbers}
                  />
                  <Form.Text className="text-muted">
                    You can specify a range (e.g., "5-10") or individual box
                    numbers separated by commas.
                  </Form.Text>
                  <Form.Control.Feedback type="invalid">
                    {errors.boxNumbers}
                  </Form.Control.Feedback>
                </Form.Group>
              )}

              {/* Preview of parsed boxes */}
              {parsedBoxes.length > 0 && (
                <Alert variant="info" className="mb-3">
                  <strong>Will add to {parsedBoxes.length} boxes:</strong>
                  <div className="mt-2">
                    {parsedBoxes.map((boxNum) => {
                      const boxDetail = availableBoxes.boxDetails?.find(
                        (detail) => detail.boxNumber === boxNum
                      );
                      return (
                        <Badge key={boxNum} bg="secondary" className="me-1">
                          {boxDetail?.name || `Box ${boxNum}`}
                        </Badge>
                      );
                    })}
                  </div>
                </Alert>
              )}

              {/* Buttons */}
              <div className="d-flex justify-content-end gap-2">
                <Button
                  variant="outline-secondary"
                  onClick={() =>
                    navigate("/boxsummary", { state: { shipmentID } })
                  }
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={
                    isLoading || Object.values(errors).some((error) => error)
                  }
                >
                  <Plus className="me-2" />
                  {isLoading ? "Processing..." : "Add Item"}
                </Button>
              </div>
            </Form>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default MultiAdd;
