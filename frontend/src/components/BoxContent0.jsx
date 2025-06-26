import React, { useState, useRef, useEffect } from "react"; // === MODIFIED/NEW ===
import {
  Card,
  Button,
  Modal,
  Form,
  Badge,
  ButtonGroup,
  Tabs,
  Tab,
  Row,
  Col,
  InputGroup,
} from "react-bootstrap";
import {
  BoxSeam,
  PlusLg,
  TrashFill,
  BoxArrowInLeft,
  Inbox,
  BoxArrowInDown,
  Upc,
  InfoCircleFill,
  Check2,
  Calculator,
  PencilFill,
} from "react-bootstrap-icons";

const BoxContent0 = ({
  box,
  boxName,
  addItem,
  reduceItem,
  availablefnskus,
  error,
  selectId,
  removeFNSKU,
  importData,
}) => {
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Add mode state for tabs
  const [addMode, setAddMode] = useState("single"); // "single" or "multi"

  // Form data for single add
  const [formData, setFormData] = useState({
    fnsku: "",
    quantity: 1,
  });

  // Multi add state
  const [multiRows, setMultiRows] = useState([{ fnsku: "" }]);
  const [multiQty, setMultiQty] = useState(1);

  // Edit state
  const [editingItem, setEditingItem] = useState(null);
  const [newQuantity, setNewQuantity] = useState("");
  const [editError, setEditError] = useState("");

  // === NEW: Ref for quantity input ===
  const qtyInputRef = useRef(null);

  // Handle opening the add modal
  const handleShowAddModal = () => {
    setShowAddModal(true);
  };

  // Reset all add forms on close
  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setFormData({ fnsku: "", quantity: 1 });
    setMultiRows([{ fnsku: "" }]);
    setMultiQty(1);
    setAddMode("single");
  };

  // Open the edit modal for a specific item
  const handleShowEditModal = (item) => {
    const fnskuInfo = availablefnskus.find((fnsku) => {
      const fnskuRow = fnsku[0];
      return importData.mainJson[fnskuRow][4] === item.fnsku;
    });

    if (fnskuInfo) {
      const fnskuRow = fnskuInfo[0];
      const row = importData.mainJson[fnskuRow];
      const expectedQty = parseInt(row[9] || "0");
      const boxedQty = parseInt(row[10] || "0");
      const currentQty = parseInt(item.quantity || "0");

      setEditingItem({
        ...item,
        expectedQty,
        boxedQty,
        availableQty: fnskuInfo[1],
        fnskuRow,
      });

      setNewQuantity(currentQty.toString());
      setShowEditModal(true);
    }
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingItem(null);
    setNewQuantity("");
    setEditError("");
  };

  // Handle form input changes for add modal
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Multi add handlers
  const handleMultiFnskuChange = (idx, value) => {
    setMultiRows(
      multiRows.map((row, i) => (i === idx ? { ...row, fnsku: value } : row))
    );
  };
  const handleAddMultiRow = () => setMultiRows([...multiRows, { fnsku: "" }]);
  const handleRemoveMultiRow = (idx) =>
    setMultiRows(multiRows.filter((_, i) => i !== idx));

  // Handle quantity change in edit modal
  const handleQuantityChange = (e) => {
    setNewQuantity(e.target.value);
    setEditError("");
  };

  const handleSaveEdit = () => {
    if (!editingItem) return;
    const newQty = parseInt(newQuantity);
    const currentQty = parseInt(editingItem.quantity);
    if (isNaN(newQty) || newQty < 0) {
      setEditError("Please enter a valid quantity");
      return;
    }
    const unboxedQty = editingItem.expectedQty - editingItem.boxedQty;
    const maxAllowed = currentQty + unboxedQty;
    if (newQty > maxAllowed) {
      setEditError(
        `Maximum allowed quantity is ${maxAllowed} (${currentQty} current + ${unboxedQty} available)`
      );
      return;
    }
    if (newQty === 0) {
      removeFNSKU(editingItem.fnsku, editingItem.quantity);
      handleCloseEditModal();
      return;
    }
    if (newQty === currentQty) {
      handleCloseEditModal();
      return;
    }
    if (newQty < currentQty) {
      if (newQty > 0) {
        const difference = currentQty - newQty;
        const success = reduceItem(editingItem.fnskuRow, difference);
        if (success) handleCloseEditModal();
      } else {
        handleCloseEditModal();
      }
    } else if (newQty > currentQty) {
      const difference = newQty - currentQty;
      const success = addItem(editingItem.fnskuRow, difference);
      if (success) handleCloseEditModal();
    }
  };

  // === MODIFIED: Enhanced matching function to check FNSKU, ASIN, and SKU ===
  const findMatchingProduct = (inputValue) => {
    for (const fnsku of availablefnskus) {
      const fnskuRow = fnsku[0];
      const row = importData.mainJson[fnskuRow];
      if (
        row[4] === inputValue || // FNSKU
        row[3] === inputValue || // ASIN
        row[0] === inputValue // SKU
      ) {
        return { fnskuRow, row, fnsku };
      }
    }
    return null;
  };

  // === NEW: Effect to auto-focus quantity when a valid match is found ===
  useEffect(() => {
    if (!showAddModal) return;
    const matchingProduct = findMatchingProduct(formData.fnsku);
    if (matchingProduct && qtyInputRef.current) {
      qtyInputRef.current.focus();
    }
    // Only run when fnsku changes or modal opens
    // eslint-disable-next-line
  }, [formData.fnsku, showAddModal]); // === MODIFIED/NEW ===

  // Handle form submission for single add
  const handleSubmit = () => {
    const matchingProduct = findMatchingProduct(formData.fnsku);
    if (matchingProduct) {
      let status = addItem(
        matchingProduct.fnskuRow,
        parseInt(formData.quantity)
      );
      if (status) handleCloseAddModal();
    } else {
      console.error("No matching FNSKU/ASIN/SKU found");
    }
  };

  // Handle submit for multi add
  const handleMultiSubmit = () => {
    multiRows.forEach((row) => {
      const matchingProduct = findMatchingProduct(row.fnsku);
      if (matchingProduct && row.fnsku) {
        addItem(matchingProduct.fnskuRow, parseInt(multiQty));
      }
    });
    handleCloseAddModal();
  };

  return (
    <Card className="shadow-sm h-100">
      <Card.Header
        className="bg-gradient-dark d-flex justify-content-between align-items-center py-3"
        style={{
          background: "linear-gradient(to right, #343a40, #495057)",
        }}
      >
        <h5 className="mb-0 text-white d-flex align-items-center">
          <BoxSeam className="me-2" />
          {boxName || "No Box Selected"}
        </h5>
        {box && box.length > 0 && selectId > 0 && (
          <div className="text-light small mt-1">
            <Badge bg="light" text="dark" className="me-2">
              {
                box.filter((item) => item.quantity && item.quantity !== "")
                  .length
              }{" "}
              Items
            </Badge>
            <Badge bg="info" className="me-2">
              {box.reduce((total, item) => {
                const qty = parseInt(item.quantity) || 0;
                return total + qty;
              }, 0)}{" "}
              Total Quantity
            </Badge>
          </div>
        )}
        {selectId > 0 && (
          <Button
            variant="light"
            size="sm"
            className="d-flex align-items-center"
            onClick={handleShowAddModal}
          >
            <PlusLg className="me-1" /> Add Item
          </Button>
        )}
      </Card.Header>
      <Card.Body>
        {selectId <= 0 ? (
          <div className="text-center py-5">
            <BoxArrowInLeft size={48} className="text-muted mb-3" />
            <h5 className="text-muted">
              Select a box from the list to view its contents
            </h5>
          </div>
        ) : box.length === 0 ||
          !box.some((detail) => detail.quantity !== "") ? (
          <div className="text-center py-5">
            <Inbox size={48} className="text-muted mb-3" />
            <h5 className="text-muted">This box is empty</h5>
            <p className="text-muted">
              Click "Add Item" to add contents to this box
            </p>
          </div>
        ) : (
          <table className="table table-hover">
            <thead className="table-light text-center">
              <tr>
                <th>SKU</th>
                <th>Title</th>
                <th>ASIN</th>
                <th>FNSKU</th>
                <th>Quantity</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {box.map(
                (detail, index) =>
                  detail.quantity !== "" && (
                    <tr key={index} className="align-middle">
                      <td>
                        <span className="fw-semibold">{detail.sku}</span>
                      </td>
                      <td>
                        <span className="fw-semibold">{detail.title}</span>
                      </td>
                      <td>
                        <span className="fw-semibold">{detail.asin}</span>
                      </td>
                      <td>
                        <span className="fw-semibold">{detail.fnsku}</span>
                      </td>
                      <td className="text-center">
                        <Badge bg="dark" pill className="px-3 py-2">
                          {detail.quantity}
                        </Badge>
                      </td>
                      <td className="text-center">
                        <ButtonGroup size="sm">
                          <Button
                            variant="light"
                            className="d-inline-flex align-items-center justify-content-center"
                            onClick={() => handleShowEditModal(detail)}
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "50% 0 0 50%",
                            }}
                          >
                            <PencilFill className="text-primary" />
                          </Button>
                          <Button
                            variant="light"
                            className="d-inline-flex align-items-center justify-content-center"
                            onClick={() =>
                              removeFNSKU(detail.fnsku, detail.quantity)
                            }
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "0 50% 50% 0",
                            }}
                          >
                            <TrashFill className="text-danger" />
                          </Button>
                        </ButtonGroup>
                      </td>
                    </tr>
                  )
              )}
            </tbody>
          </table>
        )}
      </Card.Body>

      {/* Add Item Modal with Tabs */}
      <Modal
        show={showAddModal}
        onHide={handleCloseAddModal}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <BoxArrowInDown className="me-2" /> Add Item to {boxName}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Tabs
            id="add-item-tabs"
            activeKey={addMode}
            onSelect={(k) => setAddMode(k)}
            className="mb-3"
          >
            {/* Single Add Tab */}
            <Tab eventKey="single" title="Single Add">
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <Upc className="me-2" /> Enter FNSKU/ASIN/Merchant SKU
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter FNSKU (e.g., X004B0UKXN), ASIN, or Merchant SKU"
                    value={formData.fnsku}
                    onChange={(e) => {
                      const enteredValue = e.target.value;
                      setFormData({
                        ...formData,
                        fnsku: enteredValue,
                      });
                    }}
                  />
                </Form.Group>
                {formData.fnsku && (
                  <>
                    {(() => {
                      const matchingProduct = findMatchingProduct(
                        formData.fnsku
                      );
                      return matchingProduct ? (
                        <div className="alert alert-info mb-3">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <strong>FNSKU: {matchingProduct.row[4]}</strong>
                            <Badge bg="success">
                              Available: {matchingProduct.fnsku[1]}
                            </Badge>
                          </div>
                          <div>
                            <strong>Title:</strong> {matchingProduct.row[1]}
                          </div>
                          <div>
                            <strong>SKU:</strong> {matchingProduct.row[0]}
                          </div>
                          <div>
                            <strong>ASIN:</strong> {matchingProduct.row[3]}
                          </div>
                          <div className="d-flex justify-content-between mt-2">
                            <div>
                              <strong>Expected:</strong>{" "}
                              {parseInt(matchingProduct.row[9] || "0")}
                            </div>
                            <div>
                              <strong>Boxed:</strong>{" "}
                              {parseInt(matchingProduct.row[10] || "0")}
                            </div>
                          </div>
                          <div className="mt-2">
                            <small className="text-muted">
                              Matched by:{" "}
                              {matchingProduct.row[4] === formData.fnsku
                                ? "FNSKU"
                                : matchingProduct.row[3] === formData.fnsku
                                ? "ASIN"
                                : matchingProduct.row[0] === formData.fnsku
                                ? "SKU"
                                : "Unknown"}
                            </small>
                          </div>
                        </div>
                      ) : (
                        <div className="alert alert-warning">
                          <InfoCircleFill className="me-2" />
                          No matching FNSKU, ASIN, or SKU found. Please enter a
                          valid identifier.
                        </div>
                      );
                    })()}
                  </>
                )}
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
                    ref={qtyInputRef} // === MODIFIED/NEW: Attach ref ===
                  />
                </Form.Group>
                {error && <div className="alert alert-danger">{error}</div>}
              </Form>
            </Tab>

            {/* Multi Add Tab */}
            <Tab eventKey="multi" title="Multi Add">
              <Form>
                <Row className="align-items-center mb-2">
                  {/* === MODIFIED: Updated column header === */}
                  <Col xs={5}>
                    <strong>FNSKU/ASIN/SKU</strong>
                  </Col>
                  <Col xs={3}>
                    <strong>Total</strong>
                  </Col>
                  <Col xs={3}>
                    <strong>Unboxed</strong>
                  </Col>
                  <Col xs={1}></Col>
                </Row>
                {multiRows.map((row, idx) => {
                  // === MODIFIED: Enhanced info lookup for multi add ===
                  const matchingProduct = findMatchingProduct(row.fnsku);
                  let ext = "";
                  let av = "";

                  if (matchingProduct) {
                    ext = matchingProduct.row[9]; // Expected quantity
                    av =
                      parseInt(matchingProduct.row[9] || "0") -
                      parseInt(matchingProduct.row[10] || "0"); // Unboxed quantity
                  }

                  return (
                    <Row className="align-items-center mb-2" key={idx}>
                      <Col xs={5}>
                        <InputGroup>
                          <Form.Control
                            type="text"
                            placeholder="FNSKU/ASIN/SKU"
                            value={row.fnsku}
                            onChange={(e) =>
                              handleMultiFnskuChange(idx, e.target.value)
                            }
                          />
                          {multiRows.length > 1 && (
                            <Button
                              variant="outline-danger"
                              onClick={() => handleRemoveMultiRow(idx)}
                              size="sm"
                              tabIndex={-1}
                            >
                              <TrashFill />
                            </Button>
                          )}
                        </InputGroup>
                      </Col>
                      <Col xs={3}>{ext}</Col>
                      <Col xs={3}>{av}</Col>
                      <Col xs={1}>
                        {idx === multiRows.length - 1 && (
                          <Button
                            variant="outline-primary"
                            onClick={handleAddMultiRow}
                            size="sm"
                            tabIndex={-1}
                          >
                            <PlusLg />
                          </Button>
                        )}
                      </Col>
                    </Row>
                  );
                })}
                <Form.Group className="mb-3 mt-3">
                  <Form.Label>
                    <Calculator className="me-2" /> Quantity for All
                  </Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    value={multiQty}
                    onChange={(e) => setMultiQty(e.target.value)}
                  />
                </Form.Group>
                {error && <div className="alert alert-danger">{error}</div>}
              </Form>
            </Tab>
          </Tabs>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="outline-secondary" onClick={handleCloseAddModal}>
            Cancel
          </Button>
          {addMode === "single" ? (
            <Button
              variant="success"
              className="d-flex align-items-center"
              onClick={handleSubmit}
              disabled={!formData.fnsku || formData.quantity < 1}
            >
              <Check2 className="me-2" /> Add Item
            </Button>
          ) : (
            <Button
              variant="success"
              className="d-flex align-items-center"
              onClick={handleMultiSubmit}
              disabled={
                multiRows.length === 0 ||
                multiRows.some((row) => !row.fnsku) ||
                multiQty < 1
              }
            >
              <Check2 className="me-2" /> Add All Items
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* Edit Quantity Modal (unchanged) */}
      <Modal show={showEditModal} onHide={handleCloseEditModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <PencilFill className="me-2" /> Edit Item Quantity
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editingItem && (
            <Form>
              <div className="alert alert-info mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <strong>FNSKU: {editingItem.fnsku}</strong>
                  <Badge bg="success">
                    Available: {editingItem.availableQty}
                  </Badge>
                </div>
                <div>
                  <strong>Title:</strong> {editingItem.title}
                </div>
                <div>
                  <strong>SKU:</strong> {editingItem.sku}
                </div>
                <div>
                  <strong>ASIN:</strong> {editingItem.asin}
                </div>
                <div className="d-flex justify-content-between mt-2">
                  <div>
                    <strong>Expected:</strong> {editingItem.expectedQty}
                  </div>
                  <div>
                    <strong>Boxed:</strong> {editingItem.boxedQty}
                  </div>
                </div>
              </div>

              <Form.Group className="mb-3">
                <Form.Label>
                  Current Quantity: <strong>{editingItem.quantity}</strong>
                </Form.Label>
                <Form.Control
                  type="number"
                  value={newQuantity}
                  onChange={handleQuantityChange}
                  min="0"
                  isInvalid={!!editError}
                />
                <Form.Text muted>
                  Enter 0 to remove the item from this box
                </Form.Text>
                <Form.Control.Feedback type="invalid">
                  {editError}
                </Form.Control.Feedback>
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="outline-secondary" onClick={handleCloseEditModal}>
            Cancel
          </Button>
          <Button
            variant="primary"
            className="d-flex align-items-center"
            onClick={handleSaveEdit}
          >
            <Check2 className="me-2" /> Update Quantity
          </Button>
        </Modal.Footer>
      </Modal>
    </Card>
  );
};

export default BoxContent0;
