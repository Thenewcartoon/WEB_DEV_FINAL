
// o Complete pending reviews
// o Reviews should have both public and private feedback options
// o Review score
// o Review public feedback from peers
// o Reports
//      see Combined feedback
//      see Overall scores 


//global variables
// Declare a constant or variable
let studentCourses = []
// Declare a constant or variable
let studentTeams = []
// Declare a constant or variable
let studentQuestions = [] //global questions array
// Declare a constant or variable
let studentReviews = []  //globalreviews array
// Declare a constant or variable
let studentAssignments = []


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
            option.value = course.code;
            option.textContent = `${course.code} - ${course.name}`;
            reviewCourseSelect.appendChild(option);
        });
    }
}


//******************Function for displaying Saved Reviews**************///
// Define a JavaScript function
function displaySavedReviews() {
// Declare a constant or variable
    const list = document.getElementById('savedReviewsList');
    list.innerHTML = ''; // Clear old list
    //show a placeholder message if no reviews exist
    if (reviews.length === 0) {
// Declare a constant or variable
        const item = document.createElement('li');
        item.className = 'list-group-item';
        item.textContent = 'No reviews saved yet.';
        list.appendChild(item);
        return;
    }
    //loop through all saved reviews and display them
    reviews.forEach(review => {
// Declare a constant or variable
        const item = document.createElement('li'); //create the list item container
        item.className = 'list-group-item d-flex justify-content-between align-items-start';

// Declare a constant or variable
        const content = document.createElement('div'); //build the left-side content: title course and question count
        content.innerHTML = `
            <strong>${review.title}</strong><br>
            Course: ${review.courseCode}<br>
            Questions: ${review.questions.length}
        `;

// Declare a constant or variable
        const btnGroup = document.createElement('div'); //create button group: Edit, Delete, View
        btnGroup.className = 'btn-group btn-group-sm';

        // EDIT Button
// Declare a constant or variable
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
// Declare a constant or variable
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-outline-danger';
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => { //click event for delete button
            // Remove from array and re-render list
            reviews = reviews.filter(r => r.id !== review.id);
            displaySavedReviews();
        });

        //View button
// Declare a constant or variable
        const viewBtn = document.createElement('button');
        viewBtn.className = 'btn btn-outline-secondary';
        viewBtn.textContent = 'View';
        viewBtn.addEventListener('click', () => {
// Declare a constant or variable
            const modelBody = document.getElementById('fullReviewModelBody');
            //construct model content: title, course, and all questions
// Declare a constant or variable
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
// Declare a constant or variable
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
            opt.value = course.code;
            opt.textContent = `${course.code} - ${course.name}`;
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
// Define a JavaScript function
function displayAssignedReviews() {
// Declare a constant or variable
    const list = document.getElementById('assignedReviewsList') //get ul element where the assigned reviews will be displayed
    list.innerHTML = '' // Clear previous list

    if (assignments.length === 0) { //if there are no assignments, display a message
// Declare a constant or variable
        const item = document.createElement('li')
        item.className = 'list-group-item'
        item.textContent = 'No reviews have been assigned yet.'
        list.appendChild(item)
        return;
    }

    assignments.forEach(assign => { //loops through each assignment in the assignments array
// Declare a constant or variable
        const course = courses.find(c => c.code === assign.courseCode) //finds the correct course using courseCode
// Declare a constant or variable
        const review = reviews.find(r => r.id === assign.reviewId) //finds the correct review using reviewID

// Declare a constant or variable
        const item = document.createElement('li'); //create a new <li> for the current assignment
        item.className = 'list-group-item d-flex justify-content-between align-items-start'
        //set the inner html to show: the review title, the course code and name, and the due date
// Declare a constant or variable
        const content = document.createElement('div')
        content.innerHTML = `
            <strong>${review?.title || 'Unknown Review'}</strong><br>
            Course: ${course?.code || 'Unknown'} - ${course?.name || ''}<br>
            Due: ${assign.dueDate || 'No due date'}
        `

        //button group
// Declare a constant or variable
        const btnGroup = document.createElement('div')
        btnGroup.className = 'btn-group btn-group-sm'

        //edit button
// Declare a constant or variable
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
// Declare a constant or variable
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



//***********************************END OF FUNCTIONS************************************************************************ */


// Handle "Generate Join Code" button click
//<<<<<<< HEAD
// function initalizeStudentPage(){
//     const joinCodeDisplay = document.getElementById('joinCodeDisplay');
//=======
// Define a JavaScript function
function initalizeStudentPage(){
// Declare a constant or variable
    const joinCodeDisplay = document.getElementById('joinCodeDisplay');
//>>>>>>> b44b3e5a8e0e72f66b9f06b4788986e1df58f77d
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

    
    //***************************************Schedule Reviews Tab*************************************************** */
    //event listener for assign review button
    document.getElementById('assignReviewBtn').addEventListener('click', () => {
// Declare a constant or variable
        const courseCode = document.getElementById('scheduleCourseSelect').value //get selected course code from the drop down
// Declare a constant or variable
        const reviewId = document.getElementById('scheduleReviewSelect').value //gets selected review from dropdown
// Declare a constant or variable
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
// Declare a constant or variable
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
            alert("Please enter a review title and select a course.");
            return;
        }
    
        if (questions.length === 0) {
            alert("Please add at least one question to the review.");
            return;
        }
    
// Declare a constant or variable
        const review = {
            id: crypto.randomUUID(),
            title,
            courseCode: course,
            questions: [...questions] // copy the questions array
        };
    
        reviews.push(review);
        populateScheduleDropdowns()
    
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
        createTeamBtn.addEventListener('click', () => {
// Declare a constant or variable
            const selectedCourseCode = document.getElementById('teamCourseSelect').value
// Declare a constant or variable
            const teamName = document.getElementById('teamName').value.trim()

            //get all selected students
// Declare a constant or variable
            const studentCheckboxes = document.querySelectorAll('#teams .form-check-input')
// Declare a constant or variable
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
// Declare a constant or variable
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
// Declare a constant or variable
            const editBtn = listItem.querySelector('.btn-edit-team');
            editBtn.addEventListener('click', () => {
            // Fill the Create Team form with this team's data
                document.getElementById('teamName').value = teamName;
                document.getElementById('teamCourseSelect').value = selectedCourseCode;

// Declare a constant or variable
                const studentCheckboxes = document.querySelectorAll('#teams .form-check-input');
                studentCheckboxes.forEach(cb => {
                    cb.checked = selectedStudents.includes(cb.value);
                });

                // Optionally: remove the original team so they don't get duplicated on save
                listItem.remove();

// Declare a constant or variable
                const index = teams.findIndex(team =>
                    team.teamName === teamName &&
                    team.courseCode === selectedCourseCode
                );
                if (index !== -1) {
                    teams.splice(index, 1);
                }
            });

            //button for deleting team
// Declare a constant or variable
            const deleteBtn = listItem.querySelector('.btn-delete-team')
            deleteBtn.addEventListener('click', () => {
                listItem.remove()
// Declare a constant or variable
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
    if (createCourseForm) {
        createCourseForm.addEventListener('submit', function (e) {
            e.preventDefault(); // Prevent form from reloading the page

// Declare a constant or variable
            const courseName = document.getElementById('courseName').value.trim();
// Declare a constant or variable
            const courseCode = document.getElementById('courseCode').value.trim();

            if (!courseName || !courseCode) {
                alert("Please enter both course name and course code.");
                return;
            }

            //Step 1: Save the join code locally before it's reset
// Declare a constant or variable
            const joinCodeForThisCourse = currentJoinCode || generateJoinCode();

            // Store course in global array
            courses.push({
                name: courseName,
                code: courseCode,
                joinCode: joinCodeForThisCourse,
                students: [] // we'll use this later
            });

            // Add course to Teams tab dropdown
// Declare a constant or variable
            const teamCourseSelect = document.getElementById('teamCourseSelect');
            if (teamCourseSelect) {
// Declare a constant or variable
                const option = document.createElement('option');
                option.value = courseCode;
                option.textContent = `${courseCode} - ${courseName}`;
                teamCourseSelect.appendChild(option);
            }

            populateScheduleDropdowns() //refreshes the Schedule tab dropdowns
            // add course to review tab dropdown
            populateReviewCourseDropdown()
            createCourseForm.reset();
            joinCodeDisplay.classList.add('d-none');
            currentJoinCode = '';
            
            // Add course row to table
// Declare a constant or variable
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

            // // Add delete button functionality to this row
            // const deleteButton = newRow.querySelector('.btn-outline-danger');
            // deleteButton.addEventListener('click', () => {
            //     // Remove row from the table
            //     newRow.remove();

            //     // Remove from the courses array
            //     const indexToRemove = courses.findIndex(c => c.code === courseCode);
            //     if (indexToRemove !== -1) {
            //         courses.splice(indexToRemove, 1);
            //     }

            //     // Remove from the Teams tab dropdown
            //     const teamCourseSelect = document.getElementById('teamCourseSelect');
            //     if (teamCourseSelect) {
            //         const options = teamCourseSelect.options;
            //         for (let i = 0; i < options.length; i++) {
            //             if (options[i].value === courseCode) {
            //                 teamCourseSelect.remove(i);
            //                 break;
            //             }
            //         }
            //     }
            // });

            // Reset form & join code
            createCourseForm.reset();
            joinCodeDisplay.classList.add('d-none');
            currentJoinCode = '';
        });
    }
    
    
    //***********Joining a Course logic*************** */
// Declare a constant or variable
    const joinCourseBtn = document.getElementById('joinCourseBtn');
    console.log("Found:", joinCourseBtn);
// Declare a constant or variable
    const joinCodeInput = document.getElementById('joinCodeInput');
    if (joinCourseBtn && joinCodeInput) {
        joinCourseBtn.addEventListener('click', async () => {
            console.log('Join button clicked!');
// Declare a constant or variable
            const joinCode = joinCodeInput.value.trim();
            if (!joinCode) {
                Swal.fire("Error", "Please enter a valid join code.", "warning");
                return;
            }
    
            try {
// Send HTTP request using Fetch API
                const response = await fetch(`http://localhost:8000/enroll`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ joinCode })
                });
    
// Declare a constant or variable
                const result = await response.json();
    
                if (!response.ok) {
                    Swal.fire("Failed", result.error || "Could not join course.", "error");
                    return;
                }
    
                Swal.fire("Success", "You have joined the course!", "success").then(() => {
                    // Refresh the course list after joining (you can implement this later)
                    // fetchStudentCourses();
                });
    
            } catch (error) {
                console.error("Error joining course:", error);
                Swal.fire("Error", "An unexpected error occurred.", "error");
            }
        });
    }

    //***************************************************End of Courses Tab********************************************* */
}}; 
document.addEventListener('DOMContentLoaded', () => {
    initalizeStudentPage();
});