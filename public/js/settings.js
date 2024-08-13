import { createStore } from '/js/state.js';

const store = createStore({
    theme: 'dark',
    notifications: true,
});

document.addEventListener('DOMContentLoaded', () => {
    const settingsForm = document.getElementById('settings-form');
    const themeSelect = document.getElementById('theme');
    const notificationsCheckbox = document.getElementById('notifications');

    // Load initial settings
    themeSelect.value = store.getState().theme;
    notificationsCheckbox.checked = store.getState().notifications;

    settingsForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const newSettings = {
            theme: themeSelect.value,
            notifications: notificationsCheckbox.checked,
        };

        try {
            const response = await fetch('/settings', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newSettings),
            });

            if (response.ok) {
                store.setState(newSettings);
                alert('Settings saved successfully');
            } else {
                throw new Error('Failed to save settings');
            }
        } catch (error) {
            console.error('Settings error:', error);
            alert('Failed to save settings. Please try again.');
        }
    });

    // Apply theme
    function applyTheme(theme) {
        document.body.classList.remove('light-theme', 'dark-theme');
        document.body.classList.add(`${theme}-theme`);
    }

    store.subscribe((state) => {
        applyTheme(state.theme);
    });

    applyTheme(store.getState().theme);
});