import React, { useEffect } from "react";
import { Button, Badge } from "react-bootstrap";
import {
  BoxSeamFill,
  BoxFill,
  PencilFill,
  ChevronLeft,
  ChevronRight,
  InboxesFill,
  TrashFill, // Add this import
} from "react-bootstrap-icons";
import { useBoxState, useBoxActions } from "../context/TotalContent";

const BoxList0 = ({
  boxes,
  onEdit,
  onSelect,
  onRemoveBox,
  boxQuantities,
  itemsPerPage = 15,
}) => {
  // Get state and actions from context
  const { currentPage, selectedBoxId } = useBoxState();
  const { setCurrentPage, setSelectedBox, setTotalPages } = useBoxActions();

  // Filter boxes as in original code
  const filteredBoxes = boxes.filter((_, index) => index > 11);

  // Calculate indexes for current page
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentBoxes = filteredBoxes.slice(indexOfFirstItem, indexOfLastItem);

  // Calculate total number of pages
  const totalPages = Math.ceil(filteredBoxes.length / itemsPerPage);

  // Update total pages when it changes
  useEffect(() => {
    setTotalPages(totalPages);
  }, [totalPages, setTotalPages]);

  // Function to get original index in the boxes array
  const getboxNum = (box) => {
    const match = box.match(/B(\d+)/);
    return match ? parseInt(match[1]) + 11 : null;
  };

  // Handle box selection
  const handleSelect = (boxNum) => {
    setSelectedBox(boxNum); // Update in context
    onSelect(boxNum); // Call parent callback
  };

  return (
    <div className="box-list-component">
      {/* Header remains the same */}
      <div className="bg-light p-3 border-bottom d-flex justify-content-between align-items-center">
        <h5 className="mb-0">
          <BoxSeamFill className="me-2" />
          Boxes
        </h5>
        <Badge bg="dark" pill>
          {filteredBoxes.length}
        </Badge>
      </div>

      {currentBoxes.length === 0 ? (
        <div className="text-center py-5">
          <InboxesFill size={40} className="text-muted mb-3" />
          <p className="text-muted">
            No boxes available. Click "Add New Box" to get started.
          </p>
        </div>
      ) : (
        <div className="box-list">
          {currentBoxes.map((box, index) => {
            const boxNum = getboxNum(box);
            console.log("boxNum ===>", boxNum);

            const boxData = boxQuantities[boxNum] || {
              itemCount: 0,
              totalQuantity: 0,
            };

            return (
              <div
                key={boxNum}
                className={`box-item d-flex justify-content-between align-items-center p-3 border-bottom ${
                  boxNum === selectedBoxId ? "selected-box" : ""
                }`}
              >
                {/* Make clickable area only on the left part */}
                <div
                  className="d-flex align-items-center flex-grow-1"
                  style={{ cursor: "pointer" }}
                  onClick={() => handleSelect(boxNum)}
                >
                  <div className="box-icon me-3">
                    <BoxFill
                      size={20}
                      className={
                        boxNum === selectedBoxId ? "text-primary" : "text-muted"
                      }
                    />
                  </div>
                  <div>
                    <div className="fw-medium">{box}</div>
                    <div className="d-flex align-items-center">
                      {boxData.itemCount > 0 && (
                        <div className="d-flex">
                          <Badge
                            bg="secondary"
                            size="sm"
                            className="me-1 py-1 px-2"
                          >
                            {boxData.itemCount} items
                          </Badge>
                          <Badge bg="info" size="sm" className="py-1 px-2">
                            Qty: {boxData.totalQuantity}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Button group for actions */}
                <div>
                  <Button
                    variant="light"
                    size="sm"
                    className="me-2 d-inline-flex align-items-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(boxNum); // Select the box first
                      onEdit(boxNum, box);
                    }}
                  >
                    <PencilFill size={14} className="text-dark" />
                  </Button>

                  {/* Add remove button */}
                  <Button
                    variant="light"
                    size="sm"
                    className="d-inline-flex align-items-center text-danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(boxNum); // Select the box first
                      onRemoveBox(boxNum);
                    }}
                  >
                    <TrashFill size={14} />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="pagination-container pt-3 pb-2 px-3 bg-light border-top">
          <div className="d-flex justify-content-between align-items-center">
            <Button
              variant={currentPage === 1 ? "light" : "outline-dark"}
              onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
              disabled={currentPage === 1}
              size="sm"
              className="d-flex align-items-center"
            >
              <ChevronLeft /> Prev
            </Button>

            <div className="d-flex align-items-center">
              <small className="text-muted">
                Page {currentPage} of {totalPages}
              </small>
            </div>

            <Button
              variant={currentPage === totalPages ? "light" : "outline-dark"}
              onClick={() =>
                setCurrentPage(Math.min(currentPage + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              size="sm"
              className="d-flex align-items-center"
            >
              Next <ChevronRight />
            </Button>
          </div>

          {/* Page numbers */}
          <div className="d-flex justify-content-center mt-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;

              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "dark" : "light"}
                  onClick={() => setCurrentPage(pageNum)}
                  className="mx-1 page-number-button"
                  size="sm"
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default BoxList0;
