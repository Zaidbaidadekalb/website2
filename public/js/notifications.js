import { createStore } from '/js/state.js';

const store = createStore({
    notifications: [],
});

export function initializeNotifications() {
    loadNotifications();
    setInterval(checkForNewNotifications, 60000); // Check every minute
}

async function loadNotifications() {
    try {
        const response = await fetch('/notifications', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        });
        const notifications = await response.json();
        store.setState({ notifications });
        renderNotifications();
    } catch (error) {
        console.error('Failed to load notifications:', error);
    }
}

async function checkForNewNotifications() {
    try {
        const response = await fetch('/notifications/new', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        });
        const newNotifications = await response.json();
        if (newNotifications.length > 0) {
            store.setState({ notifications: [...store.getState().notifications, ...newNotifications] });
            renderNotifications();
            showNotificationAlert(newNotifications);
        }
    } catch (error) {
        console.error('Failed to check for new notifications:', error);
    }
}

function renderNotifications() {
    const notificationContainer = document.getElementById('notification-container');
    const notifications = store.getState().notifications;

    notificationContainer.innerHTML = `
        <h3>Notifications</h3>
        <ul>
            ${notifications.map(notification => `
                <li class="${notification.read ? 'read' : 'unread'}">
                    <span class="notification-type">${notification.type}</span>
                    <span class="notification-message">${notification.message}</span>
                    <span class="notification-time">${new Date(notification.timestamp).toLocaleString()}</span>
                    ${notification.read ? '' : '<button class="mark-read" data-id="${notification.id}">Mark as Read</button>'}
                </li>
            `).join('')}
        </ul>
    `;

    notificationContainer.querySelectorAll('.mark-read').forEach(button => {
        button.addEventListener('click', () => markNotificationAsRead(button.dataset.id));
    });
}

function showNotificationAlert(newNotifications) {
    const alert = document.createElement('div');
    alert.className = 'notification-alert';
    alert.innerHTML = `
        <p>You have ${newNotifications.length} new notification${newNotifications.length > 1 ? 's' : ''}!</p>
        <button id="view-notifications">View</button>
        <button id="dismiss-alert">Dismiss</button>
    `;
    document.body.appendChild(alert);

    document.getElementById('view-notifications').addEventListener('click', () => {
        document.body.removeChild(alert);
        openNotificationsModal();
    });

    document.getElementById('dismiss-alert').addEventListener('click', () => {
        document.body.removeChild(alert);
    });
}

function openNotificationsModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Notifications</h2>
            <div id="notification-container"></div>
            <button id="close-modal">Close</button>
        </div>
    `;
    document.body.appendChild(modal);

    renderNotifications();

    document.getElementById('close-modal').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
}

async function markNotificationAsRead(notificationId) {
    try {
        const response = await fetch(`/notifications/${notificationId}/read`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        });

        if (response.ok) {
            store.setState({
                notifications: store.getState().notifications.map(n => 
                    n.id === notificationId ? { ...n, read: true } : n
                ),
            });
            renderNotifications();
        } else {
            throw new Error('Failed to mark notification as read');
        }
    } catch (error) {
        console.error('Failed to mark notification as read:', error);
        alert('Failed to mark notification as read. Please try again.');
    }
}
