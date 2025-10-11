# AI Feedback Collector App

A comprehensive full-stack application designed to help organizations collect, analyze, and gain insights from user feedback using advanced AI technologies. This app provides a user-friendly interface for feedback submission, real-time analytics, sentiment analysis, and actionable recommendations.

## Features

- **User Authentication & Authorization**: Secure login and registration with JWT-based authentication.
- **Feedback Collection**: Easy-to-use forms for users to submit feedback with categories and ratings.
- **AI-Powered Insights**: Automated analysis of feedback using AI to generate summaries, sentiment scores, and growth recommendations.
- **Analytics Dashboard**: Interactive charts and visualizations for sentiment overview, category breakdowns, recurring issues, and priority alerts.
- **Organization Management**: Setup and manage organizational profiles with logos and settings.
- **Subscription & Payments**: Integrated Stripe payments for subscription plans (Free, Pro, Enterprise).
- **Real-time Updates**: Live feedback updates and notifications.
- **Responsive Design**: Mobile-friendly interface built with React and modern CSS.

## Tech Stack

### Frontend
- **React**: Component-based UI library
- **Vite**: Fast build tool and development server
- **CSS Modules**: Scoped styling for components
- **React Router**: Client-side routing
- **Context API**: State management for authentication

### Backend
- **Node.js**: JavaScript runtime
- **Express.js**: Web framework for API development
- **MongoDB**: NoSQL database with Mongoose ODM
- **JWT**: JSON Web Tokens for authentication
- **bcrypt**: Password hashing

### Integrations
- **Stripe**: Payment processing and subscription management
- **OpenAI**: AI-powered feedback analysis and insights
- **Cloudinary**: Image upload and management for organization logos

### Development Tools
- **ESLint**: Code linting
- **Git**: Version control
- **npm**: Package management

## Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- Git

### Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/ai-feedback-collector-app.git
   cd ai-feedback-collector-app
   ```

2. **Install server dependencies**:
   ```bash
   cd server
   npm install
   ```

3. **Install client dependencies**:
   ```bash
   cd ../client
   npm install
   ```

4. **Environment Configuration**:
   - Copy `.env.example` to `.env` in both `server/` and `client/` directories
   - Fill in the required environment variables:
     - Database connection string
     - JWT secret
     - Stripe API keys
     - OpenAI API key
     - Cloudinary credentials

5. **Start the application**:
   - Start the server:
     ```bash
     cd server
     npm start
     ```
   - Start the client (in a new terminal):
     ```bash
     cd client
     npm run dev
     ```

6. **Access the app**:
   - Open your browser and navigate to `http://localhost:5173` (client)
   - Server runs on `http://localhost:5000` (or configured port)

## Usage

1. **Register/Login**: Create an account or log in to access the dashboard.
2. **Organization Setup**: Configure your organization details and upload a logo.
3. **Collect Feedback**: Share feedback forms with users or integrate via API.
4. **View Analytics**: Monitor feedback trends, sentiment, and insights on the dashboard.
5. **Manage Subscriptions**: Upgrade plans via the payments section.
6. **AI Insights**: Review AI-generated summaries and recommendations.

## API Documentation

The API provides endpoints for:
- Authentication (`/api/auth`)
- Feedback management (`/api/feedback`)
- Analytics (`/api/analytics`)
- AI processing (`/api/ai`)
- Payments (`/api/payment`)
- User management (`/api/user`)
- Settings (`/api/settings`)

Detailed API documentation can be found in the `server/routes/` directory or by running the server and accessing `/api/docs` (if Swagger is configured).

## Project Structure

```
ai-feedback-collector-app/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service functions
│   │   └── context/        # React context providers
│   ├── public/             # Static assets
│   └── package.json
├── server/                 # Backend Node.js application
│   ├── controllers/        # Route controllers
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── middleware/         # Custom middleware
│   ├── services/           # Business logic services
│   └── config/             # Configuration files
├── .gitignore              # Git ignore rules
└── README.md               # Project documentation
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@ai-feedback-collector.com or join our Discord community.

## Roadmap

- [ ] Mobile app development
- [ ] Advanced AI models integration
- [ ] Multi-language support
- [ ] API rate limiting and caching
- [ ] Export analytics reports