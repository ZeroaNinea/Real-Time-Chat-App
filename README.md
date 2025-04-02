# Real-Time Chat Application

This is a real-time chat application built with Node.js, Angular, and Socket.io. It allows users to send and receive messages in real time, join chat rooms, and more.

## Features
- Real-time messaging with Socket.io
- User authentication with JWT
- Multiple chat rooms
- Online/offline status
- Typing indicators

## Roadmap
1. **Connect to Socket.io** ✅ 
  - Basic Socket.io connection.
  - Sending and displaying messages.

2. **User Accounts & Authentication**
  - Implement JWT authentication.
  - Set up registration and login with password hashing (e.g., bcrypt).
  - Allow users to store display names and profile pictures.

3. **Chat Rooms & Message Storage**
  - Design a database schema for users, messages, and chat rooms.
  - Implement multiple chat rooms where users can join/leave.

4. **Frontend Enhancements**
  - Use Angular Material and customize it to improve UI/UX.
  - Add a chat list UI, message bubbles, timestamps, etc.

5. **Real-Time Features**
  - Show online/offline status for users.
  - Implement typing indicators ("User is typing...").
  - Add notifications for new messages.

6. **Testing & CI/CD Deployment**
  - Write unit and integration tests.
  - Use Docker for your database (PostgreSQL/MongoDB) and deploy it using Kubernetes if needed.
  - Set up CI/CD to deploy updates and allow friends to test your app.

7. **Final Enhancements**
  - Improve performance with Redis caching.
  - Implement end-to-end encryption if necessary.
  - Optimize and polish the UI.

## Backend's File Structure

```bash
backend/
│── src/
│   │── server.ts          # Starts the server (entry point).
│   │── app.ts             # Express app instance (middleware & routes).
│   │── socket.ts          # Socket.io setup.
│   │── routes/
│   │   ├── index.ts       # Define all routes.
│   │   ├── auth.routes.ts # Authentication routes (JWT, login, register).
│   │   ├── user.routes.ts # User-related routes.
│   │── config/
│   │   ├── env.ts         # Environment variables config.
│   │   ├── db.ts          # MongoDB connection.
│   │── controllers/
│   │   ├── auth.controller.ts # Handles authentication logic.
│   │   ├── user.controller.ts # Handles user-related logic.
│   │── models/
│   │   ├── user.model.ts   # Mongoose schema for users.
│   │── middleware/
│   │   ├── auth.middleware.ts # JWT verification middleware.
│   │── tests/
│       ├── auth.test.ts     # Mocha & Chai tests for auth.
│       ├── user.test.ts     # Tests for user features.
│── package.json
│── tsconfig.json
│── Dockerfile (optional)
│── .env (environment variables)
```

## The Second Step Implementation Plan

✅ **Step 1:** Separate index.ts into proper structure
<br />
➡️ **Step 2:** Create user.model.ts (MongoDB schema for users)
<br />
➡️ **Step 3:** Implement authentication (JWT, registration, login)
<br />
➡️ **Step 4:** Write Mocha & Chai tests for authentication
<br />
➡️ **Step 5:** Build UI in Angular

## Start the Project

### **In the Development Mode**

To start this project in the development mode use these commands:

```bash
cd backend
npm install
npm start

```

And then open a new terminal and run this:

```bash
cd frontend
npm install
npm start

```

## Docket & Kubernetes Deployments

The deployments are placed in the [`docker-kubernetes-deployments`](./docker-kubernetes-deployments) folder.
- **[MongoDB](./docker-kubernetes-deployments/mongodb-deployments/mongodb/)**
- **[MongoDB Express](./docker-kubernetes-deployments/mongodb-deployments/mongodb-express/)**

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
