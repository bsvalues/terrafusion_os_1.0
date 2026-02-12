import React, { useState } from "react";
import { useParams } from "wouter";

// Sample sketch data for demonstration
const sampleSketches = [
  {
    id: 1,
    reportId: 1,
    title: "First Floor Plan",
    description: "Detailed layout of the first floor with room dimensions",
    sketchUrl: "https://placehold.co/600x400/e6f7ff/0369a1?text=Floor+Plan",
    sketchType: "floor_plan",
    squareFootage: 1850,
    createdAt: "2023-04-12T10:30:45Z",
    updatedAt: "2023-04-15T14:22:10Z",
  },
  {
    id: 2,
    reportId: 1,
    title: "Property Site Plan",
    description: "Overview of the property boundaries and site features",
    sketchUrl: "https://placehold.co/600x400/f0fdf4/166534?text=Site+Plan",
    sketchType: "site_plan",
    squareFootage: 5280,
    createdAt: "2023-04-10T08:45:22Z",
    updatedAt: "2023-04-14T09:17:33Z",
  },
  {
    id: 3,
    reportId: 1,
    title: "Front Elevation",
    description: "Front view of the property with height measurements",
    sketchUrl: "https://placehold.co/600x400/fef3c7/92400e?text=Elevation",
    sketchType: "elevation",
    squareFootage: null,
    createdAt: "2023-04-11T15:22:18Z",
    updatedAt: "2023-04-13T11:05:42Z",
  },
];

// Helper function to format dates nicely
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// Function to get human-readable sketch type
const formatSketchType = (type: string) => {
  return type
    .replace("_", " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export default function BasicSketchesPage() {
  console.log("Rendering BasicSketchesPage");
  const params = useParams<{ reportId?: string }>();
  const reportId = Number(params.reportId) || 1;

  // State for filtering and viewing sketches
  const [activeSketchType, setActiveSketchType] = useState<string>("all");
  const [selectedSketch, setSelectedSketch] = useState<number | null>(null);

  // Get all unique sketch types for filter options
  const sketchTypes = [
    "all",
    ...Array.from(new Set(sampleSketches.map((sketch) => sketch.sketchType))),
  ];

  // Filter sketches based on selected type
  const filteredSketches =
    activeSketchType === "all"
      ? sampleSketches
      : sampleSketches.filter((sketch) => sketch.sketchType === activeSketchType);

  // Get the currently selected sketch details
  const selectedSketchDetails = selectedSketch
    ? sampleSketches.find((s) => s.id === selectedSketch)
    : null;

  return (
    <div style={{ padding: "20px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}
      >
        <div><>

          <h1 style={{ fontSize: "1.875rem", fontWeight: "bold" }}>Property Sketches</h1>
          <p
</> style={{ color: "#6b7280" }}>
            Create and manage sketches for appraisal report #{reportId}
          </p>
        </div>
        <button
          style={{
            backgroundColor: "#4f46e5",
            color: "white",
            padding: "0.5rem 1rem",
            borderRadius: "0.375rem",
            border: "none",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            cursor: "pointer",
          }}
        >
          <span>+ New Sketch</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid #e5e7eb",
          marginBottom: "1.5rem",
        }}
      >
        {sketchTypes.map((type) => (
          <button
            key={type}
            onClick={() => setActiveSketchType(type)}
            style={{
              padding: "0.5rem 1rem",
              marginRight: "0.5rem",
              backgroundColor: "transparent",
              border: "none",
              borderBottom:
                activeSketchType === type ? "2px solid #4f46e5" : "2px solid transparent",
              color: activeSketchType === type ? "#4f46e5" : "#6b7280",
              fontWeight: activeSketchType === type ? "bold" : "normal",
              cursor: "pointer",
            }}
          >
            {type === "all" ? "All Sketches" : formatSketchType(type)}
          </button>
        ))}
      </div>

      {selectedSketch ? (
        // Sketch Viewer
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "1rem",
            }}
          ><>

            <button
              onClick={() => setSelectedSketch(null)}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "0.375rem 0.75rem",
                backgroundColor: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: "0.375rem",
                color: "#4b5563",
                marginRight: "1rem",
                cursor: "pointer",
              }}
            >
              ← Back to Sketches
            </button>
            <h2
</> style={{ fontSize: "1.25rem", fontWeight: "bold" }}>
              {selectedSketchDetails?.title}
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 300px",
              gap: "1.5rem",
            }}
          >
            {/* Sketch Viewer */}
            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "0.5rem",
                padding: "1rem",
                backgroundColor: "#f9fafb",
                height: "600px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <img
                src={selectedSketchDetails?.sketchUrl}
                alt={selectedSketchDetails?.title}
                style={{ maxWidth: "100%", maxHeight: "100%" }}
              />
            </div>

            {/* Sketch Details */}
            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "0.5rem",
                padding: "1rem",
                backgroundColor: "white",
              }}
            ><>

              <h3 style={{ fontSize: "1.125rem", fontWeight: "bold", marginBottom: "1rem" }}>
                Sketch Details
              </h3>

              <div
