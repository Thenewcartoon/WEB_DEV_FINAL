
// When a review is selected (e.g., via a "View/Answer" button), fetch and render its questions
async function renderReviewQuestions(assessmentID) {
    const container = document.getElementById('reviewQuestionsContainer');
    container.innerHTML = ''; // Clear previous questions

    try {
        const response = await fetch(`http://localhost:8000/assessment-details/${assessmentID}`);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Failed to load questions.");
        }

        const questions = result.questions;

        questions.forEach((q, index) => {
            const questionDiv = document.createElement('div');
            questionDiv.className = 'mb-3';

            questionDiv.innerHTML = `<label class="form-label"><strong>Q${index + 1}:</strong> ${q.QuestionNarrative}</label>`;

            let inputElement;

            if (q.QuestionType === 'short-answer' || q.QuestionType === 'essay') {
                inputElement = document.createElement('textarea');
                inputElement.className = 'form-control';
                inputElement.rows = q.QuestionType === 'essay' ? 4 : 2;
            } else if (q.QuestionType === 'multiple-choice' || q.QuestionType === 'single-select') {
                inputElement = document.createElement('select');
                inputElement.className = 'form-select';
                const opts = JSON.parse(q.Options || '[]');
                opts.forEach(opt => {
                    const option = document.createElement('option');
                    option.value = opt;
                    option.textContent = opt;
                    inputElement.appendChild(option);
                });
            } else if (q.QuestionType === 'multi-select') {
                inputElement = document.createElement('div');
                const opts = JSON.parse(q.Options || '[]');
                opts.forEach(opt => {
                    const checkbox = document.createElement('div');
                    checkbox.className = 'form-check';
                    checkbox.innerHTML = `
                        <input type="checkbox" class="form-check-input" name="q_${q.QuestionID}" value="${opt}">
                        <label class="form-check-label">${opt}</label>
                    `;
                    inputElement.appendChild(checkbox);
                });
            } else if (q.QuestionType === 'likert') {
                inputElement = document.createElement('div');
                ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'].forEach(label => {
                    const radio = document.createElement('div');
                    radio.className = 'form-check';
                    radio.innerHTML = `
                        <input type="radio" class="form-check-input" name="q_${q.QuestionID}" value="${label}">
                        <label class="form-check-label">${label}</label>
                    `;
                    inputElement.appendChild(radio);
                });
            }

            if (inputElement) {
                inputElement.dataset.questionId = q.QuestionID;
                questionDiv.appendChild(inputElement);
            }

            container.appendChild(questionDiv);
        });

        // Store assessmentID for submission
        document.getElementById('reviewAnswerForm').dataset.assessmentId = assessmentID;

    } catch (err) {
        console.error("Error rendering questions:", err);
        container.innerHTML = '<p class="text-danger">Failed to load questions.</p>';
    }
}




