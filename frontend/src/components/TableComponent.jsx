import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Table, Badge, Button, Card, Form, InputGroup, Pagination, Modal } from 'react-bootstrap';
import { FaSearch, FaSort, FaSortUp, FaSortDown, FaCog } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';
import { setSelectedRow } from '../redux/reducers/excelReducer';

const TableComponent = ({ data }) => {
  const dispatch = useDispatch();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [showColumnDialog, setShowColumnDialog] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState(
    Object.keys(data[0] || {}).reduce((acc, key) => ({ ...acc, [key]: true }), {})
  );
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [tooltipImage, setTooltipImage] = useState('');

  const formatValue = (value, key) => {
    if (value === "" || value === null || value === undefined) {
      return "";
    }

    if (key === "Title") {
      return (
        <span
          title={value}
          style={{
            cursor: 'pointer',
            display: 'inline-block',
            maxWidth: '100px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {value}
        </span>
      );
    }
    if (key === "Image URL") {
      return renderImage(value);
    }
    if (key === "Product URL") {
      return (
        <Button variant="outline-primary" size="sm" href={value} target="_blank" rel="noopener noreferrer" className="d-flex align-items-center">
          <i className="bi bi-box-arrow-up-right me-1"></i> Visit
        </Button>
      );
    }
    if (key === "SalesRank") {
      return <Badge bg="info" className="px-3 py-2">{value.toLocaleString()}</Badge>;
    }
    if (["BuyBox Total", "Lowest FBA", "Lowest NonFBA", "List Price"].includes(key)) {
      return <span className="text-success fw-semibold">${value.toFixed(2)}</span>;
    }
    if (["Package Weight", "Package Height", "Package Width", "Package Lenght"].includes(key)) {
      return <span className="text-muted">{value.toFixed(2)} in</span>;
    }
    if (key === "Publication Date") {
      return new Date(value).toLocaleDateString();
    }
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    return value;
  };

  const renderImage = (imageUrl) => {
    if (!imageUrl) return "";
    return (
      <div className="position-relative">
        <img
          src={imageUrl}
          alt="Product"
          className="img-fluid rounded shadow-sm"
          style={{
            maxHeight: '100px',
            objectFit: 'contain',
            transition: 'transform 0.2s',
            cursor: 'pointer'
          }}
          onMouseOver={(e) => e.target.style.transform = 'scale(1.1)'}
          onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
        />
      </div>
    );
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort className="ms-1" />;
    return sortConfig.direction === 'asc' ?
      <FaSortUp className="ms-1" /> :
      <FaSortDown className="ms-1" />;
  };

  const filteredData = data.filter(item =>
    Object.values(item).some(value =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig.key) return 0;

    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleRowHover = (event, imageUrl) => {
    setTooltipPosition({
      x: event.clientX,
      y: event.clientY
    });
    setTooltipImage(imageUrl);
    setShowTooltip(true);
  };

  const handleRowLeave = () => {
    setShowTooltip(false);
  };

  const handleMouseMove = (event) => {
    if (showTooltip) {
      const tooltipWidth = 320; // maxWidth + padding
      const tooltipHeight = 320; // maxHeight + padding
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Calculate initial position
      let x = event.clientX + 15;
      let y = event.clientY + 15;

      // Adjust horizontal position if tooltip would overflow right edge
      if (x + tooltipWidth > viewportWidth) {
        x = event.clientX - tooltipWidth - 15;
      }

      // Adjust vertical position if tooltip would overflow bottom edge
      if (y + tooltipHeight > viewportHeight) {
        y = event.clientY - tooltipHeight - 15;
      }

      // Ensure tooltip doesn't go off the left edge
      x = Math.max(15, x);

      // Ensure tooltip doesn't go off the top edge
      y = Math.max(15, y);

      setTooltipPosition({ x, y });
    }
  };

  return (
    <Card className="shadow-lg border-0" onMouseMove={handleMouseMove}>
      <Card.Header className="bg-white border-0 py-3 d-flex justify-content-between align-items-center">
        <InputGroup className="w-50">
          <InputGroup.Text className="bg-light border-end-0">
            <FaSearch className="text-muted" />
          </InputGroup.Text>
          <Form.Control
            type="text"
            placeholder="Search in all fields..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-start-0"
          />
        </InputGroup>
        <Button
          variant="outline-secondary"
          onClick={() => setShowColumnDialog(true)}
          className="d-flex align-items-center gap-2"
        >
          <FaCog /> Columns
        </Button>
      </Card.Header>

      <div className="table-responsive">
        <Table hover className="align-middle mb-0">
          <thead>
            <tr>
              <th
                key="Image URL"
                className="border-0 py-3 text-center"
                onClick={() => handleSort("Image URL")}
                style={{
                  cursor: 'pointer',
                  background: 'linear-gradient(to right, #f8f9fa, #e9ecef)',
                  color: '#495057',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  fontSize: '0.85rem',
                  letterSpacing: '0.5px'
                }}
              >
                <div className="d-flex align-items-center justify-content-center gap-2">
                  <span>Image</span>
                  {getSortIcon("Image URL")}
                </div>
              </th>
              {Object.keys(data[0] || {})
                .filter(key => key !== "Image URL" && key !== "exist" && selectedColumns[key])
                .map((key) => (
                  <th
                    key={key}
                    className="border-0 py-3 text-center"
                    onClick={() => handleSort(key)}
                    style={{
                      cursor: 'pointer',
                      background: 'linear-gradient(to right, #f8f9fa, #e9ecef)',
                      color: '#495057',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      fontSize: '0.85rem',
                      letterSpacing: '0.5px'
                    }}
                  >
                    <div className="d-flex align-items-center justify-content-center gap-2">
                      <span>{key}</span>
                      {getSortIcon(key)}
                    </div>
                  </th>
                ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((item, index) => (
              item.exist && <tr
                key={index}
                className={`border-bottom ${index % 2 === 0 ? 'bg-white' : 'bg-light'}`}
                onMouseEnter={(e) => handleRowHover(e, item["Image URL"])}
                onMouseLeave={handleRowLeave}
                style={{
                  transition: 'background-color 0.2s ease'
                }}
                onClick={() => { dispatch(setSelectedRow(item)); }}
              >
                <td className="text-center">{renderImage(item["Image URL"])}</td>
                {Object.keys(data[0] || {})
                  .filter(key => key !== "Image URL" && key !== "exist" && selectedColumns[key])
                  .map((key) => (
                    <td key={key} className="text-center">
                      {formatValue(item[key], key)}
                    </td>
                  ))}
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      <div className="d-flex justify-content-between align-items-center p-3 bg-light border-top">
        <div className="d-flex align-items-center gap-3">
          <div className="text-muted">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedData.length)} of {sortedData.length} entries
          </div>
          <Form.Select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1); // Reset to first page when changing items per page
            }}
            style={{ width: 'auto' }}
            size="sm"
          >
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </Form.Select>
        </div>
        <Pagination className="mb-0">
          <Pagination.First
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
          />
          <Pagination.Prev
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          />

          {[...Array(totalPages)].map((_, index) => {
            const pageNumber = index + 1;
            // Show first page, last page, current page, and pages around current page
            if (
              pageNumber === 1 ||
              pageNumber === totalPages ||
              (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
            ) {
              return (
                <Pagination.Item
                  key={pageNumber}
                  active={pageNumber === currentPage}
                  onClick={() => handlePageChange(pageNumber)}
                >
                  {pageNumber}
                </Pagination.Item>
              );
            } else if (
              pageNumber === currentPage - 2 ||
              pageNumber === currentPage + 2
            ) {
              return <Pagination.Ellipsis key={pageNumber} disabled />;
            }
            return null;
          })}

          <Pagination.Next
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          />
          <Pagination.Last
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
          />
        </Pagination>
      </div>

      <Modal show={showColumnDialog} onHide={() => setShowColumnDialog(false)}>
        <Modal.Header closeButton className="bg-light">
          <Modal.Title>Select Columns</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="row row-cols-3 g-3">
            {Object.keys(data[0] || {}).filter(key => key != "exist" && key != "Image URL").map((column) => (
              <div key={column} className="col">
                <div className="d-flex justify-content-between align-items-center p-2 border rounded">
                  <span className="text-truncate" title={column}>{column}</span>
                  <Form.Check
                    type="switch"
                    id={`column-${column}`}
                    checked={selectedColumns[column]}
                    onChange={(e) => {
                      setSelectedColumns(prev => ({
                        ...prev,
                        [column]: e.target.checked
                      }));
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Modal.Body>
        <Modal.Footer className="bg-light">
          <Button variant="secondary" onClick={() => setShowColumnDialog(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {showTooltip && (
        <div
          style={{
            position: 'fixed',
            left: tooltipPosition.x,
            top: tooltipPosition.y,
            backgroundColor: 'white',
            padding: '10px',
            borderRadius: '4px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            zIndex: 1000,
            pointerEvents: 'none',
            transition: 'all 0.1s ease-out'
          }}
        >
          <img
            src={tooltipImage}
            alt="Product"
            style={{
              maxWidth: '300px',
              maxHeight: '300px',
              objectFit: 'contain',
              display: 'block'
            }}
          />
        </div>
      )}
    </Card>
  );
};

export default TableComponent; 