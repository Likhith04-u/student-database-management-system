
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("studentForm");
    const idInput = document.getElementById("studentId");
    const nameInput = document.getElementById("name");
    const emailInput = document.getElementById("email");
    const courseInput = document.getElementById("course");
    const ageInput = document.getElementById("age");
    const phoneInput = document.getElementById("phone");

    const saveButton = document.getElementById("saveButton");
    const cancelButton = document.getElementById("cancelEdit");
    const formTitle = document.getElementById("formTitle");
    const searchInput = document.getElementById("searchInput");
    const tableBody = document.getElementById("studentsTableBody");
    const messageBox = document.getElementById("message");

    const totalStudents = document.getElementById("totalStudents");
    const totalCourses = document.getElementById("totalCourses");
    const recordCount = document.getElementById("recordCount");
    const footerCount = document.getElementById("footerCount");

    const csvButton = document.getElementById("exportCsvButton");
    const excelButton = document.getElementById("exportExcelButton");
    const resetButton = document.getElementById("dropTableButton");

    const inputs = {
        name: nameInput,
        email: emailInput,
        course: courseInput,
        age: ageInput,
        phone: phoneInput
    };

    let students = [];
    let messageTimer;
    let searchTimer;

    // Safely escape text before displaying it as HTML.
    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[char]);
    }

    function showMessage(message, type = "success") {
        clearTimeout(messageTimer);
        messageBox.textContent = message;
        messageBox.className = `message ${type}`;

        messageTimer = setTimeout(() => {
            messageBox.classList.add("hidden");
        }, 6000);
    }

    function clearMessage() {
        clearTimeout(messageTimer);
        messageBox.textContent = "";
        messageBox.className = "message hidden";
    }

    // API helper with network and server-error handling.
    async function api(url, options = {}) {
        let response;

        try {
            response = await fetch(url, {
                ...options,
                headers: {
                    ...(options.body ? { "Content-Type": "application/json" } : {}),
                    ...(options.headers || {})
                }
            });
        } catch {
            throw new Error(
                "Cannot connect to the server. Check that npm start is running."
            );
        }

        const contentType = response.headers.get("content-type") || "";
        let data;

        if (contentType.includes("application/json")) {
            data = await response.json().catch(() => ({}));
        } else {
            data = {};
        }

        if (!response.ok) {
            const error = new Error(
                data.message || `Request failed (HTTP ${response.status}).`
            );

            error.status = response.status;
            error.fieldErrors = data.errors || {};
            throw error;
        }

        return data;
    }

    function validateForm() {
        const errors = {};

        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const course = courseInput.value.trim();
        const ageText = ageInput.value.trim();
        const phone = phoneInput.value.trim();
        const age = Number(ageText);

        if (!name) {
            errors.name = "Full name is required.";
        } else if (name.length > 100) {
            errors.name = "Name must be 100 characters or fewer.";
        } else if (!/^[\p{L}\p{M}\s.'’-]+$/u.test(name)) {
            errors.name = "Use letters, spaces, apostrophes, periods or hyphens.";
        }

        if (!email) {
            errors.email = "Email address is required.";
        } else if (email.length > 150) {
            errors.email = "Email must be 150 characters or fewer.";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.email = "Enter a valid email address.";
        }

        if (!course) {
            errors.course = "Course is required.";
        } else if (course.length > 100) {
            errors.course = "Course must be 100 characters or fewer.";
        }

        if (!ageText) {
            errors.age = "Age is required.";
        } else if (!/^\d+$/.test(ageText) ||
                   !Number.isInteger(age) || age < 1 || age > 120) {
            errors.age = "Age must be a whole number between 1 and 120.";
        }

        if (phone.length > 20) {
            errors.phone = "Phone number must be 20 characters or fewer.";
        } else if (phone &&
                   !/^\+?[0-9\s().-]{7,20}$/.test(phone)) {
            errors.phone = "Enter a valid phone number.";
        }

        return errors;
    }

    function displayErrors(errors) {
        const messages = Object.values(errors || {}).filter(Boolean);

        if (messages.length) {
            showMessage(messages.join(" "), "error");

            const firstInvalidField = Object.keys(errors)
                .map(key => inputs[key])
                .find(input => input);

            if (firstInvalidField) {
                firstInvalidField.focus();
            }

            return;
        }

        showMessage("Please check the submitted information.", "error");
    }

    function resetForm() {
        form.reset();
        idInput.value = "";
        formTitle.textContent = "Add New Student";
        saveButton.textContent = "+ Save Student";
        cancelButton.classList.add("hidden");
        clearMessage();
    }

    function updateDashboard(list) {
        totalStudents.textContent = list.length;

        const uniqueCourses = new Set(
            list.map(student =>
                String(student.course || "").trim().toLowerCase()
            ).filter(Boolean)
        );

        totalCourses.textContent = uniqueCourses.size;
        recordCount.textContent =
            `${list.length} ${list.length === 1 ? "record" : "records"}`;
        footerCount.textContent =
            `${list.length} ${list.length === 1 ? "student" : "students"}`;
    }

    function renderStudents(list) {
        updateDashboard(list);

        if (list.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state">
                        No student records found.
                    </td>
                </tr>`;
            return;
        }

        tableBody.innerHTML = list.map(student => `
            <tr>
                <td>${escapeHTML(student.id)}</td>
                <td>
                    <span class="student-name">${escapeHTML(student.name)}</span>
                    <span class="student-email">${escapeHTML(student.email)}</span>
                </td>
                <td>
                    <span class="course-badge">${escapeHTML(student.course)}</span>
                </td>
                <td>${escapeHTML(student.age)}</td>
                <td>${escapeHTML(student.phone || "—")}</td>
                <td>
                    <div class="action-buttons">
                        <button type="button"
                            class="action-button edit-button"
                            data-action="edit"
                            data-id="${Number(student.id)}">Edit</button>
                        <button type="button"
                            class="action-button delete-button"
                            data-action="delete"
                            data-id="${Number(student.id)}">Delete</button>
                    </div>
                </td>
            </tr>
        `).join("");
    }

    async function loadStudents() {
        tableBody.innerHTML = `
            <tr><td colspan="6" class="empty-state">Loading records...</td></tr>`;

        try {
            const query = encodeURIComponent(searchInput.value.trim());
            const result = await api(`/api/students?search=${query}`);

            if (!Array.isArray(result)) {
                throw new Error("The server returned an unexpected response.");
            }

            students = result;
            renderStudents(students);
        } catch (error) {
            tableBody.innerHTML = `
                <tr><td colspan="6" class="empty-state">
                    Unable to load student records.
                </td></tr>`;

            updateDashboard([]);
            showMessage(error.message, "error");
        }
    }

    // Add or update a student.
    form.addEventListener("submit", async event => {
        event.preventDefault();
        clearMessage();

        const errors = validateForm();

        if (Object.keys(errors).length > 0) {
            displayErrors(errors);
            return;
        }

        const editingId = idInput.value;
        const editing = Boolean(editingId);

        const student = {
            name: nameInput.value.trim(),
            email: emailInput.value.trim(),
            course: courseInput.value.trim(),
            age: Number(ageInput.value.trim()),
            phone: phoneInput.value.trim()
        };

        saveButton.disabled = true;
        cancelButton.disabled = true;
        saveButton.textContent = editing ? "Updating..." : "Saving...";

        try {
            const result = await api(
                editing
                    ? `/api/students/${encodeURIComponent(editingId)}`
                    : "/api/students",
                {
                    method: editing ? "PUT" : "POST",
                    body: JSON.stringify(student)
                }
            );

            resetForm();
            showMessage(result.message || "Student saved successfully.");
            await loadStudents();
        } catch (error) {
            if (error.fieldErrors && Object.keys(error.fieldErrors).length) {
                displayErrors(error.fieldErrors);
            } else {
                showMessage(error.message, "error");
            }
        } finally {
            saveButton.disabled = false;
            cancelButton.disabled = false;
            saveButton.textContent = idInput.value
                ? "Update Student"
                : "+ Save Student";
        }
    });

    // Handle Edit and Delete buttons.
    tableBody.addEventListener("click", async event => {
        const button = event.target.closest("button[data-action]");
        if (!button) return;

        const id = Number(button.dataset.id);
        const action = button.dataset.action;
        const student = students.find(item => Number(item.id) === id);

        if (!student) {
            showMessage("Student record not found. Refresh and try again.", "error");
            return;
        }

        if (action === "edit") {
            idInput.value = student.id;
            nameInput.value = student.name || "";
            emailInput.value = student.email || "";
            courseInput.value = student.course || "";
            ageInput.value = student.age ?? "";
            phoneInput.value = student.phone || "";

            formTitle.textContent = "Update Student";
            saveButton.textContent = "Update Student";
            cancelButton.classList.remove("hidden");
            clearMessage();

            document.getElementById("studentFormPanel").scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

            nameInput.focus();
            return;
        }

        if (action === "delete") {
            if (!confirm(`Delete student "${student.name}"? This cannot be undone.`)) {
                return;
            }

            button.disabled = true;

            try {
                const result = await api(`/api/students/${id}`, {
                    method: "DELETE"
                });

                if (Number(idInput.value) === id) {
                    resetForm();
                }

                showMessage(result.message || "Student deleted successfully.");
                await loadStudents();
            } catch (error) {
                showMessage(error.message, "error");
                button.disabled = false;
            }
        }
    });

    cancelButton.addEventListener("click", resetForm);

    searchInput.addEventListener("input", () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(loadStudents, 300);
    });

    // Export buttons.
    csvButton.addEventListener("click", () => {
        window.location.href = "/api/export/students.csv";
    });

    excelButton.addEventListener("click", () => {
        window.location.href = "/api/export/students.xlsx";
    });

    // Reset is destructive, so require explicit confirmation.
    resetButton.addEventListener("click", async () => {
        if (!confirm(
            "WARNING: This will permanently delete every student record. Continue?"
        )) {
            return;
        }

        const confirmation = prompt(
            "Type exactly DROP STUDENTS TABLE to confirm:"
        );

        if (confirmation !== "DROP STUDENTS TABLE") {
            showMessage("Reset cancelled. Confirmation did not match.", "error");
            return;
        }

        resetButton.disabled = true;
        resetButton.textContent = "Resetting...";

        try {
            const result = await api("/api/admin/drop-students-table", {
                method: "POST",
                body: JSON.stringify({ confirmation })
            });

            resetForm();
            searchInput.value = "";
            showMessage(result.message || "Student table reset.");
            await loadStudents();
        } catch (error) {
            showMessage(error.message, "error");
        } finally {
            resetButton.disabled = false;
            resetButton.textContent = "Reset Table";
        }
    });

    loadStudents();
});
