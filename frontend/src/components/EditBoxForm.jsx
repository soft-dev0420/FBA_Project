// EditBoxForm.jsx
import React, { useState, useEffect } from "react";
import { Form, Button } from "react-bootstrap";

const EditBoxForm = ({ box, onSubmit, onCancel }) => {
  const [boxData, setBoxData] = useState({
    boxName: "",
    weight: "",
    width: "",
    length: "",
    height: "",
  });

  useEffect(() => {
    // Reset form to prevent stale data
    setBoxData({
      boxName: "",
      weight: "",
      width: "",
      length: "",
      height: "",
    });

    // Extract data from the box string if available
    if (box) {
      // Get box name independently - covers both formats
      // This will match everything before the colon
      const nameMatch = box.match(/^(.*?):/);
      if (nameMatch) {
        // Always update the box name if we can extract it
        setBoxData((prev) => ({
          ...prev,
          boxName: nameMatch[1].trim(),
        }));
      }

      // Try to get weight and dimensions if available
      const weightMatch = box.match(/(\d+)\(lb\)/);
      const dimensionsMatch = box.match(/(\d+) x (\d+) x (\d+)\(inch\)/);

      // Update weight if available
      if (weightMatch) {
        setBoxData((prev) => ({
          ...prev,
          weight: weightMatch[1], //
        }));
      }

      // Update dimensions if available
      if (dimensionsMatch) {
        setBoxData((prev) => ({
          ...prev,
          width: dimensionsMatch[1],
          length: dimensionsMatch[2],
          height: dimensionsMatch[3],
        }));
      }
    }
  }, [box]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBoxData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(boxData);
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group className="mb-3">
        <Form.Label>Box Name</Form.Label>
        <Form.Control
          type="text"
          name="name"
          value={boxData.boxName}
          onChange={handleChange}
          disabled
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Weight (lb)</Form.Label>
        <Form.Control
          type="number"
          name="weight"
          value={boxData.weight}
          onChange={handleChange}
          required
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Width (inch)</Form.Label>
        <Form.Control
          type="number"
          name="width"
          value={boxData.width}
          onChange={handleChange}
          required
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Length (inch)</Form.Label>
        <Form.Control
          type="number"
          name="length"
          value={boxData.length}
          onChange={handleChange}
          required
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Height (inch)</Form.Label>
        <Form.Control
          type="number"
          name="height"
          value={boxData.height}
          onChange={handleChange}
          required
        />
      </Form.Group>

      <div className="d-flex justify-content-end gap-2">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" type="submit">
          Save Changes
        </Button>
      </div>
    </Form>
  );
};

export default EditBoxForm;
