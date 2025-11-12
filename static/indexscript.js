const form = document.getElementById('logForm');
const logsDiv = document.getElementById('logs');
const apiUrl = "/logs"; // FastAPI backend URL
const CURRENT_USER = localStorage.getItem('user_id');
const user_id = CURRENT_USER ? CURRENT_USER : "default_user";


// Add a new log
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

  const website = document.getElementById('website').value.trim();
  const user = document.getElementById('user').value.trim();
  const password = document.getElementById('password').value.trim();
  //const pincode = parseInt(document.getElementById('pincode').value.trim());

  if (!website || !user || !password ) {
    alert("Please fill in all fields!");
    return;
  }

  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ website, user, password, user_id }),
    });
    const resData = await res.json();
    console.log("Response from adding log:", resData);
    if (resData.status === "success") {
      console.log("Log added successfully", resData);
      form.reset();
      await loadUserLogs();
      //loadLogs();
    } else {
      alert("Failed to add log. Please check backend.");
    }
  } catch (err) {
    console.error("Error adding log:", err);
    alert("Could not connect to backend.");
  }
});

// Load all logs
//async function loadLogs() {
  // {

// Load logs on page load
//loadLogs();
//addLogForm.addEventListener('submit', handleAddLog);


// load logs of the particular user
async function loadUserLogs() {
  try {
  const res = await fetch(`${apiUrl}/${encodeURIComponent(user_id)}`);
    const data = await res.json();
    console.log("User Logs loaded:", data);

    // Safely handle case where entries might be undefined
    const entries = data.entries || [];

    logsDiv.innerHTML = entries.length
  ? `
    <table class="log-table">
      <thead>
        <tr>
          <th>Website</th>
          <th>Username</th>
          <th>Password</th>
        </tr>
      </thead>
      <tbody>
        ${entries.map(log => `
          <tr>
            <td>${log.website || ''}</td>
            <td>${log.user || ''}</td>
            <td>${log.password || ''}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `
  : "<p>No logs found for this user.</p>";

  }catch (err) {
    console.error("Error loading user logs:", err);
    logsDiv.innerHTML = "<p>Error loading user logs.</p>";
  }
}

// Load user-specific logs on page load
loadUserLogs();

// session token check
const sessionToken = localStorage.getItem('token');   
if (!sessionToken) {
    // Redirect to login page if session token is not found
    location.href = 'login';
}

// validate session token with backend
fetch(`/api/validate_session?token=${encodeURIComponent(sessionToken)}`)
    .then(response => {
        if (response.status === 401) {
            // Invalid session, redirect to login
            location.href = 'login';
        } 
        return response.json();
    } )
    .then(data => {
        console.log("Session validation response:", data);
        // Optionally, you can display the username or other info
    })
    .catch(error => {
        console.error('Error validating session:', error);
        // On error, redirect to login
        location.href = 'login';
    });

  // logut functionality
// const logoutBtn = document.getElementById('logoutButton');
// logoutBtn.addEventListener('click', () => {
//     // // Clear session data
//     // localStorage.removeItem('token');
//     // // localStorage.removeItem('user_id');
//     // // Redirect to login page
//     // location.href = 'login';
const logoutBtn = document.getElementById('logoutButton');
logoutBtn.addEventListener('click', async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    location.href = 'login';
    return;
  }

  try {
    // Tell backend to invalidate the session token
    await fetch('/api/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
  } catch (err) {
    console.error("Error logging out:", err);
  }

  // Clear session data locally
  localStorage.removeItem('token');
  // localStorage.removeItem('user_id');

  // Redirect to login page
  location.href = 'login';
});


