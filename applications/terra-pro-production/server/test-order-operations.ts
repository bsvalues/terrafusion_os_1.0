import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";

// Base URL for API requests
const API_BASE_URL = "http://localhost:5000/api";

// Test IDs to associate with test orders
const TEST_USER_ID = 1;
const TEST_PROPERTY_ID = 1;

// Function to create a test order
async function createOrder() {
  try {
    // First create the order without attachment
    const orderData = {
      userId: Number(TEST_USER_ID),
      propertyId: Number(TEST_PROPERTY_ID),
      orderType: "appraisal",
      status: "pending",
      priority: "high",
      notes: "Test order created via API",
    };

    // Sending JSON request for order creation
    console.log("Creating order with data:", orderData);
    const response = await axios.post(`${API_BASE_URL}/orders`, orderData);

    console.log("Order created successfully:", response.data);
    return response.data.order.id;
  } catch (error) {
    console.error("Error creating order:", error.response?.data || error.message);
    return null;
  }
}

// Function to get all orders
async function getOrders() {
  try {
    const response = await axios.get(`${API_BASE_URL}/orders`);
    console.log("All orders:", response.data);
  } catch (error) {
    console.error("Error fetching orders:", error.response?.data || error.message);
  }
}

// Function to get a specific order
async function getOrderById(id: number) {
  try {
    const response = await axios.get(`${API_BASE_URL}/orders/${id}`);
    console.log("Order details:", response.data);
  } catch (error) {
    console.error("Error fetching order:", error.response?.data || error.message);
  }
}

// Function to update an order
async function updateOrder(id: number) {
  try {
    const formData = new FormData();

    // Add updated data
    formData.append("notes", "Updated notes for test order");
    formData.append("priority", "medium");

    const response = await axios.put(`${API_BASE_URL}/orders/${id}`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });

    console.log("Order updated successfully:", response.data);
  } catch (error) {
    console.error("Error updating order:", error.response?.data || error.message);
  }
}

// Function to update just the order status
async function updateOrderStatus(id: number) {
  try {
    const response = await axios.patch(`${API_BASE_URL}/orders/${id}/status`, {
      status: "in_progress",
      notes: "Order processing started",
    });

    console.log("Order status updated successfully:", response.data);
  } catch (error) {
    console.error("Error updating order status:", error.response?.data || error.message);
  }
}

// Function to create a payment intent
async function createPaymentIntent(orderId: number) {
  try {
    const response = await axios.post(`${API_BASE_URL}/orders/payment-intent`, {
      amount: 350.0,
      orderId,
    });

    console.log("Payment intent created:", response.data);
  } catch (error) {
    console.error("Error creating payment intent:", error.response?.data || error.message);
  }
}

// Function to delete an order
async function deleteOrder(id: number) {
  try {
    const response = await axios.delete(`${API_BASE_URL}/orders/${id}`);
    console.log("Order deleted successfully:", response.data);
  } catch (error) {
    console.error("Error deleting order:", error.response?.data || error.message);
  }
}

// Main test function
async function runTests() {
  console.log("Starting order operation tests...");

  // Create an order
  const orderId = await createOrder();
  if (!orderId) {
    console.log("Terminating tests due to order creation failure");
    return;
  }

  // Get all orders
  await getOrders();

  // Get the created order
  await getOrderById(orderId);

  // Update the order
  await updateOrder(orderId);

  // Update order status
  await updateOrderStatus(orderId);

  // Create a payment intent
  await createPaymentIntent(orderId);

  // Get the updated order
  await getOrderById(orderId);

  // Delete the order (comment out if you want to keep it)
  // await deleteOrder(orderId);

  console.log("Order operation tests completed");
}

// Run the tests
runTests().catch(console.error);
