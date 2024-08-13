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

    function displayRoleSpecificContent(role) {
        switch (role) {
            case 'admin':
                roleSpecificContent.innerHTML = `
                    <h2>Admin Controls</h2>
                    <button id="create-user">Create User</button>
                    <button id="manage-teams">Manage Teams</button>
                    <div id="admin-charts"></div>
                `;
                createAdminCharts();
                break;
            case 'team':
                roleSpecificContent.innerHTML = `
                    <h2>Team Controls</h2>
                    <button id="create-key">Create Key</button>
                `;
                document.getElementById('create-key').addEventListener('click', createKey);
                break;
            case 'user':
                roleSpecificContent.innerHTML = `
                    <h2>User Dashboard</h2>
                    <p>Welcome, ${store.getState().user.username}!</p>
                `;
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