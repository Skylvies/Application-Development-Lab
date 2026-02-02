/**
 * Fetches user data and populates the dashboard UI
 */
async function loadDashboard() {
    try {
        const res = await fetch('/api/user-data');
        
        // If unauthorized (session expired), send back to login
        if (res.status === 401) {
            window.location.href = '/login.html';
            return;
        }
        
        const data = await res.json();
        const user = data.user;

        // 1. Populate Greeting and Sidebar
        document.getElementById('user-name').innerText = user.first_name || 'Student';
        document.getElementById('nav-user').innerText = `@${user.username}`;
        
        // 2. Populate the Profile Update Form
        document.getElementById('edit-username').value = user.username || '';
        document.getElementById('edit-email').value = user.email || '';

        // 3. Populate the Grades Table
        const tableBody = document.getElementById('grade-table');
        tableBody.innerHTML = ''; // Clear "Loading..." or old content

        if (user.grades && user.grades.length > 0) {
            user.grades.forEach(g => {
                const row = `
                    <tr>
                        <td>${g.subject}</td>
                        <td><span class="status-badge">${g.grade}</span></td>
                    </tr>
                `;
                tableBody.insertAdjacentHTML('beforeend', row);
            });
        } else {
            tableBody.innerHTML = '<tr><td colspan="2" style="text-align:center;">No records found.</td></tr>';
        }

    } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
    }
}

/**
 * Handles session destruction and redirection
 */
async function logout() {
    try {
        const res = await fetch('/api/logout');
        const result = await res.json();
        if (result.success) {
            window.location.href = '/login.html';
        }
    } catch (err) {
        console.error('Logout failed:', err);
    }
}

// Run the load function as soon as the page is ready
document.addEventListener('DOMContentLoaded', loadDashboard);