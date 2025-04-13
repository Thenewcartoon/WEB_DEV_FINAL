// instructor.js

let courses = [];
let teams = []

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

    const createTeamBtn = document.getElementById('createTeamBtn');
    const teamList = document.getElementById('teamList');

    let currentJoinCode = ''; // Store latest generated join code (optional)

    //logic for after pushing the create team button
    if (createTeamBtn) {
        createTeamBtn.addEventListener('click', () => {
            const selectedCourseCode = document.getElementById('teamCourseSelect').value
            const teamName = document.getElementById('teamName').value.trim()

            //get all selected students
            const studentCheckboxes = document.querySelectorAll('#teams .form-check-input')
            const selectedStudents = Array.from(studentCheckboxes)
                .filter(cb => cb.checked)
                .map(cb => cb.value)

            //validation
            if (!selectedCourseCode) {
                alert('Please select a course')
                return
            }
            if (!teamName) {
                alert('Please enter a team name')
                return
            }
            if (selectedStudents.length ===0) {
                alert('Please select at least one student')
                return
            }
            teams.push({
                courseCode: selectedCourseCode, teamName,
                members: selectedStudents
            })

            //display in the list
            const listItem = document.createElement('li')
            listItem.className = 'list-group-item'
            listItem.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <strong>${teamName}</strong><br>
                Course: ${selectedCourseCode}<br>
                Members: ${selectedStudents.join(', ')}
              </div>
              <div class="btn-group">
                <button class="btn btn-sm btn-outline-primary btn-edit-team">Edit</button>
                <button class="btn btn-sm btn-outline-danger btn-delete-team">Delete</button>
              </div>
            </div>
          `
            teamList.appendChild(listItem)


            //button for editing current team
            const editBtn = listItem.querySelector('.btn-edit-team');
            editBtn.addEventListener('click', () => {
    // Fill the Create Team form with this team's data
                document.getElementById('teamName').value = teamName;
                document.getElementById('teamCourseSelect').value = selectedCourseCode;

                const studentCheckboxes = document.querySelectorAll('#teams .form-check-input');
                studentCheckboxes.forEach(cb => {
                    cb.checked = selectedStudents.includes(cb.value);
                });

                // Optionally: remove the original team so they don't get duplicated on save
                listItem.remove();

                const index = teams.findIndex(team =>
                    team.teamName === teamName &&
                    team.courseCode === selectedCourseCode
                );
                if (index !== -1) {
                    teams.splice(index, 1);
                }
            });

            //button for deleting team
            const deleteBtn = listItem.querySelector('.btn-delete-team')
            deleteBtn.addEventListener('click', () => {
                listItem.remove()
                const index = teams.findIndex(team =>
                    team.teamName === teamName &&
                    team.courseCode === selectedCourseCode
                )
                if (index !== -1) {
                    teams.splice(index, 1)
                }

            //reset form
            document.getElementById('teamName').value = ''
            studentCheckboxes.forEach(cb => cb.checked = false)
        })
    })
    
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

            // 🔐 Step 1: Save the join code locally before it's reset
            const joinCodeForThisCourse = currentJoinCode || generateJoinCode();

            // Store course in global array
            courses.push({
                name: courseName,
                code: courseCode,
                joinCode: joinCodeForThisCourse,
                students: [] // we'll use this later
            });

            // Add course to Teams tab dropdown
            const teamCourseSelect = document.getElementById('teamCourseSelect');
            if (teamCourseSelect) {
                const option = document.createElement('option');
                option.value = courseCode;
                option.textContent = `${courseCode} - ${courseName}`;
                teamCourseSelect.appendChild(option);
            }

            createCourseForm.reset();
            joinCodeDisplay.classList.add('d-none');
            currentJoinCode = '';

            
            
            // Add course row to table
            const newRow = document.createElement('tr');
            newRow.innerHTML = `
                <td>${courseName}</td>
                <td>${courseCode}</td>
                <td>${joinCodeForThisCourse}</td>
                <td>
                    <button class="btn btn-sm btn-outline-info">View Students</button>
                    <button class="btn btn-sm btn-outline-danger">Delete</button>
                </td>
            `;
            courseTableBody.appendChild(newRow);

            // Add delete button functionality to this row
            const deleteButton = newRow.querySelector('.btn-outline-danger');
            deleteButton.addEventListener('click', () => {
                // Remove row from the table
                newRow.remove();

                // Remove from the courses array
                const indexToRemove = courses.findIndex(c => c.code === courseCode);
                if (indexToRemove !== -1) {
                    courses.splice(indexToRemove, 1);
                }

                // Remove from the Teams tab dropdown
                const teamCourseSelect = document.getElementById('teamCourseSelect');
                if (teamCourseSelect) {
                    const options = teamCourseSelect.options;
                    for (let i = 0; i < options.length; i++) {
                        if (options[i].value === courseCode) {
                            teamCourseSelect.remove(i);
                            break;
                        }
                    }
                }
            });


            // Reset form & join code
            createCourseForm.reset();
            joinCodeDisplay.classList.add('d-none');
            currentJoinCode = '';
        });
    }
}});

