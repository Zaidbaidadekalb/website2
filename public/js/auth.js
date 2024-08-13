import { showError, clearError } from './error-handling.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearError();

        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        if (!validateForm(username, password)) {
            return;
        }

        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('token', data.token);
                window.location.href = '/dashboard.html';
            } else {
                const errorData = await response.json();
                showError(errorData.message || 'Login failed. Please try again.');
            }
        } catch (error) {
            console.error('Login error:', error);
            showError('An unexpected error occurred. Please try again later.');
        }
    });

    function validateForm(username, password) {
        if (username.length < 3) {
            showError('Username must be at least 3 characters long.');
            return false;
                    }
        if (password.length < 8) {
            showError('Password must be at least 8 characters long.');
            return false;
        }
        return true;
    }

    usernameInput.addEventListener('input', () => {
        if (usernameInput.value.trim().length >= 3) {
            clearError();
        }
    });

    passwordInput.addEventListener('input', () => {
        if (passwordInput.value.length >= 8) {
            clearError();
        }
    });
});
