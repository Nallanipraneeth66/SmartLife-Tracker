# SmartLife Tracker

A comprehensive life management application built with React, Vite, and JSON-Server. Track your tasks, habits, expenses, and health metrics all in one place.

## Features

- ✅ **Task Management**: Create, update, and delete tasks with priorities and deadlines
- ✅ **Habit Tracking**: Track daily habits with time goals and progress visualization
- ✅ **Expense Tracking**: Monitor spending with categories, filters, and budget limits
- ✅ **Health Monitoring**: Track water intake, sleep, and steps with visual charts
- ✅ **Multi-User Support**: Full user isolation with authentication
- ✅ **Responsive Design**: Beautiful UI that works on all devices


## Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd smartlife-tracker
```

2. Install dependencies:
```bash
npm install
```

## Running the Application

### Start the Backend (JSON-Server)

In one terminal window:
```bash
npm run server
```

This will start JSON-Server on `http://localhost:5000` and watch `db.json` for changes.

### Start the Frontend (Vite)

In another terminal window:
```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or the port Vite assigns).

## Available Scripts

- `npm run dev` - Start the Vite development server
- `npm run build` - Build the application for production
- `npm run preview` - Preview the production build
- `npm run lint` - Run ESLint to check code quality
- `npm run server` - Start JSON-Server backend on port 5000

## Project Structure

```
smartlife-tracker/
├── src/
│   ├── api/              # API service files
│   ├── components/       # Reusable React components
│   ├── context/          # React Context providers
│   ├── pages/            # Page components
│   ├── assets/           # Static assets
│   ├── App.jsx           # Main app component
│   ├── main.jsx          # Application entry point
│   └── index.css         # Global styles
├── public/               # Public assets
├── db.json               # JSON-Server database
├── package.json          # Dependencies and scripts
└── vite.config.js        # Vite configuration
```

## Technology Stack

- **Frontend Framework**: React 19.2.0
- **Build Tool**: Vite 7.2.4
- **Styling**: Tailwind CSS 3.4.18
- **Routing**: React Router DOM 7.9.6
- **HTTP Client**: Axios 1.13.2
- **Backend**: JSON-Server 0.17.4
- **Charts**: Chart.js 4.5.1 + react-chartjs-2 5.3.1
- **Icons**: React Icons 5.5.0
- **Date Handling**: Day.js 1.11.19
- **Notifications**: React Toastify 10.0.6

## API Endpoints

The application uses JSON-Server which provides RESTful API endpoints:

- `GET /users` - Get all users
- `GET /tasks?userId={id}` - Get tasks for a user
- `POST /tasks` - Create a new task
- `PUT /tasks/{id}` - Update a task
- `DELETE /tasks/{id}` - Delete a task
- `GET /expenses?userId={id}` - Get expenses for a user
- `POST /expenses` - Create a new expense
- `GET /health?userId={id}` - Get health data for a user
- `POST /health` - Add health data
- `GET /profiles?userId={id}` - Get user profile
- `PUT /profiles/{id}` - Update user profile

## Features in Detail

### Authentication
- User registration and login
- Protected routes
- Session persistence with localStorage

### Tasks & Habits
- Create tasks with priorities (High, Medium, Low)
- Set deadlines and reminders
- Track habits with daily time goals
- Visual progress charts
- Mark tasks as completed or missed

### Expenses
- Add expenses with categories
- Filter by date, category, and amount
- Set weekly and monthly spending limits
- Budget tracking with warnings
- Export data to CSV
- Visual spending trends

### Health Tracking
- Track daily water intake (ml/cups)
- Monitor sleep hours
- Count steps
- Set custom health goals
- Visual progress charts
- Health score calculation

## Development

### Code Style
- ESLint is configured for code quality
- Follow React best practices
- Use functional components with hooks

### Adding New Features
1. Create API functions in `src/api/`
2. Create page components in `src/pages/`
3. Add routes in `src/App.jsx`
4. Update navigation in `src/components/Navbar.jsx`

## License

This project is private and for personal/educational use.

## Contributing

This is a personal project. Contributions are welcome but please open an issue first to discuss changes.

## Project Videos

### Demonstration Video (11 minutes)
Click to View Demonstration: ./Team-5_SmartLife Tracker_Demonstration.mp4

### Code Explanation Video (8 minutes)
Click to View Code Explanation: ./Team-5_SmartLife Tracker_Code Explanation.mp4
