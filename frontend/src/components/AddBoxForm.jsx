// AddBoxForm.jsx
import React, { useEffect, useState } from "react";
import { Form, Button, Alert, Badge, ListGroup } from "react-bootstrap";
import { getImportData } from "../utils/storage0";
import { Check2Circle, ArrowClockwise, Plus } from "react-bootstrap-icons";

const AddBoxForm = ({ onSubmit, onCancel, shipmentID }) => {
  const [boxData, setBoxData] = useState({
    boxName: "",
    weight: "",
    width: "",
    length: "",
    height: "",
  });

  const [multiBoxData, setMultiBoxData] = useState({
    isMultiBox: false,
    boxCount: 1,
  });

  const [nextBoxNumber, setNextBoxNumber] = useState(1);
  const [previewBoxes, setPreviewBoxes] = useState([]);
  const [deletedBoxes, setDeletedBoxes] = useState([]);
  const [selectedDeletedBox, setSelectedDeletedBox] = useState(null);
  const [showNewBoxForm, setShowNewBoxForm] = useState(false);

  const analyzeBoxData = () => {
    getImportData(shipmentID).then((data) => {
      if (!data || !data.mainJson) {
        // Default to B1 if no data
        setBoxData((prev) => ({
          ...prev,
          boxName: "P1 - B1",
        }));
        setNextBoxNumber(1);
        setDeletedBoxes([]);
        setShowNewBoxForm(true);
        return;
      }

      // Find the box name row
      let boxNameId = 0;
      for (let i = 0; i < data.mainJson.length; i++) {
        if (data.mainJson[i][0] === "Name of box") {
          boxNameId = i;
          break;
        }
      }

      // If no box name row found, default to B1
      if (boxNameId === 0) {
        setBoxData((prev) => ({
          ...prev,
          boxName: "P1 - B1",
        }));
        setNextBoxNumber(1);
        setDeletedBoxes([]);
        setShowNewBoxForm(true);
        return;
      }

      // Find deleted boxes and existing box numbers
      const boxNumbers = [];
      const deleted = [];

      for (let i = 1; i < data.mainJson[boxNameId].length; i++) {
        const boxName = data.mainJson[boxNameId][i];
        if (boxName && boxName !== "") {
          // Extract the numeric part after "B"
          const match = boxName.match(/B(\d+)$/);
          if (match && match[1]) {
            boxNumbers.push(parseInt(match[1], 10));
          }
        } else if (i > 11) {
          // Only consider deleted boxes after index 11
          // This is a deleted box slot
          deleted.push({
            index: i,
            suggestedName: `P1 - B${i - 11}`, // Calculate what the box name should be
          });
        }
      }

      // Find the highest box number
      const highestBoxNumber =
        boxNumbers.length > 0 ? Math.max(...boxNumbers) : 0;
      const nextNumber = highestBoxNumber + 1;
      setNextBoxNumber(nextNumber);

      // Set deleted boxes
      setDeletedBoxes(deleted);

      // If there are deleted boxes, don't show new box form initially
      setShowNewBoxForm(deleted.length === 0);

      // Set the new box name for when creating new boxes
      setBoxData((prev) => ({
        ...prev,
        boxName: `P1 - B${nextNumber}`,
      }));
    });
  };

  useEffect(() => {
    analyzeBoxData();
  }, [shipmentID]);

  // Update preview boxes when multiBoxData changes
  useEffect(() => {
    if (
      multiBoxData.isMultiBox &&
      multiBoxData.boxCount > 0 &&
      showNewBoxForm
    ) {
      const boxes = [];
      for (let i = 0; i < multiBoxData.boxCount; i++) {
        boxes.push(`P1 - B${nextBoxNumber + i}`);
      }
      setPreviewBoxes(boxes);
    } else {
      setPreviewBoxes([]);
    }
  }, [multiBoxData, nextBoxNumber, showNewBoxForm]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBoxData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleMultiBoxChange = (e) => {
    const { name, value, type, checked } = e.target;
    setMultiBoxData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : parseInt(value) || 1,
    }));
  };

  const handleRestoreDeletedBox = () => {
    if (!selectedDeletedBox) return;

    // Create restored box data
    const restoredBoxData = {
      ...boxData,
      boxName: selectedDeletedBox.suggestedName,
      isRestoration: true,
      restorationIndex: selectedDeletedBox.index,
    };

    onSubmit(restoredBoxData);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (multiBoxData.isMultiBox && showNewBoxForm) {
      // Create multiple boxes
      const boxesToCreate = [];
      for (let i = 0; i < multiBoxData.boxCount; i++) {
        boxesToCreate.push({
          boxName: `P1 - B${nextBoxNumber + i}`,
          weight: boxData.weight,
          width: boxData.width,
          length: boxData.length,
          height: boxData.height,
        });
      }
      onSubmit({ multipleBoxes: boxesToCreate });
    } else if (showNewBoxForm) {
      // Create single box
      onSubmit(boxData);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      {/* Show deleted boxes first if any exist */}
      {deletedBoxes.length > 0 && !showNewBoxForm && (
        <div className="mb-4">
          <Alert variant="info">
            <ArrowClockwise className="me-2" />
            <strong>Restore Deleted Boxes</strong>
            <p className="mb-3 mt-2">
              You have {deletedBoxes.length} deleted box slot(s). Please restore
              them before creating new boxes.
            </p>
          </Alert>

          <Form.Label className="fw-bold">
            Select a deleted box to restore:
          </Form.Label>
          <ListGroup className="mb-3">
            {deletedBoxes.map((deletedBox, index) => (
              <ListGroup.Item
                key={index}
                action
                active={selectedDeletedBox?.index === deletedBox.index}
                onClick={() => setSelectedDeletedBox(deletedBox)}
                className="d-flex justify-content-between align-items-center"
              >
                <span>{deletedBox.suggestedName}</span>
                <Badge bg="warning">Deleted Slot</Badge>
              </ListGroup.Item>
            ))}
          </ListGroup>

          {selectedDeletedBox && (
            <div className="border rounded p-3 bg-light mb-3">
              <h6 className="mb-3">
                Restore Box: {selectedDeletedBox.suggestedName}
              </h6>

              {/* Weight */}
              {/* <Form.Group className="mb-3">
                <Form.Label>Weight (lb)</Form.Label>
                <Form.Control
                  type="number"
                  name="weight"
                  value={boxData.weight}
                  onChange={handleChange}
                  step="0.1"
                />
              </Form.Group> */}

              {/* Dimensions */}
              {/* <div className="row">
                <div className="col-md-4">
                  <Form.Group className="mb-3">
                    <Form.Label>Width (inch)</Form.Label>
                    <Form.Control
                      type="number"
                      name="width"
                      value={boxData.width}
                      onChange={handleChange}
                      step="0.1"
                    />
                  </Form.Group>
                </div>
                <div className="col-md-4">
                  <Form.Group className="mb-3">
                    <Form.Label>Length (inch)</Form.Label>
                    <Form.Control
                      type="number"
                      name="length"
                      value={boxData.length}
                      onChange={handleChange}
                      step="0.1"
                    />
                  </Form.Group>
                </div>
                <div className="col-md-4">
                  <Form.Group className="mb-3">
                    <Form.Label>Height (inch)</Form.Label>
                    <Form.Control
                      type="number"
                      name="height"
                      value={boxData.height}
                      onChange={handleChange}
                      step="0.1"
                    />
                  </Form.Group>
                </div>
              </div> */}
            </div>
          )}

          <div className="d-flex justify-content-between">
            {/* <Button
              variant="outline-secondary"
              onClick={() => setShowNewBoxForm(true)}
            >
              Skip & Create New Box
            </Button> */}
            <Button
              variant="success"
              onClick={handleRestoreDeletedBox}
              disabled={!selectedDeletedBox}
            >
              <ArrowClockwise className="me-2" />
              Restore Box
            </Button>
          </div>
        </div>
      )}

      {/* Show new box creation form */}
      {showNewBoxForm && (
        <div>
          {deletedBoxes.length > 0 && (
            <Alert variant="success" className="mb-3">
              <Check2Circle className="me-2" />
              All deleted boxes restored! Now you can create new boxes.
            </Alert>
          )}

          {/* Multi-Box Checkbox */}
          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              id="add-multiple-boxes"
              name="isMultiBox"
              label="Add Multiple Boxes"
              checked={multiBoxData.isMultiBox}
              onChange={handleMultiBoxChange}
            />
          </Form.Group>

          {/* Number of Boxes Input */}
          {multiBoxData.isMultiBox && (
            <Form.Group className="mb-3">
              <Form.Label>Number of Boxes</Form.Label>
              <Form.Control
                type="number"
                name="boxCount"
                value={multiBoxData.boxCount}
                onChange={handleMultiBoxChange}
                min="1"
                max="200"
              />
              <Form.Text className="text-muted">
                Enter the number of boxes you want to add (1-100)
              </Form.Text>
            </Form.Group>
          )}

          {/* Preview of boxes to be created */}
          {previewBoxes.length > 0 && (
            <Alert variant="info" className="mb-3">
              <div className="d-flex align-items-center mb-2">
                <Check2Circle className="me-2" />
                <strong>Will create {previewBoxes.length} boxes:</strong>
              </div>
              <div className="d-flex flex-wrap gap-1">
                {previewBoxes.map((boxName, index) => (
                  <Badge bg="secondary" key={index} className="me-1 mb-1">
                    {boxName}
                  </Badge>
                ))}
              </div>
            </Alert>
          )}

          {/* Box Name */}
          <Form.Group className="mb-3">
            <Form.Label>Box Name</Form.Label>
            <Form.Control
              type="text"
              name="boxName"
              value={
                multiBoxData.isMultiBox
                  ? `P1 - B${nextBoxNumber}`
                  : boxData.boxName
              }
              onChange={handleChange}
              disabled
            />
            {multiBoxData.isMultiBox && (
              <Form.Text className="text-muted">
                Starting box name (others will be numbered sequentially)
              </Form.Text>
            )}
          </Form.Group>

          {/* Weight */}
          {/* <Form.Group className="mb-3">
            <Form.Label>Weight (lb)</Form.Label>
            <Form.Control
              type="number"
              name="weight"
              value={boxData.weight}
              onChange={handleChange}
              step="0.1"
            />
            {multiBoxData.isMultiBox && (
              <Form.Text className="text-muted">
                This weight will be applied to all boxes
              </Form.Text>
            )}
          </Form.Group> */}

          {/* Dimensions */}
          {/* <div className="row">
            <div className="col-md-4">
              <Form.Group className="mb-3">
                <Form.Label>Width (inch)</Form.Label>
                <Form.Control
                  type="number"
                  name="width"
                  value={boxData.width}
                  onChange={handleChange}
                  step="0.1"
                />
              </Form.Group>
            </div>
            <div className="col-md-4">
              <Form.Group className="mb-3">
                <Form.Label>Length (inch)</Form.Label>
                <Form.Control
                  type="number"
                  name="length"
                  value={boxData.length}
                  onChange={handleChange}
                  step="0.1"
                />
              </Form.Group>
            </div>
            <div className="col-md-4">
              <Form.Group className="mb-3">
                <Form.Label>Height (inch)</Form.Label>
                <Form.Control
                  type="number"
                  name="height"
                  value={boxData.height}
                  onChange={handleChange}
                  step="0.1"
                />
              </Form.Group>
            </div>
          </div> */}

          {multiBoxData.isMultiBox && (
            <Form.Text className="text-muted mb-3 d-block">
              All boxes will have the same dimensions and weight
            </Form.Text>
          )}

          {/* Buttons */}
          <div className="d-flex justify-content-end">
            <Button
              variant="outline-secondary"
              onClick={onCancel}
              className="me-2"
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              <Plus className="me-2" />
              {multiBoxData.isMultiBox
                ? `Create ${multiBoxData.boxCount} Boxes`
                : "Create Box"}
            </Button>
          </div>
        </div>
      )}

      {/* Show buttons for deleted box restoration flow */}
      {deletedBoxes.length > 0 && !showNewBoxForm && !selectedDeletedBox && (
        <div className="d-flex justify-content-end">
          <Button
            variant="outline-secondary"
            onClick={onCancel}
            className="me-2"
          >
            Cancel
          </Button>
          {/* <Button
            variant="outline-primary"
            onClick={() => setShowNewBoxForm(true)}
          >
            Skip & Create New Box
          </Button> */}
        </div>
      )}
    </Form>
  );
};

export default AddBoxForm;
