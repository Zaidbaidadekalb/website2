// Initialize magicmouse.js
options = {
    "cursorOuter": "circle-basic",
    "hoverEffect": "circle-move",
    "hoverItemMove": false,
    "defaultCursor": false,
    "outerWidth": 30,
    "outerHeight": 30
};
magicMouse(options);

// Global variables
let token = localStorage.getItem('token');
const apiUrl = 'key-management-worker.zaidbaidaa.workers.dev'; // Replace with your Cloudflare Worker URL

// Helper function to make API requests
async function apiRequest(endpoint, method = 'GET', body = null) {
    const headers = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const options = {
        method,
        headers,
    };
    if (body) {
        options.body = JSON.stringify(body);
    }
    const response = await fetch(`${apiUrl}${endpoint}`, options);
    if (response.status === 401) {
        logout();
        throw new Error('Unauthorized');
    }
    return response.json();
}

// Show loading animation
function showLoading() {
    document.querySelector('.loading').style.display = 'block';
}

// Hide loading animation
function hideLoading() {
    document.querySelector('.loading').style.display = 'none';
}

// Login functionality
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        showLoading();
        const data = await apiRequest('/login', 'POST', { username, password });
        token = data.token;
        localStorage.setItem('token', token);
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('main-content').style.display = 'block';
        loadDashboard();
    } catch (error) {
        alert('Login failed. Please try again.');
    } finally {
        hideLoading();
    }
});

// Logout functionality
document.getElementById('logout-link').addEventListener('click', (e) => {
    e.preventDefault();
    logout();
});

function logout() {
    localStorage.removeItem('token');
    token = null;
    document.getElementById('login-section').style.display = 'block';
    document.getElementById('main-content').style.display = 'none';
}

// Load dashboard content
async function loadDashboard() {
    await Promise.all([
        loadStatus(),
        loadKeys(),
        loadLogs(),
        loadUsers()
    ]);
}

// Load system status
async function loadStatus() {
    try {
        const status = await apiRequest('/status');
        const statusContent = document.getElementById('status-content');
        statusContent.innerHTML = `
            <div class="status-card">
                <h4>Worker Status: ${status.status}</h4>
                <p>Current Time: ${status.currentTime}</p>
                <p>Worker Runtime: ${status.workerRuntime}</p>
                <p>Datacenter: ${status.cloudflareInfo.datacenter}</p>
                <p>Country: ${status.cloudflareInfo.country}</p>
            </div>
        `;
    } catch (error) {
        console.error('Error loading status:', error);
    }
}

// Load keys
async function loadKeys() {
    try {
        const keys = await apiRequest('/keys');
        const keysList = document.getElementById('keys-list');
        keysList.innerHTML = keys.map(key => `
            <div class="card mb-3">
                <div class="card-body">
                    <h5 class="card-title">${key.key}</h5>
                    <p class="card-text">Expiration: ${key.expirationDate}</p>
                    <p class="card-text">Usage: ${key.usageCount}/${key.maxUsage}</p>
                    <button class="btn btn-sm btn-danger delete-key" data-id="${key.id}">Delete</button>
                </div>
            </div>
        `).join('');

        // Add event listeners for delete buttons
        document.querySelectorAll('.delete-key').forEach(button => {
            button.addEventListener('click', async (e) => {
                const id = e.target.getAttribute('data-id');
                if (confirm('Are you sure you want to delete this key?')) {
                    await apiRequest(`/keys/${id}`, 'DELETE');
                    loadKeys();
                }
            });
        });

        loadKeyStatistics();
    } catch (error) {
        console.error('Error loading keys:', error);
    }
}

// Load key statistics
async function loadKeyStatistics() {
    try {
        const statistics = await apiRequest('/keys/statistics');
        updateKeyCharts(statistics);
    } catch (error) {
        console.error('Error loading key statistics:', error);
    }
}