</> style={{ marginBottom: "0.75rem" }}><>

                <div style={{ fontWeight: "bold", marginBottom: "0.25rem" }}>Title</div>
                <div
</>>{selectedSketchDetails?.title}</div>
              </div>

              <div style={{ marginBottom: "0.75rem" }}><>

                <div style={{ fontWeight: "bold", marginBottom: "0.25rem" }}>Description</div>
                <div
</>>{selectedSketchDetails?.description}</div>
              </div>

              <div style={{ marginBottom: "0.75rem" }}><>

                <div style={{ fontWeight: "bold", marginBottom: "0.25rem" }}>Type</div>
                <div
</>>
                  {selectedSketchDetails?.sketchType &&
                    formatSketchType(selectedSketchDetails.sketchType)}
                </div>
              </div>

              <div style={{ marginBottom: "0.75rem" }}><>

                <div style={{ fontWeight: "bold", marginBottom: "0.25rem" }}>Square Footage</div>
                <div
</>>
                  {selectedSketchDetails?.squareFootage
                    ? `${selectedSketchDetails.squareFootage} sq ft`
                    : "N/A"}
                </div>
              </div>

              <div style={{ marginBottom: "0.75rem" }}><>

                <div style={{ fontWeight: "bold", marginBottom: "0.25rem" }}>Created</div>
                <div
</>>
                  {selectedSketchDetails?.createdAt && formatDate(selectedSketchDetails.createdAt)}
                </div>
              </div>

              <div style={{ marginBottom: "1.5rem" }}><>

                <div style={{ fontWeight: "bold", marginBottom: "0.25rem" }}>Last Updated</div>
                <div
</>>
                  {selectedSketchDetails?.updatedAt && formatDate(selectedSketchDetails.updatedAt)}
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.5rem" }}><>

                <button
                  style={{
                    padding: "0.5rem 1rem",
                    backgroundColor: "#f3f4f6",
                    color: "#4b5563",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.375rem",
                    cursor: "pointer",
                    flex: "1",
                  }}
                >
                  Edit Details
                </button>
                <button
</>
                  style={{
                    padding: "0.5rem 1rem",
                    backgroundColor: "#fee2e2",
                    color: "#b91c1c",
                    border: "1px solid #fecaca",
                    borderRadius: "0.375rem",
                    cursor: "pointer",
                    flex: "1",
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Sketch Gallery
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {filteredSketches.length > 0 ? (
            filteredSketches.map((sketch) => (
              <div
                key={sketch.id}
                onClick={() => setSelectedSketch(sketch.id)}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "0.5rem",
                  overflow: "hidden",
                  cursor: "pointer",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  backgroundColor: "white",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                }}
              >
                <div
                  style={{
                    height: "200px",
                    overflow: "hidden",
                    backgroundColor: "#f3f4f6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                ><>

                  <img
                    src={sketch.sketchUrl}
                    alt={sketch.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
                <div
</> style={{ padding: "1rem" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "0.5rem",
                    }}
                  ><>

                    <h3 style={{ fontSize: "1.125rem", fontWeight: "bold" }}>{sketch.title}</h3>
                    <span
</>
                      style={{
                        backgroundColor: "#f3f4f6",
                        color: "#4b5563",
                        padding: "0.25rem 0.5rem",
                        borderRadius: "0.25rem",
                        fontSize: "0.75rem",
                      }}
                    >
                      {formatSketchType(sketch.sketchType)}
                    </span>
                  </div><>

                  <p
                    style={{
                      color: "#6b7280",
                      marginBottom: "0.5rem",
                      fontSize: "0.875rem",
                      height: "40px",
                      overflow: "hidden",
                    }}
                  >
                    {sketch.description}
                  </p>
                  <div
</>
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      color: "#6b7280",
                      fontSize: "0.75rem",
                    }}
                  ><>

                    <div>{sketch.squareFootage ? `${sketch.squareFootage} sq ft` : "N/A"}</div>
                    <div
</>>Updated {formatDate(sketch.updatedAt)}</div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div
              style={{
                gridColumn: "1 / -1",
                textAlign: "center",
                padding: "3rem",
                backgroundColor: "#f9fafb",
                borderRadius: "0.5rem",
                border: "1px solid #e5e7eb",
              }}
            ><>

              <div style={{ fontSize: "1.125rem", fontWeight: "500", marginBottom: "0.5rem" }}>
                No sketches found
              </div>
              <p
</> style={{ color: "#6b7280" }}>
                No sketches match the selected filter. Try selecting a different category or create
                a new sketch.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
