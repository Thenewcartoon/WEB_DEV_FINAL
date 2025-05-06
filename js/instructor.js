
// instructor.js

//global variables
// Declare a constant or variable
let courses = []
// Declare a constant or variable
let teams = []
// Declare a constant or variable
let questions = [] //global questions array
// Declare a constant or variable
let reviews = []  //globalreviews array
// Declare a constant or variable
let assignments = []
// Declare a constant or variable
let editingGroupId = null;

//***************************************************FUNCTIONS****************************************************************************************/

// Function to generate a 6-character alphanumeric join code
// Define a JavaScript function
function generateJoinCode(length = 6) {
// Declare a constant or variable
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
// Declare a constant or variable
    let code = '';
    for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

async function refreshAllCourseDropdowns() {
    await fetchAndDisplayCourses();              // Update table
    await populateTeamCourseDropdown();          // Teams tab
    populateReportCourseDropdown();              // Reports tab
    populateScheduleDropdowns();                 // Schedule tab
    populateReviewCourseDropdown();              // Reviews tab
    populateReviewResultsDropdowns();            // Results tab
}

//function for displaying each question added. it will show the options if the question has any. Also will have an edit and delete button for the questions
// Define a JavaScript function
function renderQuestionPreview(question) {
// Declare a constant or variable
    const list = document.getElementById('reviewQuestionList')  //Find the <ul> element that will hold all previewed questions

// Declare a constant or variable
    const item = document.createElement('li') //Create a new <li> element for the current question
    item.className = 'list-group-item' //Bootstrap styling
    item.dataset.id = question.id; //Store the unique ID on the element for reference

    // Create the inner content
// Declare a constant or variable
    let html = `<strong>${question.text}</strong><br><em>Type: ${question.type}</em>`

    // Display options if applicable
    if (question.options && question.options.length) {
        html += `<ul class="mt-2">`
        question.options.forEach(opt => {
            html += `<li>${opt}</li>`
        });
        html += `</ul>`;
    }

    // Add Edit/Delete buttons below the questions
    html += `
        <div class="mt-2">
            <button class="btn btn-sm btn-outline-primary me-2 btn-edit-question">Edit</button>
            <button class="btn btn-sm btn-outline-danger btn-delete-question">Delete</button>
        </div>
    `;
    //inject the HTML into the <li> and add it to the list 
    item.innerHTML = html;
    list.appendChild(item);

    // DELETE question button
    item.querySelector('.btn-delete-question').addEventListener('click', () => {
        // Remove from array
        questions = questions.filter(q => q.id !== question.id); //remove the question from the questions array
        // Remove list from DOM
        item.remove();
    });

    //EDIT question Button
    item.querySelector('.btn-edit-question').addEventListener('click', () => {
        // Refill form fields with the question data
        document.getElementById('questionType').value = question.type;
        document.getElementById('questionText').value = question.text;

        //clear current options in the UI before redoing it
// Declare a constant or variable
        const optionsContainer = document.getElementById('questionOptionsContainer');
        optionsContainer.innerHTML = '';
        optionsContainer.style.display = 'none';

        // Handle options depending on the type
        if (question.type === 'likert') {
            document.getElementById('questionType').dispatchEvent(new Event('change')) //Likert is pre-defined, so just re-trigger the dropdown change to rebuild UI
        } else if (question.type === 'multiple-choice' || question.type === 'multi-select') {
            document.getElementById('questionType').dispatchEvent(new Event('change')) //Same: trigger the change to set up the container
// Declare a constant or variable
            const optionList = document.getElementById('mcOptionList') //manually add back the saved options into the option list
            question.options.forEach(opt => {
// Declare a constant or variable
                const optionInput = document.createElement('div')
                optionInput.className = 'input-group mb-2'
                optionInput.innerHTML = `
                    <input type="text" class="form-control" value="${opt}">
                    <button class="btn btn-outline-danger" type="button">Remove</button>
                `;
                optionInput.querySelector('button').addEventListener('click', () => { //Allow the instructor to remove this option if needed
                    optionInput.remove();
                });
                optionList.appendChild(optionInput) //Add the option to the list container
            });
        }

        // Remove original question from list and array — it will be re-added on "Add Question"
        questions = questions.filter(q => q.id !== question.id);
        item.remove();
    });
}


//***********Function for displaying courses inside the Select a Course Box under the reviews tab */
// Define a JavaScript function
function populateReviewCourseDropdown() {
// Declare a constant or variable
    const reviewCourseSelect = document.getElementById('reviewCourseSelect');
    if (reviewCourseSelect) {
        reviewCourseSelect.innerHTML = '<option disabled selected>Select a course</option>';

        courses.forEach(course => {
// Declare a constant or variable
            const option = document.createElement('option');
            option.value = course.CourseNumber;
            option.textContent = `${course.CourseNumber} - ${course.CourseName}`;
            reviewCourseSelect.appendChild(option);
        });
    }
}


//******************Function for displaying Saved Reviews**************///
async function displaySavedReviews() {
// Declare a constant or variable
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
// Declare a constant or variable
    const list = document.getElementById('savedReviewsList');
    list.innerHTML = ''; // Clear old list

    if (!currentUser || !currentUser.UserID) {
// Declare a constant or variable
        const item = document.createElement('li');
        item.className = 'list-group-item';
        item.textContent = 'Error: No user found.';
        list.appendChild(item);
        return;
    }

    try {
// Send HTTP request using Fetch API
        const response = await fetch(`http://localhost:8000/instructor-assessments/${currentUser.UserID}`);
// Declare a constant or variable
        const data = await response.json();

// Declare a constant or variable
        const assessments = data.assessments;

        if (!assessments || assessments.length === 0) {
// Declare a constant or variable
            const item = document.createElement('li');
            item.className = 'list-group-item';
            item.textContent = 'No reviews saved yet.';
            list.appendChild(item);
            return;
        }

        for (const assessment of assessments) {
// Declare a constant or variable
            const item = document.createElement('li');
            item.className = 'list-group-item d-flex justify-content-between align-items-start';

// Declare a constant or variable
            const content = document.createElement('div');
            content.innerHTML = `
                <strong>${assessment.Name}</strong><br>
                Course: ${assessment.CourseNumber} (${assessment.CourseName})
            `;

// Declare a constant or variable
            const btnGroup = document.createElement('div');
            btnGroup.className = 'btn-group btn-group-sm';

            // ---------------- View Button ------------------
// Declare a constant or variable
            const viewBtn = document.createElement('button');
            viewBtn.className = 'btn btn-outline-secondary';
            viewBtn.textContent = 'View';
            viewBtn.addEventListener('click', async () => {
                try {
// Send HTTP request using Fetch API
                    const res = await fetch(`http://localhost:8000/assessment-details/${assessment.AssessmentID}`);
// Declare a constant or variable
                    const data = await res.json();

// Declare a constant or variable
                    const modelBody = document.getElementById('fullReviewModelBody');
// Declare a constant or variable
                    let html = `
                        <p><strong>Title:</strong> ${data.title}</p>
                        <p><strong>Course:</strong> ${assessment.CourseNumber}</p>
                        <hr>
                    `;
                    data.questions.forEach((q, i) => {
                        html += `<p><strong>Q${i + 1}:</strong> ${q.text} <em>(${q.type})</em></p>`;
                        if (q.options?.length > 0) {
                            html += '<ul>';
                            q.options.forEach(opt => html += `<li>${opt}</li>`);
                            html += '</ul>';
                        }
                    });

                    modelBody.innerHTML = html;
// Declare a constant or variable
                    const modal = new bootstrap.Modal(document.getElementById('fullReviewModel'));
                    modal.show();
                } catch (err) {
                    console.error('Error loading review details:', err);
                    Swal.fire("Error", "Could not load full review details.", "error");
                }
            });

            // ---------------- Edit Button ------------------
// Declare a constant or variable
            const editBtn = document.createElement('button');
            editBtn.className = 'btn btn-outline-primary';
            editBtn.textContent = 'Edit';
            editBtn.addEventListener('click', async () => {
                try {
// Send HTTP request using Fetch API
                    const res = await fetch(`http://localhost:8000/assessment-details/${assessment.AssessmentID}`);
// Declare a constant or variable
                    const data = await res.json();

                    // Load review data into form
                    document.getElementById('reviewTitle').value = data.title;
                    document.getElementById('reviewCourseSelect').value = assessment.CourseNumber;

                    questions = data.questions; // replace global questions array
                    document.getElementById('reviewQuestionList').innerHTML = '';
                    questions.forEach(renderQuestionPreview);

                    // Delete assessment from DB so it doesn’t duplicate on re-save
// Send HTTP request using Fetch API
                    await fetch(`http://localhost:8000/delete-assessment/${assessment.AssessmentID}`, {
                        method: 'DELETE'
                    });

                    await displaySavedReviews(); // Refresh list

                } catch (err) {
                    console.error('Error editing review:', err);
                    Swal.fire("Error", "Could not load or delete the review for editing.", "error");
                }
            });

            // ---------------- Delete Button ------------------
// Declare a constant or variable
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-outline-danger';
            deleteBtn.textContent = 'Delete';
            deleteBtn.addEventListener('click', async () => {
// Declare a constant or variable
                const confirmed = await Swal.fire({
                    title: 'Are you sure?',
                    text: 'This will permanently delete the review.',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Yes, delete it!'
                });

                if (confirmed.isConfirmed) {
                    try {
// Send HTTP request using Fetch API
                        await fetch(`http://localhost:8000/delete-assessment/${assessment.AssessmentID}`, {
                            method: 'DELETE'
                        });
                        Swal.fire("Deleted!", "The review has been deleted.", "success");
                        await displaySavedReviews();
                    } catch (err) {
                        console.error('Error deleting review:', err);
                        Swal.fire("Error", "Failed to delete the review.", "error");
                    }
                }
            });

            btnGroup.appendChild(viewBtn);
            btnGroup.appendChild(editBtn);
            btnGroup.appendChild(deleteBtn);

            item.appendChild(content);
            item.appendChild(btnGroup);
            list.appendChild(item);
        }

    } catch (err) {
        console.error("Error fetching assessments:", err);
// Declare a constant or variable
        const item = document.createElement('li');
        item.className = 'list-group-item';
        item.textContent = 'Failed to load reviews.';
        list.appendChild(item);
    }
}




//*************Function for filling in the dropdowns on the schedule tab***************** */
// Define a JavaScript function
function populateScheduleDropdowns() {
// Declare a constant or variable
    const courseSelect = document.getElementById('scheduleCourseSelect');
// Declare a constant or variable
    const reviewSelect = document.getElementById('scheduleReviewSelect');

    // Populate courses
    if (courseSelect) {
        courseSelect.innerHTML = '<option disabled selected>Select a course</option>';
        courses.forEach(course => {
// Declare a constant or variable
            const opt = document.createElement('option');
            opt.value = course.CourseNumber;
            opt.textContent = `${course.CourseNumber} - ${course.CourseName}`;
            courseSelect.appendChild(opt);
        });
    }

    // Populate reviews
    if (reviewSelect) {
        reviewSelect.innerHTML = '<option disabled selected>Select a review</option>';
        reviews.forEach(review => {
// Declare a constant or variable
            const opt = document.createElement('option');
            opt.value = review.id;
            opt.textContent = review.title;
            reviewSelect.appendChild(opt);
        });
    }
}

//Function for displaying the assigned reviews created by an instructor
async function displayAssignedReviews() {
// Declare a constant or variable
    const currentUser = getCurrentUser();
// Declare a constant or variable
    const list = document.getElementById('assignedReviewsList');
    list.innerHTML = '';

    if (!currentUser || !currentUser.UserID) {
// Declare a constant or variable
        const item = document.createElement('li');
        item.className = 'list-group-item';
        item.textContent = 'Error: No instructor found.';
        list.appendChild(item);
        return;
    }

    try {
// Send HTTP request using Fetch API
        const response = await fetch(`http://localhost:8000/scheduled-reviews/${currentUser.UserID}`);
// Declare a constant or variable
        const data = await response.json();
// Declare a constant or variable
        const assignments = data.scheduledReviews;

        if (assignments.length === 0) {
// Declare a constant or variable
            const item = document.createElement('li');
            item.className = 'list-group-item';
            item.textContent = 'No reviews have been assigned yet.';
            list.appendChild(item);
            return;
        }

        assignments.forEach(assign => {
// Declare a constant or variable
            const item = document.createElement('li');
            item.className = 'list-group-item d-flex justify-content-between align-items-start';
        
// Declare a constant or variable
            const content = document.createElement('div');
            content.innerHTML = `
                <strong>${assign.ReviewTitle}</strong><br>
                Course: ${assign.CourseNumber} - ${assign.CourseName}<br>
                Due: ${assign.DueDate}
            `;
        
// Declare a constant or variable
            const btnGroup = document.createElement('div');
            btnGroup.className = 'btn-group btn-group-sm';
        
            // ====== DELETE BUTTON ======
// Declare a constant or variable
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-outline-danger';
            deleteBtn.textContent = 'Delete';
            deleteBtn.addEventListener('click', async () => {
// Declare a constant or variable
                const confirm = await Swal.fire({
                    title: "Are you sure?",
                    text: "This will permanently delete the assignment.",
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonText: "Yes, delete it!"
                });
        
                if (!confirm.isConfirmed) return;
        
                try {
// Send HTTP request using Fetch API
                    const response = await fetch(`http://localhost:8000/delete-scheduled-review/${assign.ScheduleID}`, {
                        method: 'DELETE'
                    });
        
// Declare a constant or variable
                    const result = await response.json();
                    if (!response.ok) throw new Error(result.error);
        
                    Swal.fire("Deleted!", "Scheduled review has been removed.", "success");
                    displayAssignedReviews(); // Refresh the list
                } catch (err) {
                    console.error("Failed to delete scheduled review:", err);
                    Swal.fire("Error", err.message, "error");
                }
            });
        
            // ====== APPEND BUTTON AND RENDER ======
            btnGroup.appendChild(deleteBtn);
            item.appendChild(content);
            item.appendChild(btnGroup);
            list.appendChild(item);
        });
        

    } catch (err) {
        console.error("Error loading assigned reviews:", err);
// Declare a constant or variable
        const item = document.createElement('li');
        item.className = 'list-group-item';
        item.textContent = 'Failed to load assigned reviews.';
        list.appendChild(item);
    }
}



// Define a JavaScript function
function populateReviewResultsDropdowns() {
// Declare a constant or variable
    const courseSelect = document.getElementById('resultsCourseSelect');
// Declare a constant or variable
    const reviewSelect = document.getElementById('resultsReviewSelect');

    if (!courseSelect || !reviewSelect) return;

    // Populate course dropdown
    courseSelect.innerHTML = '<option disabled selected>Select a course</option>';
    courses.forEach(course => {
// Declare a constant or variable
        const option = document.createElement('option');
        option.value = course.CourseNumber;
        option.textContent = `${course.CourseNumber} - ${course.CourseName}`;
        courseSelect.appendChild(option);
        });

    // Populate review dropdown
    reviewSelect.innerHTML = '<option disabled selected>Select a review</option>';
    reviews.forEach(review => {
// Declare a constant or variable
        const option = document.createElement('option');
        option.value = review.id;
        option.textContent = review.title;
        reviewSelect.appendChild(option);
    });
}



// Define a JavaScript function
function renderReviewResults() {
// Declare a constant or variable
    const courseCode = document.getElementById('resultsCourseSelect').value;
// Declare a constant or variable
    const reviewId = document.getElementById('resultsReviewSelect').value;
// Declare a constant or variable
    const list = document.getElementById('reviewResultsList');

    list.innerHTML = ''; // Clear old results

    // Filter responses for this course + review
// Declare a constant or variable
    const filtered = responses.filter(r => r.courseCode === courseCode && r.reviewId === reviewId);

    if (filtered.length === 0) {
// Declare a constant or variable
        const li = document.createElement('li');
        li.className = 'list-group-item';
        li.textContent = 'No submissions found for this review.';
        list.appendChild(li);
        return;
        }

    filtered.forEach(r => {
// Declare a constant or variable
        const item = document.createElement('li');
        item.className = 'list-group-item';
        item.innerHTML = `
            <strong>Student:</strong> ${r.student}<br>
            <strong>Public Feedback:</strong> ${r.publicFeedback}<br>
            <strong>Private Feedback:</strong> ${r.privateFeedback}
        `
        list.appendChild(item);
        });
    }

//function for displaying reports
// Define a JavaScript function
function renderReportsForCourse(courseCode) {
// Declare a constant or variable
    const list = document.getElementById('reportResultsList');
    list.innerHTML = '';

// Declare a constant or variable
    const item = document.createElement('li');
    item.className = 'list-group-item text-muted';
    item.innerHTML = `
        <em>Student responses and scores will appear here once backend integration is complete.</em>
    `;
    list.appendChild(item);
}



// Define a JavaScript function
function populateReportCourseDropdown() {
// Declare a constant or variable
    const select = document.getElementById('reportCourseSelect');
    if (!select) return;

    select.innerHTML = '<option disabled selected>Select a course</option>';

    courses.forEach(course => {
// Declare a constant or variable
        const opt = document.createElement('option');
        opt.value = course.CourseNumber;
        opt.textContent = `${course.CourseNumber} - ${course.CourseName}`;
        select.appendChild(opt);
    });
}


// Define a JavaScript function
function getCurrentUser() {
// Declare a constant or variable
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
}


async function fetchAndDisplayCourses() {
// Declare a constant or variable
    const currentUser = getCurrentUser();
    if (!currentUser) {
        Swal.fire("Error", "User not logged in.", "error");
        return;
    }

    try {
// Send HTTP request using Fetch API
        const response = await fetch(`http://localhost:8000/courses/${currentUser.UserID}`, {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Failed to fetch courses');
        }

// Declare a constant or variable
        const data = await response.json();
// Declare a constant or variable
        const coursesFromDB = data.courses;
        courses = coursesFromDB;

        // Filter courses by instructor's email
// Declare a constant or variable
        const instructorCourses = coursesFromDB;

// Declare a constant or variable
        const courseTableBody = document.getElementById('courseTableBody');
        courseTableBody.innerHTML = '';

        instructorCourses.forEach(course => {
// Declare a constant or variable
            const newRow = document.createElement('tr');
            newRow.innerHTML = `
                <td>${course.CourseName}</td>
                <td>${course.CourseNumber}</td>
                <td>${course.CourseSection}</td>
                <td>${course.JoinCode}</td>
                <td>
                    <button class="btn btn-sm btn-outline-info" type="button">View Students</button>
                    <button class="btn btn-sm btn-outline-danger" type="button">Delete</button>
                </td>
            `;

            // Set up the View Students button
// Declare a constant or variable
            const viewButton = newRow.querySelector('.btn-outline-info');
            viewButton.addEventListener('click', async () => {
                try {
// Send HTTP request using Fetch API
                    const res = await fetch(`http://localhost:8000/courses/${encodeURIComponent(course.CourseNumber)}/students`);
// Declare a constant or variable
                    const result = await res.json();

                    if (!res.ok) {
                        Swal.fire("Error", result.error || "Failed to fetch students.", "error");
                        return;
                    }

// Declare a constant or variable
                    const studentList = result.students.map(s => `${s.FirstName} ${s.LastName} (${s.Email})`).join('<br>');

                    Swal.fire({
                        title: `Students in ${course.CourseNumber}`,
                        html: studentList || 'No students enrolled yet.',
                        icon: 'info',
                        width: '50%'
                    });
                } catch (err) {
                    console.error("Error fetching students:", err);
                    Swal.fire("Error", "Could not fetch students.", "error");
                }
            });

            // Set up the Delete button
// Declare a constant or variable
            const deleteButton = newRow.querySelector('.btn-outline-danger');
            deleteButton.addEventListener('click', async () => {
                try {
// Send HTTP request using Fetch API
                    const res = await fetch(`http://localhost:8000/courses/${encodeURIComponent(course.CourseNumber)}`, {
                        method: 'DELETE',
                        credentials: 'include'
                    });

                    if (!res.ok) {
// Declare a constant or variable
                        const result = await res.json();
                        Swal.fire("Error", result.error || "Failed to delete course.", "error");
                        return;
                    }

                    Swal.fire("Deleted!", "Course has been deleted.", "success");
                    // Refresh the course list
                    await refreshAllCourseDropdowns();

                } catch (err) {
                    console.error("Error deleting course:", err);
                    Swal.fire("Error", "Could not delete course.", "error");
                }
            });

            courseTableBody.appendChild(newRow);
        });
    } catch (error) {
        console.error("Error fetching courses:", error);
        Swal.fire("Error", "Could not fetch courses.", "error");
    }
}


//populating select course drop down on teams page
async function populateTeamCourseDropdown() {
// Declare a constant or variable
    const courseSelect = document.getElementById('teamCourseSelect');
    if (!courseSelect) return;

    // ⛳️ Get instructor ID from localStorage or session
// Declare a constant or variable
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
// Declare a constant or variable
    const UserId = currentUser?.UserID;

    if (!UserId) {
        console.error("Instructor not logged in or UserID missing.");
        return;
    }

    try {
// Send HTTP request using Fetch API
        const response = await fetch(`http://localhost:8000/courses/${UserId}`);
// Declare a constant or variable
        const data = await response.json();

        if (!response.ok) {
            console.error("Failed to fetch instructor courses:", data.error);
            return;
        }

        // Clear existing options
        courseSelect.innerHTML = '<option selected disabled>Select a course</option>';

        data.courses.forEach(course => {
// Declare a constant or variable
            const option = document.createElement('option');
            option.value = course.CourseNumber;
            option.textContent = `${course.CourseNumber} - ${course.CourseName}`;
            courseSelect.appendChild(option);
        });
    } catch (err) {
        console.error("Error loading instructor courses:", err);
    }
}

//display students based on the selected course
// Define a JavaScript function
function setupCourseStudentListener() {
// Declare a constant or variable
    const courseSelect = document.getElementById('teamCourseSelect');
// Declare a constant or variable
    const studentContainer = document.getElementById('teams');

    if (!courseSelect || !studentContainer) return;

    courseSelect.addEventListener('change', async () => {
// Declare a constant or variable
        const courseCode = courseSelect.value;
        if (!courseCode) return;

        try {
// Send HTTP request using Fetch API
            const response = await fetch(`http://localhost:8000/courses/${encodeURIComponent(courseCode)}/students`);
// Declare a constant or variable
            const data = await response.json();

            if (!response.ok) {
                console.error("Failed to fetch students:", data.error);
                return;
            }

            // Clear existing checkboxes
// Declare a constant or variable
            const formCheckElements = studentContainer.querySelectorAll('.form-check');
            formCheckElements.forEach(el => el.remove());

            // Dynamically create new checkboxes
            data.students.forEach((student, index) => {
// Declare a constant or variable
                const formCheck = document.createElement('div');
                formCheck.className = 'form-check';

// Declare a constant or variable
                const input = document.createElement('input');
                input.type = 'checkbox';
                input.className = 'form-check-input';
                input.id = `student-${index}`;
                input.value = student.Email;

// Declare a constant or variable
                const label = document.createElement('label');
                label.className = 'form-check-label';
                label.htmlFor = input.id;
                label.textContent = `${student.FirstName} ${student.LastName}`;

                formCheck.appendChild(input);
                formCheck.appendChild(label);

                studentContainer.querySelector('.mb-3:nth-child(2)').appendChild(formCheck);
            });

        } catch (error) {
            console.error("Error fetching students:", error);
        }
    });
}


//Displays teams the instructor has created for specific course. This is for the instructor side
// Define a JavaScript function
function fetchAndDisplayTeamsForCourse(courseCode) {
// Send HTTP request using Fetch API
    fetch(`http://localhost:8000/courses/${encodeURIComponent(courseCode)}/teams`)
        .then(res => res.json())
        .then(data => {
// Declare a constant or variable
            const teamList = document.getElementById('teamList');
            teamList.innerHTML = '';

            data.teams.forEach(team => {
// Declare a constant or variable
                const listItem = document.createElement('li');
                listItem.className = 'list-group-item';
                listItem.innerHTML = `
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <strong>${team.teamName}</strong><br>
                            Course: ${courseCode}<br>
                            Members: ${team.members.join(', ')}
                        </div>
                        <div class="btn-group">
                            <button class="btn btn-sm btn-outline-primary btn-edit-team">Edit</button>
                            <button class="btn btn-sm btn-outline-danger btn-delete-team">Delete</button>
                        </div>
                    </div>
                `;
                teamList.appendChild(listItem);

                // 🔧 Wire up Edit button
// Declare a constant or variable
                const editBtn = listItem.querySelector('.btn-edit-team');
                editBtn.addEventListener('click', () => {
                    editingGroupId = team.groupId;  // 👈 make sure this comes from backend
                    document.getElementById('teamName').value = team.teamName;
                    document.getElementById('teamCourseSelect').value = courseCode;

// Declare a constant or variable
                    const studentCheckboxes = document.querySelectorAll('#teams .form-check-input');
                    studentCheckboxes.forEach(cb => {
                        cb.checked = team.members.includes(cb.value);
                    });
                });

                // 🔧 Wire up Delete button (optional for now)
// Declare a constant or variable
                const deleteBtn = listItem.querySelector('.btn-delete-team');
                deleteBtn.addEventListener('click', async () => {
// Declare a constant or variable
                    const confirmed = await Swal.fire({
                        title: "Are you sure?",
                        text: "This will permanently delete the team.",
                        icon: "warning",
                        showCancelButton: true,
                        confirmButtonText: "Yes, delete it!"
                    });

                    if (!confirmed.isConfirmed) return;

                    try {
// Send HTTP request using Fetch API
                        const response = await fetch(`http://localhost:8000/teams/${team.groupId}`, {
                            method: 'DELETE'
                        });

// Declare a constant or variable
                        const result = await response.json();

                        if (!response.ok) {
                            Swal.fire("Error", result.error || "Failed to delete team.", "error");
                            return;
                        }

                        Swal.fire("Deleted!", "Team has been deleted.", "success");
                        fetchAndDisplayTeamsForCourse(courseCode); // 🔁 Refresh the list

                    } catch (err) {
                        console.error("Error deleting team:", err);
                        Swal.fire("Error", "Something went wrong.", "error");
                    }
                });

            });
        })
        .catch(err => {
            console.error("Error loading teams:", err);
        });
}


//---------------------------------------------------------------------------------------------------------------------------------------

/**
 * Initializes the Instructor Dashboard after the instructor logs in.
 * This function sets up all event listeners, populates dropdowns, 
 * and renders the instructor interface components.
 * 
 * This is called manually after dynamically inserting instructor.html,
 * because DOMContentLoaded will NOT fire again after the initial page load.
 * 
 * Includes setup for:
 * - Course creation form and table
 * - Team creation tools
 * - Review creation, preview, saving
 * - Schedule assignments dropdowns
 * - Tab event listeners and DOM hooks
 */
// Define a JavaScript function
function initalizeInstructorPage() {
    
// Declare a constant or variable
        const joinCodeDisplay = document.getElementById('joinCodeDisplay');
// Declare a constant or variable
        const joinCodeText = document.getElementById('joinCodeText');
// Declare a constant or variable
        const generateJoinCodeBtn = document.getElementById('generateJoinCode');
// Declare a constant or variable
        const createCourseForm = document.getElementById('createCourseForm');
// Declare a constant or variable
        const courseTableBody = document.getElementById('courseTableBody');
    
// Declare a constant or variable
        const createTeamBtn = document.getElementById('createTeamBtn');
// Declare a constant or variable
        const teamList = document.getElementById('teamList');
    
// Declare a constant or variable
        let currentJoinCode = ''; // Store latest generated join code (optional)

        refreshAllCourseDropdowns().then(() => {
            setupCourseStudentListener();
        });
    
        
        //click event for the logout button on the instructor page
// Declare a constant or variable
        const logoutBtn = document.getElementById('btnLogout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
// Declare a constant or variable
                const instructorPage = document.getElementById('instructorPage');
                if (instructorPage) instructorPage.remove();

                document.body.className = 'bg-dark d-flex align-items-center justify-content-center min-vh-100';
// Declare a constant or variable
                const selectDiv = document.getElementById('divSelect');
                if (selectDiv) selectDiv.style.display = 'block';
            
        // Optionally clear any stored user info
        // localStorage.removeItem('currentUser');
    });
}

        
        
        
        //--------------------------------------------------------------------------------------------------
        //*******************************************Reports Tab**************************************** */
        //click event for generate reports button. Using a simulation with the 
        document.getElementById('generateReportBtn').addEventListener('click', () => {
// Declare a constant or variable
            const selectedCourse = document.getElementById('reportCourseSelect').value;
            if (!selectedCourse) {
                alert("Please select a course to generate the report.");
                return;
            }
            renderReportsForCourse(selectedCourse);
        });
    
        
        //---------------------------------------------------------------------------------------------------------------
        //*************************************Review Results********************************************************* */
        document.getElementById('viewReviewResultsBtn').addEventListener('click', () => {
// Declare a constant or variable
            const selectedCourse = document.getElementById('resultsCourseSelect').value;
// Declare a constant or variable
            const selectedReview = document.getElementById('resultsReviewSelect').value;
        
            // Simple validation
            if (!selectedCourse || !selectedReview) {
                alert("Please select both a course and a review.");
                return;
            }
        
            // Simulate what will eventually be a backend call
            console.log("Ready to fetch results for:");
            console.log("Course Code:", selectedCourse);
            console.log("Review ID:", selectedReview);
        
            // Future backend fetch will go here
        
            // Show a placeholder for now
// Declare a constant or variable
            const list = document.getElementById('reviewResultsList');
            list.innerHTML = `
                <li class="list-group-item text-muted">
                    Placeholder: Review results will be loaded here from the backend.
                </li>
            `;
        });
        
        //***************************************End of Review Results*********************************************** */
        //--------------------------------------------------------------------------------------------------------------
        
        //***************************************Schedule Reviews Tab*************************************************** */
        //event listener for assign review button
        document.getElementById('assignReviewBtn').addEventListener('click', async () => {
// Declare a constant or variable
            const courseCode = document.getElementById('scheduleCourseSelect').value;
// Declare a constant or variable
            const assessmentID = document.getElementById('scheduleReviewSelect').value;
// Declare a constant or variable
            const dueDate = document.getElementById('reviewDueDate').value;
        
            // Validate form
            if (!courseCode || !assessmentID || !dueDate) {
                Swal.fire("Missing Info", "Please select course, review, and due date.", "warning");
                return;
            }
        
            // Get CourseID from selected course code (assumes courses[] is already loaded)
// Declare a constant or variable
            const course = courses.find(c => c.CourseNumber === courseCode);

            if (!course) {
                Swal.fire("Error", "Course not found.", "error");
                return;
            }
        
// Declare a constant or variable
            const payload = {
                assessmentID,
                courseID: course.CourseID,
                dueDate
            };
        
            try {
// Send HTTP request using Fetch API
                const response = await fetch('http://localhost:8000/assign-review', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
        
// Declare a constant or variable
                const result = await response.json();
                if (!response.ok) throw new Error(result.error);
        
                Swal.fire("Success", "Review assigned!", "success");
        
                // Reset form
                document.getElementById('scheduleCourseSelect').selectedIndex = 0;
                document.getElementById('scheduleReviewSelect').selectedIndex = 0;
                document.getElementById('reviewDueDate').value = '';
        
                // Refresh assigned list
                displayAssignedReviews(); // If you build this later
        
            } catch (err) {
                console.error("Error assigning review:", err);
                Swal.fire("Error", err.message, "error");
            }
        });
        

        
        
    
        
        
        //*************************************************Reviews Tab********************************** ***********************/
        //--------------------------------------------------------------------------------------------------------------------------------------
        //Event listener for when instructor selects a different question
        document.getElementById('questionType').addEventListener('change', function () {
// Declare a constant or variable
            const selectedType = this.value //value of the selected question
// Declare a constant or variable
            const optionsContainer = document.getElementById('questionOptionsContainer') //questionOptionsContainer value stored in options container
        
            // Always reset first
            optionsContainer.innerHTML = ''
            optionsContainer.style.display = 'none' // Start hidden
            //if selected type is likert, show a fixed 1-5 agreement scale
            if (selectedType === 'likert') {
                optionsContainer.style.display = 'block'
        
// Declare a constant or variable
                const likertOptions = ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'] //scale options
                likertOptions.forEach(label => { //for each value in the scale, create a new <div> and sets the inner html to include a disabled radio input (so the instructor cant click it) and a label that shows the selected likert option
// Declare a constant or variable
                    const div = document.createElement('div')
                    div.className = 'form-check'
                    div.innerHTML = `
                        <input class="form-check-input" type="radio" disabled> 
                        <label class="form-check-label">${label}</label>
                    `
                    optionsContainer.appendChild(div) //appends radip button + label row into the #questionOptionsContainer
                })
                //if the selected type is multiple choice or multiselect, give custom options 
            } else if (selectedType === 'multiple-choice' || selectedType === 'multi-select') {
                optionsContainer.style.display = 'block' //shows the extra options
                //label for the section
// Declare a constant or variable
                const label = document.createElement('label')
                label.className = 'form-label';
                label.textContent = 'Answer Choices:'
                optionsContainer.appendChild(label)
                //container that holds all the answer options
// Declare a constant or variable
                const optionList = document.createElement('div')
                optionList.id = 'mcOptionList'
                optionsContainer.appendChild(optionList)
                //add option button that lets instructor add more answer choices
// Declare a constant or variable
                const addBtn = document.createElement('button')
                addBtn.type = 'button'
                addBtn.className = 'btn btn-sm btn-outline-secondary mt-2'
                addBtn.textContent = 'Add Option';
                //add new input row with text box and remove button
                addBtn.addEventListener('click', () => {
// Declare a constant or variable
                    const optionInput = document.createElement('div')
                    optionInput.className = 'input-group mb-2'
                    optionInput.innerHTML = `
                        <input type="text" class="form-control" placeholder="Option text">
                        <button class="btn btn-outline-danger" type="button">Remove</button>
                    `
                    optionInput.querySelector('button').addEventListener('click', () => { //handle remove button click to delete the input row
                        optionInput.remove()
                    })
                    optionList.appendChild(optionInput) //add new input row to the option list
                })
        
                optionsContainer.appendChild(addBtn) //add button to the options container
                addBtn.click(); // Automatically click the add button once to show the first option
            }
        
            // For short answer or essay, the container remains hidden.
        })
        
        document.getElementById('addQuestionBtn').addEventListener('click', () => {
// Declare a constant or variable
            const type = document.getElementById('questionType').value;
// Declare a constant or variable
            const text = document.getElementById('questionText').value.trim();
// Declare a constant or variable
            const optionsContainer = document.getElementById('questionOptionsContainer');
        
            if (!type || !text) { //validation to make sure question type is selected or that a question is created
                alert('Please select a question type and enter a question.');
                return;
            }
        
// Declare a constant or variable
            let options = [];
        
            if (type === 'multiple-choice' || type === 'multi-select') {
// Declare a constant or variable
                const optionInputs = optionsContainer.querySelectorAll('#mcOptionList input');
                optionInputs.forEach(input => {
// Declare a constant or variable
                    const val = input.value.trim();
                    if (val !== '') {
                        options.push(val);
                    }
                });
        
                if (options.length < 2) {
                    alert('Please enter at least 2 answer choices.');
                    return;
                }
            } else if (type === 'likert') {
                options = ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'];
            }
        
            // Create question object
// Declare a constant or variable
            const question = {
                id: crypto.randomUUID(), // for tracking/editing/deleting later
                type,
                text,
                options
            };
        
            // Save it
            questions.push(question);
        
            // Render it in the preview list
            renderQuestionPreview(question);
        
            // Clear form
            document.getElementById('questionText').value = '';
            document.getElementById('questionType').value = '';
            optionsContainer.innerHTML = '';
            optionsContainer.style.display = 'none';
        });
        
        // click event after clicking the Save review button
        document.getElementById('saveReviewBtn').addEventListener('click', () => {
// Declare a constant or variable
            const title = document.getElementById('reviewTitle').value.trim();
// Declare a constant or variable
            const course = document.getElementById('reviewCourseSelect').value;
        
            if (!title || !course) {
                Swal.fire("Missing Info", "Please enter a review title and select a course.", "warning");
                return;
            }
        
            if (questions.length === 0) {
                Swal.fire("No Questions", "Please add at least one question to the review.", "warning");
                return;
            }
        
// Declare a constant or variable
            const review = {
                title,
                courseCode: course,
                questions: [...questions] // Make a shallow copy
            };
        
// Send HTTP request using Fetch API
            fetch('http://localhost:8000/create-assessment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(review)
            })
            .then(res => res.json())
            .then(result => {
                if (result.error) throw new Error(result.error);
        
                Swal.fire("Success", "Review saved successfully!", "success");
        
                // Refresh dropdowns
                populateScheduleDropdowns();
                populateReviewResultsDropdowns();
                displaySavedReviews();
        
                // Clear form and local questions array
                document.getElementById('reviewTitle').value = '';
                document.getElementById('reviewCourseSelect').selectedIndex = 0;
                document.getElementById('reviewQuestionList').innerHTML = '';
                questions = [];
            })
            .catch(err => {
                console.error("Failed to save review:", err);
                Swal.fire("Error", err.message, "error");
            });
        });
        
        //***********************************End of Reviews Tab********************************************************************************/
        //---------------------------------------------------------------------------------------------------------------------------
        
        //---------------------------------------------------------------------------------------------------------------------------------------
        //******************************************Teams Tab******************************************************************************* */
    
        //logic for after pushing the create team button
        if (createTeamBtn) {
            createTeamBtn.addEventListener('click', async () => {
// Declare a constant or variable
                const selectedCourseCode = document.getElementById('teamCourseSelect').value;
// Declare a constant or variable
                const teamName = document.getElementById('teamName').value.trim();
// Declare a constant or variable
                const studentCheckboxes = document.querySelectorAll('#teams .form-check-input');
// Declare a constant or variable
                const selectedStudents = Array.from(studentCheckboxes)
                    .filter(cb => cb.checked)
                    .map(cb => cb.value);  // Student emails
        
                // Validation
                if (!selectedCourseCode) {
                    Swal.fire("Error", "Please select a course.", "warning");
                    return;
                }
                if (!teamName) {
                    Swal.fire("Error", "Please enter a team name.", "warning");
                    return;
                }
                if (selectedStudents.length === 0) {
                    Swal.fire("Error", "Please select at least one student.", "warning");
                    return;
                }
        
                try {
                    // Determine route and method
// Declare a constant or variable
                    let url = 'http://localhost:8000/teams';
// Declare a constant or variable
                    let method = 'POST';
                    if (editingGroupId) {
                        url = `http://localhost:8000/teams/${editingGroupId}`;
                        method = 'PUT';
                    }
        
// Send HTTP request using Fetch API
                    const response = await fetch(url, {
                        method,
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            courseCode: selectedCourseCode,
                            teamName,
                            studentEmails: selectedStudents
                        })
                    });
        
// Declare a constant or variable
                    const result = await response.json();
        
                    if (!response.ok) {
                        Swal.fire("Error", result.error || "Failed to save team.", "error");
                        return;
                    }
        
                    Swal.fire("Success", editingGroupId ? "Team updated." : "Team created.", "success");
        
                    // Clear form and reset editing state
                    editingGroupId = null;
                    document.getElementById('teamName').value = '';
                    studentCheckboxes.forEach(cb => cb.checked = false);
        
                    // Refresh team list for the selected course
                    fetchAndDisplayTeamsForCourse(selectedCourseCode);
        
                } catch (err) {
                    console.error("Error creating/updating team:", err);
                    Swal.fire("Error", "Something went wrong.", "error");
                }
            });
        }
        
        
        
        document.getElementById('teamCourseSelect').addEventListener('change', (e) => {
// Declare a constant or variable
            const selectedCourseCode = e.target.value;
            if (selectedCourseCode) {
                fetchAndDisplayTeamsForCourse(selectedCourseCode);
            }
        });

        // --- 🆕 New scheduleCourseSelect listener ---
        document.getElementById('scheduleCourseSelect').addEventListener('change', async function () {
// Declare a constant or variable
            const selectedCourse = this.value;
// Declare a constant or variable
            const reviewSelect = document.getElementById('scheduleReviewSelect');
    
            reviewSelect.innerHTML = '<option disabled selected>Select a review</option>';

            if (!selectedCourse) return;

            try {
// Send HTTP request using Fetch API
                const response = await fetch(`http://localhost:8000/reviews-by-course/${selectedCourse}`);
// Declare a constant or variable
                const data = await response.json();

                if (!data || data.length === 0) {
// Declare a constant or variable
                    const opt = document.createElement('option');
                    opt.disabled = true;
                    opt.textContent = 'No reviews found';
                    reviewSelect.appendChild(opt);
                    return;
                }

                data.forEach(review => {
// Declare a constant or variable
                    const option = document.createElement('option');
                    option.value = review.AssessmentID;
                    option.textContent = review.Name;
                    reviewSelect.appendChild(option);
                });

            } catch (err) {
                console.error("Error loading reviews:", err);
        }
        });
        //********************************************End of Teams tab************************************************************************** */
        //-----------------------------------------------------------------------------------------------------------------------------------------
    
        //--------------------------------------------------------------------------------------------------------------------------------------
        //**************************************************Courses Tab******************************************************************* */
        if (generateJoinCodeBtn) {
            generateJoinCodeBtn.addEventListener('click', () => {
                currentJoinCode = generateJoinCode();
                joinCodeText.textContent = currentJoinCode;
                joinCodeDisplay.classList.remove('d-none');
            });
        }
    
        // Handle course creation form submission
