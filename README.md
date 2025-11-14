# Quiz Master

A comprehensive full-stack quiz application with AI-assisted features, admin management, and real-time leaderboards.

## Features

- **User Authentication**: Signup, login, password reset with OTP verification
- **Quiz Management**: Create, edit, delete, and attempt quizzes
- **AI Integration**: AI-powered question generation and quiz assistance
- **Admin Dashboard**: Manage users, quizzes, and view analytics
- **Leaderboard**: Real-time ranking based on quiz performance
- **Results Tracking**: Persistent storage and historical analysis
- **Email Notifications**: Welcome emails and password reset OTPs
- **Role-Based Access**: Separate admin and user interfaces

## Tech Stack

**Backend**
- Node.js & Express
- MongoDB with Mongoose
- JWT Authentication
- Nodemailer for email services
- Google Generative AI API

**Frontend**
- React with Vite
- Tailwind CSS
- Axios for API calls
- Chart.js for analytics
- React Router for navigation

## Project Structure

```


```

## Database Models

- **User**: Authentication, profile, role, statistics
- **Quiz**: Metadata, questions, time limits, visibility
- **Question**: Question text, options, correct answer, difficulty
- **Result**: User scores, answers, timestamps
- **OTP**: Temporary tokens for password reset
- **Feedback**: User feedback and reports

## API Routes

| Route Group | Purpose |
|-------------|---------|
| `authRoutes.js` | Authentication (signup, login, password reset) |
| `quizRoutes.js` | Quiz CRUD and retrieval |
| `questionRoute.js` | Question management |
| `resultRoutes.js` | Results submission and leaderboard |
| `adminRoutes.js` | Admin management endpoints |
| `feedbackRoutes.js` | User feedback collection |
| `aiRoutes.js` | AI-powered question generation |

## Setup & Installation

### Prerequisites
- Node.js (v14+)
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup

```bash
cd backend
npm install
```

Create `.env` file:
```env
MONGO_URI=<your_mongodb_connection_string>
JWT_SECRET=<strong_secret_key>
PORT=5000
EMAIL_USER=<gmail_address>
EMAIL_PASS=<gmail_app_password>
VITE_GOOGLE_GENERATIVE_AI_API_KEY=<google_ai_key>
```

Start server:
```bash
npm start
```

Server runs on `http://localhost:5000`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

## Usage

### Create an Admin Account

```bash
cd backend
node scripts/createAdmin.js
```

Follow the prompts to create an admin user.

### Initialize Rankings

```bash
cd backend
node scripts/initializeRanks.js
```

### Development Workflow

1. Start MongoDB service
2. Run backend: `npm start` (from `backend/`)
3. Run frontend: `npm run dev` (from `frontend/`)
4. Access app at `http://localhost:5173`

## Build & Deploy

### Frontend Production Build

```bash
cd frontend
npm run build
```

Output files in `frontend/dist/`

### Backend Deployment

- Use PM2 or similar process manager for production
- Set environment variables in deployment platform
- Configure MongoDB connection and email credentials

## Authentication

Protected endpoints require Bearer JWT token in Authorization header:

```bash
Authorization: Bearer <jwt_token>
```

Admin-only endpoints check for `role === "admin"` in token payload.

## File Descriptions

**Key Backend Files:**
- `app.js` - Express setup, middleware configuration, route mounting
- `connection.js` - MongoDB connection helper
- `authMiddleware.js` - JWT verification and role validation

**Key Frontend Files:**
- `App.jsx` - Main app component with routing
- `AuthContext.jsx` - Global authentication state management
- `PrivateRoute.jsx` - Protected route wrapper for users
- `AdminRoute.jsx` - Protected route wrapper for admins

## Security Considerations

- Store sensitive keys in `.env` (never commit to version control)
- Use strong JWT_SECRET and email app passwords
- Validate and sanitize all user inputs
- Enable CORS carefully in production
- Use HTTPS for API calls

## ESLint & Code Quality

Run linting on frontend:

```bash
cd frontend
npm run lint
```

## Troubleshooting

**MongoDB Connection Issues**
- Verify MONGO_URI is correct
- Check MongoDB service is running
- Ensure IP whitelist allows your connection

**Email Not Sending**
- Verify EMAIL_USER and EMAIL_PASS are correct
- Check Gmail allows app passwords (2FA required)
- Use dedicated email service (SendGrid) for production

**AI Features Not Working**
- Verify VITE_GOOGLE_GENERATIVE_AI_API_KEY is set
- Check API key is valid and has necessary permissions

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see LICENSE file for details.

## Support

For issues, questions, or suggestions, please open an issue in the repository.

---

**Last Updated**: November 2025