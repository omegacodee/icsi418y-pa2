# ICSI 418Y - Programming Assignments 2 and 3

Full-stack Login/Signup application (PA2), extended with Projects and Project Memberships (PA3).

Frontend: React (Vite). Backend: Node.js + Express. Database: MongoDB Atlas via the native mongodb driver.

## Setup

### Backend
cd server
npm install
Create server/.env with MONGO_URI, DB_NAME=pa2db, PORT=9000
node server.js

### Frontend
cd client
npm install
npm run dev
Open http://localhost:5173

## Database Collections
- users: _id, f_name, l_name, username, password
- projects: _id, name, description, status, project_lead_id
- projectMemberships: _id, project_id, user_id

project_lead_id, project_id, and user_id are ObjectId references.

## Usage
1. Sign up or log in.
2. Create Project tab: create a project and assign a project lead.
3. View Projects tab: see all projects and their leads.
4. Manage Membership tab: select a project, add or remove members.