// Declare a constant or variable
        const createCourseBtn = document.getElementById('createCourseBtn');

if (createCourseBtn) {
    createCourseBtn.addEventListener('click', async function (e) {
        e.preventDefault();  // Optional now but still good practice
        
// Declare a constant or variable
        const courseName = document.getElementById('courseName').value.trim();
// Declare a constant or variable
        const courseCode = document.getElementById('courseCode').value.trim();
// Declare a constant or variable
        const courseSection = document.getElementById('courseSection').value.trim();
// Declare a constant or variable
        const currentUser = getCurrentUser();
        console.log("DEBUG currentUser:", currentUser);

        if (!courseName || !courseCode || !courseSection) {
            alert("Please fill in all fields");
            return;
        }

// Declare a constant or variable
        const joinCodeForThisCourse = currentJoinCode || generateJoinCode();

        try {
// Send HTTP request using Fetch API
            const response = await fetch('http://localhost:8000/createCourse', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    courseName,
                    courseCode,
                    courseSection,
                    joinCode: joinCodeForThisCourse,
                    userID: currentUser.UserID // Assuming you have the user ID from the logged-in user
                })
            });

// Declare a constant or variable
            const data = await response.json();

            if (!response.ok) {
                Swal.fire({
                    title: 'Error',
                    text: data.error || 'Failed to create course.',
                    icon: 'error'
                });
                return;
            }

            Swal.fire({
                title: 'Success!',
                text: 'Course created successfully.',
                icon: 'success'
            }).then(async() => {
                // Clear fields manually now (no form.reset())
                document.getElementById('courseName').value = '';
                document.getElementById('courseCode').value = '';
                document.getElementById('courseSection').value = '';
                joinCodeDisplay.classList.add('d-none');
                currentJoinCode = '';
                await refreshAllCourseDropdowns();

            });

        } catch (error) {
            console.error('Error during course creation:', error);
            Swal.fire({
                title: 'Error',
                text: 'An unexpected error occurred.',
                icon: 'error'
            });
        }
    });
}


