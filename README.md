# Student Database Management System

A web-based Student Database Management System built using **Node.js, Express.js, MySQL, HTML, CSS, and JavaScript**. This application helps manage student records through a simple and user-friendly dashboard.

## Features

- **Dashboard:** View student statistics and records.
- **Add Students:** Enter student name, email, course, age, and phone number.
- **View Students:** Display student records in a table.
- **Search Students:** Search records using available student details.
- **Update Students:** Edit existing student information.
- **Delete Students:** Remove individual student records.
- **Input Validation:** Validate student information before saving.
- **Export Records:** Download student records in CSV and Excel formats.
- **MySQL Database:** Store and manage student information.
- **Error Handling:** Handle invalid input and database errors.

## Technologies Used

| Technology | Purpose |
|---|---|
| HTML5 | Web page structure |
| CSS3 | Styling and responsive layout |
| JavaScript | Frontend functionality |
| Node.js | JavaScript runtime |
| Express.js | Backend server and API |
| MySQL | Database management |
| mysql2 | MySQL connectivity |
| ExcelJS | Excel file export |
| dotenv | Environment configuration |

## Project Structure

```text
student_database_management_system/
├── public/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── server.js
├── package.json
├── package-lock.json
├── .env.example
├── .gitignore
└── README.md
```

## Prerequisites

Install the following before running the project:

- [Node.js](https://nodejs.org/)
- [MySQL](https://dev.mysql.com/downloads/)
- [Git](https://git-scm.com/downloads/)

## Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Likhith04-u/student-database-management-system.git
```

### 2. Open the Project Folder

```bash
cd student-database-management-system
```

### 3. Install Dependencies

```bash
npm install
```

If dependencies are not already listed in `package.json`, install them using:

```bash
npm install express mysql2 dotenv exceljs
```

### 4. Configure Environment Variables

Create a `.env` file in the project root directory and add your local MySQL configuration:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=student_management
PORT=3000
```

Replace `your_mysql_password` with your own MySQL password. Do not upload your `.env` file to GitHub.

### 5. Create the Database

Open MySQL and execute:

```sql
CREATE DATABASE IF NOT EXISTS student_management;
```

Select the database:

```sql
USE student_management;
```

If your `server.js` automatically creates the `students` table when the application starts, you do not need to create it manually.

### 6. Start the Application

```bash
npm start
```

Open the application in your browser:

http://localhost:3000

## Database Fields

The student records include:

- Student ID
- Full Name
- Email Address
- Course
- Age
- Phone Number
- Record Creation Date

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/students` | Retrieve student records |
| POST | `/api/students` | Add a new student |
| PUT | `/api/students/:id` | Update a student |
| DELETE | `/api/students/:id` | Delete a student |
| GET | `/api/export/students.csv` | Export records as CSV |
| GET | `/api/export/students.xlsx` | Export records as Excel |

The application may also provide additional endpoints for administrative operations.

## Security Notes

- Keep database credentials in `.env`.
- Exclude `.env` and `node_modules/` using `.gitignore`.
- Never publish passwords or other sensitive information.
- Add authentication and authorization before deploying the application publicly.
- Protect destructive administrative operations, including database table resets.

## Future Enhancements

- Admin login and authentication
- Student profile photographs
- Pagination for large datasets
- Course-wise filtering
- Improved reporting and analytics
- Cloud deployment

## Author

**Likhith U**

## License

This project is intended for educational and academic purposes. Add an open-source license if you decide to distribute it under specific license terms.
