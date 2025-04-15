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
✅ **Step 2:** Create user.model.ts (MongoDB schema for users)
<br />
✅ **Step 3:** Implement authentication (JWT, registration, login)
<br />
✅ **Step 4:** Implement JWT key rotation logic
<br />
✅ **Step 5:** Write Mocha & Chai tests for authentication
<br />
✅ **Step 6:** Build UI in Angular
<br />
✅ **Step 7:** Deploy Redis with K8s
<br />
✅ **Step 8:** Set up Redis in the backend
<br />
✅ **Step 9:** Store tokens in Redis on login, and check them in a middleware
<br />
✅ **Step 10:** Implement logout by deleting the token from Redis
<br />
✅ **Step 11:** Then add the Angular interceptor to send tokens on every request
<br />
✅ **Step 12:** Create a simple home page with links to the login and register pages
<br />
✅ **Step 13:** Build the register page
<br />
✅ **Step 14:** Build the login page
<br />
➡️ **Step 15:** Build the account page to use the /auth/account route
<br />
➡️ **Step 15.1:** Display user info
<br />
➡️ **Step 15.2:** Create a form for changing the password
<br />
➡️ **Step 15.3:** Implement avatar updating
<br />
➡️ **Step 15.4:** Implement log out
<br />
➡️ **Step 15.5:** Implement account deletion
<br />
➡️ **Step 15.6:** Build the account page to use the /auth/account route

### Main Components (likely pages or views)

1. **RegisterComponent**
2. **LoginComponent**
3. **ChatRoomsComponent** (public rooms list)
4. **PrivateMessagesComponent**
5. **AccountSettingsComponent**
6. **UserSearchComponent**
7. **ChatSearchComponent**
8. **FriendsComponent**
9. **CreateChatRoomComponent**
10. **ChatRoomDetailComponent** (for viewing & sending messages in a room)
11. **PrivateChatComponent** (for one-on-one messages)

### Shared / Reusable Components

- **MessageBubbleComponent**
- **UserCardComponent**
- **ChatRoomCardComponent**
- **NavbarComponent**
- **SidebarComponent**
- **SearchInputComponent**
- **ModalComponent** (for creating rooms or settings)
- **NotificationBadgeComponent**
- **TypingIndicatorComponent**

## Planned Pages

1. **Account Page**
2. **Chat Room Page**
3. **Friends & Activity Page**
4. **Personal Messages Page**
5. **Landing Page**

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

## Docker & Kubernetes Deployments

The deployments are placed in the [`docker-kubernetes-deployments`](./docker-kubernetes-deployments) folder.

- **[MongoDB](./docker-kubernetes-deployments/mongodb-deployments/mongodb/)**
- **[MongoDB Express](./docker-kubernetes-deployments/mongodb-deployments/mongodb-express/)**

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
