import { createStore } from '/js/state.js';

const store = createStore({
    user: null,
    keys: [],
    error: null,
});

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    const dashboardContent = document.getElementById('dashboard-content');
    const roleSpecificContent = document.getElementById('role-specific-content');
    const errorContainer = document.getElementById('error-container');
    const logoutButton = document.getElementById('logout');

    logoutButton.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('token');
        window.location.href = '/login.html';
    });

    async function fetchUserData() {
        try {
            const response = await fetch('/users/me', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const userData = await response.json();
                store.setState({ user: userData });
                displayRoleSpecificContent(userData.role);
            } else {
                throw new Error('Failed to fetch user data');
            }
        } catch (error) {
            handleError(error);
        }
    }

    async function fetchDashboardData() {
        try {
            const response = await fetch('/keys', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                store.setState({ keys: data });
                displayDashboardContent(data);
            } else {
                throw new Error('Failed to fetch dashboard data');
            }
        } catch (error) {
            handleError(error);
        }
    }

    async function loadAdminDashboard() {
    try {
        const [userStats, keyStats, recentActivity] = await Promise.all([
            fetch('/admin/user-stats', { headers: { 'Authorization': `Bearer ${token}` } }).then(res => res.json()),
            fetch('/admin/key-stats', { headers: { 'Authorization': `Bearer ${token}` } }).then(res => res.json()),
            fetch('/admin/recent-activity', { headers: { 'Authorization': `Bearer ${token}` } }).then(res => res.json())
        ]);

        document.getElementById('user-stats-content').innerHTML = `
            <p>Total Users: ${userStats.totalUsers}</p>
            <p>Active Users: ${userStats.activeUsers}</p>
            <p>New Users (Last 30 days): ${userStats.newUsers}</p>
        `;

        document.getElementById('key-stats-content').innerHTML = `
            <p>Total Keys: ${keyStats.totalKeys}</p>
            <p>Active Keys: ${keyStats.activeKeys}</p>
            <p>Expired Keys: ${keyStats.expiredKeys}</p>
        `;

        document.getElementById('recent-activity-content').innerHTML = `
            <ul>
                ${recentActivity.map(activity => `<li>${activity.action} by ${activity.user} at ${new Date(activity.timestamp).toLocaleString()}</li>`).join('')}
            </ul>
        `;

        document.getElementById('manage-users').addEventListener('click', openUserManagement);
        document.getElementById('manage-teams').addEventListener('click', openTeamManagement);
        document.getElementById('generate-report').addEventListener('click', generateReport);
    } catch (error) {
        handleError(error);
    }
}

async function loadTeamDashboard() {
    try {
        const [teamKeyStats, teamMembers] = await Promise.all([
            fetch('/team/key-stats', { headers: { 'Authorization': `Bearer ${token}` } }).then(res => res.json()),
            fetch('/team/members', { headers: { 'Authorization': `Bearer ${token}` } }).then(res => res.json())
        ]);

        document.getElementById('team-key-stats-content').innerHTML = `
            <p>Total Team Keys: ${teamKeyStats.totalKeys}</p>
            <p>Active Team Keys: ${teamKeyStats.activeKeys}</p>
            <p>Keys Expiring Soon: ${teamKeyStats.expiringKeys}</p>
        `;

        document.getElementById('team-members-content').innerHTML = `
            <ul>
                ${teamMembers.map(member => `<li>${member.name} (${member.role})</li>`).join('')}
            </ul>
        `;

        document.getElementById('create-key').addEventListener('click', createKey);
        document.getElementById('request-more-keys').addEventListener('click', requestMoreKeys);
    } catch (error) {
        handleError(error);
    }
}

async function loadUserDashboard() {
    try {
        const [userKeyStats, keyUsageHistory] = await Promise.all([
            fetch('/user/key-stats', { headers: { 'Authorization': `Bearer ${token}` } }).then(res => res.json()),
            fetch('/user/key-usage-history', { headers: { 'Authorization': `Bearer ${token}` } }).then(res => res.json())
        ]);

        document.getElementById('user-key-stats-content').innerHTML = `
            <p>Your Active Keys: ${userKeyStats.activeKeys}</p>
            <p>Total Usage: ${userKeyStats.totalUsage}</p>
            <p>Keys Expiring Soon: ${userKeyStats.expiringKeys}</p>
        `;

        document.getElementById('key-usage-history-content').innerHTML = `
            <ul>
                ${keyUsageHistory.map(usage => `<li>Key: ${usage.key} - Used on: ${new Date(usage.timestamp).toLocaleString()}</li>`).join('')}
            </ul>
        `;

        document.getElementById('request-key').addEventListener('click', requestNewKey);
    } catch (error) {
        handleError(error);
    }
}
    

