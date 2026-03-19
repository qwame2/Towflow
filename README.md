# 🚗 TowFlow — Smart Towing & Roadside Assistance System

TowFlow is a full-stack, real-time towing and dispatch platform designed to connect users in need of roadside assistance with nearby tow truck drivers efficiently and reliably.

<<<<<<< HEAD
It addresses a critical real-world problem: **slow and uncoordinated emergency response during vehicle breakdowns**, by enabling instant service requests, live tracking, and seamless communication between users, drivers, and administrators.
=======
It solves a critical problem: **slow, uncoordinated emergency response in vehicle breakdown situations** by enabling instant service requests, live tracking, and seamless communication between users, drivers, and administrators.
>>>>>>> 2f37b7f643580e403d91ff8317e7f0239f5ce232

---

## ⚡ Key Features

<<<<<<< HEAD
* 📍 Real-time driver tracking using Mapbox
* 🚨 Instant towing request and dispatch system
* 📱 Dedicated mobile apps for users and drivers
* 🧭 Smart job assignment and navigation
* 📊 Admin dashboard for monitoring and analytics
* 🔐 Secure authentication with JWT

---

# 📱 User App (Customer Experience)

The TowFlow user application allows customers to request roadside assistance, track drivers in real-time, and manage their vehicles and services.

---

### 🏠 Home & Request Flow

![Welcome Screen](./screenshots/user-welcome.jpg)
![Home Screen](./screenshots/user-home.jpg)
![Request Service](./screenshots/user-request.jpg)

---

### 🔧 Service Selection
![Nearby Assistance](./screenshots/user-services.jpg)
![In Map Service Request](./screenshots/user-mapservices.jpg)


---

### 🚗 Vehicle Management

![My Vehicles](./screenshots/user-vehicles.jpg)

---

### 📍 Live Tracking

![Live Tracking](./screenshots/user-tracking.jpg)

---

### 👤 Profile & Settings

![User Profile](./screenshots/user-profile.jpg)
![Edit Profile](./screenshots/user-edit-profile.jpg)

---

### 🆘 Support System

![Help Center](./screenshots/user-help.jpg)

---

> ⚠️ Note: The user module is actively under development and continuously improving.

---

## 🔄 User Workflow

1. User selects issue (flat tire, fuel, lockout, etc.)
2. System fetches nearby service providers
3. User selects preferred provider
4. Request is sent to backend
5. Driver is assigned
6. User tracks driver in real-time
7. Service is completed

---

# 📱 Driver App (In Development)

Below are screenshots from the TowFlow driver application.

### 🚗 Driver Dashboard & Map View

![Driver Map](./screenshots/driver-map.jpg)
![Driver Active Trip](./screenshots/driver-active.jpg)

---

### 👤 Profile & Account

![Driver Profile](./screenshots/driver-profile.jpg)
![Edit Profile](./screenshots/edit-profile.jpg)

---

### 🚚 Vehicle & Documents

![Vehicle Details](./screenshots/vehicle-details.jpg)
![Upload Documents](./screenshots/upload-documents.jpg)

---

### 📋 Menu

![Driver Menu](./screenshots/driver-menu.jpg)

---

## 🔄 Driver Workflow

1. Driver goes online
2. System scans for nearby requests
3. Driver accepts job
4. Navigation + tracking begins
5. Trip completed and earnings updated

---

## 🧭 System Architecture (Production-Oriented)

```
                  ┌──────────────────────────┐
                  │     Mobile Clients       │
                  │  (User & Driver Apps)   │
                  └──────────┬──────────────┘
                             │ REST / JSON
                             ▼
                  ┌──────────────────────────┐
                  │      Backend API         │
                  │   Node.js + Express      │
                  └──────────┬──────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
┌───────────────┐   ┌────────────────┐   ┌──────────────────┐
│ PostgreSQL DB │   │ Realtime Layer │   │ Notification Svc │
│  (Core Data)  │   │ (WebSockets)   │   │ (Email / Push)   │
└───────────────┘   └────────────────┘   └──────────────────┘
                             │
                             ▼
                  ┌──────────────────────────┐
                  │   Admin Dashboard (Web)  │
                  │ React + Analytics        │
                  └──────────────────────────┘
```

---

## 🗄️ Database Design (Core Entities)

**Users**

* id, name, email, role

**Drivers**

* id, user_id, status, location

**Vehicles**

* id, driver_id, type, plate

**Requests**

* id, user_id, status, location

**Trips**

* id, request_id, earnings

---

## 🔌 API Overview

**Base URL:**
http://localhost:5000/api

### Auth

* POST /auth/register
* POST /auth/login

### Requests

* POST /requests
* GET /requests/nearby
* POST /requests/:id/accept
=======
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
>>>>>>> 2f37b7f643580e403d91ff8317e7f0239f5ce232

---

## 🛠️ Tech Stack

<<<<<<< HEAD
**Backend**

* Node.js, Express
* PostgreSQL

**Frontend**
=======
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
>>>>>>> 2f37b7f643580e403d91ff8317e7f0239f5ce232

* React + Tailwind

<<<<<<< HEAD
**Mobile**

* React Native (Expo)

---

## 🚀 Deployment Strategy

* Backend → AWS / Render
* DB → PostgreSQL
* Mobile → Expo
* Web → Vercel

---

## 📖 Case Study

TowFlow demonstrates:

* Real-time system design
* Full-stack architecture
* Mobile + backend integration

---

## 🔮 Future Roadmap

- AI-based driver allocation  
- Predictive demand analytics  
- Backend integration for payments (MoMo already designed in UI)  
- Multi-region scaling  

---

## 📌 Status

🚧 Actively under development

---

## 👨‍💻 Author

**Adomako Emmanuel**
Full-stack Developer | Systems Builder
=======

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

>>>>>>> 2f37b7f643580e403d91ff8317e7f0239f5ce232
