import React, { useEffect, useState } from "react";
import { Button, Modal, Table, Badge, Form } from "react-bootstrap";
import {
  getAllShipments,
  deleteShipment,
  saveImportData,
} from "../utils/storage0";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import {
  BoxSeam,
  Grid3x3GapFill,
  TrashFill,
  ExclamationTriangle,
  Calendar3,
  ClockHistory,
  FileEarmarkArrowDownFill,
  PencilFill,
  CheckLg,
} from "react-bootstrap-icons";

const ShipmentsPage = () => {
  const [shipments, setShipments] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [shipmentToRemove, setShipmentToRemove] = useState(null);
  const [editingShipmentId, setEditingShipmentId] = useState(null);
  const [editedName, setEditedName] = useState("");
  const navigate = useNavigate();

  // Load all shipments on mount
  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    const all = await getAllShipments();
    setShipments(all || []);
  };

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

  // Calculate number of boxes and items for a shipment
  const getBoxAndItemCount = (shipment) => {
    let boxCount = 0;
    let itemCount = 0;
    if (!shipment || !shipment.mainJson) return { boxCount, itemCount };

    // Find the row with "Name of box"
    let box_location = 0;
    for (let i = 0; i < shipment.mainJson.length; i++) {
      if (shipment.mainJson[i][0] === "Name of box") {
        box_location = i;
        break;
      }
    }
    const boxArray = shipment.mainJson[box_location];
    for (let i = 0; i < boxArray.length; i++) {
      if (boxArray[i] !== "" && boxArray[i] !== "Name of box") {
        boxCount++;
      }
    }

    // Count items
    let lastItem = 0;
    for (let i = 5; i < shipment.mainJson.length; i++) {
      if (shipment.mainJson[i][0] === "") {
        lastItem = i;
        break;
      }
    }
    itemCount = lastItem > 5 ? lastItem - 5 : 0;
    return { boxCount, itemCount };
  };

  // Start editing a shipment name
  const handleEditName = (shipment) => {
    setEditingShipmentId(shipment.shipmentID);
    setEditedName(shipment.shipmentName || shipment.shipmentID);
  };

  // Open delete confirmation modal
  const handleDeleteClick = (shipment) => {
    setShipmentToRemove(shipment);
    setShowDeleteModal(true);
  };

  // Save the edited shipment name
  const handleSaveName = async (shipment) => {
    try {
      // Create a copy of the shipment
      const updatedShipment = { ...shipment };

      // Update the shipment name
      updatedShipment.shipmentName = editedName;

      // Save to storage
      await saveImportData(updatedShipment, shipment.shipmentID);

      // Refresh the shipments list
      fetchShipments();

      // Clear editing state
      setEditingShipmentId(null);

      toast.success("Shipment name updated successfully!");
    } catch (error) {
      console.error("Error updating shipment name:", error);
      toast.error("Failed to update shipment name. Please try again.");
    }
  };

  // Handle editing input change
  const handleNameInputChange = (e) => {
    setEditedName(e.target.value);
  };

  // Handle pressing Enter key to save
  const handleKeyPress = (e, shipment) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveName(shipment);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingShipmentId(null);
  };

  // Remove shipment
  const handleDeleteConfirm = async () => {
    if (!shipmentToRemove) return;
    try {
      await deleteShipment(shipmentToRemove.shipmentID);
      toast.success(
        `Shipment ${shipmentToRemove.shipmentID} removed successfully!`
      );
      setShowDeleteModal(false);
      setShipmentToRemove(null);
      fetchShipments();
    } catch (error) {
      console.error("Error removing shipment:", error);
      toast.error("Failed to remove shipment. Please try again.");
    }
  };

  // Navigate to BoxSummary0 with selected shipment
  const navigateToBoxSummary = (shipmentID) => {
    navigate("/boxsummary0", { state: { shipmentID } });
  };

  // Navigate to ProductDetail0 with selected shipment
  const navigateToProducts = (shipmentID) => {
    navigate("/products0", { state: { shipmentID } });
  };

  // Navigate to ProductDetail0 with selected shipment
  const navigateToExport = (shipmentID) => {
    navigate("/export0", { state: { shipmentID } });
  };

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Shipments</h2>
      </div>

      <Table striped bordered hover responsive className="shadow-sm">
        <thead className="bg-light">
          <tr>
            <th>Shipment ID</th>
            <th>Shipment Name</th>
            <th>Boxes</th>
            <th>Items</th>
            <th>Created</th>
            <th>Last Updated</th>
            <th colSpan="4">Actions</th>
          </tr>
        </thead>
        <tbody>
          {shipments.length === 0 && (
            <tr>
              <td colSpan={9} className="text-center py-4 text-muted">
                No shipments found.
              </td>
            </tr>
          )}
          {shipments.map((shipment) => {
            const { boxCount, itemCount } = getBoxAndItemCount(shipment);
            return (
              <tr key={shipment.shipmentID}>
                <td className="fw-bold">{shipment.shipmentID}</td>
                <td>
                  {editingShipmentId === shipment.shipmentID ? (
                    <div className="d-flex">
                      <Form.Control
                        type="text"
                        value={editedName}
                        onChange={handleNameInputChange}
                        onKeyPress={(e) => handleKeyPress(e, shipment)}
                        autoFocus
                        size="sm"
                        className="me-2"
                      />
                      <Button
                        variant="outline-success"
                        size="sm"
                        onClick={() => handleSaveName(shipment)}
                        className="me-1"
                      >
                        <CheckLg />
                      </Button>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={handleCancelEdit}
                      >
                        ✕
                      </Button>
                    </div>
                  ) : (
                    <div className="d-flex align-items-center">
                      <span className="me-2">
                        {shipment.shipmentName || shipment.shipmentID}
                      </span>
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0 text-muted"
                        onClick={() => handleEditName(shipment)}
                      >
                        <PencilFill size={12} />
                      </Button>
                    </div>
                  )}
                </td>
                <td>{boxCount}</td>
                <td>{itemCount}</td>
                <td>
                  <div className="d-flex align-items-center">
                    <Calendar3 className="text-muted me-2" />
                    {formatDate(shipment.createdDate)}
                  </div>
                </td>
                <td>
                  <div className="d-flex align-items-center">
                    <ClockHistory className="text-muted me-2" />
                    {formatDate(shipment.lastModifiedDate)}
                  </div>
                </td>
                {/* Action buttons - remain the same */}
                <td>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="w-100 d-flex align-items-center justify-content-center"
                    onClick={() => navigateToBoxSummary(shipment.shipmentID)}
                  >
                    <BoxSeam className="me-2" /> Boxes
                  </Button>
                </td>
                <td>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    className="w-100 d-flex align-items-center justify-content-center"
                    onClick={() => navigateToProducts(shipment.shipmentID)}
                  >
                    <Grid3x3GapFill className="me-2" /> Products
                  </Button>
                </td>
                <td>
                  <Button
                    variant="outline-success"
                    size="sm"
                    className="w-100 d-flex align-items-center justify-content-center"
                    onClick={() => navigateToExport(shipment.shipmentID)}
                  >
                    <FileEarmarkArrowDownFill className="me-2" /> Export
                  </Button>
                </td>
                <td>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    className="w-100 d-flex align-items-center justify-content-center"
                    onClick={() => handleDeleteClick(shipment)}
                  >
                    <TrashFill className="me-2" /> Remove
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>

      {/* Delete Confirmation Modal - remains the same */}
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
            <ExclamationTriangle size={50} className="text-danger mb-3" />
            <p>
              Are you sure you want to delete shipment{" "}
              <strong>{shipmentToRemove?.shipmentID}</strong>? This action
              cannot be undone.
            </p>
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
    </div>
  );
};

export default ShipmentsPage;
