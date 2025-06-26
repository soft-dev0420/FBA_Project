import React from "react";

function ValidationAlerts({ validation }) {
  if (!validation.length) return null;
  return (
    <div className="alert alert-warning">
      <ul className="mb-0">
        {validation.map((msg, i) => <li key={i}>{msg}</li>)}
      </ul>
    </div>
  );
}

export default ValidationAlerts;
