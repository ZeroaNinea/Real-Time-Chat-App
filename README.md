# 🟣 Real-Time Chat Application

A full-featured, real-time chat application built with **Angular**, **Node.js**, **Socket.IO**, and **MongoDB**, styled with **Angular Material**, and deployed with **Docker** and **Kubernetes**.

It supports private and public chat rooms, direct messages, friend requests, profile customization, and real-time features like typing indicators and online status.

---

## ✨ Features

### 🧵 Chat Functionality

- Real-time messaging with **Socket.IO**
- Create public and private chat rooms
- Edit, delete, reply to messages
- **Markdown formatting** (bold, italic, code, strike)
- Emoji & GIF support
- **Typing indicators**
- **Message pagination**
- Scroll preservation and reply highlighting

### 👥 Users & Authentication

- Register / Login with hashed passwords (JWT auth)
- Profile pages with editable avatar, display name, pronouns, bio, and status
- Change password and delete account
- Role-based permissions (owner, mod, etc.)

### 🫂 Friends & Private Messages

- Send, accept, and reject friend requests
- Direct (1-on-1) private chat
- View friend's status and activity

### 🧠 Reactions & Real-Time Status _(Coming soon)_

- Add emoji reactions to messages
- See who’s online, offline, or idle
- Custom user status (like “studying”, “away”, etc.)

---

## 🖼️ Screenshots

> Replace the filenames with your actual screenshots!

### 🌐 Landing Page

![Landing Page](./screenshots/home.png)

### 🔐 Login

![Login](./screenshots/login.png)

### 📝 Register

![Register](./screenshots/register.png)

### 👤 Account Page

![Account Page](./screenshots/account.png)

### 💬 Public Chat Room

![Public Chat](./screenshots/chat-room-public.png)

### 🔒 Private Chat Room

![Private Chat](./screenshots/chat-room-private.png)

---

## 🧰 Tech Stack

| Layer    | Technology                                                                                                                                           |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend | Angular, SCSS, Angular Material                                                                                                                      |
| Backend  | Node.js, Express, Socket.IO                                                                                                                          |
| Auth     | JWT, Redis (token store)                                                                                                                             |
| Database | MongoDB, Mongoose                                                                                                                                    |
| Realtime | Socket.IO                                                                                                                                            |
| DevOps   | Docker, Kubernetes (Minikube)                                                                                                                        |
| Testing  | Mocha & Chai (backend), Jasmine & Karma (frontend), Cypress (E2E), Artillery (performance), LighthouseCI (standards), Clinic.Js (backend algorithms) |

---

## 📂 Project Structure

### Backend

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
- **[This preject](./docker-kubernetes-deployments/real-time-chat-app-deployment/):** Images are deployed with Docker. Uses `docker compose` and K8s ingress.

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
