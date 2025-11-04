import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";

// Server URL, typically accessible on port 5000 in Replit
const SERVER_URL = "http://localhost:5000";

// Path to the PDF file to upload
const PDF_FILE_PATH = path.join(process.cwd(), "attached_assets", "415 Order.pdf");

async function testOrderFileUpload() {
  console.log("Starting order file upload test...");

  // Check if the file exists
  if (!fs.existsSync(PDF_FILE_PATH)) {
    console.error(`Error: File not found at ${PDF_FILE_PATH}`);
    return;
  }

  // Create the form data
  const formData = new FormData();
  formData.append("attachment", fs.createReadStream(PDF_FILE_PATH));
  formData.append("userId", "1");
  formData.append("propertyId", "1");
  formData.append("orderType", "appraisal");
  formData.append("status", "pending");
  formData.append("priority", "high");
  formData.append("notes", "Test order with PDF attachment");

  try {
    // Send the API request
    const response = await axios.post(`${SERVER_URL}/api/orders`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });

    console.log("Order created successfully with file upload:");
    console.log(response.data);

    // If the order was created successfully, test getting the order
    if (response.data.order && response.data.order.id) {
      const orderId = response.data.order.id;

      console.log(`Fetching order with ID ${orderId}...`);
      const getResponse = await axios.get(`${SERVER_URL}/api/orders/${orderId}`);
      console.log("Order details:");
      console.log(getResponse.data);
    }
  } catch (error) {
    console.error(
      "Error uploading file with order:",
      error.response ? error.response.data : error.message
    );
  }
}

// Run the test
testOrderFileUpload()
  .then(() => console.log("Order file upload test completed"))
  .catch((err) => console.error("Error in test:", err));
