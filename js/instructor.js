// instructor.js

// Utility function: Generate a 6-character alphanumeric join code
function generateJoinCode(length = 6) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Handle "Generate Join Code" button click
document.addEventListener("DOMContentLoaded", () => {
    const joinCodeDisplay = document.getElementById('joinCodeDisplay');
    const joinCodeText = document.getElementById('joinCodeText');
    const generateJoinCodeBtn = document.getElementById('generateJoinCode');
    const createCourseForm = document.getElementById('createCourseForm');
    const courseTableBody = document.getElementById('courseTableBody');

    let currentJoinCode = ''; // Store latest generated join code (optional)

    if (generateJoinCodeBtn) {
        generateJoinCodeBtn.addEventListener('click', () => {
            currentJoinCode = generateJoinCode();
            joinCodeText.textContent = currentJoinCode;
            joinCodeDisplay.classList.remove('d-none');
        });
    }

    // Handle course creation form submission
    if (createCourseForm) {
        createCourseForm.addEventListener('submit', function (e) {
            e.preventDefault(); // Prevent form from reloading the page

            const courseName = document.getElementById('courseName').value.trim();
            const courseCode = document.getElementById('courseCode').value.trim();

            if (!courseName || !courseCode) {
                alert("Please enter both course name and course code.");
                return;
            }

            // Add course row to table
            const newRow = document.createElement('tr');
            newRow.innerHTML = `
                <td>${courseName}</td>
                <td>${courseCode}</td>
                <td>${currentJoinCode || '—'}</td>
                <td>
                    <button class="btn btn-sm btn-outline-info">View Students</button>
                    <button class="btn btn-sm btn-outline-danger">Delete</button>
                </td>
            `;
            courseTableBody.appendChild(newRow);

            // Add delete button functionality to this row
            const deleteButton = newRow.querySelector('.btn-outline-danger');
            deleteButton.addEventListener('click', () => {
                newRow.remove();
            });

            // Reset form & join code
            createCourseForm.reset();
            joinCodeDisplay.classList.add('d-none');
            currentJoinCode = '';
        });
    }
});

