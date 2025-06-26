import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Card, Row, Col, Badge, ProgressBar, Table, Alert, Pagination, Form, Modal } from 'react-bootstrap';
import { FaDatabase, FaCheckCircle, FaExclamationTriangle, FaChartLine, FaTable } from 'react-icons/fa';

const DataDisplayComponent = () => {
  const { data: excelData, isLoading, error, percent } = useSelector((state) => state.excel);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showFailedModal, setShowFailedModal] = useState(false);

  if (!excelData || !excelData.success || excelData.success.length === 0) {
    return (
      <div className="text-center py-5">
        <div className="mb-4">
          <FaDatabase className="text-muted" style={{ fontSize: '4rem' }} />
        </div>
        <h4 className="text-secondary mb-2">No Data Available</h4>
        <p className="text-muted">Upload an Excel file to start analyzing your data.</p>
      </div>
    );
  }

  const keys = Object.keys(excelData.success[0] || {});
  const totalItems = excelData.success.length + (excelData.error?.length || 0);
  const successfulItems = excelData.success.length;
  const failedItems = excelData.error?.length || 0;
  const successRate = totalItems > 0 ? ((successfulItems / totalItems) * 100).toFixed(1) : 0;

  const totalPages = Math.ceil(successfulItems / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = excelData.success.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleItemsPerPageChange = (event) => {
    const newItemsPerPage = parseInt(event.target.value, 10);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const handleFailedCardClick = () => {
    setShowFailedModal(true);
  };

  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;

    items.push(
      <Pagination.Prev
        key="prev"
        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
      />
    );

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <Pagination.Item
            key={i}
            active={i === currentPage}
            onClick={() => handlePageChange(i)}
          >
            {i}
          </Pagination.Item>
        );
      }
    } else {
      items.push(
        <Pagination.Item
          key={1}
          active={1 === currentPage}
          onClick={() => handlePageChange(1)}
        >
          1
        </Pagination.Item>
      );

      if (currentPage > 3) {
        items.push(<Pagination.Ellipsis key="start-ellipsis" disabled />);
      }

      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);

      for (let i = startPage; i <= endPage; i++) {
        items.push(
          <Pagination.Item
            key={i}
            active={i === currentPage}
            onClick={() => handlePageChange(i)}
          >
            {i}
          </Pagination.Item>
        );
      }

      if (currentPage < totalPages - 2) {
        items.push(<Pagination.Ellipsis key="end-ellipsis" disabled />);
      }

      items.push(
        <Pagination.Item
          key={totalPages}
          active={totalPages === currentPage}
          onClick={() => handlePageChange(totalPages)}
        >
          {totalPages}
        </Pagination.Item>
      );
    }

    items.push(
      <Pagination.Next
        key="next"
        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
      />
    );

    return items;
  };

  return (
    <div className="mb-4">
      {/* Enhanced Data Summary Cards */}
      <Row className="mb-4 g-3">
        <Col lg={3} md={6}>
          <Card className="text-center border-0 shadow-lg h-100" style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
          }}>
            <Card.Body className="p-4">
              <div className="mb-3">
                <FaDatabase className="fs-1" />
              </div>
              <h2 className="fw-bold mb-1">{totalItems.toLocaleString()}</h2>
              <p className="mb-0 opacity-75">Total Items</p>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} md={6}>
          <Card className="text-center border-0 shadow-lg h-100" style={{
            background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
            color: 'white'
          }}>
            <Card.Body className="p-4">
              <div className="mb-3">
                <FaCheckCircle className="fs-1" />
              </div>
              <h2 className="fw-bold mb-1">{successfulItems.toLocaleString()}</h2>
              <p className="mb-0 opacity-75">Successful</p>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} md={6}>
          <Card 
            className="text-center border-0 shadow-lg h-100" 
            style={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              cursor: 'pointer'
            }}
            onClick={handleFailedCardClick}
          >
            <Card.Body className="p-4">
              <div className="mb-3">
                <FaExclamationTriangle className="fs-1" />
              </div>
              <h2 className="fw-bold mb-1">{failedItems.toLocaleString()}</h2>
              <p className="mb-0 opacity-75">Failed</p>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} md={6}>
          <Card className="text-center border-0 shadow-lg h-100" style={{
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            color: 'white'
          }}>
            <Card.Body className="p-4">
              <div className="mb-3">
                <FaChartLine className="fs-1" />
              </div>
              <h2 className="fw-bold mb-1">{successRate}%</h2>
              <p className="mb-0 opacity-75">Success Rate</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Failed Items Modal */}
      <Modal show={showFailedModal} onHide={() => setShowFailedModal(false)} size="lg">
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title>
            <FaExclamationTriangle className="me-2" />
            Failed Items ({failedItems})
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {excelData.error && excelData.error.length > 0 ? (
            <div className="table-responsive">
              <Table striped bordered hover>
                <thead className="table-danger">
                  <tr>
                    <th>ASIN</th>
                  </tr>
                </thead>
                <tbody>
                  {excelData.error.map((errorItem, index) => (
                    <tr key={index}>
                      <td className="fw-bold">{errorItem || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-4">
              <FaExclamationTriangle className="text-muted mb-3" style={{ fontSize: '3rem' }} />
              <h5 className="text-muted">No failed items found</h5>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <button 
            className="btn btn-secondary" 
            onClick={() => setShowFailedModal(false)}
          >
            Close
          </button>
        </Modal.Footer>
      </Modal>

      {/* Progress Bar */}
      {isLoading && (
        <Card className="mb-4 border-0 shadow-lg">
          <Card.Body className="p-4">
            <div className="d-flex align-items-center mb-3">
              <div className="spinner-border spinner-border-sm text-primary me-3" role="status" />
              <h5 className="mb-0 text-primary">Processing Data...</h5>
            </div>
            <ProgressBar now={percent} label={`${Math.round(percent)}%`} variant="primary" style={{ height: '12px', borderRadius: '6px' }} />
            <small className="text-muted">Progress: {Math.round(percent)}% complete</small>
          </Card.Body>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <Alert variant="danger" className="mb-4 border-0 shadow-sm">
          <Alert.Heading>Error Loading Data</Alert.Heading>
          <p className="mb-0">{error}</p>
        </Alert>
      )}

      {/* Data Table */}
      <Card className="border-0 shadow-lg">
        <Card.Header className="bg-primary text-white py-3">
          <div className="d-flex align-items-center">
            <FaTable className="me-2" />
            <h5 className="mb-0">Data Analysis Results</h5>
            <Badge bg="light" text="primary" className="ms-auto">
              {successfulItems} records
            </Badge>
          </div>
        </Card.Header>
        <Card.Body className="p-0">

          {/* Pagination and Rows Selector */}
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-center py-3 px-3">
            <div className="d-flex align-items-center gap-2 text-muted mb-2 mb-md-0">
              <span>Page</span>
              <Form.Control
                type="number"
                min={1}
                max={totalPages}
                value={currentPage}
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10);
                  if (!isNaN(value)) setCurrentPage(value > totalPages ? totalPages : value < 1 ? 1 : value);
                }}
                onBlur={(e) => {
                  const value = parseInt(e.target.value, 10);
                  if (!isNaN(value)) setCurrentPage(Math.max(1, Math.min(value, totalPages)));
                }}
                style={{ width: '70px' }}
                size="sm"
              />
              <span>of {totalPages}</span>
            </div>
            <div className="d-flex align-items-center gap-3">
              <Form.Select
                size="sm"
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
                style={{ width: 'auto', backgroundColor: '#f8f9fa', color: '#212529' }}
              >
                {[10, 20, 50, 100].map(option => (
                  <option key={option} value={option} className='text-dark'>
                    {option} rows/page
                  </option>
                ))}
              </Form.Select>
              <Pagination className="mb-0">{renderPaginationItems()}</Pagination>
            </div>
          </div>

          {/* Table */}
          <div className="table-responsive">
            <Table className="mb-0">
              <thead className="table-light">
                <tr>
                  {keys.map((key, index) => (
                    <th key={index} className="border-0 py-3 px-3 fw-semibold text-secondary">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentItems.map((item, rowIndex) => (
                  <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'table-light' : ''}>
                    {keys.map((key, colIndex) => (
                      <td key={colIndex} className="border-0 py-3 px-3">
                        <span className="text-truncate d-inline-block" style={{ maxWidth: '200px' }}>
                          {item[key] || '-'}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default DataDisplayComponent;