// This file handles all communication between your React app and the backend server
// Think of it as a "messenger" that sends requests to your server and brings back responses

const API_BASE = "http://localhost:5000/api"; // This is your server's address

// ======================
// USER AUTHENTICATION
// ======================

// This function logs in existing users
// It sends email and password to the server and gets back a token if successful
export async function loginUser(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST", // We're sending data to the server
    headers: { "Content-Type": "application/json" }, // Tells server we're sending JSON
    body: JSON.stringify({ email, password }) // Convert JS object to JSON string
  });
  
  // If login fails, throw an error with the server's message
  if (!res.ok) throw new Error((await res.json()).message || "Login failed");
  
  // Return the successful response (includes token and user info)
  return res.json();
}

// This function creates new user accounts
// Similar to login, but for new registrations
export async function registerUser(username, email, password) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password })
  });
  
  if (!res.ok) throw new Error((await res.json()).message || "Registration failed");
  return res.json();
}

// ======================
// FEEDBACK SUBMISSION
// ======================

// This is the main function that sends feedback to your server
// It takes the user's feedback text and sends it to the "demo-cafe" organization
export default async function submitFeedback(text) {
  const rating = 3; // Default rating (you'll want to make this dynamic later)

  try {
    // Send POST request to create new feedback
    const res = await fetch(`${API_BASE}/feedback/demo-cafe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, rating }) // Send both text and rating
    });

    // Return the server's response (usually includes success message and feedback ID)
    return res.json();
    
  } catch (error) {
    // If anything goes wrong (network error, server down, etc.)
    console.log("Error submitting Feedback", error.message);
  }
}