const API_BASE_URL = 'https://key-management-worker.zaidbaidaa.workers.dev';

function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type} show`;
    setTimeout(() => {
        notification.className = 'notification';
    }, 3000);
}

function showError(message) {
    const errorContainer = document.getElementById('error-container');
    errorContainer.textContent = message;
    errorContainer.className = 'error-message show';
}

function clearError() {
    const errorContainer = document.getElementById('error-container');
    errorContainer.textContent = '';
    errorContainer.className = 'error-message';
}

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
                showError(errorData.message || 'Login failed. Please try again.');
            }
        } catch (error) {
            console.error('Login error:', error);
            showError('An unexpected error occurred. Please try again later.');
        }
    });

    usernameInput.addEventListener('input', clearError);
    passwordInput.addEventListener('input', clearError);
});
