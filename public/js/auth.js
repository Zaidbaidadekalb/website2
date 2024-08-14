import { showNotification } from './notifications.js';

const API_BASE_URL = 'https://key-management-worker.zaidbaidaa.workers.dev';

function validateForm(username, password) {
    if (username.length < 3) {
        showNotification('Username must be at least 3 characters long.', 'error');
        return false;
    }
    if (password.length < 8) {
        showNotification('Password must be at least 8 characters long.', 'error');
        return false;
    }
    return true;
}

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        if (!validateForm(username, password)) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('token', data.token);
                showNotification('Login successful. Redirecting...', 'success');
                setTimeout(() => {
                    window.location.href = '/dashboard.html';
                }, 1500);
            } else {
                const errorData = await response.json();
                showNotification(errorData.message || 'Login failed. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            showNotification('An unexpected error occurred. Please try again later.', 'error');
        }
    });
});
