# TowFlow

TowFlow is a comprehensive towing management and dispatch system designed to streamline the connection between users in need of towing services and professional tow truck drivers.

## 🚀 System Overview

The project is structured as a monorepo containing the following components:

- **`towflow-backend`**: A robust REST API built with Node.js and Express. It handles user authentication, service requests, and real-time data management using PostgreSQL.
- **`towflow-web`**: A modern administration and monitoring dashboard built with React, Vite, and TypeScript. It features real-time tracking via Mapbox GL and data visualization with Recharts.
- **`towflow-user`**: A mobile application for customers built with Expo (React Native). It allows users to request tows, track their driver in real-time, and manage their profile.
- **`towflow-driver`**: A dedicated mobile application for tow truck operators built with Expo (React Native). It manages job assignments, navigation, and status updates.

## 🛠️ Tech Stack

### Backend
- **Core**: Node.js, Express
- **Database**: PostgreSQL (PostgreSQL driver: `pg`)
- **Authentication**: JWT (JSON Web Tokens), Bcrypt for password hashing
- **Communication**: Nodemailer for email notifications
- **Environment Management**: Dotenv

### Web Dashboard
- **Framework**: React 19, Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Maps**: Mapbox GL, React Map GL
- **State Management & Forms**: React Hook Form, Zod
- **Icons & UI**: Lucide React, Radix UI components
- **Routing**: React Router DOM

### Mobile Apps (User & Driver)
- **Framework**: Expo / React Native
- **Navigation**: Expo Router, React Navigation
- **Maps**: React Native Maps
- **APIs**: Axios for networking
- **Localization**: i18next
- **Security**: Expo Secure Store, Expo Local Authentication

## 📂 Project Structure

```text
TowFlow/
├── towflow-backend/     # Node.js Express API
├── towflow-web/         # React Admin Dashboard
├── towflow-user/        # React Native Customer App
├── towflow-driver/      # React Native Driver App
├── towflow.sql          # Database Schema
└── node_modules/        # Shared dependencies
```

## ⚙️ Development Environment Info

- **OS**: Windows
- **Node.js**: Expected (v18+)
- **Database**: PostgreSQL
- **Mobile Environment**: Expo SDK 54
