// Get the form element (Must have id="signupForm" in your HTML: <form id="signupForm">)
const form = document.getElementById('signupForm');

if (form) {
    // Attach the single event listener to handle the entire submission process
    form.addEventListener('submit', async (e) => {
        
        // 1. Stop the page from refreshing
        e.preventDefault(); 
        console.log("Signup form submitted. Starting validation.");

        // 2. Get user input. (MAKE SURE THESE IDs MATCH YOUR HTML)
        const username = document.getElementById('username').value.trim();  
        const password = document.getElementById('password').value.trim();
        const confirmPassword = document.getElementById('confirm-password').value.trim();

        // --- Client-Side Validation (Your code) ---
        if (!username || !password || !confirmPassword) {   
            alert("Please fill in all fields!");
            return;
        }
        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }
        
        // --- Server Communication (Logic moved from the separate function) ---
        try {
            console.log("Attempting signup for user:", username); 
            
            // Send a POST request to your backend server endpoint
            const response = await fetch('/api/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                // Send credentials to the server
                body: JSON.stringify({ username, password })
            });

            // 3. Process the server's response
            if (response.ok) { // Status 200-299 (Success)
                alert("✅ Account created successfully!");  

                location.href = '/target/login';

            } else if (response.status === 409) { // Status 409 (Conflict/User Exists)
                alert(" Signup failed: Username already exists.");
            } else { // Handle 500 or other errors
                alert(" An error occurred. Please try again later.");
            }  

        } catch (error) {
            // This catches network issues (e.g., server is offline)
            console.error('Network Error:', error);
            alert(" Could not connect to the server. Check your server status.");
        }
    });
} else {
    console.error("Initialization Error: Form with ID 'signupForm' not found. Check your HTML."); 
}
// The file MUST END here. No other incomplete code or unclosed blocks.