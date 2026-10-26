# Student Database Management System (Node.js + MySQL)

## Requirements
- Node.js and npm
- MySQL Server
- VS Code (recommended)

## Setup on Windows
1. Extract the project ZIP and open the `student_database_management_system` folder in VS Code.
2. Start MySQL Server.
3. In this folder, create a file named `.env` by copying `.env.example`.
4. Edit `.env` and enter your actual MySQL password:
   `DB_HOST=localhost`
   `DB_USER=root`
   `DB_PASSWORD=your_actual_mysql_password`
   `DB_NAME=student_management`
   `PORT=3000`
   If your MySQL root account has no password, leave `DB_PASSWORD=` blank.
5. Open the VS Code terminal in this project folder and run:
   `npm install`
6. Run:
   `npm start`
7. Open `http://localhost:3000` in your browser.

The application creates the `student_management` database and `students` table automatically at startup if they do not exist.

## Demonstrating the eight required operations
1. **Create database:** On startup, `initializeDatabase()` executes `CREATE DATABASE IF NOT EXISTS`.
2. **Create connection:** `mysql2/promise` creates a MySQL connection and connection pool.
3. **Create table:** `createStudentsTable()` executes `CREATE TABLE IF NOT EXISTS`; the UI also has a Create table button.
4. **Insert records:** Fill in the form and select Add Student.
5. **Retrieve records:** The records table loads from `GET /api/students`; Refresh records reloads it.
6. **Update records:** Select Edit, change details, and select Save changes.
7. **Delete records:** Select Delete and confirm.
8. **Drop table:** Select Drop students table and confirm. This permanently deletes the table and its data. Select Create table to restore an empty table.

## Useful SQL commands
Run these in MySQL Workbench if you want to inspect the database:

```sql
SHOW DATABASES;
USE student_management;
SHOW TABLES;
DESCRIBE students;
SELECT * FROM students;
```

To drop the table directly in SQL (destructive):

```sql
DROP TABLE IF EXISTS students;
```

## Troubleshooting
- **Access denied:** Check `DB_USER` and `DB_PASSWORD` in `.env`.
- **ECONNREFUSED:** Make sure the MySQL server is running and the host/port are correct.
- **Port 3000 already in use:** Change `PORT=3001` in `.env`, restart, and visit `http://localhost:3001`.
- **Table does not exist:** Click Create table. The server also creates it on the next restart.
- **Duplicate email:** Each email must be unique.
