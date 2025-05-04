

// instructor.js

//global variables
let courses = []
let teams = []
let questions = [] //global questions array
let reviews = []  //globalreviews array
let assignments = []
let editingGroupId = null;

//***************************************************FUNCTIONS****************************************************************************************/

// Function to generate a 6-character alphanumeric join code
function generateJoinCode(length = 6) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
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
function renderQuestionPreview(question) {
    const list = document.getElementById('reviewQuestionList')  //Find the <ul> element that will hold all previewed questions

    const item = document.createElement('li') //Create a new <li> element for the current question
    item.className = 'list-group-item' //Bootstrap styling
    item.dataset.id = question.id; //Store the unique ID on the element for reference

    // Create the inner content
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
        const optionsContainer = document.getElementById('questionOptionsContainer');
        optionsContainer.innerHTML = '';
        optionsContainer.style.display = 'none';

        // Handle options depending on the type
        if (question.type === 'likert') {
            document.getElementById('questionType').dispatchEvent(new Event('change')) //Likert is pre-defined, so just re-trigger the dropdown change to rebuild UI
        } else if (question.type === 'multiple-choice' || question.type === 'multi-select') {
            document.getElementById('questionType').dispatchEvent(new Event('change')) //Same: trigger the change to set up the container
            const optionList = document.getElementById('mcOptionList') //manually add back the saved options into the option list
            question.options.forEach(opt => {
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
function populateReviewCourseDropdown() {
    const reviewCourseSelect = document.getElementById('reviewCourseSelect');
    if (reviewCourseSelect) {
        reviewCourseSelect.innerHTML = '<option disabled selected>Select a course</option>';

        courses.forEach(course => {
            const option = document.createElement('option');
            option.value = course.CourseNumber;
            option.textContent = `${course.CourseNumber} - ${course.CourseName}`;
            reviewCourseSelect.appendChild(option);
        });
    }
}


//******************Function for displaying Saved Reviews**************///
function displaySavedReviews() {
    const list = document.getElementById('savedReviewsList');
    list.innerHTML = ''; // Clear old list
    //show a placeholder message if no reviews exist
    if (reviews.length === 0) {
        const item = document.createElement('li');
        item.className = 'list-group-item';
        item.textContent = 'No reviews saved yet.';
        list.appendChild(item);
        return;
    }
    //loop through all saved reviews and display them
    reviews.forEach(review => {
        const item = document.createElement('li'); //create the list item container
        item.className = 'list-group-item d-flex justify-content-between align-items-start';

        const content = document.createElement('div'); //build the left-side content: title course and question count
        content.innerHTML = `
            <strong>${review.title}</strong><br>
            Course: ${review.courseCode}<br>
            Questions: ${review.questions.length}
        `;

        const btnGroup = document.createElement('div'); //create button group: Edit, Delete, View
        btnGroup.className = 'btn-group btn-group-sm';

        // EDIT Button
        const editBtn = document.createElement('button');
        editBtn.className = 'btn btn-outline-primary';
        editBtn.textContent = 'Edit';
        editBtn.addEventListener('click', () => {
            // Load review data back into form
            document.getElementById('reviewTitle').value = review.title;
            document.getElementById('reviewCourseSelect').value = review.courseCode;

            // Set questions[] to this review’s questions
            questions = [...review.questions];

            // Re-render all questions into the preview
            document.getElementById('reviewQuestionList').innerHTML = '';
            questions.forEach(q => renderQuestionPreview(q));

            // Remove review from the list so it's not duplicated on save
            reviews = reviews.filter(r => r.id !== review.id);
            renderSavedReviews();
        });

        // DELETE Button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-outline-danger';
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => { //click event for delete button
            // Remove from array and re-render list
            reviews = reviews.filter(r => r.id !== review.id);
            displaySavedReviews();
        });

        //View button
        const viewBtn = document.createElement('button');
        viewBtn.className = 'btn btn-outline-secondary';
        viewBtn.textContent = 'View';
        viewBtn.addEventListener('click', () => {
            const modelBody = document.getElementById('fullReviewModelBody');
            //construct model content: title, course, and all questions
            let html = `
                <p><strong>Title:</strong> ${review.title}</p>
                <p><strong>Course:</strong> ${review.courseCode}</p>
                <hr>
            `;
            //loop through each question in the review and display it
            review.questions.forEach((q, index) => {
                html += `<p><strong>Q${index + 1}:</strong> ${q.text} <em>(${q.type})</em></p>`; //add question number, question text, and question type 
                if (q.options && q.options.length > 0) { //if question has answer options, display them as list
                    html += `<ul>` //starts list
                    q.options.forEach(opt => {
                        html += `<li>${opt}</li>` //displays each option
                    });
                    html += `</ul>` //end of list
                }
            });

            modelBody.innerHTML = html;
            //show the model
            const model = new bootstrap.Model(document.getElementById('fullReviewModel'));
            model.show();
        });
        //adds the three buttons to the btnGroup container
        btnGroup.appendChild(viewBtn)
        btnGroup.appendChild(editBtn)
        btnGroup.appendChild(deleteBtn)

        item.appendChild(content) //item is the <li> representing one saved review. content contains the review title, course and question count
        item.appendChild(btnGroup) //btnGroup holds the 3 buttons
        list.appendChild(item) // appends the entire list to the outer <ul> (#savedReviewsList) which contains all the reviews
    }) 
}


//*************Function for filling in the dropdowns on the schedule tab***************** */
function populateScheduleDropdowns() {
    const courseSelect = document.getElementById('scheduleCourseSelect');
    const reviewSelect = document.getElementById('scheduleReviewSelect');

    // Populate courses
    if (courseSelect) {
        courseSelect.innerHTML = '<option disabled selected>Select a course</option>';
        courses.forEach(course => {
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
            const opt = document.createElement('option');
            opt.value = review.id;
            opt.textContent = review.title;
            reviewSelect.appendChild(opt);
        });
    }
}

//Function for displaying the assigned reviews created by an instructor
function displayAssignedReviews() {
    const list = document.getElementById('assignedReviewsList') //get ul element where the assigned reviews will be displayed
    list.innerHTML = '' // Clear previous list

    if (assignments.length === 0) { //if there are no assignments, display a message
        const item = document.createElement('li')
        item.className = 'list-group-item'
        item.textContent = 'No reviews have been assigned yet.'
        list.appendChild(item)
        return;
    }

    assignments.forEach(assign => { //loops through each assignment in the assignments array
        const course = courses.find(c => c.code === assign.courseCode) //finds the correct course using courseCode
        const review = reviews.find(r => r.id === assign.reviewId) //finds the correct review using reviewID

        const item = document.createElement('li'); //create a new <li> for the current assignment
        item.className = 'list-group-item d-flex justify-content-between align-items-start'
        //set the inner html to show: the review title, the course code and name, and the due date
        const content = document.createElement('div')
        content.innerHTML = `
            <strong>${review?.title || 'Unknown Review'}</strong><br>
            Course: ${course?.code || 'Unknown'} - ${course?.name || ''}<br>
            Due: ${assign.dueDate || 'No due date'}
        `

        //button group
        const btnGroup = document.createElement('div')
        btnGroup.className = 'btn-group btn-group-sm'

        //edit button
        const editBtn = document.createElement('button');
        editBtn.className = 'btn btn-outline-primary';
        editBtn.textContent = 'Edit';
        editBtn.addEventListener('click', () => {
            // Refill form with assignment data
            document.getElementById('scheduleCourseSelect').value = assign.courseCode
            document.getElementById('scheduleReviewSelect').value = assign.reviewId
            document.getElementById('reviewDueDate').value = assign.dueDate

            // Remove original assignment from array
            assignments = assignments.filter(a => a.id !== assign.id);
            displayAssignedReviews(); // Re-render the list
        })

        //delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-outline-danger';
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => {
            // Remove assignment from array
            assignments = assignments.filter(a => a.id !== assign.id);
            displayAssignedReviews(); // Re-render the list
        });

        // Add buttons to button group
        btnGroup.appendChild(editBtn);
        btnGroup.appendChild(deleteBtn);

        // Add everything to the list item
        item.appendChild(content);
        item.appendChild(btnGroup);

        list.appendChild(item); //add the <li> item to the list
    });
}


function populateReviewResultsDropdowns() {
    const courseSelect = document.getElementById('resultsCourseSelect');
    const reviewSelect = document.getElementById('resultsReviewSelect');

    if (!courseSelect || !reviewSelect) return;

    // Populate course dropdown
    courseSelect.innerHTML = '<option disabled selected>Select a course</option>';
    courses.forEach(course => {
        const option = document.createElement('option');
        option.value = course.CourseNumber;
        option.textContent = `${course.CourseNumber} - ${course.CourseName}`;
        courseSelect.appendChild(option);
        });

    // Populate review dropdown
    reviewSelect.innerHTML = '<option disabled selected>Select a review</option>';
    reviews.forEach(review => {
        const option = document.createElement('option');
        option.value = review.id;
        option.textContent = review.title;
        reviewSelect.appendChild(option);
    });
}



function renderReviewResults() {
    const courseCode = document.getElementById('resultsCourseSelect').value;
    const reviewId = document.getElementById('resultsReviewSelect').value;
    const list = document.getElementById('reviewResultsList');

    list.innerHTML = ''; // Clear old results

    // Filter responses for this course + review
    const filtered = responses.filter(r => r.courseCode === courseCode && r.reviewId === reviewId);

    if (filtered.length === 0) {
        const li = document.createElement('li');
        li.className = 'list-group-item';
        li.textContent = 'No submissions found for this review.';
        list.appendChild(li);
        return;
        }

    filtered.forEach(r => {
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
function renderReportsForCourse(courseCode) {
    const list = document.getElementById('reportResultsList');
    list.innerHTML = '';

    const item = document.createElement('li');
    item.className = 'list-group-item text-muted';
    item.innerHTML = `
        <em>Student responses and scores will appear here once backend integration is complete.</em>
    `;
    list.appendChild(item);
}



function populateReportCourseDropdown() {
    const select = document.getElementById('reportCourseSelect');
    if (!select) return;

    select.innerHTML = '<option disabled selected>Select a course</option>';

    courses.forEach(course => {
        const opt = document.createElement('option');
        opt.value = course.CourseNumber;
        opt.textContent = `${course.CourseNumber} - ${course.CourseName}`;
        select.appendChild(opt);
    });
}



function getCurrentUser() {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
}


async function fetchAndDisplayCourses() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        Swal.fire("Error", "User not logged in.", "error");
        return;
    }

    try {
        const response = await fetch(`http://localhost:8000/courses/${currentUser.UserID}`, {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Failed to fetch courses');
        }

        const data = await response.json();
        const coursesFromDB = data.courses;

        courses = coursesFromDB;

        // Filter courses by instructor's email
        const instructorCourses = coursesFromDB;

        const courseTableBody = document.getElementById('courseTableBody');
        courseTableBody.innerHTML = '';

        instructorCourses.forEach(course => {
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
            const viewButton = newRow.querySelector('.btn-outline-info');
            viewButton.addEventListener('click', async () => {
                try {
                    const res = await fetch(`http://localhost:8000/courses/${encodeURIComponent(course.CourseNumber)}/students`);
                    const result = await res.json();

                    if (!res.ok) {
                        Swal.fire("Error", result.error || "Failed to fetch students.", "error");
                        return;
                    }

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
            const deleteButton = newRow.querySelector('.btn-outline-danger');
            deleteButton.addEventListener('click', async () => {
                try {
                    const res = await fetch(`http://localhost:8000/courses/${encodeURIComponent(course.CourseNumber)}`, {
                        method: 'DELETE',
                        credentials: 'include'
                    });

                    if (!res.ok) {
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
    const courseSelect = document.getElementById('teamCourseSelect');
    if (!courseSelect) return;

    // ⛳️ Get instructor ID from localStorage or session
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const UserId = currentUser?.UserID;
    // const UserId = userData.user.UserID

    if (!UserId) {
        console.error("Instructor not logged in or UserID missing.");
        return;
    }

    try {
        const response = await fetch(`http://localhost:8000/courses/${UserId}`);
        const data = await response.json();

        if (!response.ok) {
            console.error("Failed to fetch instructor courses:", data.error);
            return;
        }

        // Clear existing options
        courseSelect.innerHTML = '<option selected disabled>Select a course</option>';

        data.courses.forEach(course => {
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
function setupCourseStudentListener() {
    const courseSelect = document.getElementById('teamCourseSelect');
    const studentContainer = document.getElementById('teams');

    if (!courseSelect || !studentContainer) return;

    courseSelect.addEventListener('change', async () => {
        const courseCode = courseSelect.value;
        if (!courseCode) return;

        try {
            const response = await fetch(`http://localhost:8000/courses/${encodeURIComponent(courseCode)}/students`);
            const data = await response.json();

            if (!response.ok) {
                console.error("Failed to fetch students:", data.error);
                return;
            }

            // Clear existing checkboxes
            const formCheckElements = studentContainer.querySelectorAll('.form-check');
            formCheckElements.forEach(el => el.remove());

            // Dynamically create new checkboxes
            data.students.forEach((student, index) => {
                const formCheck = document.createElement('div');
                formCheck.className = 'form-check';

                const input = document.createElement('input');
                input.type = 'checkbox';
                input.className = 'form-check-input';
                input.id = `student-${index}`;
                input.value = student.Email;

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
function fetchAndDisplayTeamsForCourse(courseCode) {
    fetch(`http://localhost:8000/courses/${encodeURIComponent(courseCode)}/teams`)
        .then(res => res.json())
        .then(data => {
            const teamList = document.getElementById('teamList');
            teamList.innerHTML = '';

            data.teams.forEach(team => {
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
                const editBtn = listItem.querySelector('.btn-edit-team');
                editBtn.addEventListener('click', () => {
                    editingGroupId = team.groupId;  // 👈 make sure this comes from backend
                    document.getElementById('teamName').value = team.teamName;
                    document.getElementById('teamCourseSelect').value = courseCode;

                    const studentCheckboxes = document.querySelectorAll('#teams .form-check-input');
                    studentCheckboxes.forEach(cb => {
                        cb.checked = team.members.includes(cb.value);
                    });
                });

                // 🔧 Wire up Delete button (optional for now)
                const deleteBtn = listItem.querySelector('.btn-delete-team');
                deleteBtn.addEventListener('click', async () => {
                    const confirmed = await Swal.fire({
                        title: "Are you sure?",
                        text: "This will permanently delete the team.",
                        icon: "warning",
                        showCancelButton: true,
                        confirmButtonText: "Yes, delete it!"
                    });

                    if (!confirmed.isConfirmed) return;

                    try {
                        const response = await fetch(`http://localhost:8000/teams/${team.groupId}`, {
                            method: 'DELETE'
                        });

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
function initalizeInstructorPage() {
    
        const joinCodeDisplay = document.getElementById('joinCodeDisplay');
        const joinCodeText = document.getElementById('joinCodeText');
        const generateJoinCodeBtn = document.getElementById('generateJoinCode');
        const createCourseForm = document.getElementById('createCourseForm');
        const courseTableBody = document.getElementById('courseTableBody');
    
        const createTeamBtn = document.getElementById('createTeamBtn');
        const teamList = document.getElementById('teamList');
    
        let currentJoinCode = ''; // Store latest generated join code (optional)

        refreshAllCourseDropdowns().then(() => {
            setupCourseStudentListener();
        });

    
        
        //click event for the logout button on the instructor page
        const logoutBtn = document.getElementById('btnLogout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                const instructorPage = document.getElementById('instructorPage');
                if (instructorPage) instructorPage.remove();

                document.body.className = 'bg-dark d-flex align-items-center justify-content-center min-vh-100';
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
            const selectedCourse = document.getElementById('resultsCourseSelect').value;
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
        document.getElementById('assignReviewBtn').addEventListener('click', () => {
            const courseCode = document.getElementById('scheduleCourseSelect').value //get selected course code from the drop down
            const reviewId = document.getElementById('scheduleReviewSelect').value //gets selected review from dropdown
            const dueDate = document.getElementById('reviewDueDate').value //gets due date from the date input
        
            // Validation
            if (!courseCode || !reviewId) { //makes sure course and review are selected
                alert("Please select both a course and a review.");
                return;
            }
        
            // Store the assignment in the assignments array
            assignments.push({
                id: crypto.randomUUID(),  //unique ID for future use
                courseCode,
                reviewId,
                dueDate
            })
    
            displayAssignedReviews() // calls displayAssignedReviews so the instructor can see what they have made already
        
            // Reset form fields
            document.getElementById('scheduleCourseSelect').selectedIndex = 0
            document.getElementById('scheduleReviewSelect').selectedIndex = 0
            document.getElementById('reviewDueDate').value = ''
        
            // Show a temporary success message
            const alertBox = document.getElementById('assignmentSuccessAlert')
            alertBox.classList.remove('d-none')
            setTimeout(() => {
                alertBox.classList.add('d-none') //hides message after 3 seconds
            }, 3000);
            
        });
        
    
        
        
        //*************************************************Reviews Tab********************************** ***********************/
        //--------------------------------------------------------------------------------------------------------------------------------------
        //Event listener for when instructor selects a different question
        document.getElementById('questionType').addEventListener('change', function () {
            const selectedType = this.value //value of the selected question
            const optionsContainer = document.getElementById('questionOptionsContainer') //questionOptionsContainer value stored in options container
        
            // Always reset first
            optionsContainer.innerHTML = ''
            optionsContainer.style.display = 'none' // Start hidden
            //if selected type is likert, show a fixed 1-5 agreement scale
            if (selectedType === 'likert') {
                optionsContainer.style.display = 'block'
        
                const likertOptions = ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'] //scale options
                likertOptions.forEach(label => { //for each value in the scale, create a new <div> and sets the inner html to include a disabled radio input (so the instructor cant click it) and a label that shows the selected likert option
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
                const label = document.createElement('label')
                label.className = 'form-label';
                label.textContent = 'Answer Choices:'
                optionsContainer.appendChild(label)
                //container that holds all the answer options
                const optionList = document.createElement('div')
                optionList.id = 'mcOptionList'
                optionsContainer.appendChild(optionList)
                //add option button that lets instructor add more answer choices
                const addBtn = document.createElement('button')
                addBtn.type = 'button'
                addBtn.className = 'btn btn-sm btn-outline-secondary mt-2'
                addBtn.textContent = 'Add Option';
                //add new input row with text box and remove button
                addBtn.addEventListener('click', () => {
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
            const type = document.getElementById('questionType').value;
            const text = document.getElementById('questionText').value.trim();
            const optionsContainer = document.getElementById('questionOptionsContainer');
        
            if (!type || !text) { //validation to make sure question type is selected or that a question is created
                alert('Please select a question type and enter a question.');
                return;
            }
        
            let options = [];
        
            if (type === 'multiple-choice' || type === 'multi-select') {
                const optionInputs = optionsContainer.querySelectorAll('#mcOptionList input');
                optionInputs.forEach(input => {
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
            const title = document.getElementById('reviewTitle').value.trim();
            const course = document.getElementById('reviewCourseSelect').value;
        
            if (!title || !course) {
                alert("Please enter a review title and select a course.");
                return;
            }
        
            if (questions.length === 0) {
                alert("Please add at least one question to the review.");
                return;
            }
        
            const review = {
                id: crypto.randomUUID(),
                title,
                courseCode: course,
                questions: [...questions] // copy the questions array
            };
        
            reviews.push(review);
            populateScheduleDropdowns()
            populateReviewResultsDropdowns() //call populareReviewResultsDropdowns to fill in select boxes on review results tab
        
            // Reset the form and question list
            document.getElementById('reviewTitle').value = ''
            document.getElementById('reviewCourseSelect').selectedIndex = 0
            document.getElementById('reviewQuestionList').innerHTML = ''
            questions = [];
        
            alert("Review saved successfully!")
            displaySavedReviews()
        });
        //***********************************End of Reviews Tab********************************************************************************/
        //---------------------------------------------------------------------------------------------------------------------------
        
        //---------------------------------------------------------------------------------------------------------------------------------------
        //******************************************Teams Tab******************************************************************************* */
    
        //logic for after pushing the create team button
        if (createTeamBtn) {
            createTeamBtn.addEventListener('click', async () => {
                const selectedCourseCode = document.getElementById('teamCourseSelect').value;
                const teamName = document.getElementById('teamName').value.trim();
                const studentCheckboxes = document.querySelectorAll('#teams .form-check-input');
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
                    let url = 'http://localhost:8000/teams';
                    let method = 'POST';
                    if (editingGroupId) {
                        url = `http://localhost:8000/teams/${editingGroupId}`;
                        method = 'PUT';
                    }
        
                    const response = await fetch(url, {
                        method,
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            courseCode: selectedCourseCode,
                            teamName,
                            studentEmails: selectedStudents
                        })
                    });
        
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
            const selectedCourseCode = e.target.value;
            if (selectedCourseCode) {
                fetchAndDisplayTeamsForCourse(selectedCourseCode);
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
        const createCourseBtn = document.getElementById('createCourseBtn');

if (createCourseBtn) {
    createCourseBtn.addEventListener('click', async function (e) {
        e.preventDefault();  // Optional now but still good practice
        
        const courseName = document.getElementById('courseName').value.trim();
        const courseCode = document.getElementById('courseCode').value.trim();
        const courseSection = document.getElementById('courseSection').value.trim();

        const currentUser = getCurrentUser();
        console.log("DEBUG currentUser:", currentUser);


        if (!courseName || !courseCode || !courseSection) {
            alert("Please fill in all fields");
            return;
        }
        console.log(currentUser.UserID)
        const joinCodeForThisCourse = currentJoinCode || generateJoinCode();

        try {
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

        
        populateReportCourseDropdown()
    
     //***************************************************End of Courses Tab********************************************* */

};


//***********************************END OF FUNCTIONS************************************************************************ */


// Handle "Generate Join Code" button click




