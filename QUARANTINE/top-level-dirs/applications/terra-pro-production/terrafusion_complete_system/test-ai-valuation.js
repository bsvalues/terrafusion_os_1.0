/**
 * Test client for AI valuation API
 */
import fetch from "node-fetch";

// Test both endpoints
async function testAIValuation() {
  console.log("Testing AI Valuation API...");

  try {
    // Test GET endpoint with a property ID
    console.log("\nTesting GET /api/ai/value/1:");
    const getResponse = await fetch("http://localhost:5000/api/ai/value/1");
    const getData = await getResponse.json();
    console.log("Status:", getResponse.status);
    console.log("Response:", JSON.stringify(getData, null, 2));

    // Test POST endpoint with property details
    console.log("\nTesting POST /api/ai/value:");
    const propertyDetails = {
      address: {
        street: "789 Test Avenue",
        city: "TestCity",
        state: "TS",
        zipCode: "12345",
      },
      propertyType: "single-family",
      bedrooms: 4,
      bathrooms: 2,
      squareFeet: 2400,
      yearBuilt: 2000,
      lotSize: 0.3,
      features: [{ name: "Updated Kitchen" }, { name: "Hardwood Floors" }, { name: "Fireplace" }],
      condition: "Excellent",
    };

    const postResponse = await fetch("http://localhost:5000/api/ai/value", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(propertyDetails),
    });

    const postData = await postResponse.json();
    console.log("Status:", postResponse.status);
    console.log("Response:", JSON.stringify(postData, null, 2));
  } catch (error) {
    console.error("Error testing AI Valuation API:", error);
  }
}

// Execute the test
testAIValuation();
