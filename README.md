# 🚗 TowFlow — Smart Towing & Roadside Assistance System

TowFlow is a full-stack, real-time towing and dispatch platform designed to connect users in need of roadside assistance with nearby tow truck drivers efficiently and reliably.

It solves a critical problem: **slow, uncoordinated emergency response in vehicle breakdown situations** by enabling instant service requests, live tracking, and seamless communication between users, drivers, and administrators.

---

## ⚡ Key Features

- 📍 Real-time driver tracking using Mapbox
- 🚨 Instant towing request and dispatch system
- 📱 Dedicated mobile apps for users and drivers
- 🧭 Smart job assignment and navigation
- 📊 Admin dashboard for monitoring and analytics
- 🔐 Secure authentication with JWT

---

## 🧱 Architecture Overview

TowFlow is built as a scalable monorepo with four main components:

- **`towflow-backend`**  
  REST API handling authentication, service requests, and real-time operations using PostgreSQL.

- **`towflow-web`**  
  Admin dashboard for dispatchers to monitor requests, track drivers, and manage operations.

- **`towflow-user`**  
  Mobile app for customers to request towing services and track drivers live.

- **`towflow-driver`**  
  Mobile app for drivers to receive jobs, navigate, and update status in real-time.

---

## 🛠️ Tech Stack

### Backend
- Node.js, Express
- PostgreSQL
- JWT Authentication
- Bcrypt
- Nodemailer

### Web Dashboard
- React (Vite + TypeScript)
- Tailwind CSS
- Mapbox GL
- React Hook Form + Zod

### Mobile Apps
- Expo (React Native)
- React Navigation
- React Native Maps
- Axios
- i18next

---

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


---

## ⚙️ Development Environment

- Node.js v18+
- PostgreSQL
- Expo SDK 54
- Windows OS

---

## 🚀 Vision

TowFlow is designed to evolve into a **scalable emergency logistics platform**, supporting real-time coordination, intelligent dispatching, and future integrations such as AI-driven route optimization and predictive maintenance alerts.

