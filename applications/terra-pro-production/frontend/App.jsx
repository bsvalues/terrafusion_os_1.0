import React, { useState, useEffect } from "react";
import "./App.css";

const conditions = ["Excellent", "Good", "Average", "Fair", "Poor"];

const propertyTypes = ["single-family", "condo", "townhouse", "multi-family", "land"];

function formatCurrency(value) {
  if (!value && value !== 0) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function App() {
  // Property form state
  const [formData, setFormData] = useState({
    address: "",
    city: "",
    state: "",
    zipCode: "",
    propertyType: "single-family",
    bedrooms: "",
    bathrooms: "",
    squareFeet: "",
    yearBuilt: "",
    lotSize: "",
    condition: "Good",
    features: {
      "Hardwood Floors": false,
      "Updated Kitchen": false,
      Fireplace: false,
      Deck: false,
      "Swimming Pool": false,
      Garage: false,
      "Central AC": false,
      "New Roof": false,
    },
  });

  // Valuation result state
  const [valuationResult, setValuationResult] = useState(null);

  // Loading state
  const [isLoading, setIsLoading] = useState(false);

  // Error state
  const [error, setError] = useState(null);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.startsWith("feature-")) {
      const featureName = name.replace("feature-", "");
      setFormData({
        ...formData,
        features: {
          ...formData.features,
          [featureName]: checked,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  // Sample data for Walla Walla property
  const fillSampleData = () => {
    setFormData({
      address: "4234 Old Milton Hwy",
      city: "Walla Walla",
      state: "WA",
      zipCode: "99362",
      propertyType: "single-family",
      bedrooms: "4",
      bathrooms: "2.5",
      squareFeet: "2450",
      yearBuilt: "1974",
      lotSize: "0.38",
      condition: "Good",
      features: {
        "Hardwood Floors": true,
        "Updated Kitchen": true,
        Fireplace: true,
        Deck: true,
        "Swimming Pool": false,
        Garage: true,
        "Central AC": true,
        "New Roof": true,
      },
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setValuationResult(null);

    try {
      // First check if we can use the real-time property analysis endpoint
      const analysisResponse = await fetch("/api/realtime/propertyAnalysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          propertyType: formData.propertyType,
        }),
      });

      if (analysisResponse.ok) {
        const analysisData = await analysisResponse.json();

        // If we got a valid estimated value (not a placeholder text)
        if (
          analysisData.marketData &&
          analysisData.marketData.estimatedValue &&
          analysisData.marketData.estimatedValue.includes("$")
        ) {
          // Format the data to display on the UI
          setValuationResult({
            estimatedValue: analysisData.marketData.estimatedValue,
            valueRange: {
              min: analysisData.marketData.estimatedValue,
              max: analysisData.marketData.estimatedValue,
            },
            confidenceLevel:
              analysisData.marketData.confidenceScore >= 0.8
                ? "high"
                : analysisData.marketData.confidenceScore >= 0.5
                  ? "medium"
                  : "low",
            adjustments: [],
            marketAnalysis: analysisData.marketData.marketTrends || "Market analysis not available",
            comparableAnalysis: analysisData.marketData.comparableSales
              ? `Based on ${analysisData.marketData.comparableSales.length} comparable properties in the area.`
              : "Comparable analysis not available",
            propertyAnalysis: analysisData.propertyAnalysis,
            appraisalSummary: analysisData.appraisalSummary,
          });

          setIsLoading(false);
          return;
        }
      }

      // If the real-time endpoint doesn't return a valid result,
      // fall back to the Python API for full valuation

      // Convert features to array format expected by API
      const featuresArray = Object.entries(formData.features)
        .filter(([_, isChecked]) => isChecked)
        .map(([name, _]) => ({ name, value: "Yes" }));

      // Prepare the request data
      const requestData = {
        property: {
          address: {
            street: formData.address,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode,
          },
          propertyType: formData.propertyType,
          bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
          bathrooms: formData.bathrooms ? parseFloat(formData.bathrooms) : null,
          squareFeet: formData.squareFeet ? parseInt(formData.squareFeet) : null,
          yearBuilt: formData.yearBuilt ? parseInt(formData.yearBuilt) : null,
          lotSize: formData.lotSize ? parseFloat(formData.lotSize) : null,
          condition: formData.condition,
          features: featuresArray,
        },
      };

      // The URL needs to be configured based on your deployment
      // For local development with Python FastAPI running on port 8000:
      const apiUrl = "http://localhost:8000/appraise";

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setValuationResult(data);
    } catch (error) {
      console.error("Error during valuation:", error);
      setError("Failed to perform valuation. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header>
        <h1>Terrafusion Core AI Valuator</h1>
        <p>Advanced property valuation with AI analysis</p>
      </header>

      <main>
        <div className="container">
          <div className="row">
            <div className="col-md-6">
              <div className="card">
                <div className="card-header">
                  <h2>Property Details</h2>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={fillSampleData}
                  >
                    Fill Sample Data
                  </button>
                </div>

                <div className="card-body">
                  <form onSubmit={handleSubmit}>
                    <div className="form-section">
                      <h3>Location</h3>
                      <div className="form-group">
                        <label htmlFor="address">Street Address</label>
                        <input
                          type="text"
                          id="address"
                          name="address"
                          className="form-control"
                          value={formData.address}
                          onChange={handleInputChange}
                          required
                        />
                      </div>

                      <div className="form-row">
                        <div className="form-group col-md-6">
                          <label htmlFor="city">City</label>
                          <input
                            type="text"
                            id="city"
                            name="city"
                            className="form-control"
                            value={formData.city}
                            onChange={handleInputChange}
                            required
                          />
                        </div>

                        <div className="form-group col-md-3">
                          <label htmlFor="state">State</label>
                          <input
                            type="text"
                            id="state"
                            name="state"
                            className="form-control"
                            value={formData.state}
                            onChange={handleInputChange}
                            required
                          />
                        </div>

                        <div className="form-group col-md-3">
                          <label htmlFor="zipCode">ZIP Code</label>
                          <input
                            type="text"
                            id="zipCode"
                            name="zipCode"
                            className="form-control"
                            value={formData.zipCode}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="form-section">
                      <h3>Property Characteristics</h3>

                      <div className="form-group">
                        <label htmlFor="propertyType">Property Type</label>
                        <select
                          id="propertyType"
                          name="propertyType"
                          className="form-control"
                          value={formData.propertyType}
                          onChange={handleInputChange}
                          required
                        >
                          {propertyTypes.map((type) => (
                            <option key={type} value={type}>
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-row">
                        <div className="form-group col-md-4">
                          <label htmlFor="bedrooms">Bedrooms</label>
                          <input
                            type="number"
                            id="bedrooms"
                            name="bedrooms"
                            className="form-control"
                            value={formData.bedrooms}
                            onChange={handleInputChange}
                            min="0"
                            step="1"
                          />
                        </div>

                        <div className="form-group col-md-4">
                          <label htmlFor="bathrooms">Bathrooms</label>
                          <input
                            type="number"
                            id="bathrooms"
                            name="bathrooms"
                            className="form-control"
                            value={formData.bathrooms}
                            onChange={handleInputChange}
                            min="0"
                            step="0.5"
                          />
                        </div>

                        <div className="form-group col-md-4">
                          <label htmlFor="yearBuilt">Year Built</label>
                          <input
                            type="number"
                            id="yearBuilt"
                            name="yearBuilt"
                            className="form-control"
                            value={formData.yearBuilt}
                            onChange={handleInputChange}
                            min="1800"
                            max={new Date().getFullYear()}
                          />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group col-md-6">
                          <label htmlFor="squareFeet">Square Feet</label>
                          <input
                            type="number"
                            id="squareFeet"
                            name="squareFeet"
                            className="form-control"
                            value={formData.squareFeet}
                            onChange={handleInputChange}
                            min="0"
                          />
                        </div>

                        <div className="form-group col-md-6">
                          <label htmlFor="lotSize">Lot Size (acres)</label>
                          <input
                            type="number"
                            id="lotSize"
                            name="lotSize"
                            className="form-control"
                            value={formData.lotSize}
                            onChange={handleInputChange}
                            min="0"
                            step="0.01"
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label htmlFor="condition">Condition</label>
                        <select
                          id="condition"
                          name="condition"
                          className="form-control"
                          value={formData.condition}
                          onChange={handleInputChange}
                        >
                          {conditions.map((condition) => (
                            <option key={condition} value={condition}>
                              {condition}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="form-section">
                      <h3>Features</h3>
                      <div className="feature-grid">
                        {Object.keys(formData.features).map((feature) => (
                          <div key={feature} className="feature-item">
                            <input
                              type="checkbox"
                              id={`feature-${feature}`}
                              name={`feature-${feature}`}
                              checked={formData.features[feature]}
                              onChange={handleInputChange}
                            />
                            <label htmlFor={`feature-${feature}`}>{feature}</label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="form-group mt-4">
                      <button
                        type="submit"
                        className="btn btn-primary btn-lg btn-block"
                        disabled={isLoading}
                      >
                        {isLoading ? "Analyzing Property..." : "Appraise Property"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              {isLoading && (
                <div className="card">
                  <div className="card-body text-center">
                    <div className="spinner-border text-primary" role="status">
                      <span className="sr-only">Loading...</span>
                    </div>
                    <p className="loading-text">Analyzing property data and market conditions...</p>
                  </div>
                </div>
              )}

              {!isLoading && valuationResult && (
                <div className="card valuation-result">
                  <div className="card-header">
                    <h2>Valuation Results</h2>
                  </div>

                  <div className="card-body">
                    <div className="valuation-summary">
                      <h3>Estimated Value</h3>
                      <div className="estimated-value">
                        {typeof valuationResult.estimatedValue === "number"
                          ? formatCurrency(valuationResult.estimatedValue)
                          : valuationResult.estimatedValue}
                      </div>

                      {valuationResult.valueRange && (
                        <div className="value-range">
                          Range:{" "}
                          {typeof valuationResult.valueRange.min === "number"
                            ? formatCurrency(valuationResult.valueRange.min)
                            : valuationResult.valueRange.min}{" "}
                          -
                          {typeof valuationResult.valueRange.max === "number"
                            ? formatCurrency(valuationResult.valueRange.max)
                            : valuationResult.valueRange.max}
                        </div>
                      )}

                      <div className={`confidence-level ${valuationResult.confidenceLevel}`}>
                        <span className="confidence-label">Confidence:</span>
                        <span className="confidence-value">
                          {valuationResult.confidenceLevel.charAt(0).toUpperCase() +
                            valuationResult.confidenceLevel.slice(1)}
                        </span>
                      </div>
                    </div>

                    {/* Appraisal Summary - from the realtime endpoint */}
                    {valuationResult.appraisalSummary && (
                      <div className="section">
                        <h3>Appraisal Summary</h3>
                        <div className="appraisal-summary">
                          {valuationResult.appraisalSummary.comments && (
                            <p>{valuationResult.appraisalSummary.comments}</p>
                          )}
                          {valuationResult.appraisalSummary.valuationApproach && (
                            <p>
                              <strong>Approach:</strong>{" "}
                              {valuationResult.appraisalSummary.valuationApproach}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Market Analysis */}
                    <div className="section">
                      <h3>Market Analysis</h3>
                      <p>{valuationResult.marketAnalysis}</p>
                    </div>

                    {/* Property Analysis - from the realtime endpoint */}
                    {valuationResult.propertyAnalysis && (
                      <div className="section">
                        <h3>Property Analysis</h3>
                        <div className="property-analysis">
                          {valuationResult.propertyAnalysis.condition && (
                            <p>
                              <strong>Condition:</strong>{" "}
                              {valuationResult.propertyAnalysis.condition}
                            </p>
                          )}

                          {valuationResult.propertyAnalysis.qualityRating && (
                            <p>
                              <strong>Quality Rating:</strong>{" "}
                              {valuationResult.propertyAnalysis.qualityRating}
                            </p>
                          )}

                          {valuationResult.propertyAnalysis.features &&
                            valuationResult.propertyAnalysis.features.length > 0 && (
                              <div>
                                <strong>Features:</strong>
                                <ul className="features-list">
                                  {valuationResult.propertyAnalysis.features.map(
                                    (feature /* , index */) => (
                                      <li key={index}>{feature}</li>
                                    )
                                  )}
                                </ul>
                              </div>
                            )}

                          {valuationResult.propertyAnalysis.improvements &&
                            valuationResult.propertyAnalysis.improvements.length > 0 && (
                              <div>
                                <strong>Recent Improvements:</strong>
                                <ul className="improvements-list">
                                  {valuationResult.propertyAnalysis.improvements.map(
                                    (improvement /* , index */) => (
                                      <li key={index}>{improvement}</li>
                                    )
                                  )}
                                </ul>
                              </div>
                            )}
                        </div>
                      </div>
                    )}

                    {/* Value Adjustments */}
                    {valuationResult.adjustments && valuationResult.adjustments.length > 0 && (
                      <div className="section">
                        <h3>Value Adjustments</h3>
                        <div className="adjustments">
                          {valuationResult.adjustments.map((adj /* , index */) => (
                            <div key={index} className="adjustment-item">
                              <div className="adjustment-factor">{adj.factor}</div>
                              <div className="adjustment-description">{adj.description}</div>
                              <div className="adjustment-amount">
                                {typeof adj.amount === "number"
                                  ? formatCurrency(adj.amount)
                                  : adj.amount}
                              </div>
                              <div className="adjustment-reasoning">{adj.reasoning}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Comparable Analysis */}
                    <div className="section">
                      <h3>Comparable Analysis</h3>
                      <p>{valuationResult.comparableAnalysis}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer>
        <p>&copy; 2025 Terrafusion. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
