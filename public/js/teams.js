// Teams JavaScript - teams.js

let currentTeams = [];
let filteredTeams = [];
let currentPage = 1;
let itemsPerPage = 10;
let isEditing = false;
let editingTeamId = null;
let playerCount = 0;

document.addEventListener('DOMContentLoaded', function() {
    initTeamsPage();
});

function initTeamsPage() {
    loadTeams();
    setupEventListeners();
    setupRegistrationFees();
}

// Setup event listeners
function setupEventListeners() {
    // Add team button
    document.getElementById('add-team-btn').addEventListener('click', openAddTeamModal);
    
    // Modal controls
    document.getElementById('close-modal').addEventListener('click', closeModal);
    document.getElementById('cancel-btn').addEventListener('click', closeModal);
    document.getElementById('close-delete-modal').addEventListener('click', closeDeleteModal);
    document.getElementById('cancel-delete').addEventListener('click', closeDeleteModal);
    document.getElementById('close-status-modal').addEventListener('click', closeStatusModal);
    document.getElementById('cancel-status').addEventListener('click', closeStatusModal);
    
    // Form submission
    document.getElementById('team-form').addEventListener('submit', handleFormSubmit);
    
    // Delete and status confirmation
    document.getElementById('confirm-delete').addEventListener('click', handleDelete);
    document.getElementById('confirm-status').addEventListener('click', handleStatusUpdate);
    
    // Filters
    document.getElementById('tier-filter').addEventListener('change', applyFilters);
    document.getElementById('gender-filter').addEventListener('change', applyFilters);
    document.getElementById('status-filter').addEventListener('change', applyFilters);
    document.getElementById('payment-filter').addEventListener('change', applyFilters);
    document.getElementById('search-input').addEventListener('input', debounce(applyFilters, 300));
    
    // Export button
    document.getElementById('export-btn').addEventListener('click', exportTeams);
    
    // Player management
    document.getElementById('add-player-btn').addEventListener('click', addPlayerForm);
    
    // Tier change - update registration fee
    document.querySelector('select[name="tier"]').addEventListener('change', updateRegistrationFee);
    
    // Modal backdrop clicks
    document.getElementById('team-modal').addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });
    
    document.getElementById('delete-modal').addEventListener('click', function(e) {
        if (e.target === this) closeDeleteModal();
    });
    
    document.getElementById('status-modal').addEventListener('click', function(e) {
        if (e.target === this) closeStatusModal();
    });
}

// Setup registration fees display
function setupRegistrationFees() {
    const registrationFees = {
        'elementary': 150,
        'middle': 200,
        'high_school': 250
    };
    
    const tierSelect = document.querySelector('select[name="tier"]');
    const options = tierSelect.querySelectorAll('option');
    
    options.forEach(option => {
        const value = option.value;
        if (value && registrationFees[value]) {
            option.textContent = option.textContent.replace(/\$[\d,]+/, `$${registrationFees[value]}`);
        }
    });
}

// Update registration fee when tier changes
function updateRegistrationFee() {
    const tierSelect = document.querySelector('select[name="tier"]');
    const selectedTier = tierSelect.value;
    
    const registrationFees = {
        'elementary': 150,
        'middle': 200,
        'high_school': 250
    };
    
    console.log('Selected tier:', selectedTier, 'Fee:', registrationFees[selectedTier] || 0);
}

// Load teams from API
async function loadTeams() {
    try {
        showLoading();
        const response = await fetch('/api/teams');
        const result = await response.json();
        
        if (result.success) {
            currentTeams = result.data;
            filteredTeams = [...currentTeams];
            updateTeamsTable();
            updatePagination();
        } else {
            showToast('Failed to load teams', 'error');
        }
    } catch (error) {
        console.error('Error loading teams:', error);
        showToast('Error loading teams', 'error');
    } finally {
        hideLoading();
    }
}