function displayRoleSpecificContent(role) {
    switch (role) {
        case 'admin':
            roleSpecificContent.innerHTML = `
                <h2>Admin Dashboard</h2>
                <div class="dashboard-widgets">
                    <div class="widget" id="user-stats">
                        <h3>User Statistics</h3>
                        <div id="user-stats-content"></div>
                    </div>
                    <div class="widget" id="key-stats">
                        <h3>Key Statistics</h3>
                        <div id="key-stats-content"></div>
                    </div>
                    <div class="widget" id="recent-activity">
                        <h3>Recent Activity</h3>
                        <div id="recent-activity-content"></div>
                    </div>
                </div>
                <div class="admin-controls">
                    <button id="manage-users">Manage Users</button>
                    <button id="manage-teams">Manage Teams</button>
                    <button id="generate-report">Generate Report</button>
                </div>
            `;
            loadAdminDashboard();
            break;
        case 'team':
            roleSpecificContent.innerHTML = `
                <h2>Team Dashboard</h2>
                <div class="dashboard-widgets">
                    <div class="widget" id="team-key-stats">
                        <h3>Team Key Statistics</h3>
                        <div id="team-key-stats-content"></div>
                    </div>
                    <div class="widget" id="team-members">
                        <h3>Team Members</h3>
                        <div id="team-members-content"></div>
                    </div>
                </div>
                <div class="team-controls">
                    <button id="create-key">Create Key</button>
                    <button id="request-more-keys">Request More Keys</button>
                </div>
            `;
            loadTeamDashboard();
            break;
        case 'user':
            roleSpecificContent.innerHTML = `
                <h2>User Dashboard</h2>
                <div class="dashboard-widgets">
                    <div class="widget" id="user-key-stats">
                        <h3>Your Key Statistics</h3>
                        <div id="user-key-stats-content"></div>
                    </div>
                    <div class="widget" id="key-usage-history">
                        <h3>Key Usage History</h3>
                        <div id="key-usage-history-content"></div>
                    </div>
                </div>
                <div class="user-controls">
                    <button id="request-key">Request New Key</button>
                </div>
            `;
            loadUserDashboard();
            break;
    }
}

    function displayDashboardContent(data) {
        dashboardContent.innerHTML = `
            <h2>Your Keys</h2>
            <ul class="key-list">
                ${data.map(key => `
                    <li class="key-item">
                        <span class="key-value">${key.key}</span>
                        <span class="key-expiration">Expires: ${new Date(key.expirationDate).toLocaleDateString()}</span>
                        <button class="edit-key" data-id="${key.id}">Edit</button>
                        <button class="delete-key" data-id="${key.id}">Delete</button>
                    </li>
                `).join('')}
            </ul>
        `;

        document.querySelectorAll('.edit-key').forEach(button => {
            button.addEventListener('click', () => editKey(button.dataset.id));
        });

        document.querySelectorAll('.delete-key').forEach(button => {
            button.addEventListener('click', () => deleteKey(button.dataset.id));
        });
    }

    function createAdminCharts() {
        const chartContainer = document.getElementById('admin-charts');
        
        // Key usage chart
        const keyUsageCtx = document.createElement('canvas');
        chartContainer.appendChild(keyUsageCtx);
        new Chart(keyUsageCtx, {
            type: 'bar',
            data: {
                labels: store.getState().keys.map(key => key.key),
                datasets: [{
                    label: 'Key Usage',
                    data: store.getState().keys.map(key => key.usageCount),
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                }]
            },
            options: {
                responsive: true,
                title: {
                    display: true,
                    text: 'Key Usage'
                }
            }
        });

        // Key expiration chart
        const keyExpirationCtx = document.createElement('canvas');
        chartContainer.appendChild(keyExpirationCtx);
        new Chart(keyExpirationCtx, {
            type: 'pie',
            data: {
                labels: ['Active', 'Expired'],
                datasets: [{
                    data: [
                        store.getState().keys.filter(key => new Date(key.expirationDate) > new Date()).length,
                        store.getState().keys.filter(key => new Date(key.expirationDate) <= new Date()).length
                    ],
                    backgroundColor: ['rgba(75, 192, 192, 0.6)', 'rgba(255, 99, 132, 0.6)']
                }]
            },
            options: {
                responsive: true,
                title: {
                    display: true,
                    text: 'Key Status'
                }
            }
        });
    }

    async function createKey() {
        try {
            const response = await fetch('/keys', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
                    isWhitelisted: true,
                    maxUsage: 100,
                }),
            });

            if (response.ok) {
                const newKey = await response.json();
                store.setState({ keys: [...store.getState().keys, newKey] });
                displayDashboardContent(store.getState().keys);
            } else {
                throw new Error('Failed to create key');
            }
        } catch (error) {
            handleError(error);
        }
    }

    async function editKey(id) {
        // Implement key editing logic
    }

    async function deleteKey(id) {
        try {
            const response = await fetch(`/keys/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                store.setState({ keys: store.getState().keys.filter(key => key.id !== id) });
                displayDashboardContent(store.getState().keys);
            } else {
                throw new Error('Failed to delete key');
            }
        } catch (error) {
            handleError(error);
        }
    }

    function handleError(error) {
        console.error('Error:', error);
        store.setState({ error: error.message });
        errorContainer.textContent = `Error: ${error.message}`;
        errorContainer.style.display = 'block';
        setTimeout(() => {
            errorContainer.style.display = 'none';
            store.setState({ error: null });
        }, 5000);
    }

    fetchUserData();
    fetchDashboardData();

    // Set up WebSocket for real-time updates
    const ws = new WebSocket('wss://your-worker-url');
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'key_update') {
            store.setState({ keys: data.keys });
            displayDashboardContent(data.keys);
        }
    };
});
