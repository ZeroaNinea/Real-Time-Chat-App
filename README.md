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

2. **User Accounts & Authentication** ✅

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
✅ **Step 15:** Build the account page to use the /auth/account route
<br />
✅ **Step 15.1:** Display user info
<br />
✅ **Step 15.2:** Create a form for changing the password
<br />
✅ **Step 15.3:** Implement avatar updating
<br />
✅ **Step 15.4:** Implement account deletion
<br />
✅ **Step 15.5:** Implement log out
<br />
✅ **Step 15.6:** Implement pronouns editing
<br />
✅ **Step 15.6:** Implement implement user card
<br />
✅ **Step 15.6:** Build the account page to use the /auth/account route

```plaintext
/account-page
│
├── /account/                 ← Parent layout component (e.g., shows sidebar, etc.)
│   └── account.component.ts
│
├── /account-info/            ← Display user data
│   └── account-info.component.ts
│
├── /account-edit/            ← Edit username/email/avatar
│   └── account-edit.component.ts
│
├── /change-password/         ← Password change form
│   └── change-password.component.ts
│
├── /delete-account/          ← Delete button + confirmation dialog
│   └── delete-account.component.ts
│
└── /logout-button/           ← Logout trigger
    └── logout-button.component.ts
```

## The Third Step Implementation Plan

✅ Step 1: Define MongoDB schema for Message and ChatRoom
<br />
✅ Step 2: Create backend service to handle messages
<br />
✅ Step 3: Create simple ChatComponent in Angular
<br />
✅ Step 4: Add chat rooms with Socket.io
<br />
✅ Step 5: Add channel order
<br />
✅ Step 6: Display channels
<br />
✅ Step 7: Select channel
<br />
✅ Step 8: Add topic field
<br />
✅ Step 9: Rename channel
<br />
✅ Step 10: Edit permissions
<br />
✅ Step 11: Delete channel
<br />
➡️ Step: 12: Implement channel order changing
<br />
✅ Step 13: Connect Socket.io to frontend, allow sending messages
<br />
✅ Step 14: Display message history
<br />
➡️ Step 15: Add timestamps and online indicators
<br />
✅ Step 16: Delete messages with the chat room
<br />
➡️ Step 17: Add message pagination
<br />
✅ Step 18: Add a Discord like input field for messages
<br />
✅ Step 19: Display chat member list
<br />
➡️ Step 20: Add message editing and deleting
<br />
➡️ Step 21: Add display chat rooms on the `main` page
<br />
✅ Step 22: Position the `chat-room` page's elements
<br />
✅ Step 23: Add display user avatars and usernames
<br />
✅ Step 24: Design the messages list:

- Different background colors for sender vs. receiver. ✅
- Avatars and usernames. ✅
- Timestamps in subtle grey. ✅
- Hover actions: delete, edit, reply. ✅
- Styling replies (quoted messages, highlighted background). ✅
- Grouping messages by the same user. ✅
- Scroll behavior. ✅
  <br />

✅ Step 25: Design the members list
<br />
➡️ Step 26: Design the channel list
<br />
✅ Step 27: Add a send button icon
<br />
➡️ Step 28: Add an emoji picker button (use Angular emoji picker `ngx-emoji-mart`)
<br />
➡️ Step 29: Add an upload attachment button (images, videos, GIFs etc...)
<br />
➡️ Step 30: Add a GIF picker button.
<br />
➡️ Step 31: Markdown formating toolbar (**bold**, _italic_, **underline**, ~~strike~~, `code`)
<br />
➡️ Step 32: Implement role assignment
<br />
➡️ Step 33: Implement bio and pronouns editing
<br />
➡️ Step 34: Implement role choosing
<br />
✅ Step 35: Implement status editing
<br />

#### **The chat room's URL:** http://localhost:4200/chat-room/6829e659be0550e0e63405ca/channel/6829e65fbe0550e0e63405f2

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

## Planned Features

1. Search bar for chat rooms and users.
2. Friend requests system.
3. User profile page.
4. Message reactions and replies.
5. File/image upload.

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
