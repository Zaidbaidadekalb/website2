document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const usernameError = document.getElementById('username-error');
    const passwordError = document.getElementById('password-error');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Reset error messages
        usernameError.textContent = '';
        passwordError.textContent = '';

        // Validate inputs
        let isValid = true;

        if (usernameInput.value.trim() === '') {
            usernameError.textContent = 'Username is required';
            isValid = false;
        }

        if (passwordInput.value.trim() === '') {
            passwordError.textContent = 'Password is required';
            isValid = false;
        }

        if (!isValid) return;

        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: usernameInput.value,
                    password: passwordInput.value,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('token', data.token);
                window.location.href = '/dashboard.html';
            } else {
                throw new Error('Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Login failed. Please try again.');
        }
    });

    // Add real-time validation
    usernameInput.addEventListener('input', () => {
        if (usernameInput.value.trim() !== '') {
            usernameError.textContent = '';
        }
    });

    passwordInput.addEventListener('input', () => {
        if (passwordInput.value.trim() !== '') {
            passwordError.textContent = '';
        }
    });
});
