// instructor.js

let courses = []
let teams = []
let questions = [] //global questions array
let reviews = []  //globalreviews array

// Utility function: Generate a 6-character alphanumeric join code
function generateJoinCode(length = 6) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

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

function populateReviewCourseDropdown() {
    const reviewCourseSelect = document.getElementById('reviewCourseSelect');
    if (reviewCourseSelect) {
        reviewCourseSelect.innerHTML = '<option disabled selected>Select a course</option>';

        courses.forEach(course => {
            const option = document.createElement('option');
            option.value = course.code;
            option.textContent = `${course.code} - ${course.name}`;
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
            const modalBody = document.getElementById('fullReviewModalBody');
            //construct modal content: title, course, and all questions
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

            modalBody.innerHTML = html;
            //show the modal
            const modal = new bootstrap.Modal(document.getElementById('fullReviewModal'));
            modal.show();
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
    
    document.getElementById('addQuestionBtn').addEventListener('click', () => {
        const type = document.getElementById('questionType').value;
        const text = document.getElementById('questionText').value.trim();
        const optionsContainer = document.getElementById('questionOptionsContainer');
    
        if (!type || !text) {
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
    
        // Reset the form and question list
        document.getElementById('reviewTitle').value = ''
        document.getElementById('reviewCourseSelect').selectedIndex = 0
        document.getElementById('reviewQuestionList').innerHTML = ''
        questions = [];
    
        alert("Review saved successfully!")
        displaySavedReviews()
    });
    
    
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
            // add course to review tab dropdown
            populateReviewCourseDropdown()
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