document.getElementById('resultsCourseSelect').addEventListener('change', function () {
// Declare a constant or variable
    const selectedCourseCode = this.value;

    if (!selectedCourseCode) return;

    // Fetch all reviews for this course
// Send HTTP request using Fetch API
    fetch(`http://localhost:8000/reviews-by-course/${selectedCourseCode}`)
        .then(response => response.json())
        .then(data => {
// Declare a constant or variable
            const reviewDropdown = document.getElementById('resultsReviewSelect');
            reviewDropdown.innerHTML = '<option disabled selected>Select a review</option>';

            if (data.length === 0) {
                reviewDropdown.innerHTML += '<option disabled>No reviews found</option>';
                return;
            }

            data.forEach(review => {
// Declare a constant or variable
                const option = document.createElement('option');
                option.value = review.AssessmentID;
                option.textContent = review.Name;
                reviewDropdown.appendChild(option);
            });
        })
        .catch(err => {
            console.error('Failed to fetch reviews for selected course:', err);
            Swal.fire("Error", "Unable to load reviews for this course.", "error");
        });
});


        
        populateReportCourseDropdown()

        // Show saved reviews when instructor clicks the Reviews tab
        document.getElementById('reviews-tab').addEventListener('click', () => {
            displaySavedReviews();
        });

        document.getElementById('schedule-tab').addEventListener('click', () => {
            displayAssignedReviews();
        });
        
    
     //***************************************************End of Courses Tab********************************************* */
};

//***********************************END OF FUNCTIONS************************************************************************ */


// Handle "Generate Join Code" button click




