//global variables
const regEmail = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/
const regPassword = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/
//end global variables

// Reset Password button event listener. all validation and click events for Reset Password page must be handled inside this event
// document.querySelector('#btnLoginButton').addEventListener('click', (event) => {
//     fetch("components/resetPassword.html") //makes http request to get the content of the login.html file from the components directory
//     .then(response => response.text())  //takes response from fetch request and extracts its text content
//     .then(html => { //takes the html text and runs code in this callback function

//         // Back to selection screen button
//         document.querySelector('#btnSwapLogin').addEventListener('click', function(){
//             document.querySelector('#frmLogin').style.display = 'none';
//             document.querySelector('#divSelect').style.display = 'block';
//         });
//     })
//     .catch(error => console.error("Error fetching Login form:", error));
// })


// Login button event listener. all validation and click events for Login page must be handled inside this event
document.querySelector('#btnLoginButton').addEventListener('click', (event) => {
    fetch("components/login.html") //makes http request to get the content of the login.html file from the components directory
    .then(response => response.text())  //takes response from fetch request and extracts its text content
    .then(html => { //takes the html text and runs code in this callback function
        // Add the HTML to the page
        document.querySelector('#divContent').insertAdjacentHTML("beforeend", html); //finds the element with ID "divContent" and adds the HTML from the login component to its existing content.
        
        // Hide index, show login
        document.querySelector('#divSelect').style.display = 'none';
        document.querySelector('#frmLogin').style.display = 'block';
        
        // **********ALL event handlers for the login form below***************
        
        //change title for if user selects student or instructor
        document.querySelector('#roleSelect').addEventListener('change', function() {
            const selectedRole = document.querySelector('#roleSelect').value;
            const loginTitleResponsive = document.querySelector('#loginTitleResponsive');

            // Show the contact info section if the role is "student"
            if (selectedRole === 'student') {
                loginTitleResponsive.textContent = 'Welcome Students';
            } else {
                loginTitleResponsive.textContent = 'Welcome Instructors';
            }
        });

        //Click event for clicking login button 
        document.querySelector('#btnLogin').addEventListener('click', function() {

            let strEmail = document.querySelector('#txtUsername').value.trim()  //grabs what the user entered into the email box
            let strPassword = document.querySelector('#txtPassword').value  //grabs what the user entered into the password box
            let role = document.querySelector('#roleSelect').value  //grabs what role the user selected (student or instructor)
            let blnError = false
            let strMessage = '' 
            let strIsPasswordCorrect = true
            
            //makes sure the email is actually an email
            if(!regEmail.test(strEmail)){  //testing strEmail against the regular expression pattern. if the test fails, false is returned, which is negated by the !, therefore, the code inside the if statement executes
                blnError = true;
                strMessage += '<p>You must enter a valid email</p>'
            }

            //password validtaion. NIST compliance regex
            if (!regPassword.test(strPassword)) {
                strMessage += "<p>Your password must be compliant with NIST Standard</p>";
                strMessage += "</ul>";
            }

            //make sure the password is actually user's password. Logic to be added later when able to store user passwords with user accounts
            if(!strIsPasswordCorrect){
                strMessage += "<p>Password Incorrect!</p>";
            }

            //if student did not select a role, return an error message saying to do so
            if (role === "") {
                blnError = true;
                strMessage += '<p>Please select a valid role (Student or Instructor).</p>';
            }
            
            //sweet alert  pop up message
            if (strMessage !== "") {
                Swal.fire({
                    title: "Oh no, you have an error",
                    html: strMessage,
                    icon: "error"
                });
            } else {
                Swal.fire({
                    title: "Success!",
                    text: "Your form has been submitted.",
                    icon: "success"
                });
            }
        });

        // Back to landing screen button
        document.querySelector('#btnSwapLogin').addEventListener('click', function () {
            let divContent = document.querySelector('#divContent');
        
            // Remove login and registration forms from the page
            let loginForm = document.querySelector('#frmLogin');
            let registerForm = document.querySelector('#frmRegister');
        
            if (loginForm) loginForm.remove(); // Removes login form completely
            if (registerForm) registerForm.remove(); // Removes registration form completely
        
            // Show the main selection screen again
            document.querySelector('#divSelect').style.display = 'block';
        });
        
    })
    .catch(error => console.error("Error fetching Login form:", error));
})


