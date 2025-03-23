//global variables
const regEmail = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/
const regPassword = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/
//end global variables

//click event for #btnRegisterButton to pull up the registration page after clicking the register button.
document.querySelector('#btnRegisterButton').addEventListener('click', function() {
    document.querySelector('#divSelect').style.display = 'none';  // Hide the current card
    document.querySelector('#frmRegister').style.display = 'block';  // Show the registration form
});

//change event for if user selects student or instructor. if user selects student, contact info section will be shown
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


// Listen for changes on the contact type dropdown directly using document.querySelector
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


document.querySelector('#btnRegister').addEventListener('click', function() {
    let strFirstName = document.querySelector('#txtFirstName').value.trim()
    let strLastName = document.querySelector('#txtLastName').value.trim()
    let strEmail = document.querySelector('#txtUsername').value.trim()
    let strPassword = document.querySelector('#txtPassword').value
    let role = document.querySelector('#roleSelect').value
    let contactType = document.querySelector('#contactType').value;
    let contactInfo = document.querySelector('#txtContact').value.trim()

    let blnError = false
    let strMessage = '' 
    
    if(strFirstName.length < 2 || !/^[A-Za-z]+$/.test(strFirstName)) {
        blnError = true
        strMessage += "<p class='mb-0'>First name must be at least 2 letters.</p>"
    }

    if(strLastName.length < 2 || !/^[A-Za-z]+$/.test(strLastName)) {
        blnError = true
        strMessage += "<p class='mb-0'>Last name must be at least 2 letters.</p>"
    }

    if(!regEmail.test(strEmail)){  //testing strEmail against the regular expression pattern. if the test fails, false is returned, which is negated by the !, therefore, the code inside the if statement executes
        blnError = true;
        strMessage += '<p>You must enter a valid email</p>'
    }

    if (!regPassword.test(strPassword)) {
        strMessage += "<p>Your password must be at least 8 characters long and include:</p>";
        strMessage += "<ul>";
        strMessage += "<li>At least one uppercase letter</li>";
        strMessage += "<li>At least one lowercase letter</li>";
        strMessage += "<li>At least one number</li>";
        strMessage += "</ul>";
    }

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
            if (contactType === "mobile" && !/^\d{10}$/.test(contactInfo)) {
                blnError = true;
                strMessage += '<p>Please enter a valid 10-digit mobile number.</p>';
            } else if (contactType === "discord" && !/^.{3,32}#[0-9]{4}$/.test(contactInfo)) {
                blnError = true;
                strMessage += '<p>Please enter a valid Discord username (e.g., user#1234).</p>';
            } else if (contactType === "teams" && contactInfo.length < 3) {
                blnError = true;
                strMessage += '<p>Teams username must be at least 3 characters long.</p>';
            }
        }
    }
    
    
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

})
