import React, { useState } from "react";
import { useLocation } from "wouter";

// Sample report data for demonstration
const sampleReports = [
  {
    id: 1,
    propertyId: 101,
    status: "Active",
    propertyAddress: "123 Main St, Austin, TX",
    lastEdited: "2023-04-15",
  },
  {
    id: 2,
    propertyId: 102,
    status: "Complete",
    propertyAddress: "456 Oak Ave, Dallas, TX",
    lastEdited: "2023-04-10",
  },
  {
    id: 3,
    propertyId: 103,
    status: "Active",
    propertyAddress: "789 Pine Ln, Houston, TX",
    lastEdited: "2023-04-20",
  },
];

// Sample comparable properties
const sampleComparables = [
  {
    id: 1,
    reportId: 1,
    address: "111 First St",
    city: "Austin",
    state: "TX",
    salePrice: 425000,
    grossLivingArea: 2100,
    bedrooms: 3,
    bathrooms: 2,
  },
  {
    id: 2,
    reportId: 1,
    address: "222 Second Ave",
    city: "Austin",
    state: "TX",
    salePrice: 455000,
    grossLivingArea: 2300,
    bedrooms: 4,
    bathrooms: 2.5,
  },
  {
    id: 3,
    reportId: 1,
    address: "333 Third Blvd",
    city: "Austin",
    state: "TX",
    salePrice: 412000,
    grossLivingArea: 2000,
    bedrooms: 3,
    bathrooms: 2,
  },
];

