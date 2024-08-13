import { createStore } from '/js/state.js';

const store = createStore({
    teams: [],
    selectedTeam: null,
});

export function openTeamManagement() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Team Management</h2>
            <div id="team-list"></div>
            <button id="create-team">Create New Team</button>
            <div id="team-details"></div>
        </div>
    `;
    document.body.appendChild(modal);

    loadTeams();
    document.getElementById('create-team').addEventListener('click', createTeam);
}

async function loadTeams() {
    try {
        const response = await fetch('/admin/teams', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        });
        const teams = await response.json();
        store.setState({ teams });
        renderTeamList();
    } catch (error) {
        console.error('Failed to load teams:', error);
        alert('Failed to load teams. Please try again.');
    }
}

function renderTeamList() {
    const teamList = document.getElementById('team-list');
    teamList.innerHTML = `
        <ul>
            ${store.getState().teams.map(team => `
                <li>
                    <span>${team.name}</span>
                    <button class="edit-team" data-id="${team.id}">Edit</button>
                    <button class="delete-team" data-id="${team.id}">Delete</button>
                </li>
            `).join('')}
        </ul>
    `;

    teamList.querySelectorAll('.edit-team').forEach(button => {
        button.addEventListener('click', () => editTeam(button.dataset.id));
    });

    teamList.querySelectorAll('.delete-team').forEach(button => {
        button.addEventListener('click', () => deleteTeam(button.dataset.id));
    });
}

async function createTeam() {
    const teamName = prompt('Enter new team name:');
    if (!teamName) return;

    try {
        const response = await fetch('/admin/teams', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: teamName }),
        });

        if (response.ok) {
            const newTeam = await response.json();
            store.setState({ teams: [...store.getState().teams, newTeam] });
            renderTeamList();
        } else {
            throw new Error('Failed to create team');
        }
    } catch (error) {
        console.error('Failed to create team:', error);
        alert('Failed to create team. Please try again.');
    }
}

async function editTeam(teamId) {
    const team = store.getState().teams.find(t => t.id === teamId);
    if (!team) return;

    store.setState({ selectedTeam: team });
    renderTeamDetails();
}

async function deleteTeam(teamId) {
    if (!confirm('Are you sure you want to delete this team?')) return;

    try {
        const response = await fetch(`/admin/teams/${teamId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        });

        if (response.ok) {
            store.setState({ teams: store.getState().teams.filter(t => t.id !== teamId) });
            renderTeamList();
        } else {
            throw new Error('Failed to delete team');
        }
    } catch (error) {
        console.error('Failed to delete team:', error);
        alert('Failed to delete team. Please try again.');
    }
}

function renderTeamDetails() {
    const teamDetails = document.getElementById('team-details');
    const team = store.getState().selectedTeam;

    if (!team) {
        teamDetails.innerHTML = '';
        return;
    }

    teamDetails.innerHTML = `
        <h3>Edit Team: ${team.name}</h3>
        <form id="edit-team-form">
            <label for="team-name">Team Name:</label>
            <input type="text" id="team-name" value="${team.name}" required>
            <h4>Team Members:</h4>
            <ul id="team-members">
                ${team.members.map(member => `
                    <li>
                        ${member.name} (${member.role})
                        <button type="button" class="remove-member" data-id="${member.id}">Remove</button>
                    </li>
                `).join('')}
            </ul>
            <button type="button" id="add-member">Add Member</button>
            <button type="submit">Save Changes</button>
        </form>
    `;

    document.getElementById('edit-team-form').addEventListener('submit', updateTeam);
    document.getElementById('add-member').addEventListener('click', addTeamMember);
    teamDetails.querySelectorAll('.remove-member').forEach(button => {
        button.addEventListener('click', () => removeTeamMember(button.dataset.id));
    });
}

async function updateTeam(event) {
    event.preventDefault();
    const team = store.getState().selectedTeam;
    const updatedName = document.getElementById('team-name').value;

    try {
        const response = await fetch(`/admin/teams/${team.id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: updatedName,
                members: team.members,
            }),
        });

        if (response.ok) {
            const updatedTeam = await response.json();
            store.setState({
                teams: store.getState().teams.map(t => t.id === updatedTeam.id ? updatedTeam : t),
                selectedTeam: updatedTeam,
            });
            renderTeamList();
            renderTeamDetails();
        } else {
            throw new Error('Failed to update team');
        }
    } catch (error) {
        console.error('Failed to update team:', error);
        alert('Failed to update team. Please try again.');
    }
}

async function addTeamMember() {
    const memberName = prompt('Enter new member name:');
    const memberRole = prompt('Enter member role:');
    if (!memberName || !memberRole) return;

    const team = store.getState().selectedTeam;
    team.members.push({ id: Date.now(), name: memberName, role: memberRole });
    store.setState({ selectedTeam: team });
    renderTeamDetails();
}

function removeTeamMember(memberId) {
    const team = store.getState().selectedTeam;
    team.members = team.members.filter(m => m.id !== parseInt(memberId));
    store.setState({ selectedTeam: team });
    renderTeamDetails();
}
