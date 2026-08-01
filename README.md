# YQueue — Phase 1 (≈35%)

Secure Transaction Verification and Anti-Fraud Queue Management System for Campus Canteens.
This is Phase 1: authentication, landing page, student dashboard (browse/search/filter/cart, no checkout),
admin dashboard (food CRUD, stats), and the REST API + MongoDB models this is built on.

## Stack
- Frontend: React (Vite) + Tailwind CSS + React Router + Axios + react-hot-toast
- Backend: Node.js + Express.js + MongoDB + Mongoose
- Auth: JWT + bcrypt, role-based (student / admin)

## Project Structure
```
yqueue/
  server/
    config/db.js
    controllers/       authController, foodController, cartController
    middleware/         auth.js (JWT), role.js (RBAC), errorHandler.js
    models/              User, Food, Cart
    routes/               authRoutes, foodRoutes, cartRoutes
    utils/                asyncHandler, generateToken, validators
    server.js
  client/
    src/
      components/       Navbar, Sidebar, FoodCard, CartItemRow, LoadingSpinner, EmptyState, ProtectedRoute
      context/            AuthContext (Context API)
      layouts/            StudentLayout, AdminLayout
      pages/              LandingPage, StudentLogin/Signup, AdminLogin, StudentDashboard, Menu, Cart, Profile,
                           AdminDashboard, ManageFood, NotFound
      services/           api.js (axios instance), authService, foodService, cartService
```

## Setup

### 1. Backend
```bash
cd server
cp .env.example .env      # then fill in MONGO_URI and JWT_SECRET
npm install
npm run dev                # requires nodemon; or `npm start`
```
API runs on `http://localhost:5000`. Health check: `GET /api/health`.

### 2. Frontend
```bash
cd client
cp .env.example .env       # VITE_API_URL=http://localhost:5000/api
npm install
npm run dev
```
App runs on `http://localhost:5173`.

### 3. Create an admin account
There's no admin signup UI by design (you don't want random people creating admin accounts).
Fastest way for Phase 1: call the signup API directly with `role: "admin"`:
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@yqueue.com","password":"admin123","role":"admin"}'
```
In Phase 2 you'd lock this behind an invite code or a seed script instead.

## What's deliberately NOT built yet (Phase 2)
Payment gateway (Razorpay), QR generation/verification, kitchen dashboard, real-time queue (Socket.IO),
order placement/status, notifications, analytics, inventory. Route mounting points for all of these are
already stubbed (commented out) in `server.js` so wiring them in later doesn't require restructuring.

## Notes on design decisions
- **Role enforcement on login**: the frontend passes `role: "student"` or `role: "admin"` on login, and the
  backend rejects if the account's actual role doesn't match — so a student can't log into `/admin/login`.
- **Cart total is server-computed**, not trusted from the client, to avoid price tampering.
- **express-validator** on signup/login/food-create for backend validation; matching lightweight validation
  on the frontend forms too.
- Centralized `asyncHandler` + `errorHandler` middleware so controllers stay clean (no repetitive try/catch).
