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

//function for displaying student teams
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

document.addEventListener('DOMContentLoaded', () => {
    const teamsTab = document.getElementById('teams-tab');
    if (teamsTab) {
        teamsTab.addEventListener('click', () => {
            fetchAndDisplayStudentTeams();
        });
    } else {
        console.warn("Element with ID 'teams-tab' not found.");
    }
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
}

