import React from 'react';
import { useSelector } from 'react-redux';
import { Card, Row, Col, Badge, ProgressBar, Table, Alert } from 'react-bootstrap';
import { FaDatabase, FaCheckCircle, FaExclamationTriangle, FaChartLine, FaTable } from 'react-icons/fa';

const DataDisplayComponent = () => {
  const { data: excelData, isLoading, error, percent } = useSelector((state) => state.excel);

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
          <Card className="text-center border-0 shadow-lg h-100" style={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white'
          }}>
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

      {/* Enhanced Progress Indicator */}
      {isLoading && (
        <Card className="mb-4 border-0 shadow-lg">
          <Card.Body className="p-4">
            <div className="d-flex align-items-center mb-3">
              <div className="spinner-border spinner-border-sm text-primary me-3" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <h5 className="mb-0 text-primary">Processing Data...</h5>
            </div>
            <ProgressBar
              now={percent}
              label={`${Math.round(percent)}%`}
              variant="primary"
              className="mb-2"
              style={{ height: '12px', borderRadius: '6px' }}
            />
            <small className="text-muted">
              <i className="bi bi-clock me-1"></i>
              Progress: {Math.round(percent)}% complete
            </small>
          </Card.Body>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="danger" className="mb-4 border-0 shadow-sm">
          <Alert.Heading>
            <i className="bi bi-exclamation-triangle me-2"></i>
            Error Loading Data
          </Alert.Heading>
          <p className="mb-0">{error}</p>
        </Alert>
      )}

      {/* Enhanced Data Table */}
      {excelData.success.length > 0 && (
        <Card className="border-0 shadow-lg">
          <Card.Header className="bg-primary text-white py-3">
            <div className="d-flex align-items-center">
              <FaTable className="me-2" />
              <h5 className="mb-0">Data Analysis Results</h5>
              <Badge bg="light" text="primary" className="ms-auto">
                {excelData.success.length} records
              </Badge>
            </div>
          </Card.Header>
          <Card.Body className="p-0">
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
                  {excelData.success.map((item, rowIndex) => (
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
      )}
    </div>
  );
};

export default DataDisplayComponent;