import { createStore } from '/js/state.js';

const store = createStore({
    users: [],
    selectedUser: null,
});

export function openUserManagement() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>User Management</h2>
            <div id="user-list"></div>
            <button id="create-user">Create New User</button>
            <div id="user-details"></div>
        </div>
    `;
    document.body.appendChild(modal);

    loadUsers();
    document.getElementById('create-user').addEventListener('click', createUser);
}

async function loadUsers() {
    try {
        const response = await fetch('/admin/users', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        });
        const users = await response.json();
        store.setState({ users });
        renderUserList();
    } catch (error) {
        console.error('Failed to load users:', error);
        alert('Failed to load users. Please try again.');
    }
}

function renderUserList() {
    const userList = document.getElementById('user-list');
    userList.innerHTML = `
        <ul>
            ${store.getState().users.map(user => `
                <li>
                    <span>${user.username} (${user.role})</span>
                    <button class="edit-user" data-id="${user.id}">Edit</button>
                    <button class="delete-user" data-id="${user.id}">Delete</button>
                </li>
            `).join('')}
        </ul>
    `;

    userList.querySelectorAll('.edit-user').forEach(button => {
        button.addEventListener('click', () => editUser(button.dataset.id));
    });

    userList.querySelectorAll('.delete-user').forEach(button => {
        button.addEventListener('click', () => deleteUser(button.dataset.id));
    });
}

async function createUser() {
    const username = prompt('Enter new username:');
    const password = prompt('Enter password:');
    const role = prompt('Enter user role (admin, team, or user):');
    if (!username || !password || !role) return;

    try {
        const response = await fetch('/admin/users', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password, role }),
        });
        if (response.ok) {
            const newUser = await response.json();
            store.setState({ users: [...store.getState().users, newUser] });
            renderUserList();
        } else {
            throw new Error('Failed to create user');
        }
    } catch (error) {
        console.error('Failed to create user:', error);
        alert('Failed to create user. Please try again.');
    }
}

async function editUser(userId) {
    const user = store.getState().users.find(u => u.id === userId);
    if (!user) return;
    store.setState({ selectedUser: user });
    renderUserDetails();
}

async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
        const response = await fetch(`/admin/users/${userId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        });
        if (response.ok) {
            store.setState({ users: store.getState().users.filter(u => u.id !== userId) });
            renderUserList();
        } else {
            throw new Error('Failed to delete user');
        }
    } catch (error) {
        console.error('Failed to delete user:', error);
        alert('Failed to delete user. Please try again.');
    }
}

function renderUserDetails() {
    const userDetails = document.getElementById('user-details');
    const user = store.getState().selectedUser;
    if (!user) {
        userDetails.innerHTML = '';
        return;
    }

    userDetails.innerHTML = `
        <h3>Edit User: ${user.username}</h3>
        <form id="edit-user-form">
            <label for="username">Username:</label>
            <input type="text" id="username" value="${user.username}" required>
            <label for="role">Role:</label>
            <select id="role" required>
                <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                <option value="team" ${user.role === 'team' ? 'selected' : ''}>Team</option>
                <option value="user" ${user.role === 'user' ? 'selected' : ''}>User</option>
            </select>
            <label for="new-password">New Password (leave blank to keep current):</label>
            <input type="password" id="new-password">
            <button type="submit">Save Changes</button>
        </form>
    `;

    document.getElementById('edit-user-form').addEventListener('submit', updateUser);
}

async function updateUser(event) {
    event.preventDefault();

    const user = store.getState().selectedUser;
    const updatedUsername = document.getElementById('username').value;
    const updatedRole = document.getElementById('role').value;
    const newPassword = document.getElementById('new-password').value;

    try {
        const response = await fetch(`/admin/users/${user.id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: updatedUsername,
                role: updatedRole,
                password: newPassword || undefined,
            }),
        });
        if (response.ok) {
            const updatedUser = await response.json();
            store.setState({
                users: store.getState().users.map(u => u.id === updatedUser.id ? updatedUser : u),
                selectedUser: updatedUser,
            });
            renderUserList();
            renderUserDetails();
        } else {
            throw new Error('Failed to update user');
        }
    } catch (error) {
        console.error('Failed to update user:', error);
        alert('Failed to update user. Please try again.');
    }
}
