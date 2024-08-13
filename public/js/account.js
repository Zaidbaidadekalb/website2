import { createStore } from '/js/state.js';

const store = createStore({
    user: null,
});

document.addEventListener('DOMContentLoaded', () => {
    const accountInfo = document.getElementById('account-info');
    const changePasswordForm = document.getElementById('change-password-form');

    async function fetchUserData() {
        try {
            const response = await fetch('/users/me', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (response.ok) {
                const userData = await response.json();
                store.setState({ user: userData });
                displayAccountInfo(userData);
            } else {
                throw new Error('Failed to fetch user data');
            }
        } catch (error) {
            console.error('Account error:', error);
            alert('Failed to load account information. Please try again.');
        }
    }

    function displayAccountInfo(user) {
        accountInfo.innerHTML = `
            <h2>Account Information</h2>
            <p><strong>Username:</strong> ${user.username}</p>
            <p><strong>Role:</strong> ${user.role}</p>
            <p><strong>Email:</strong> ${user.email}</p>
        `;
    }

    changePasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (newPassword !== confirmPassword) {
            alert('New passwords do not match');
            return;
        }

        try {
            const response = await fetch('/change-password', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword,
                }),
            });

            if (response.ok) {
                alert('Password changed successfully');
                changePasswordForm.reset();
            } else {
                throw new Error('Failed to change password');
            }
        } catch (error) {
            console.error('Password change error:', error);
            alert('Failed to change password. Please try again.');
        }
    });

    fetchUserData();
});