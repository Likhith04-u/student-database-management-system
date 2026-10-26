
require("dotenv").config();

const express = require("express");
const mysql = require("mysql2/promise");
const ExcelJS = require("exceljs");
const path = require("path");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "20kb" }));
app.use(express.static(path.join(__dirname, "public")));

const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "student_management",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Create the table if it does not exist.
async function createStudentsTable() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS students (
            id INT NOT NULL AUTO_INCREMENT,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(150) NOT NULL UNIQUE,
            course VARCHAR(100) NOT NULL,
            age INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            phone VARCHAR(20) DEFAULT NULL,
            PRIMARY KEY (id)
        )
    `);
}

// Centralized input validation.
function validateStudent(body) {
    const errors = {};

    if (!body || typeof body !== "object" || Array.isArray(body)) {
        return { errors: { general: "Please submit valid student data." } };
    }

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const course = typeof body.course === "string" ? body.course.trim() : "";
    const phone = body.phone == null ? "" :
        typeof body.phone === "string" ? body.phone.trim() : null;

    if (!name) {
        errors.name = "Full name is required.";
    } else if (name.length > 100) {
        errors.name = "Full name must be 100 characters or fewer.";
    } else if (!/^[\p{L}\p{M}\s.'’-]+$/u.test(name)) {
        errors.name = "Name may contain letters, spaces, apostrophes, periods and hyphens.";
    }

    if (!email) {
        errors.email = "Email address is required.";
    } else if (email.length > 150) {
        errors.email = "Email must be 150 characters or fewer.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.email = "Enter a valid email address, such as student@example.com.";
    }

    if (!course) {
        errors.course = "Course is required.";
    } else if (course.length > 100) {
        errors.course = "Course must be 100 characters or fewer.";
    }

    const ageText = body.age == null ? "" : String(body.age).trim();
    const age = Number(ageText);

    if (!ageText) {
        errors.age = "Age is required.";
    } else if (!/^\d+$/.test(ageText) ||
               !Number.isInteger(age) || age < 1 || age > 120) {
        errors.age = "Age must be a whole number between 1 and 120.";
    }

    if (phone === null) {
        errors.phone = "Phone number must be text.";
    } else if (phone.length > 20) {
        errors.phone = "Phone number must be 20 characters or fewer.";
    } else if (phone && !/^\+?[0-9\s().-]{7,20}$/.test(phone)) {
        errors.phone = "Enter a valid phone number using digits and optional +, spaces, brackets or hyphens.";
    }

    return {
        errors,
        value: {
            name,
            email,
            course,
            age,
            phone: phone || null
        }
    };
}

function sendValidationError(res, errors) {
    return res.status(400).json({
        message: "Please correct the highlighted fields.",
        errors
    });
}

function handleDatabaseError(error, res, operation) {
    console.error(`${operation} error:`, error.code || error.message);

    if (error.code === "ER_DUP_ENTRY") {
        return res.status(409).json({
            message: "That email address is already registered.",
            errors: { email: "Use a different email address." }
        });
    }

    if (error.code === "ER_NO_SUCH_TABLE") {
        return res.status(500).json({
            message: "The student table is missing. Restart the server to initialize it."
        });
    }

    return res.status(500).json({
        message: "Something went wrong while accessing the database. Please try again."
    });
}

// GET: List and search students.
app.get("/api/students", async (req, res) => {
    try {
        const search = typeof req.query.search === "string"
            ? req.query.search.trim().slice(0, 150)
            : "";
        const term = `%${search}%`;

        const [students] = await pool.query(
            `SELECT id, name, email, course, age, phone, created_at
             FROM students
             WHERE name LIKE ?
                OR email LIKE ?
                OR course LIKE ?
                OR phone LIKE ?
                OR CAST(age AS CHAR) LIKE ?
             ORDER BY id DESC`,
            [term, term, term, term, term]
        );

        res.json(students);
    } catch (error) {
        handleDatabaseError(error, res, "Fetch students");
    }
});

// POST: Add a student.
app.post("/api/students", async (req, res) => {
    const { errors, value } = validateStudent(req.body);

    if (Object.keys(errors).length > 0) {
        return sendValidationError(res, errors);
    }

    try {
        const [result] = await pool.query(
            `INSERT INTO students (name, email, course, age, phone)
             VALUES (?, ?, ?, ?, ?)`,
            [value.name, value.email, value.course, value.age, value.phone]
        );

        res.status(201).json({
            message: "Student added successfully.",
            id: result.insertId
        });
    } catch (error) {
        handleDatabaseError(error, res, "Add student");
    }
});

// PUT: Update an existing student.
app.put("/api/students/:id", async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id < 1) {
        return res.status(400).json({ message: "Invalid student ID." });
    }

    const { errors, value } = validateStudent(req.body);

    if (Object.keys(errors).length > 0) {
        return sendValidationError(res, errors);
    }

    try {
        const [result] = await pool.query(
            `UPDATE students
             SET name = ?, email = ?, course = ?, age = ?, phone = ?
             WHERE id = ?`,
            [value.name, value.email, value.course, value.age, value.phone, id]
        );

        if (result.affectedRows === 0) {
            const [existing] = await pool.query(
                "SELECT id FROM students WHERE id = ?",
                [id]
            );

            if (existing.length === 0) {
                return res.status(404).json({ message: "Student not found." });
            }
        }

        res.json({ message: "Student updated successfully." });
    } catch (error) {
        handleDatabaseError(error, res, "Update student");
    }
});

// DELETE: Delete one student.
app.delete("/api/students/:id", async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id < 1) {
        return res.status(400).json({ message: "Invalid student ID." });
    }

    try {
        const [result] = await pool.query(
            "DELETE FROM students WHERE id = ?",
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Student not found." });
        }

        res.json({ message: "Student deleted successfully." });
    } catch (error) {
        handleDatabaseError(error, res, "Delete student");
    }
});

// Helper for CSV and Excel exports.
async function getStudentsForExport() {
    const [students] = await pool.query(`
        SELECT id, name, email, course, age, phone, created_at
        FROM students
        ORDER BY id ASC
    `);

    return students;
}

function formatDate(value) {
    if (!value) return "";

    const date = new Date(value);

    return Number.isNaN(date.getTime())
        ? ""
        : date.toISOString().slice(0, 10);
}

// GET: Export CSV.
app.get("/api/export/students.csv", async (req, res) => {
    try {
        const students = await getStudentsForExport();

        const headers = [
            "Student ID", "Name", "Email", "Course",
            "Age", "Phone", "Registration Date"
        ];

        function csvCell(value) {
            let text = value == null ? "" : String(value);

            if (/^[\s]*[=+\-@]/.test(text)) {
                text = "'" + text;
            }

            return `"${text.replace(/"/g, '""')}"`;
        }

        const rows = students.map(student => [
            student.id,
            student.name,
            student.email,
            student.course,
            student.age,
            student.phone || "",
            formatDate(student.created_at)
        ]);

        const csv = [
            headers.map(csvCell).join(","),
            ...rows.map(row => row.map(csvCell).join(","))
        ].join("\r\n");

        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader(
            "Content-Disposition",
            'attachment; filename="student_records.csv"'
        );

        res.send("\uFEFF" + csv);
    } catch (error) {
        handleDatabaseError(error, res, "CSV export");
    }
});

