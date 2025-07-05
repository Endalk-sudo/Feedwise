import express  from 'express';
import connectDB  from './config/db.js';
import authRoutes  from './routes/auth.js';
import userRoutes  from './routes/user.js';
import cookieParser  from 'cookie-parser';
import dotenv from "dotenv";


dotenv.config(); 

const app = express(); 

// Connect to the database. This is important for storing user data, tokens, etc.
connectDB();

// Middleware
app.use(express.json()); // Parse incoming JSON requests (important for APIs)
app.use(cookieParser()); // Parse cookies (optional for JWT, but can be useful)


// Define Routes
// All authentication-related endpoints (register, login, refresh, etc.) are under /api/auth
app.use('/api/auth', authRoutes);



// All user-related endpoints (profile, update, etc.) are under /api/user and are protected
app.use('/api/user', userRoutes); // These routes usually require a valid JWT to access



// Basic route for testing if the API is running
app.get('/', (req, res) => {
    res.send('API is running...');
});






const PORT = process.env.PORT || 5000;




// Start the server and listen for requests
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
