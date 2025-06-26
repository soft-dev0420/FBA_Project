import React from 'react';
import { Spinner, ProgressBar, Card, Badge } from 'react-bootstrap';

const LoadingComponent = ({
  isLoading,
  percent = 0,
  message = "Loading...",
  showProgress = true,
  variant = "primary",
  size = "lg"
}) => {
  if (!isLoading) return null;

  return (
    <div className="text-center py-5">
      <Spinner animation="border" variant={variant} size={size} />
      <h4 className="text-secondary mt-3">{message}</h4>

      {showProgress && percent > 0 && (
        <div className="w-75 mx-auto mt-3">
          <ProgressBar
            now={percent}
            label={`${Math.round(percent)}%`}
            variant="success"
            className="mb-2"
          />
          <small className="text-muted">
            Progress: {Math.round(percent)}% complete
          </small>
        </div>
      )}
    </div>
  );
};

// Specialized loading components
export const DataLoadingComponent = ({ isLoading, percent, itemCount = 0 }) => (
  <LoadingComponent
    isLoading={isLoading}
    percent={percent}
    message={`Fetching data for ${itemCount} items...`}
    showProgress={true}
    variant="primary"
  />
);

export const FileLoadingComponent = ({ isLoading, fileName }) => (
  <LoadingComponent
    isLoading={isLoading}
    message={`Processing ${fileName}...`}
    showProgress={false}
    variant="info"
  />
);

export const NetworkLoadingComponent = ({ isLoading, endpoint }) => (
  <LoadingComponent
    isLoading={isLoading}
    message={`Connecting to ${endpoint}...`}
    showProgress={false}
    variant="warning"
  />
);

export default LoadingComponent; 