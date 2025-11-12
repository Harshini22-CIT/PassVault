const form = document.getElementById('loginForm');
if (form) {
    // Attach the single event listener to handle the entire submission process
    form.addEventListener('submit', async (e) => {
        
        // 2. Get user input. (MAKE SURE THESE IDs MATCH YOUR HTML: 'username' and 'password')
        const username = document.getElementById('username').value.trim();  
        const password = document.getElementById('password').value.trim();

        // --- Client-Side Validation ---
        if (!username || !password) {
            showMessage('error', "Please fill in both username and password!");
            return;
        }
        
        // --- Server Communication (Login Fetch) ---
        try {
            console.log("Attempting login for user:", username); 
            
            // Send a POST request to your backend server endpoint
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });
            const responseData = await response.json();
  console.log(" login for user response:", responseData); 
            // 3. Process the server's response
            if (responseData.status === "success") { // Status 200-299 (Success)
                 localStorage.setItem('user_id', username)
                 localStorage.setItem('token', responseData.token)
                alert('success', "✅ Logged in successfully! Redirecting...");
                // redirect to main page or dashboard
                location.href = '/target/index';
               


                
                // Use a slight delay for better user experience before redirect
                //setTimeout(() => {
                    //location.href = '/index.html'; // Assuming '/main.html' is your dashboard
                //}, 1000);

            } else if (response.status === 401) { 
                // Handle unauthorized access (Incorrect credentials)
                alert('error', "❌ Login failed: Incorrect username or password.");
                
            } else { 
                // Handle 500 or other errors
                alert('error', "⚠️ An unexpected error occurred. Please try again later.");
            }  

        } catch (error) {
            // This catches network issues (e.g., server is offline)
            console.error('Network Error:', error);
            alert('error', "🚨 Could not connect to the server. Check your server status.");
        }
    });
} else {
    // Log an error if the form ID is incorrect or missing
    console.error("Initialization Error: Form with ID 'loginForm' not found. Check your HTML."); 
}