// Register button event listener. all validation and click events for registration page must be handled inside this event
document.querySelector('#btnRegisterButton').addEventListener('click', (event) => {
    fetch("components/registration.html") //makes http request to get the content of the registration.html file from the components directory
    .then(response => response.text())  //takes response from fetch request and extracts its text content
    .then(html => { //takes the html text and runs code in this callback function
        // Add the HTML to the page
        document.querySelector('#divContent').insertAdjacentHTML("beforeend", html); //finds the element with ID "divContent" and adds the HTML from the register component to its existing content.
        
        // Hide selection, show registration
        document.querySelector('#divSelect').style.display = 'none';
        document.querySelector('#frmRegister').style.display = 'block';
        
        // **********ALL event handlers for the registration form below***************
        
        //change event for if user selects student or instructor
        document.querySelector('#roleSelect').addEventListener('change', function() {
            const selectedRole = document.querySelector('#roleSelect').value;
            const studentContact = document.querySelector('#studentContact');

            // Show the contact info section if the role is "student"
            if (selectedRole === 'student') {
                studentContact.style.display = 'block';
            } else {
                studentContact.style.display = 'none';
            }
        });

        // adds a change event for whenever user selects their method of contact (teams, discord, or mobile).
        document.querySelector('#contactType').addEventListener('change', function() {
            const selectedType = document.querySelector('#contactType').value;
            const txtContact = document.querySelector('#txtContact');

            // Update the placeholder text based on the selected contact type
            if (selectedType === 'mobile') {
                txtContact.placeholder = 'Enter your mobile number';
            } else if (selectedType === 'discord') {
                txtContact.placeholder = 'Enter your Discord username';
            } else if (selectedType === 'teams') {
                txtContact.placeholder = 'Enter your Teams username';
            }
        });

        //Click event for clicking register button 
        document.querySelector('#btnRegister').addEventListener('click', function() {
            let strFirstName = document.querySelector('#txtFirstName').value.trim() //grabs what the user entered into the first name box
            let strLastName = document.querySelector('#txtLastName').value.trim() //grabs what the user entered into the last name box
            let strEmail = document.querySelector('#txtUsername').value.trim()  //grabs what the user entered into the email box
            let strPassword = document.querySelector('#txtPassword').value  //grabs what the user entered into the password box
            let role = document.querySelector('#roleSelect').value  //grabs what role the user selected (student or instructor)
            let contactType = document.querySelector('#contactType').value;  //grabs which contact type the user selected ()
            let contactInfo = document.querySelector('#txtContact').value.trim() //grabs what the user entered into the contact info text box

            let blnError = false
            let strMessage = '' 
            
            //makes sure first name is actually a name
            if(strFirstName.length < 2 || !/^[A-Za-z]+$/.test(strFirstName)) {
                blnError = true
                strMessage += "<p class='mb-0'>First name must be at least 2 letters.</p>"
            }

            //makes sure last name is actually a name
            if(strLastName.length < 2 || !/^[A-Za-z]+$/.test(strLastName)) {
                blnError = true
                strMessage += "<p class='mb-0'>Last name must be at least 2 letters.</p>"
            }
            //makes sure the email is actually an email
            if(!regEmail.test(strEmail)){  //testing strEmail against the regular expression pattern. if the test fails, false is returned, which is negated by the !, therefore, the code inside the if statement executes
                blnError = true;
                strMessage += '<p>You must enter a valid email</p>'
            }

            //password validtaion. NIST compliance regex
            if (!regPassword.test(strPassword)) {
                strMessage += "<p>Your password must be at least 8 characters long and include:</p>";
                strMessage += "<ul>";
                strMessage += "<li>At least one uppercase letter</li>";
                strMessage += "<li>At least one lowercase letter</li>";
                strMessage += "<li>At least one number</li>";
                strMessage += "</ul>";
            }

            //if student did not select a role, return an error message saying to do so
            if (role === "") {
                blnError = true;
                strMessage += '<p>Please select a valid role (Student or Instructor).</p>';
            }

            // Contact Info Validation (Only for students)
            if (role === "student") {
                if (contactType === "") {
                    blnError = true;
                    strMessage += '<p>Please select a contact type (Mobile, Discord, or Teams).</p>';
                
                } else {
                    // Validate based on contact type
                    if (contactType === "mobile" && !/^\d{10}$/.test(contactInfo)) {  //makes sure phone number is in correct format
                        blnError = true;
                        strMessage += '<p>Please enter a valid 10-digit mobile number.</p>';
                    } else if (contactType === "discord" && !/^.{3,32}#[0-9]{4}$/.test(contactInfo)) {  //makes sure discord name is in correct format
                        blnError = true;
                        strMessage += '<p>Please enter a valid Discord username (e.g., user#1234).</p>';
                    } else if (contactType === "teams" && contactInfo.length < 3) {  //makes sure teams username is in correct format
                        blnError = true;
                        strMessage += '<p>Teams username must be at least 3 characters long.</p>';
                    }
                }
            }
            
            //sweet alert  pop up message
            if (strMessage !== "") {
                Swal.fire({
                    title: "Oh no, you have an error",
                    html: strMessage,
                    icon: "error"
                });
            } else {
                Swal.fire({
                    title: "Success!",
                    text: "Your form has been submitted.",
                    icon: "success"
                });
            }
        });

        // Back to landing screen button
        document.querySelector('#btnSwapLogin').addEventListener('click', function () {
            let divContent = document.querySelector('#divContent');
        
            // Remove login and registration forms from the page
            let loginForm = document.querySelector('#frmLogin');
            let registerForm = document.querySelector('#frmRegister');
        
            if (loginForm) loginForm.remove(); // Removes login form completely
            if (registerForm) registerForm.remove(); // Removes registration form completely
        
            // Show the main selection screen again
            document.querySelector('#divSelect').style.display = 'block';
        });
        
    })
    .catch(error => console.error("Error fetching registration form:", error));
});
