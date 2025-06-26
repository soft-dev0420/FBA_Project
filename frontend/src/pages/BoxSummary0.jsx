import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom"; // Added useLocationion
import { useBoxActions, useBoxState } from "../context/TotalContent";
import BoxList0 from "../components/BoxList0";
import BoxContent0 from "../components/BoxContent0";
import { getImportData, saveImportData } from "../utils/storage0"; // Changed to saveImportData
import { Button, Modal, Card, Badge } from "react-bootstrap";
import AddBoxForm from "../components/AddBoxForm";
import EditBoxForm from "../components/EditBoxForm";
import {
  PlusLg,
  BoxSeam,
  PencilSquare,
  ExclamationCircle,
  ExclamationTriangle,
  Calendar3,
  ClockHistory,
  ArrowLeft,
  BoxArrowRight,
} from "react-bootstrap-icons";
import { toast } from "react-toastify";

const BoxSummary0 = () => {
  const { setSelectedBox, setTotals, setItemsPerPage } = useBoxActions();
  const { totals, itemsPerPage } = useBoxState(); // Access totals from context
  const location = useLocation(); // Get location for shipmentID
  const shipmentID = location.state?.shipmentID; // Get shipmentID from route state
  const [boxQuantities, setBoxQuantities] = useState([]);

  const navigate = useNavigate();
  const [boxes, setBoxes] = useState([]);
  const [importData, setImportData] = useState({});
  const [selectId, setSelectId] = useState(0);
  const [boxDetail, setBoxDetail] = useState([]);
  const [avalible_fnsku, setAvalible_fnsku] = useState([]);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [error, setError] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentEditBox, setCurrentEditBox] = useState({ index: 0, data: "" });

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

  // Handle opening the edit modal
  const handleEditBox = (index, boxData) => {
    setCurrentEditBox({ index, data: boxData });
    setShowEditModal(true);
  };

  // Handle the edit form submission
  const handleEditBoxSubmit = (boxData) => {
    setConfirmMessage(
      `Are you sure you want to update box "${boxData.boxName}"?`
    );
    setConfirmAction(() => () => {
      updateBoxInData(currentEditBox.index, boxData);
      setShowConfirmModal(false);
      setShowEditModal(false);
    });
    setShowConfirmModal(true);
  };

  // Update the box data in storage
  const updateBoxInData = (boxIndex, boxData) => {
    getImportData(shipmentID).then((data) => {
      // Pass shipmentID
      if (!data) return;

      let boxNameId = 0;
      for (let i = 0; i < data.mainJson.length; i++) {
        if (data.mainJson[i][0] === "Name of box") {
          boxNameId = i;
          break;
        }
      }

      // Update the box properties
      data.mainJson[boxNameId + 1][boxIndex] = boxData.weight;
      data.mainJson[boxNameId + 2][boxIndex] = boxData.width;
      data.mainJson[boxNameId + 3][boxIndex] = boxData.length;
      data.mainJson[boxNameId + 4][boxIndex] = boxData.height;

      // Save updated data with shipmentID
      saveImportData(data, shipmentID).then(() => {
        // Use saveImportData with shipmentID
        // Reload boxes to show the updated list
        loadBoxes();
        toast.success(`Box updated successfully!`);
      });
    });
  };

  // Set items per page to 15 when component mounts
  useEffect(() => {
    if (itemsPerPage !== 15 && setItemsPerPage) {
      setItemsPerPage(15);
    }
  }, [itemsPerPage, setItemsPerPage]);

  useEffect(() => {
    loadBoxes();
  }, [selectId, shipmentID]);

  const loadBoxes = () => {
    getImportData(shipmentID).then((data) => {
      // Pass shipmentID
      if (!data) return;

      let name = [];
      let weight = [];
      let width = [];
      let length = [];
      let height = [];
      let boxArray = [];
      let boxNameId = 0;
      setImportData(data);
      calculateTotals(data);
      // Calculate box quantities here
      const boxQuantities = calculateBoxQuantities(data);
      let fnsku = [];

      for (let i = 0; i < data.mainJson.length; i++) {
        if (data.mainJson[i][0] === "Name of box") {
          boxNameId = i;
          break;
        }
        if (i > 4) {
          fnsku.push([
            i,
            parseInt(data.mainJson[i][9]) - parseInt(data.mainJson[i][10]),
          ]);
        }
      }

      setAvalible_fnsku(fnsku);
      name = data.mainJson[boxNameId];
      weight = data.mainJson[boxNameId + 1];
      width = data.mainJson[boxNameId + 2];
      length = data.mainJson[boxNameId + 3];
      height = data.mainJson[boxNameId + 4];
      boxArray.push(name[0]);

      for (let i = 1; i < name.length; i++) {
        if (i < 12) {
          boxArray.push("");
        } else if (name[i] !== "") {
          if (weight[i] !== "") {
            boxArray.push(
              name[i] +
                ": " +
                weight[i] +
                "(lb) , " +
                width[i] +
                " x " +
                length[i] +
                " x " +
                height[i] +
                "(inch)"
            );
          } else {
            boxArray.push(name[i] + ":" + "W x L x H (inch)");
          }
        }
      }

      setBoxes(boxArray);
      setBoxQuantities(boxQuantities); // Add this state variable
    });
  };

  // Add this function to BoxSummary0.jsx
  const calculateTotals = (data) => {
    if (!data || !data.mainJson) return;

    // Safe parsing function
    const safeParseInt = (value) => {
      if (value === undefined || value === null || value === "") return 0;
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? 0 : parsed;
    };

    // Calculate totals
    const calculatedTotals = {
      num: 0,
      expected: 0,
      boxed: 0,
    };

    for (let i = 5; i < data.mainJson.length; i++) {
      const item = data.mainJson[i];
      if (item && item[4] !== "") {
        calculatedTotals.num++;
        calculatedTotals.expected += safeParseInt(item[9]);
        calculatedTotals.boxed += safeParseInt(item[10]);
      }
    }

    // Update context with the calculated totals
    setTotals(calculatedTotals);
  };

  const onListClicked = useCallback((index) => {
    setSelectId(index);
    calculateBox(index);
  }, []);

  const calculateBox = (index) => {
    let detail = [];
    if (index > 10) {
      const a = getImportData(shipmentID);
      getImportData(shipmentID).then(
        (
          data // Pass shipmentID
        ) => {
          data.mainJson.map(
            (data, idx) =>
              idx > 4 &&
              data[4] !== "" &&
              detail.push({
                quantity: data[index],
                fnsku: data[4],
                title: data[1],
                asin: data[3],
                sku: data[0],
              })
          );
          setBoxDetail(detail);
        }
      );
    }
  };

  // Handle opening the add box modal
  const handleAddBox = () => {
    setShowAddModal(true);
  };

  // Handle the add box form submission - UPDATED
  const handleAddBoxSubmit = (submissionData) => {
    if (submissionData.multipleBoxes) {
      // Handle multiple boxes
      addMultipleBoxesToData(submissionData.multipleBoxes);
    } else if (submissionData.isRestoration) {
      // Handle restoration of deleted box
      restoreDeletedBox(submissionData);
    } else {
      // Handle single box
      addBoxToData(submissionData);
    }
    setShowAddModal(false);
  };

  // NEW FUNCTION: Restore a deleted box
  const restoreDeletedBox = async (boxData) => {
    try {
      const data = await getImportData(shipmentID);
      if (!data) return;

      let boxNameId = 0;
      for (let i = 0; i < data.mainJson.length; i++) {
        if (data.mainJson[i][0] === "Name of box") {
          boxNameId = i;
          break;
        }
      }

      const restoreIndex = boxData.restorationIndex;

      // Restore box info at the specific index
      data.mainJson[boxNameId][restoreIndex] = boxData.boxName;
      data.mainJson[boxNameId + 1][restoreIndex] = boxData.weight;
      data.mainJson[boxNameId + 2][restoreIndex] = boxData.width;
      data.mainJson[boxNameId + 3][restoreIndex] = boxData.length;
      data.mainJson[boxNameId + 4][restoreIndex] = boxData.height;

      // Restore box quantity header
      const boxNum = getboxNum(boxData.boxName);
      data.mainJson[4][restoreIndex] = `Box ${boxNum} quantity`;

      // Save updated data
      await saveImportData(data, shipmentID);

      // Reload boxes to show the updated list
      loadBoxes();

      // Select the restored box
      setTimeout(() => {
        setSelectedBox(restoreIndex);
        onListClicked(restoreIndex);
        toast.success(`Box "${boxData.boxName}" restored successfully!`);
      }, 100);
    } catch (error) {
      console.error("Error restoring box:", error);
      toast.error("Failed to restore box. Please try again.");
    }
  };

  // UPDATED: Add the box data to storage (for completely new boxes)
  const addBoxToData = (boxData) => {
    getImportData(shipmentID).then((data) => {
      let boxNameId = 0;
      for (let i = 0; i < data.mainJson.length; i++) {
        if (data.mainJson[i][0] === "Name of box") {
          boxNameId = i;
          break;
        }
      }

      let boxNum = getboxNum(boxData.boxName);
      data.mainJson[4].push(`Box ${boxNum} quantity`);

      for (let i = 5; i < boxNameId; i++) {
        data.mainJson[i].push("");
      }
      data.mainJson[boxNameId].push(boxData.boxName);
      data.mainJson[boxNameId + 1].push(boxData.weight);
      data.mainJson[boxNameId + 2].push(boxData.width);
      data.mainJson[boxNameId + 3].push(boxData.length);
      data.mainJson[boxNameId + 4].push(boxData.height);

      const newBoxIndex = data.mainJson[boxNameId].length - 1;

      // Save updated data with shipmentID
      saveImportData(data, shipmentID).then(() => {
        // Reload boxes to show the updated list
        loadBoxes();

        // Use setTimeout to ensure boxes are loaded
        setTimeout(() => {
          // Set the selected box in the global context
          setSelectedBox(newBoxIndex);

          // Call your existing selection function
          onListClicked(newBoxIndex);
          toast.success(`Box "${boxData.boxName}" added successfully!`);
        }, 100);
      });
    });
  };

  const addItem = async (fnsku, quantity) => {
    let status;
    if (avalible_fnsku[fnsku - 5][1] >= quantity) {
      avalible_fnsku[fnsku - 5][1] -= quantity;
      importData.mainJson[fnsku][10] =
        parseInt(importData.mainJson[fnsku][10]) + quantity + "";

      // mounted books
      if (importData.mainJson[fnsku][selectId] === "") {
        importData.mainJson[fnsku][selectId] = quantity + "";
      } else {
        importData.mainJson[fnsku][selectId] =
          parseInt(importData.mainJson[fnsku][selectId]) + quantity + "";
      }

      await saveImportData(importData, shipmentID); // Use saveImportData with shipmentID
      calculateBox(selectId);
      loadBoxes();
      setError("");
      status = true;
      toast.success(`Added ${quantity} units to box successfully!`);
    } else {
      setError("Exceed the maximum quantity");
      toast.error("Cannot add items: Exceeds available quantity");
      status = false;
    }

    if (status) {
      // Recalculate totals after item is added
      calculateTotals(importData);
    }
    return status;
  };

  const reduceItem = async (fnsku, difference) => {
    let status = false;

    // Get current quantity in this box
    const currentInBox = parseInt(importData.mainJson[fnsku][selectId]) || 0;

    // Check if we can reduce the requested amount
    if (currentInBox >= difference && difference > 0) {
      // Increase available quantity (return items to available pool)
      avalible_fnsku[fnsku - 5][1] += difference;

      // Decrease total boxed quantity
      const currentBoxedTotal = parseInt(importData.mainJson[fnsku][10]) || 0;
      importData.mainJson[fnsku][10] =
        Math.max(0, currentBoxedTotal - difference) + "";

      // Reduce from current box
      const newBoxQuantity = currentInBox - difference;
      if (newBoxQuantity === 0) {
        importData.mainJson[fnsku][selectId] = "";
      } else {
        importData.mainJson[fnsku][selectId] = newBoxQuantity + "";
      }

      // Save the updated data
      await saveImportData(importData, shipmentID);

      // Update UI
      calculateBox(selectId);
      loadBoxes();
      setError("");
      status = true;

      toast.success(`Reduced ${difference} units from box successfully!`);
    } else if (difference <= 0) {
      setError("Reduction amount must be greater than 0");
      toast.error("Reduction amount must be greater than 0");
      status = false;
    } else {
      setError(
        `Cannot reduce ${difference} units. Only ${currentInBox} units available in this box`
      );
      toast.error(
        `Cannot reduce ${difference} units. Only ${currentInBox} units available in this box`
      );
      status = false;
    }

    if (status) {
      // Recalculate totals after item is reduced
      calculateTotals(importData);
    }

    return status;
  };

  // Add multiple boxes to data - NEW FUNCTION
  const addMultipleBoxesToData = async (boxesArray) => {
    try {
      const data = await getImportData(shipmentID);
      if (!data) return;

      let boxNameId = 0;
      for (let i = 0; i < data.mainJson.length; i++) {
        if (data.mainJson[i][0] === "Name of box") {
          boxNameId = i;
          break;
        }
      }

      // Add all boxes
      boxesArray.forEach((boxData, index) => {
        const boxNumber = boxData.boxName.match(/B(\d+)$/)[1];

        // Add column header for quantity tracking
        data.mainJson[4].push(`Box ${boxNumber} quantity`);

        // Add empty cells for existing items
        for (let i = 5; i < boxNameId; i++) {
          data.mainJson[i].push("");
        }

        // Add box details
        data.mainJson[boxNameId].push(boxData.boxName);
        data.mainJson[boxNameId + 1].push(boxData.weight);
        data.mainJson[boxNameId + 2].push(boxData.width);
        data.mainJson[boxNameId + 3].push(boxData.length);
        data.mainJson[boxNameId + 4].push(boxData.height);
      });

      // Save updated data
      await saveImportData(data, shipmentID);

      // Reload boxes to show the updated list
      loadBoxes();

      // Select the first new box
      const firstNewBoxIndex =
        data.mainJson[boxNameId].length - boxesArray.length;
      setTimeout(() => {
        setSelectedBox(firstNewBoxIndex);
        onListClicked(firstNewBoxIndex);
        toast.success(`${boxesArray.length} boxes added successfully!`);
      }, 100);
    } catch (error) {
      console.error("Error adding multiple boxes:", error);
      toast.error("Failed to add boxes. Please try again.");
    }
  };

  // Add this function to calculate quantities for all boxes
  const calculateBoxQuantities = (data) => {
    if (!data || !data.mainJson) return [];

    // Find the box name row
    let boxNameId = 0;
    for (let i = 0; i < data.mainJson.length; i++) {
      if (data.mainJson[i][0] === "Name of box") {
        boxNameId = i;
        break;
      }
    }

    // Create an array to store box quantities
    const boxQuantities = [];

    // Loop through each box (starting from index 1 to skip header)
    for (
      let boxIndex = 1;
      boxIndex < data.mainJson[boxNameId].length;
      boxIndex++
    ) {
      const boxName = data.mainJson[boxNameId][boxIndex];

      // Skip empty boxes
      if (!boxName || boxName === "") continue;

      let itemCount = 0;
      let totalQuantity = 0;

      // Loop through each item row
      for (let i = 5; i < boxNameId; i++) {
        // Check if this item has a quantity in this box
        const quantity = parseInt(data.mainJson[i][boxIndex]) || 0;
        if (quantity > 0) {
          itemCount++;
          totalQuantity += quantity;
        }
      }

      // Store the results with original box index
      boxQuantities[boxIndex] = {
        itemCount,
        totalQuantity,
      };
    }

    return boxQuantities;
  };

  const removeFNSKU = (fnsku, quantity) => {
    // Show confirmation modal
    setConfirmMessage(
      `Are you sure you want to remove ${quantity} units of FNSKU ${fnsku} from this box?`
    );
    setConfirmAction(() => () => {
      // This will be executed when user confirms
      removeFNSKUFromBox(fnsku, quantity);
      setShowConfirmModal(false);
    });
    setShowConfirmModal(true);
  };

  const removeFNSKUFromBox = (fnsku, quantity) => {
    // Find the index of the FNSKU in the mainJson array
    let fnskuRow = -1;
    for (let i = 5; i < importData.mainJson.length; i++) {
      if (importData.mainJson[i][4] === fnsku) {
        fnskuRow = i;
        break;
      }
    }

    if (fnskuRow !== -1) {
      // Get the current quantity
      const removeQuantity = parseInt(quantity) || 0;

      // Remove the quantity from the box
      importData.mainJson[fnskuRow][selectId] = "";

      // Update the boxed quantity (column 10)
      const boxedQuantity = parseInt(importData.mainJson[fnskuRow][10]) || 0;
      importData.mainJson[fnskuRow][10] = boxedQuantity - removeQuantity + "";

      // Increase the available quantity
      for (let i = 0; i < avalible_fnsku.length; i++) {
        if (avalible_fnsku[i][0] === fnskuRow) {
          avalible_fnsku[i][1] += removeQuantity;
          break;
        }
      }

      // Save data with shipmentID
      saveImportData(importData, shipmentID).then(() => {
        // Use saveImportData with shipmentID
        // Refresh the UI
        calculateBox(selectId);

        loadBoxes();
        setError("");
        // Add this line to recalculate totals
        calculateTotals(importData);
        toast.info(`Removed ${quantity} units of ${fnsku} from box`);
      });
    }
  };

  const handleRemoveBox = async (boxIndex) => {
    // Find the box name from the current boxes array
    // Get the current data

    const data = await getImportData(shipmentID);
    if (!data) return;

    let boxNameId = 0;
    for (let i = 0; i < data.mainJson.length; i++) {
      if (data.mainJson[i][0] === "Name of box") {
        boxNameId = i;
        break;
      }
    }

    const boxNameForMessage =
      data.mainJson[boxNameId][boxIndex] || `Box ${boxIndex}`;

    // Set confirmation message with the actual box name
    setConfirmMessage(
      `Are you sure you want to remove "${boxNameForMessage}"? All items in this box will be unboxed.`
    );

    setConfirmAction(() => async () => {
      try {
        // Store items that need to be unboxed for later reference
        const boxedItems = [];
        for (let i = 5; i < data.mainJson.length; i++) {
          const qty = parseInt(data.mainJson[i][boxIndex]) || 0;
          if (qty > 0) {
            boxedItems.push({
              row: i,
              quantity: qty,
            });
          }
        }

        // 1. Remove box info from box-related arrays (name, weight, etc.)
        for (let j = 0; j <= 4; j++) {
          // Remove the box column from box-name, weight, width, length, height rows
          data.mainJson[boxNameId + j][boxIndex] = "";
        }

        // 2. Remove column from box quantity header
        data.mainJson[4][boxIndex] = "";

        // 3. Process each row with items to unbox
        for (let i = 5; i < boxNameId; i++) {
          // If this row had items in the removed box
          const item = boxedItems.find((item) => item.row === i);
          if (item) {
            // Adjust the total boxed quantity by subtracting the quantity from this box
            const currentBoxed = parseInt(data.mainJson[i][10]) || 0;
            data.mainJson[i][10] = String(
              Math.max(0, currentBoxed - item.quantity)
            );
          }

          // Remove the box column from this row
          data.mainJson[i][boxIndex] = "";
        }

        // Save the updated data
        await saveImportData(data, shipmentID);
        // Add this line to recalculate totals
        calculateTotals(data);
        console.log("remove data  ===> ", data.mainJson);
        // Reset selected box if it was the deleted one
        if (selectId === boxIndex) {
          setSelectId(0);
        } else if (selectId > boxIndex) {
          // Adjust selection index since we removed a box
          setSelectId(selectId - 1);
        }

        // Reload boxes to update the UI
        loadBoxes();

        setShowConfirmModal(false);
        toast.success(
          `Box "${boxNameForMessage}" removed successfully. Items have been unboxed.`
        );
      } catch (error) {
        console.error("Error removing box:", error);
        toast.error("Failed to remove box. Please try again.");
        setShowConfirmModal(false);
      }
    });

    setShowConfirmModal(true);
  };

  // get box number from box name
  const getboxNum = (boxName) => {
    const match = boxName.match(/B(\d+)/);
    return match ? parseInt(match[1]) : null;
  };

  return (
    <div className="container mt-4">
      <Card className="shadow-sm mb-4 bg-light">
        <div
          className="position-relative"
          style={{ minHeight: "10rem", overflow: "hidden" }}
        >
          {/* Background Image */}
          <div
            style={{
              backgroundImage: "url('/images/BoxSummary.webp')",
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
            {/* Main content with flexible spacing */}
            <div className="d-flex justify-content-between flex-grow-1">
              <h1 className="mb-0 d-flex align-items-center">
                <BoxSeam size={28} style={{ marginRight: "12px" }} />
                {/* Top section with shipment ID */}
                {shipmentID && (
                  <Badge bg="light" text="dark" className="px-2 py-2">
                    {shipmentID}
                  </Badge>
                )}
              </h1>
              <Button
                variant="dark"
                onClick={handleAddBox}
                className="d-flex align-items-center"
                size="lg"
              >
                <PlusLg className="me-2" /> Add New Box
              </Button>
            </div>

            {/* Bottom section with dates and button */}
            <div className="d-flex justify-content-between align-items-end mt-auto">
              <div>
                {importData.createdDate && (
                  <div className="text-dark small d-flex align-items-center">
                    <Calendar3 className="me-1" /> Created:{" "}
                    {formatDate(importData.createdDate)}
                  </div>
                )}
                {importData.lastModifiedDate && (
                  <div className="text-dark small d-flex align-items-center">
                    <ClockHistory className="me-1" /> Last Updated:{" "}
                    {formatDate(importData.lastModifiedDate)}
                  </div>
                )}
              </div>
            </div>
            <div className="d-flex mb-1 justify-content-between mt-5">
              {/* Left Button - to Products */}
              <Button
                variant="dark"
                onClick={() =>
                  navigate("/products0", { state: { shipmentID } })
                }
                className="d-flex align-items-center"
              >
                <ArrowLeft className="me-2" /> Products
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
                  <span className="fs-5 fw-bold">{totals.num}</span>
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

      {/* Main Content Area */}
      <div className="row">
        {/* Enhanced Box List */}
        <div className="col-md-4">
          <Card className="shadow-sm mb-4">
            <Card.Body className="p-3">
              <BoxList0
                boxes={boxes}
                onSelect={onListClicked}
                onEdit={handleEditBox}
                onRemoveBox={handleRemoveBox} // Add this new prop
                boxQuantities={boxQuantities}
                itemsPerPage={15} // Pass as prop
              />
            </Card.Body>
          </Card>
        </div>

        {/* Box Content Area */}
        <div className="col-md-8">
          <BoxContent0
            addItem={addItem}
            reduceItem={reduceItem}
            box={boxDetail}
            boxName={boxes[selectId]}
            availablefnskus={avalible_fnsku}
            error={error}
            selectId={selectId}
            removeFNSKU={removeFNSKU}
            importData={importData}
          />
        </div>
      </div>

      {/* Enhanced Add Box Modal */}
      {/* Add Box Modal - UPDATED */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered>
        <Modal.Header
          closeButton
          className="border-0 pb-0"
          style={{
            backgroundImage: "linear-gradient(to right, #f8f9fa, #e9ecef)",
            height: "5rem",
          }}
        >
          <Modal.Title style={{ color: "#212529", fontWeight: "bold" }}>
            <BoxSeam className="me-2" />
            Add New Box
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="px-4">
          <AddBoxForm
            onSubmit={handleAddBoxSubmit}
            onCancel={() => setShowAddModal(false)}
            shipmentID={shipmentID} // Add this prop
          />
        </Modal.Body>
      </Modal>

      {/* Enhanced Edit Box Modal */}
      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
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
            <PencilSquare className="me-2" />
            Edit Box Properties
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="px-4">
          <EditBoxForm
            box={currentEditBox.data}
            onSubmit={handleEditBoxSubmit}
            onCancel={() => setShowEditModal(false)}
          />
        </Modal.Body>
      </Modal>

      {/* Enhanced Confirmation Modal */}
      <Modal
        show={showConfirmModal}
        onHide={() => setShowConfirmModal(false)}
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
            <ExclamationTriangle className="me-2 text-warning" />
            Confirm Action
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="px-4">
          <div className="text-center mb-4">
            <ExclamationCircle size={50} className="text-warning mb-3" />
            <p>{confirmMessage}</p>
            {error && <div className="alert alert-danger mt-3">{error}</div>}
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
            onClick={() => setShowConfirmModal(false)}
          >
            Cancel
          </Button>
          <Button variant="warning" onClick={confirmAction}>
            Confirm
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default BoxSummary0;
