Skill Nexus Week 3 — TaskFlow

A full-stack task management application built using React, Node.js, Express, and MongoDB. The application includes user authentication, task management, task filtering, and image uploads.

Features

* User registration and login
* Password hashing with bcrypt
* JWT-based authentication
* Create, view, update, and delete tasks
* Filter tasks by All, Active, and Completed
* Upload images using Multer
* MongoDB database integration
* Responsive React user interface

Tech Stack

Frontend

* React
* Vite
* Axios
* React Router DOM

Backend

* Node.js
* Express.js
* MongoDB and Mongoose
* JSON Web Tokens (JWT)
* bcryptjs
* Multer

Project Structure

Skill Nexus Week 3/
├── backend/
│   ├── server.js
│   ├── package.json
│   └── uploads/
├── frontend/
│   ├── src/
│   ├── package.json
│   └── index.html
├── .gitignore
└── README.md

Prerequisites

* Node.js and npm
* MongoDB Atlas account or a local MongoDB instance
* Git

Installation

1. Clone the repository

git clone https://github.com/abhigyantxo/Skill-Nexus-Week-3.git
cd Skill-Nexus-Week-3

2. Configure the backend

cd backend
npm install

Create a .env file inside the backend folder:

PORT=5003
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_private_secret

Replace the example values with your own credentials. Never upload .env to GitHub.

Start the backend:

npm start

If npm start is not configured in backend/package.json, use:

node server.js

3. Configure the frontend

Open a second terminal:

cd frontend
npm install
npm run dev

Open the local URL printed by Vite in your terminal.

API Endpoints

Method	Endpoint	Description
POST	/api/auth/register	Register a user
POST	/api/auth/login	Log in
GET	/api/tasks	Retrieve tasks
POST	/api/tasks	Create a task
PUT	/api/tasks/:id	Update a task
DELETE	/api/tasks/:id	Delete a task
POST	/api/upload	Upload an image

Task and image endpoints require a valid JWT access token.

Security

* Passwords are hashed before storage.
* Protected endpoints require JWT authentication.
* Environment variables are excluded from version control.
* Image uploads are restricted by file type and size in the application.

Learning Outcomes

* Full-stack application development
* REST API design
* Database integration with MongoDB
* User authentication and authorization
* React frontend and backend integration
* File uploads using Multer
* Git and GitHub version control

Author

Abhigyan Singh

GitHub: https://github.com/abhigyantxo

⸻

Developed as part of the Skill Nexus Week 3 project.