async function fetchStudentCourses() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || !currentUser.Email) {
        console.error("No logged in user found in localStorage.");
        return;
    }

    try {
        const response = await fetch(`http://localhost:8000/student-courses?email=${encodeURIComponent(currentUser.Email)}`);
        const result = await response.json();

        if (!response.ok) {
            console.error("Error fetching courses:", result.error);
            return;
        }

        const courseTableBody = document.getElementById('courseTableBody');
        if (!courseTableBody) {
            console.error("Could not find course table body.");
            return;
        }

        courseTableBody.innerHTML = ''; // Clear table

        result.courses.forEach(course => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${course.CourseName}</td>
                <td>${course.CourseNumber}</td>
                <td>${course.JoinCode}</td>
                <td>
                <button class="btn btn-sm btn-outline-danger drop-course-btn" data-course-code="${course.CourseNumber}">Drop</button>
                </td>
            `;
            
            courseTableBody.appendChild(row);
        });
        // 🔻 Add this after the loop to wire up the Drop buttons
        document.querySelectorAll('.drop-course-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                console.log("Drop Button Clicked")
                const courseCode = e.target.getAttribute('data-course-code');
                const currentUser = JSON.parse(localStorage.getItem('currentUser'));

                const confirm = await Swal.fire({
                    title: "Are you sure?",
                    text: `Do you want to drop ${courseCode}?`,
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonText: "Yes, drop it!",
                    cancelButtonText: "Cancel"
                });

                if (!confirm.isConfirmed) return;

                try {
                    const response = await fetch('http://localhost:8000/drop-course', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            email: currentUser.Email,
                            courseCode
                        })
                    });

                    const result = await response.json();
                    if (!response.ok) {
                        Swal.fire("Error", result.error || "Could not drop course.", "error");
                        return;
                    }

                    Swal.fire("Dropped", "You have left the course.", "success");
                    fetchStudentCourses(); // Refresh table

                } catch (err) {
                    console.error("Drop request failed:", err);
                    Swal.fire("Error", "Failed to drop course.", "error");
                }
            });
        });

    } catch (err) {
        console.error("Fetch error:", err);
    }
}
//function for rendering review questions for each question in the review
function showReviewQuestionsModal(review, questions) {
    const modalBody = document.getElementById('fullReviewModalBody');
    modalBody.innerHTML = ''; // Clear old content

    const form = document.createElement('form');
    form.id = 'reviewAnswerForm';

    questions.forEach((q, index) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'mb-3';

        const label = document.createElement('label');
        label.className = 'form-label';
        label.textContent = `Q${index + 1}: ${q.QuestionNarrative}`;
        wrapper.appendChild(label);

        let input;

        switch (q.QuestionType.toLowerCase()) {
            case 'short-answer':
                input = document.createElement('input');
                input.type = 'text';
                input.className = 'form-control';
                input.name = `question_${q.QuestionID}`;
                break;

            case 'essay':
                input = document.createElement('textarea');
                input.className = 'form-control';
                input.name = `question_${q.QuestionID}`;
                input.rows = 4;
                break;

            case 'multiple-choice':
                const optionsMC = String(q.Options || '').split(',');
                optionsMC.forEach((opt, idx) => {
                    const radio = document.createElement('div');
                    radio.className = 'form-check';
                    radio.innerHTML = `
                        <input class="form-check-input" type="radio" name="question_${q.QuestionID}" id="option_${q.QuestionID}_${idx}" value="${opt.trim()}">
                        <label class="form-check-label" for="option_${q.QuestionID}_${idx}">${opt.trim()}</label>
                    `;
                    wrapper.appendChild(radio);
                });
                break;

            case 'multi-select':
                const optionsMS = String(q.Options || '').split(',');
                optionsMS.forEach((opt, idx) => {
                    const checkbox = document.createElement('div');
                    checkbox.className = 'form-check';
                    checkbox.innerHTML = `
                        <input class="form-check-input" type="checkbox" name="question_${q.QuestionID}" id="option_${q.QuestionID}_${idx}" value="${opt.trim()}">
                        <label class="form-check-label" for="option_${q.QuestionID}_${idx}">${opt.trim()}</label>
                    `;
                    wrapper.appendChild(checkbox);
                });
                break;

            case 'likert':
                const likertOptions = ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'];
                likertOptions.forEach((opt, idx) => {
                    const likert = document.createElement('div');
                    likert.className = 'form-check';
                    likert.innerHTML = `
                        <input class="form-check-input" type="radio" name="question_${q.QuestionID}" id="likert_${q.QuestionID}_${idx}" value="${opt}">
                        <label class="form-check-label" for="likert_${q.QuestionID}_${idx}">${opt}</label>
                    `;
                    wrapper.appendChild(likert);
                });
                break;

            default:
                input = document.createElement('input');
                input.type = 'text';
                input.className = 'form-control';
                input.name = `question_${q.QuestionID}`;
                break;
        }

        if (input) {
            wrapper.appendChild(input);
        }

        form.appendChild(wrapper);
    });

    // Submit button
    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.className = 'btn btn-primary';
    submitBtn.textContent = 'Submit Review';
    form.appendChild(submitBtn);

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        // Submit logic here in a future step
        Swal.fire("Submitted", "Your review has been submitted!", "success");
        const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('fullReviewModal'));
        modal.hide();
    });

    modalBody.appendChild(form);

    const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('fullReviewModal'));
    modal.show();
}







//function for submitting student answers
async function submitStudentReviewAnswers(assessmentID) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const modalBody = document.getElementById('fullReviewModelBody');
    const inputs = modalBody.querySelectorAll('[data-question-id]');
    const responses = [];

    inputs.forEach(input => {
        const questionID = input.getAttribute('data-question-id');
        let value;

        if (input.type === 'checkbox') {
            const checkedOptions = modalBody.querySelectorAll(`[data-question-id="${questionID}"]:checked`);
            value = Array.from(checkedOptions).map(cb => cb.value).join(', ');
        } else if (input.type === 'radio') {
            const selected = modalBody.querySelector(`[data-question-id="${questionID}"]:checked`);
            value = selected ? selected.value : '';
        } else {
            value = input.value;
        }

        responses.push({
            assessmentID,
            questionID,
            userID: currentUser.UserID,
            targetUserID: currentUser.UserID, // defaulting to self-review for now
            response: value,
            public: 0 // defaulting to private
        });
    });

    try {
        const res = await fetch('http://localhost:8000/submit-review', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ responses })
        });

        const result = await res.json();
        if (!res.ok) throw new Error(result.error);

        Swal.fire("Success", "Review submitted!", "success");
        const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('fullReviewModal'));
        modal.hide();

    } catch (err) {
        console.error("Submit error:", err);
        Swal.fire("Error", "Failed to submit review.", "error");
    }
}





async function fetchAndDisplayAssignedReviewsForStudent() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const list = document.getElementById('savedReviewsList');
    list.innerHTML = '';

    if (!currentUser || !currentUser.Email) {
        const item = document.createElement('li');
        item.className = 'list-group-item';
        item.textContent = 'Error: No student found.';
        list.appendChild(item);
        return;
    }

    try {
        const response = await fetch(`http://localhost:8000/student-assigned-reviews/${encodeURIComponent(currentUser.Email)}`);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Failed to fetch assigned reviews.");
        }

        const reviews = result.reviews;

        if (!reviews || reviews.length === 0) {
            const item = document.createElement('li');
            item.className = 'list-group-item';
            item.textContent = 'No reviews assigned.';
            list.appendChild(item);
            return;
        }

        reviews.forEach(review => {
            const item = document.createElement('li');
            item.className = 'list-group-item d-flex justify-content-between align-items-start flex-column';
        
            const content = document.createElement('div');
            content.innerHTML = `
                <strong>${review.ReviewTitle}</strong><br>
                Course: ${review.CourseNumber} - ${review.CourseName}<br>
                Due: ${review.EndDate}
            `;
        
            const viewBtn = document.createElement('button');
            viewBtn.className = 'btn btn-primary btn-sm mt-2 align-self-end';
            viewBtn.textContent = 'View / Answer';
            viewBtn.addEventListener('click', async () => {
                try {
                    const response = await fetch(`http://localhost:8000/assessment-questions/${review.AssessmentID}`);
                    const result = await response.json();

                    if (!response.ok) throw new Error(result.error || "Failed to fetch review questions.");
                    const questions = result.questions;

                    showReviewQuestionsModal(review, questions); // You will define this next
                } catch (err) {
                    console.error("Error fetching review questions:", err);
                    Swal.fire("Error", "Could not load review questions.", "error");
                }
            });

            item.appendChild(content);
            item.appendChild(viewBtn);
            list.appendChild(item);
        });

    } catch (err) {
        console.error("Error loading assigned reviews:", err);
        const item = document.createElement('li');
        item.className = 'list-group-item';
        item.textContent = 'Failed to load assigned reviews.';
        list.appendChild(item);
    }
}





