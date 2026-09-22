# YQueue — Smart Campus Canteen & Queue Management System

> A secure full-stack digital canteen platform designed to streamline campus food ordering, payment verification, QR-based order collection, and queue management.

![YQueue](https://img.shields.io/badge/YQueue-Smart%20Campus%20Platform-111827?style=for-the-badge)
![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Backend-Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Express](https://img.shields.io/badge/API-Express.js-000000?style=for-the-badge&logo=express)
![JWT](https://img.shields.io/badge/Auth-JWT-000000?style=for-the-badge)
![Deployment](https://img.shields.io/badge/Deployment-Vercel%20%2B%20Render-000000?style=for-the-badge)

---

## Overview

**YQueue** is a full-stack smart campus canteen management system that digitizes the traditional canteen ordering and collection process.

The platform connects students, canteen workers, and administrators through a centralized web application.

Instead of students waiting in physical queues and manually coordinating with canteen staff, YQueue provides a digital workflow for:

- Browsing the canteen menu
- Managing a shopping cart
- Placing food orders
- Processing payments
- Verifying orders securely
- QR-based order collection
- Worker-side order verification
- Administrative food management
- Order and queue management
- Authentication and role-based access
- Real-time application communication

The system is designed with security, scalability, and a clean separation between frontend, backend, and database layers.

---

# Core Objectives

YQueue aims to:

- Reduce physical waiting time inside campus canteens
- Digitize the food ordering process
- Prevent fake payment claims
- Prevent unauthorized food collection
- Provide secure order verification
- Give workers better control over order processing
- Provide administrators with centralized management
- Provide students with a convenient digital ordering experience
- Establish a scalable architecture for future campus services

---

# Key Features

## Student

Students can:

- Create and authenticate accounts
- Browse available food items
- Search and filter the menu
- Add items to cart
- Manage cart quantities
- Place orders
- Make payments
- Track order status
- Access order information
- Use QR-based order collection
- Reset forgotten passwords through OTP verification

---

## Worker

Workers can:

- Securely log in to the worker dashboard
- View incoming orders
- Manage order processing
- Verify customer orders
- Scan order QR codes
- Validate order collection
- Prevent unauthorized collection
- Manage the operational queue

The QR verification workflow is designed to ensure that an order is validated before it is handed over to the student.

---

## Administrator

Administrators have centralized control over the system.

Admin functionality includes:

- Secure admin authentication
- Food item management
- Add food items
- Update food items
- Delete food items
- View system information
- Monitor operational data
- Access reports and analytics
- Manage platform-level functionality

---

# Authentication & Security

YQueue uses multiple layers of application security.

### Authentication

- JWT-based authentication
- Role-based access control
- Protected API routes
- Secure password handling
- Authentication middleware
- Session/token validation

### Additional Security Infrastructure

The backend includes infrastructure for:

- Request validation
- Rate limiting
- Security middleware
- Audit logging
- Password reset
- OTP-based verification
- Protected administrative operations

Sensitive credentials are kept on the server and are not exposed to the frontend.

---

# QR Order Verification

One of the core components of YQueue is its QR-based order collection workflow.

### Workflow

```text
Student places order
        ↓
Payment verification
        ↓
Order generated
        ↓
Order processed by canteen
        ↓
Student receives order QR
        ↓
Worker scans QR
        ↓
Backend verifies QR token
        ↓
Order validation
        ↓
Authorized collection
