import React from "react";

const ErrorMessage: React.FC<{ error: string }> = ({ error }) => (
  <div className="text-red-400 bg-red-900/30 border border-red-400/30 rounded-xl p-4 mb-4 shadow-lg">
    {error}
  </div>
);

export default ErrorMessage; 