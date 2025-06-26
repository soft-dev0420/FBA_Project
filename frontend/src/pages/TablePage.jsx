import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as XLSX from 'xlsx';
import TableComponent from '../components/TableComponent';
import LoadingComponent from '../components/LoadingComponent';
import { fetchExcelData, clearData } from '../redux/reducers/excelReducer';
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
import DataDisplayComponent from '../components/DataDisplayComponent';

const TablePage = () => {
  const [fileName, setFileName] = useState('');
  const [noAsinsFound, setNoAsinsFound] = useState(false);
  const [asinsCount, setAsinsCount] = useState(0);
  const dispatch = useDispatch();
  const { isLoading, data, error, percent } = useSelector((state) => state.excel);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setNoAsinsFound(false);

    // Clear previous data
    dispatch(clearData());

    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const workbook = XLSX.read(event.target.result, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const asins = jsonData.map(row => row[0]).filter(Boolean);
        setAsinsCount(asins.length);

        if (asins.length > 0) {
          dispatch(fetchExcelData({ asins, country: 'US' }));
        } else {
          console.warn('No ASINs found in the uploaded file.');
          setNoAsinsFound(true);
        }
      } catch (err) {
        console.error('Error processing Excel file:', err);
      }
    };

    reader.onerror = (err) => {
      console.error('Error reading file:', err);
    };

    reader.readAsBinaryString(file);
  };
  console.log(data);

  return (
    <Container fluid className="py-2 min-vh-80">
      <Row className="justify-content-center">
        <Col xs={12} xl={10}>
          <Card className="shadow-lg border-0">
            <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center rounded-top py-4">
              <div className="d-flex align-items-center">
                <i className="bi bi-table fs-3 me-2"></i>
                <h4 className="mb-0">ASIN Data Viewer</h4>
              </div>
              {data.length > 0 && (
                <Badge bg="light" text="primary" className="fs-6 fw-medium shadow-sm px-3 py-2 rounded-pill">
                  <i className="bi bi-file-earmark-excel me-1"></i>
                  {fileName} - {data.length} items
                </Badge>
              )}
            </Card.Header>

            <Card.Body className="bg-white rounded-bottom p-4">
              {isLoading ? (
                <LoadingComponent
                  isLoading={isLoading}
                  percent={percent}
                  message={`Fetching ASIN Data from Amazon for ${asinsCount} items...`}
                  showProgress={true}
                  variant="primary"
                />
              ) : error ? (
                <div className="text-center py-5">
                  <i className="bi bi-exclamation-triangle-fill text-warning" style={{ fontSize: '4rem' }}></i>
                  <h4 className="text-warning mt-3 mb-2">Data Loading Issue</h4>
                  <p className="text-muted mb-3">
                    {error.includes('Network Error') || error.includes('ERR_NETWORK')
                      ? 'Unable to connect to the server. Please check your internet connection.'
                      : typeof error === 'object' ? JSON.stringify(error) : error
                    }
                  </p>
                  <div className="d-flex justify-content-center gap-3">
                    <label htmlFor="fileInputError">
                      <Button variant="primary" size="lg" as="span">
                        <i className="bi bi-upload me-2"></i>
                        Upload a Different File
                      </Button>
                    </label>
                    <Button variant="outline-secondary" size="lg" onClick={() => window.location.reload()}>
                      <i className="bi bi-arrow-clockwise me-2"></i>
                      Retry
                    </Button>
                  </div>
                  <input
                    type="file"
                    className="d-none"
                    id="fileInputError"
                    accept=".xlsx, .xls"
                    onChange={handleFileUpload}
                  />
                </div>
              ) : noAsinsFound ? (
                <div className="text-center py-5">
                  <i className="bi bi-exclamation-circle-fill text-warning" style={{ fontSize: '4rem' }}></i>
                  <h4 className="text-warning mt-3 mb-2">No ASINs Found</h4>
                  <p className="text-muted mb-4">
                    The uploaded file doesn't contain any valid ASINs in the first column.
                    Please ensure your Excel file has ASINs in the first column.
                  </p>
                  <label htmlFor="fileInputNoAsins">
                    <Button variant="primary" size="lg" as="span">
                      <i className="bi bi-upload me-2"></i>
                      Upload a Different File
                    </Button>
                  </label>
                  <input
                    type="file"
                    className="d-none"
                    id="fileInputNoAsins"
                    accept=".xlsx, .xls"
                    onChange={handleFileUpload}
                  />
                </div>
              ) : data.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-file-earmark-excel text-primary" style={{ fontSize: '4rem' }}></i>
                  <h4 className="text-secondary mt-3 mb-2">No Excel File Loaded</h4>
                  <p className="text-muted mb-4">Start by uploading a spreadsheet to visualize your data.</p>
                  <label htmlFor="fileInput">
                    <Button variant="primary" size="lg" as="span">
                      <i className="bi bi-upload me-2"></i>
                      Upload Excel File
                    </Button>
                  </label>
                  <input
                    type="file"
                    className="d-none"
                    id="fileInput"
                    accept=".xlsx, .xls"
                    onChange={handleFileUpload}
                  />
                  <p className="text-muted mt-3 small">
                    Supported formats: <strong>.xlsx</strong>, <strong>.xls</strong>
                  </p>
                </div>
              ) : (
                <>
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="d-flex gap-2">
                      <label htmlFor="fileInput">
                        <Button variant="outline-primary" as="span">
                          <i className="bi bi-arrow-clockwise me-2"></i>
                          Upload Another File
                        </Button>
                      </label>
                      <Button
                        variant="outline-secondary"
                        onClick={() => dispatch(clearData())}
                      >
                        <i className="bi bi-trash me-2"></i>
                        Clear Data
                      </Button>
                    </div>
                    <small className="text-muted">
                      <i className="bi bi-info-circle me-1"></i>
                      Click rows to inspect data
                    </small>
                  </div>
                  <input
                    type="file"
                    className="d-none"
                    id="fileInput"
                    accept=".xlsx, .xls"
                    onChange={handleFileUpload}
                  />
                  <div className="table-responsive">
                    {/* <TableComponent data={data}/> */}
                    <DataDisplayComponent />
                  </div>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default TablePage;
