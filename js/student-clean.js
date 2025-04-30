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
    
            Swal.fire("Success", "You have joined the course!", "success");
    
        } catch (err) {
            console.error("Fetch error:", err);
            Swal.fire("Error", "Request failed to send.", "error");
        }
    });
    
}
}