// Update teams table
function updateTeamsTable() {
    const tbody = document.getElementById('teams-table-body');
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedTeams = filteredTeams.slice(startIndex, endIndex);
    
    if (paginatedTeams.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" style="text-align: center; padding: 2rem;">
                    No teams found
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = paginatedTeams.map(team => `
        <tr>
            <td>${team.teamId}</td>
            <td><strong>${team.teamName}</strong></td>
            <td>${team.organization}</td>
            <td>${team.coachName}</td>
            <td>${formatTier(team.tier)}</td>
            <td>${formatGender(team.gender)}</td>
            <td>${team.players?.length || 0}</td>
            <td>$${team.registrationFee?.toLocaleString() || '0'}</td>
            <td>
                <span class="status-badge status-${team.registrationStatus}">${team.registrationStatus}</span>
                ${team.paymentStatus !== 'completed' ? '<br><small style="color: #dc3545;">Payment Pending</small>' : ''}
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-small btn-primary" onclick="editTeam('${team.teamId}')">Edit</button>
                    <button class="btn-small btn-secondary" onclick="updateTeamStatus('${team.teamId}')">Status</button>
                    <button class="btn-small btn-danger" onclick="confirmDeleteTeam('${team.teamId}')">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Apply filters
function applyFilters() {
    const tierFilter = document.getElementById('tier-filter').value;
    const genderFilter = document.getElementById('gender-filter').value;
    const statusFilter = document.getElementById('status-filter').value;
    const paymentFilter = document.getElementById('payment-filter').value;
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    
    filteredTeams = currentTeams.filter(team => {
        const matchesTier = !tierFilter || team.tier === tierFilter;
        const matchesGender = !genderFilter || team.gender === genderFilter;
        const matchesStatus = !statusFilter || team.registrationStatus === statusFilter;
        const matchesPayment = !paymentFilter || team.paymentStatus === paymentFilter;
        const matchesSearch = !searchTerm || 
            team.teamName.toLowerCase().includes(searchTerm) ||
            team.organization.toLowerCase().includes(searchTerm) ||
            team.coachName.toLowerCase().includes(searchTerm) ||
            team.coachEmail.toLowerCase().includes(searchTerm) ||
            team.teamId.toLowerCase().includes(searchTerm);
        
        return matchesTier && matchesGender && matchesStatus && matchesPayment && matchesSearch;
    });
    
    currentPage = 1;
    updateTeamsTable();
    updatePagination();
}

// Update pagination
function updatePagination() {
    const totalPages = Math.ceil(filteredTeams.length / itemsPerPage);
    const paginationContainer = document.getElementById('pagination');
    
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    if (currentPage > 1) {
        paginationHTML += `<button class="pagination-btn" onclick="changePage(${currentPage - 1})">Previous</button>`;
    }
    
    for (let i = 1; i <= totalPages; i++) {
        if (i === currentPage) {
            paginationHTML += `<button class="pagination-btn active">${i}</button>`;
        } else if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            paginationHTML += `<button class="pagination-btn" onclick="changePage(${i})">${i}</button>`;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            paginationHTML += `<span class="pagination-ellipsis">...</span>`;
        }
    }
    
    if (currentPage < totalPages) {
        paginationHTML += `<button class="pagination-btn" onclick="changePage(${currentPage + 1})">Next</button>`;
    }
    
    paginationContainer.innerHTML = paginationHTML;
}

// Change page
function changePage(page) {
    currentPage = page;
    updateTeamsTable();
    updatePagination();
}

// Open add team modal
function openAddTeamModal() {
    isEditing = false;
    editingTeamId = null;
    playerCount = 0;
    
    document.getElementById('modal-title').textContent = 'Add Team';
    document.getElementById('team-form').reset();
    document.getElementById('players-container').innerHTML = '';
    
    // Add initial 5 player forms
    for (let i = 0; i < 5; i++) {
        addPlayerForm();
    }
    
    document.getElementById('team-modal').style.display = 'block';
}

// Add player form
function addPlayerForm() {
    if (playerCount >= 10) {
        showToast('Maximum 10 players allowed per team', 'warning');
        return;
    }
    
    const template = document.getElementById('player-template');
    const playerForm = template.content.cloneNode(true);
    
    playerCount++;
    const playerNumber = playerForm.querySelector('.player-number');
    playerNumber.textContent = playerCount;
    
    // Set unique names for inputs
    const inputs = playerForm.querySelectorAll('input');
    inputs.forEach(input => {
        const originalName = input.name;
        input.name = `${originalName}_${playerCount}`;
    });
    
    // Add remove button functionality
    const removeBtn = playerForm.querySelector('.remove-player-btn');
    if (playerCount <= 5) {
        removeBtn.style.display = 'none'; // Can't remove first 5 players
    } else {
        removeBtn.addEventListener('click', function() {
            removePlayerForm(this.closest('.player-form'));
        });
    }
    
    document.getElementById('players-container').appendChild(playerForm);
}

// Remove player form
function removePlayerForm(playerForm) {
    playerForm.remove();
    playerCount--;
    updatePlayerNumbers();
}

// Update player numbers after removal
function updatePlayerNumbers() {
    const playerForms = document.querySelectorAll('.player-form');
    playerForms.forEach((form, index) => {
        const playerNumber = form.querySelector('.player-number');
        playerNumber.textContent = index + 1;
        
        // Update input names
        const inputs = form.querySelectorAll('input');
        inputs.forEach(input => {
            const baseName = input.name.split('_')[0];
            input.name = `${baseName}_${index + 1}`;
        });
        
        // Hide remove button for first 5 players
        const removeBtn = form.querySelector('.remove-player-btn');
        removeBtn.style.display = index < 5 ? 'none' : 'inline-block';
    });
}

// Edit team
function editTeam(teamId) {
    const team = currentTeams.find(t => t.teamId === teamId);
    if (!team) return;
    
    isEditing = true;
    editingTeamId = teamId;
    playerCount = 0;
    
    document.getElementById('modal-title').textContent = 'Edit Team';
    
    // Populate form
    const form = document.getElementById('team-form');
    form.teamName.value = team.teamName || '';
    form.organization.value = team.organization || '';
    form.city.value = team.city || '';
    form.tier.value = team.tier || '';
    form.gender.value = team.gender || '';
    form.coachName.value = team.coachName || '';
    form.coachEmail.value = team.coachEmail || '';
    form.coachPhone.value = team.coachPhone || '';
    form.emergencyContactName.value = team.emergencyContact?.name || '';
    form.emergencyContactPhone.value = team.emergencyContact?.phone || '';
    form.emergencyContactRelationship.value = team.emergencyContact?.relationship || '';
    form.specialRequirements.value = team.specialRequirements || '';
    form.comments.value = team.comments || '';
    
    // Clear and populate players
    document.getElementById('players-container').innerHTML = '';
    
    if (team.players && team.players.length > 0) {
        team.players.forEach(player => {
            addPlayerForm();
            const playerForm = document.querySelector('.player-form:last-child');
            playerForm.querySelector('input[name^="playerName"]').value = player.playerName || '';
            playerForm.querySelector('input[name^="dateOfBirth"]').value = 
                player.dateOfBirth ? new Date(player.dateOfBirth).toISOString().split('T')[0] : '';
        });
    } else {
        // Add default 5 players for editing
        for (let i = 0; i < 5; i++) {
            addPlayerForm();
        }
    }
    
    document.getElementById('team-modal').style.display = 'block';
}

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const teamData = {};
    
    // Extract basic team data
    teamData.teamName = formData.get('teamName');
    teamData.organization = formData.get('organization');
    teamData.city = formData.get('city');
    teamData.tier = formData.get('tier');
    teamData.gender = formData.get('gender');
    teamData.coachName = formData.get('coachName');
    teamData.coachEmail = formData.get('coachEmail');
    teamData.coachPhone = formData.get('coachPhone');
    teamData.specialRequirements = formData.get('specialRequirements');
    teamData.comments = formData.get('comments');
    
    // Emergency contact
    teamData.emergencyContact = {
        name: formData.get('emergencyContactName'),
        phone: formData.get('emergencyContactPhone'),
        relationship: formData.get('emergencyContactRelationship')
    };
    
    // Set registration fee based on tier
    const registrationFees = {
        'elementary': 150,
        'middle': 200,
        'high_school': 250
    };
    teamData.registrationFee = registrationFees[teamData.tier] || 0;
    
    // Extract player data
    teamData.players = [];
    for (let i = 1; i <= playerCount; i++) {
        const playerName = formData.get(`playerName_${i}`);
        const dateOfBirth = formData.get(`dateOfBirth_${i}`);
        const idPhoto = formData.get(`idPhoto_${i}`);
        
        if (playerName && dateOfBirth) {
            const player = {
                playerName,
                dateOfBirth,
                ageAtRegistration: calculateAge(new Date(dateOfBirth))
            };
            
            // Handle file upload for editing (simplified for demo)
            if (idPhoto && idPhoto.size > 0) {
                player.idPhotoUrl = `uploads/${Date.now()}_${idPhoto.name}`;
                player.idPhotoOriginalName = idPhoto.name;
            } else if (isEditing) {
                // Keep existing photo data if editing
                const existingTeam = currentTeams.find(t => t.teamId === editingTeamId);
                const existingPlayer = existingTeam?.players?.[i - 1];
                if (existingPlayer) {
                    player.idPhotoUrl = existingPlayer.idPhotoUrl;
                    player.idPhotoOriginalName = existingPlayer.idPhotoOriginalName;
                }
            }
            
            teamData.players.push(player);
        }
    }
    
    // Validate player count
    if (teamData.players.length < 5) {
        showToast('Team must have at least 5 players', 'error');
        return;
    }
    
    if (teamData.players.length > 10) {
        showToast('Team cannot have more than 10 players', 'error');
        return;
    }
    
    try {
        showLoading();
        
        const url = isEditing ? `/api/teams/${editingTeamId}` : '/api/teams';
        const method = isEditing ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(teamData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast(isEditing ? 'Team updated successfully' : 'Team created successfully', 'success');
            closeModal();
            loadTeams();
        } else {
            showToast(result.message || 'Failed to save team', 'error');
        }
    } catch (error) {
        console.error('Error saving team:', error);
        showToast('Error saving team', 'error');
    } finally {
        hideLoading();
    }
}

// Update team status
function updateTeamStatus(teamId) {
    const team = currentTeams.find(t => t.teamId === teamId);
    if (!team) return;
    
    editingTeamId = teamId;
    document.getElementById('new-status').value = team.registrationStatus;
    document.getElementById('status-notes').value = '';
    document.getElementById('status-modal').style.display = 'block';
}

// Handle status update
async function handleStatusUpdate() {
    const newStatus = document.getElementById('new-status').value;
    const notes = document.getElementById('status-notes').value;
    
    try {
        showLoading();
        
        const response = await fetch(`/api/teams/${editingTeamId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                registrationStatus: newStatus,
                notes: notes
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Team status updated successfully', 'success');
            closeStatusModal();
            loadTeams();
        } else {
            showToast(result.message || 'Failed to update status', 'error');
        }
    } catch (error) {
        console.error('Error updating status:', error);
        showToast('Error updating status', 'error');
    } finally {
        hideLoading();
    }
}

// Confirm delete team
function confirmDeleteTeam(teamId) {
    editingTeamId = teamId;
    document.getElementById('delete-modal').style.display = 'block';
}

// Handle delete
async function handleDelete() {
    try {
        showLoading();
        
        const response = await fetch(`/api/teams/${editingTeamId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Team deleted successfully', 'success');
            closeDeleteModal();
            loadTeams();
        } else {
            showToast(result.message || 'Failed to delete team', 'error');
        }
    } catch (error) {
        console.error('Error deleting team:', error);
        showToast('Error deleting team', 'error');
    } finally {
        hideLoading();
    }
}

// Close modals
function closeModal() {
    document.getElementById('team-modal').style.display = 'none';
    isEditing = false;
    editingTeamId = null;
    playerCount = 0;
}

function closeDeleteModal() {
    document.getElementById('delete-modal').style.display = 'none';
    editingTeamId = null;
}

function closeStatusModal() {
    document.getElementById('status-modal').style.display = 'none';
    editingTeamId = null;
}

// Export teams
function exportTeams() {
    const csvContent = generateTeamsCSV(filteredTeams);
    downloadCSV(csvContent, 'teams.csv');
}

// Generate CSV content
function generateTeamsCSV(teams) {
    const headers = [
        'Team ID', 'Team Name', 'Organization', 'City', 'Tier', 'Gender',
        'Coach Name', 'Coach Email', 'Coach Phone', 'Registration Fee',
        'Registration Status', 'Payment Status', 'Player Count',
        'Emergency Contact Name', 'Emergency Contact Phone', 'Special Requirements'
    ];
    
    const rows = teams.map(team => [
        team.teamId,
        team.teamName,
        team.organization,
        team.city,
        formatTier(team.tier),
        formatGender(team.gender),
        team.coachName,
        team.coachEmail,
        team.coachPhone,
        team.registrationFee,
        team.registrationStatus,
        team.paymentStatus,
        team.players?.length || 0,
        team.emergencyContact?.name || '',
        team.emergencyContact?.phone || '',
        team.specialRequirements
    ]);
    
    return [headers, ...rows]
        .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
        .join('\n');
}

// Utility functions
function calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    
    return age;
}

function formatTier(tier) {
    const tierMap = {
        'elementary': 'Elementary School',
        'middle': 'Middle School',
        'high_school': 'High School'
    };
    return tierMap[tier] || tier;
}

function formatGender(gender) {
    return gender ? gender.charAt(0).toUpperCase() + gender.slice(1) : '';
}

function downloadCSV(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showLoading() {
    const table = document.getElementById('teams-table-body');
    table.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 2rem;">Loading...</td></tr>';
}

function hideLoading() {
    // Loading will be hidden when table is updated
}

function showToast(message, type) {
    if (window.dashboardUtils && window.dashboardUtils.showToast) {
        window.dashboardUtils.showToast(message, type);
    } else {
        alert(message);
    }
}