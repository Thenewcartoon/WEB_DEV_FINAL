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
document.querySelector('#btnSwapLogin').addEventListener('click', function(){
    document.querySelector('#frmRegister').style.display = 'none'
    document.querySelector('#frmLogin').style.display = 'block'
})