function initializeJoinCourseButton() {
    const joinCourseBtn = document.getElementById('joinCourseBtn');
    const joinCodeInput = document.getElementById('joinCodeInput');

    if (joinCourseBtn && joinCodeInput) {
        joinCourseBtn.addEventListener('click', async () => {
            const joinCode = joinCodeInput.value.trim();
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
            console.log("About to send join request:", joinCode, currentUser);
    
            try {
                const response = await fetch('http://localhost:8000/enroll', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        joinCode,
                        email: currentUser.Email  // Note: capital 'E'
                    })
                });
    
                const result = await response.json();
                console.log("Response:", result);
    
                if (!response.ok) {
                    Swal.fire("Failed", result.error || "Could not join course.", "error");
                    return;
                }
    
                Swal.fire("Success", "You have joined the course!", "success").then(() => {
                    fetchStudentCourses();  // ⬅ refresh the course list after enrolling
                });
    
            } catch (err) {
                console.error("Fetch error:", err);
                Swal.fire("Error", "Request failed to send.", "error");
            }
        });
    
    }
}

async function fetchAndDisplayStudentTeams() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || !currentUser.Email) {
        console.error("No logged-in student found.");
        return;
    }

    try {
        const response = await fetch(`http://localhost:8000/student-teams?email=${encodeURIComponent(currentUser.Email)}`);
        const result = await response.json();

        if (!response.ok) {
            console.error("Failed to fetch student teams:", result.error);
            return;
        }

        const teamList = document.getElementById('studentTeamList');
        if (!teamList) {
            console.error("Could not find studentTeamList element.");
            return;
        }

        teamList.innerHTML = ''; // Clear any previous items

        result.teams.forEach(team => {
            const listItem = document.createElement('li');
            listItem.className = 'list-group-item';

            const membersList = team.members.map(m =>
                `<li>${m.name} — ${m.contact} (${m.type})</li>`
            ).join('');

            listItem.innerHTML = `
                <strong>${team.groupName}</strong><br>
                Course: ${team.courseNumber} - ${team.courseName}
                <ul>${membersList}</ul>
            `;

            teamList.appendChild(listItem);
        });

    } catch (err) {
        console.error("Fetch error:", err);
    }
}

// document.addEventListener('DOMContentLoaded', () => {
//     const teamsTab = document.getElementById('teams-tab');
//     if (teamsTab) {
//         teamsTab.addEventListener('click', () => {
//             fetchAndDisplayStudentTeams();
//         });
//     } else {
//         console.warn("Element with ID 'teams-tab' not found.");
//     }
// });

document.addEventListener('DOMContentLoaded', () => {
    initializeStudentPageEvents();
});



function initializeStudentPageEvents() {
    const teamsTab = document.getElementById('teams-tab');
    if (teamsTab) {
        teamsTab.addEventListener('click', () => {
            fetchAndDisplayStudentTeams();
        });
    } else {
        console.warn("teams-tab button not found.");
    }
    const reviewsTab = document.getElementById('reviews-tab');
    if (reviewsTab) {
        reviewsTab.addEventListener('click', () => {
            fetchAndDisplayAssignedReviewsForStudent();
        });
    } else {
        console.warn("reviews-tab button not found.");
    }
}