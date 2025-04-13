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

            //Step 1: Save the join code locally before it's reset
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