// Update key charts
function updateKeyCharts(statistics) {
    // Usage chart
    new Chart(document.getElementById('keyUsageChart'), {
        type: 'bar',
        data: {
            labels: statistics.mostUsedKeys.map(k => k.key),
            datasets: [{
                label: 'Usage Count',
                data: statistics.mostUsedKeys.map(k => k.usageCount),
                backgroundColor: 'rgba(74, 144, 226, 0.6)'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Most Used Keys'
                }
            }
        }
    });

    // Expiration chart
    new Chart(document.getElementById('keyExpirationChart'), {
        type: 'pie',
        data: {
            labels: ['Active', 'Expired', 'Nearing Expiration'],
            datasets: [{
                data: [
                    statistics.activeKeys,
                    statistics.expiredKeys,
                    statistics.keysNearingExpiration.length
                ],
                backgroundColor: [
                    'rgba(75, 192, 192, 0.6)',
'rgba(255, 99, 132, 0.6)',
                    'rgba(255, 206, 86, 0.6)'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Key Status Distribution'
                }
            }
        }
    });
}

// Load logs
async function loadLogs() {
    try {
        const logs = await apiRequest('/logs');
        const logsList = document.getElementById('logs-list');
        logsList.innerHTML = logs.map(log => `
            <div class="card mb-3">
                <div class="card-body">
                    <h5 class="card-title">${log.type}</h5>
                    <p class="card-text">${log.message}</p>
                    <p class="card-text"><small class="text-muted">${new Date(log.timestamp).toLocaleString()}</small></p>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading logs:', error);
    }
}

// Load users
async function loadUsers() {
    try {
        const users = await apiRequest('/users');
        const usersList = document.getElementById('users-list');
        usersList.innerHTML = users.map(user => `
            <div class="card mb-3">
                <div class="card-body">
                    <h5 class="card-title">${user.username}</h5>
                    <p class="card-text">Role: ${user.role}</p>
                    <button class="btn btn-sm btn-danger delete-user" data-id="${user.id}">Delete</button>
                </div>
            </div>
        `).join('');

        // Add event listeners for delete buttons
        document.querySelectorAll('.delete-user').forEach(button => {
            button.addEventListener('click', async (e) => {
                const id = e.target.getAttribute('data-id');
                if (confirm('Are you sure you want to delete this user?')) {
                    await apiRequest(`/users/${id}`, 'DELETE');
                    loadUsers();
                }
            });
        });
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

// Create new key
document.getElementById('create-key-btn').addEventListener('click', async () => {
    const expirationDate = prompt('Enter expiration date (YYYY-MM-DD):');
    const maxUsage = prompt('Enter maximum usage count:');
    
    try {
        showLoading();
        await apiRequest('/keys', 'POST', { expirationDate, maxUsage: parseInt(maxUsage) });
        loadKeys();
    } catch (error) {
        alert('Failed to create key. Please try again.');
    } finally {
        hideLoading();
    }
});

// Search keys
document.getElementById('search-keys-btn').addEventListener('click', async () => {
    const searchTerm = prompt('Enter search term:');
    if (searchTerm) {
        try {
            showLoading();
            const keys = await apiRequest(`/keys/search?key=${searchTerm}`);
            const keysList = document.getElementById('keys-list');
            keysList.innerHTML = keys.map(key => `
                <div class="card mb-3">
                    <div class="card-body">
                        <h5 class="card-title">${key.key}</h5>
                        <p class="card-text">Expiration: ${key.expirationDate}</p>
                        <p class="card-text">Usage: ${key.usageCount}/${key.maxUsage}</p>
                        <button class="btn btn-sm btn-danger delete-key" data-id="${key.id}">Delete</button>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            alert('Failed to search keys. Please try again.');
        } finally {
            hideLoading();
        }
    }
});

// Delete all keys
document.getElementById('delete-all-keys-btn').addEventListener('click', async () => {
    if (confirm('Are you sure you want to delete all keys? This action cannot be undone.')) {
        try {
            showLoading();
            await apiRequest('/keys', 'DELETE');
            loadKeys();
        } catch (error) {
            alert('Failed to delete all keys. Please try again.');
        } finally {
            hideLoading();
        }
    }
});

// Search logs
document.getElementById('search-logs-btn').addEventListener('click', async () => {
    const type = prompt('Enter log type (info/error):');
    const startDate = prompt('Enter start date (YYYY-MM-DD):');
    const endDate = prompt('Enter end date (YYYY-MM-DD):');
    
    if (type || startDate || endDate) {
        try {
            showLoading();
            const queryParams = new URLSearchParams({ type, startDate, endDate }).toString();
            const logs = await apiRequest(`/logs/search?${queryParams}`);
            const logsList = document.getElementById('logs-list');
            logsList.innerHTML = logs.map(log => `
                <div class="card mb-3">
                    <div class="card-body">
                        <h5 class="card-title">${log.type}</h5>
                        <p class="card-text">${log.message}</p>
                        <p class="card-text"><small class="text-muted">${new Date(log.timestamp).toLocaleString()}</small></p>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            alert('Failed to search logs. Please try again.');
        } finally {
            hideLoading();
        }
    }
});

// Delete all logs
document.getElementById('delete-all-logs-btn').addEventListener('click', async () => {
    if (confirm('Are you sure you want to delete all logs? This action cannot be undone.')) {
        try {
            showLoading();
            await apiRequest('/logs', 'DELETE');
            loadLogs();
        } catch (error) {
            alert('Failed to delete all logs. Please try again.');
        } finally {
            hideLoading();
        }
    }
});

// Create new user
document.getElementById('create-user-btn').addEventListener('click', async () => {
    const username = prompt('Enter username:');
    const password = prompt('Enter password:');
    const role = prompt('Enter role:');
    
    try {
        showLoading();
        await apiRequest('/users', 'POST', { username, password, role });
        loadUsers();
    } catch (error) {
        alert('Failed to create user. Please try again.');
    } finally {
        hideLoading();
    }
});

// Change password
document.getElementById('change-password-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    
    try {
        showLoading();
        await apiRequest('/change-password', 'POST', { currentPassword, newPassword });
        alert('Password changed successfully.');
        document.getElementById('change-password-form').reset();
    } catch (error) {
        alert('Failed to change password. Please try again.');
    } finally {
        hideLoading();
    }
});

// Animate sections on scroll
const sections = document.querySelectorAll('.section');
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, { threshold: 0.1 });

sections.forEach(section => {
    observer.observe(section);
});

// Initialize dashboard if token exists
if (token) {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('main-content').style.display = 'block';
    loadDashboard();
}