// GET: Export Excel.
app.get("/api/export/students.xlsx", async (req, res) => {
    try {
        const students = await getStudentsForExport();
        const workbook = new ExcelJS.Workbook();

        workbook.creator = "StudentHub";
        workbook.title = "Student Database Records";

        const worksheet = workbook.addWorksheet("Students");

        worksheet.columns = [
            { header: "Student ID", key: "id", width: 13 },
            { header: "Name", key: "name", width: 25 },
            { header: "Email", key: "email", width: 32 },
            { header: "Course", key: "course", width: 20 },
            { header: "Age", key: "age", width: 10 },
            { header: "Phone", key: "phone", width: 18 },
            { header: "Registration Date", key: "created_at", width: 20 }
        ];

        worksheet.addRows(students.map(student => ({
            id: student.id,
            name: student.name,
            email: student.email,
            course: student.course,
            age: student.age,
            phone: student.phone || "",
            created_at: formatDate(student.created_at)
        })));

        const header = worksheet.getRow(1);
        header.font = { bold: true, color: { argb: "FFFFFFFF" } };
        header.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF6257E8" }
        };
        header.height = 24;

        worksheet.views = [{ state: "frozen", ySplit: 1 }];
        worksheet.autoFilter = { from: "A1", to: "G1" };

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
            "Content-Disposition",
            'attachment; filename="student_records.xlsx"'
        );

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        handleDatabaseError(error, res, "Excel export");
    }
});

// POST: Reset the table. This permanently deletes all student records.
app.post("/api/admin/drop-students-table", async (req, res) => {
    if (req.body?.confirmation !== "DROP STUDENTS TABLE") {
        return res.status(400).json({
            message: "Confirmation phrase did not match."
        });
    }

    let connection;

    try {
        connection = await pool.getConnection();
        await connection.query("DROP TABLE IF EXISTS students");

        await connection.query(`
            CREATE TABLE students (
                id INT NOT NULL AUTO_INCREMENT,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(150) NOT NULL UNIQUE,
                course VARCHAR(100) NOT NULL,
                age INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                phone VARCHAR(20) DEFAULT NULL,
                PRIMARY KEY (id)
            )
        `);

        res.json({
            message: "Table reset. All previous student records were deleted."
        });
    } catch (error) {
        handleDatabaseError(error, res, "Reset table");
    } finally {
        if (connection) connection.release();
    }
});

// Handle unknown API endpoints.
app.use("/api", (req, res) => {
    res.status(404).json({ message: "API endpoint not found." });
});

// Handle malformed JSON and unexpected errors.
app.use((error, req, res, next) => {
    if (res.headersSent) {
        return next(error);
    }

    if (error.type === "entity.parse.failed") {
        return res.status(400).json({
            message: "Invalid JSON request. Please check the submitted data."
        });
    }

    if (error.type === "entity.too.large") {
        return res.status(413).json({
            message: "Request is too large."
        });
    }

    console.error("Unexpected server error:", error.message);

    res.status(500).json({
        message: "An unexpected server error occurred. Please try again."
    });
});

// Start only after the database connection and table initialization succeed.
async function startServer() {
    try {
        await pool.query("SELECT 1");
        await createStudentsTable();

        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
            console.log("MySQL connected. Student table is ready.");
        });
    } catch (error) {
        console.error("Server startup failed:", error.message);
        console.error("Check MySQL is running and verify your .env file.");
        process.exit(1);
    }
}

startServer();
