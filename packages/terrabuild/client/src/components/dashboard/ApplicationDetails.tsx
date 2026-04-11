import React from "react";
import { APP_DETAILS } from "@/data/constants";

const DETAIL_ROWS = [
  { label: 'Application', value: APP_DETAILS.name },
  { label: 'Version',     value: APP_DETAILS.version },
  { label: 'County',      value: APP_DETAILS.county },
  { label: 'Description', value: APP_DETAILS.description },
];

export default function ApplicationDetails() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4">
      <h3 className="text-sm font-medium text-neutral-500 mb-3">Application Details</h3>
      <div className="space-y-2">
        {DETAIL_ROWS.map((row, index) => (
          <div className="flex justify-between items-center" key={index}>
            <div className="text-xs text-neutral-500">{row.label}:</div>
            <div className="text-xs font-medium text-neutral-600">{row.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