export default function CompsPage() {
  console.log("CompsPage rendering");
  const [, setLocation] = useLocation();
  const [selectedReport, setSelectedReport] = useState<number | null>(1);
  const [comparables, setComparables] = useState(sampleComparables);

  // Get the selected report details
  const selectedReportDetails = selectedReport
    ? sampleReports.find((r) => r.id === selectedReport)
    : null;

  return (
    <div style={{ padding: "20px" }}><>

      <h1 style={{ fontSize: "1.75rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
        Comparable Properties
      </h1>
      <p
</> style={{ color: "#4b5563", marginBottom: "1.5rem" }}>
        Manage comparable properties for your appraisal reports
      </p>

      {/* Report Selector */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          alignItems: "center",
          marginBottom: "1.5rem",
          padding: "1rem",
          backgroundColor: "#f9fafb",
          borderRadius: "0.5rem",
          border: "1px solid #e5e7eb",
        }}
      >
        <div style={{ flex: "1", minWidth: "200px" }}><>

          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
            Select Report
          </label>
          <select
</>
            value={selectedReport || ""}
            onChange={(e) => setSelectedReport(e.target.value ? Number(e.target.value) : null)}
            style={{
              width: "100%",
              padding: "0.5rem",
              border: "1px solid #d1d5db",
              borderRadius: "0.25rem",
              backgroundColor: "white",
            }}
          >
            <option value="">Select a report...</option>
            {sampleReports.map((report) => (
              <option key={report.id} value={report.id}>
                {report.propertyAddress} ({report.status})
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <button
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#4f46e5",
              color: "white",
              border: "none",
              borderRadius: "0.25rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <span>Add Comparable</span>
          </button>
        </div>
      </div>

      {/* Selected Report Details */}
      {selectedReportDetails && (
        <div
          style={{
            marginBottom: "1.5rem",
            padding: "1rem",
            backgroundColor: "#f0f9ff",
            borderRadius: "0.5rem",
            border: "1px solid #bae6fd",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}><>

            <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
              Report: {selectedReportDetails.propertyAddress}
            </h2>
            <div
</>>
              <button
                onClick={() => setLocation(`/snapshots/${selectedReportDetails.propertyId}`)}
                style={{
                  padding: "0.4rem 0.8rem",
                  backgroundColor: "#0ea5e9",
                  color: "white",
                  border: "none",
                  borderRadius: "0.25rem",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem",
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ><>

                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline
</> points="12 6 12 12 16 14"></polyline>
                </svg>
                View Snapshot History
              </button>
            </div>
          </div>
          <div style={{ color: "#4b5563" }}>
            <div>
              Status: <span style={{ fontWeight: "500" }}>{selectedReportDetails.status}</span>
            </div>
            <div>
              Last edited:{" "}
              <span style={{ fontWeight: "500" }}>{selectedReportDetails.lastEdited}</span>
            </div>
            <div style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "#6b7280" }}>
              Property ID: {selectedReportDetails.propertyId}
            </div>
          </div>
        </div>
      )}

      {/* Comparables Table */}
      {selectedReport && comparables.length > 0 ? (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.875rem",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#f9fafb" }}><>

                <th
                  style={{
                    padding: "0.75rem",
                    textAlign: "left",
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  Address
                </th>
                <th
</>
                  style={{
                    padding: "0.75rem",
                    textAlign: "right",
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  Sale Price
                </th><>

                <th
                  style={{
                    padding: "0.75rem",
                    textAlign: "right",
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  Sq Ft
                </th>
                <th
</>
                  style={{
                    padding: "0.75rem",
                    textAlign: "center",
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  Beds/Baths
                </th>
                <th
                  style={{
                    padding: "0.75rem",
                    textAlign: "center",
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {comparables.map((comp) => (
                <tr key={comp.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td style={{ padding: "0.75rem" }}><>

                    <div>{comp.address}</div>
                    <div
</> style={{ color: "#6b7280", fontSize: "0.75rem" }}>
                      {comp.city}, {comp.state}
                    </div>
                  </td><>

                  <td style={{ padding: "0.75rem", textAlign: "right" }}>
                    ${comp.salePrice.toLocaleString()}
                  </td>
                  <td
</> style={{ padding: "0.75rem", textAlign: "right" }}>
                    {comp.grossLivingArea.toLocaleString()}
                  </td><>

                  <td style={{ padding: "0.75rem", textAlign: "center" }}>
                    {comp.bedrooms}/{comp.bathrooms}
                  </td>
                  <td
</> style={{ padding: "0.75rem", textAlign: "center" }}>
                    <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                      <button
                        onClick={() =>
                          setLocation(`/snapshots/${selectedReportDetails?.propertyId}`)
                        }
                        style={{
                          padding: "0.375rem 0.75rem",
                          backgroundColor: "#e0f2fe",
                          color: "#0284c7",
                          border: "1px solid #bae6fd",
                          borderRadius: "0.25rem",
                          cursor: "pointer",
                          fontSize: "0.75rem",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.3rem",
                        }}
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        ><>

                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline
</> points="12 6 12 12 16 14"></polyline>
                        </svg>
                        History
                      </button><>

                      <button
                        style={{
                          padding: "0.375rem 0.75rem",
                          backgroundColor: "#f3f4f6",
                          color: "#4b5563",
                          border: "1px solid #d1d5db",
                          borderRadius: "0.25rem",
                          cursor: "pointer",
                          fontSize: "0.75rem",
                        }}
                      >
                        Edit
                      </button>
                      <button
</>
                        style={{
                          padding: "0.375rem 0.75rem",
                          backgroundColor: "#fee2e2",
                          color: "#b91c1c",
                          border: "1px solid #fecaca",
                          borderRadius: "0.25rem",
                          cursor: "pointer",
                          fontSize: "0.75rem",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div
          style={{
            textAlign: "center",
            padding: "3rem 1rem",
            backgroundColor: "#f9fafb",
            borderRadius: "0.5rem",
            border: "1px solid #e5e7eb",
          }}
        ><>

          <div style={{ fontSize: "1.125rem", fontWeight: "500", marginBottom: "0.5rem" }}>
            No comparable properties
          </div>
          <p
</> style={{ color: "#6b7280" }}>
            {selectedReport
              ? "No comparable properties have been added to this report yet."
              : "Please select a report to view its comparable properties."}
          </p>
        </div>
      )}
    </div>
  );
}
