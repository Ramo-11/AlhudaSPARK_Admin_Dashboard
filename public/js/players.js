// Players JavaScript - players.js

let currentPlayers = [];
let filteredPlayers = [];
let currentPage = 1;
let itemsPerPage = 10;
let isEditing = false;
let editingPlayerId = null;

document.addEventListener('DOMContentLoaded', function () {
    initPlayersPage();
});

function initPlayersPage() {
    loadPlayers();
    loadStats();
    setupEventListeners();
}

// Setup event listeners
function setupEventListeners() {
    // Add player button
    document.getElementById('add-player-btn').addEventListener('click', openAddPlayerModal);

    // Modal controls
    document.getElementById('close-modal').addEventListener('click', closeModal);
    document.getElementById('cancel-btn').addEventListener('click', closeModal);
    document.getElementById('close-delete-modal').addEventListener('click', closeDeleteModal);
    document.getElementById('cancel-delete').addEventListener('click', closeDeleteModal);
    document.getElementById('close-payment-modal').addEventListener('click', closePaymentModal);
    document.getElementById('cancel-payment').addEventListener('click', closePaymentModal);
    document.getElementById('close-shirt-modal').addEventListener('click', closeShirtModal);
    document.getElementById('close-shirt-summary').addEventListener('click', closeShirtModal);

    // Form submission
    document.getElementById('player-form').addEventListener('submit', handleFormSubmit);

    // Delete and payment confirmation
    document.getElementById('confirm-delete').addEventListener('click', handleDelete);
    document.getElementById('confirm-payment').addEventListener('click', handlePaymentUpdate);

    // Filters
    document.getElementById('shirt-filter').addEventListener('change', applyFilters);
    document.getElementById('team-filter').addEventListener('change', applyFilters);
    document.getElementById('status-filter').addEventListener('change', applyFilters);
    document.getElementById('payment-filter').addEventListener('change', applyFilters);
    document.getElementById('search-input').addEventListener('input', debounce(applyFilters, 300));

    // Export and shirt summary buttons
    document.getElementById('export-btn').addEventListener('click', exportPlayers);
    document.getElementById('shirt-summary-btn').addEventListener('click', showShirtSummary);
    document.getElementById('export-shirts').addEventListener('click', exportShirtSummary);

    // Modal backdrop clicks
    document.getElementById('player-modal').addEventListener('click', function (e) {
        if (e.target === this) closeModal();
    });

    document.getElementById('delete-modal').addEventListener('click', function (e) {
        if (e.target === this) closeDeleteModal();
    });

    document.getElementById('payment-modal').addEventListener('click', function (e) {
        if (e.target === this) closePaymentModal();
    });

    document.getElementById('shirt-modal').addEventListener('click', function (e) {
        if (e.target === this) closeShirtModal();
    });
}

// Load stats
async function loadStats() {
    try {
        const response = await fetch('/api/players/stats');
        const result = await response.json();

        if (result.success) {
            document.getElementById('total-players-count').textContent = result.data.total || 0;
            document.getElementById('approved-players').textContent = result.data.approved || 0;
            document.getElementById('practice-revenue').textContent = formatCurrency(
                result.data.revenue || 0
            );
            document.getElementById('pending-practice-payments').textContent =
                result.data.pendingPayments || 0;
            document.getElementById('shirt-orders').textContent = result.data.shirtCount || 0;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load players from API
async function loadPlayers() {
    try {
        showLoading();
        const response = await fetch('/api/players');
        const result = await response.json();

        if (result.success) {
            currentPlayers = result.data;
            filteredPlayers = [...currentPlayers];
            updatePlayersTable();
            updatePagination();
        } else {
            showToast('Failed to load players', 'error');
        }
    } catch (error) {
        console.error('Error loading players:', error);
        showToast('Error loading players', 'error');
    } finally {
        hideLoading();
    }
}

// Update players table
function updatePlayersTable() {
    const tbody = document.getElementById('players-table-body');
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedPlayers = filteredPlayers.slice(startIndex, endIndex);

    if (paginatedPlayers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" style="text-align: center; padding: 2rem;">
                    No players found
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = paginatedPlayers
        .map(
            (player) => `
        <tr>
            <td>${player.playerId}</td>
            <td><strong>${player.playerName}</strong></td>
            <td>${player.ageAtRegistration || calculateAge(player.dateOfBirth)}</td>
            <td><small>${player.jerseyName || player.playerName}</small></td>
            <td><small>${player.currentSchool}</small></td>
            <td><span class="shirt-size-badge">${player.shirtSize}</span></td>
            <td>${player.chosenTeam}</td>
            <td>${player.parentInfo?.name || ''}</td>
            <td>
                ${player.parentInfo?.email || ''}<br>
                <small>${player.parentInfo?.phone || ''}</small>
            </td>
            <td>$${player.registrationFee || 275}</td>
            <td>
                <span class="status-badge status-${player.registrationStatus}">${
                player.registrationStatus
            }</span>
                ${
                    player.paymentStatus !== 'completed'
                        ? '<br><small style="color: #dc3545;">Payment: ' +
                          player.paymentStatus +
                          '</small>'
                        : ''
                }
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-small btn-primary" onclick="editPlayer('${
                        player.playerId
                    }')">Edit</button>
                    <button class="btn-small btn-secondary" onclick="updatePaymentStatus('${
                        player.playerId
                    }')">Payment</button>
                    <button class="btn-small btn-danger" onclick="confirmDeletePlayer('${
                        player.playerId
                    }')">Delete</button>
                </div>
            </td>
        </tr>
    `
        )
        .join('');
}

// Apply filters
function applyFilters() {
    const shirtFilter = document.getElementById('shirt-filter').value;
    const teamFilter = document.getElementById('team-filter').value;
    const statusFilter = document.getElementById('status-filter').value;
    const paymentFilter = document.getElementById('payment-filter').value;
    const searchTerm = document.getElementById('search-input').value.toLowerCase();

    filteredPlayers = currentPlayers.filter((player) => {
        const matchesShirt = !shirtFilter || player.shirtSize === shirtFilter;
        const matchesTeam = !teamFilter || player.chosenTeam === teamFilter;
        const matchesStatus = !statusFilter || player.registrationStatus === statusFilter;
        const matchesPayment = !paymentFilter || player.paymentStatus === paymentFilter;
        const matchesSearch =
            !searchTerm ||
            player.playerName.toLowerCase().includes(searchTerm) ||
            player.jerseyName.toLowerCase().includes(searchTerm) ||
            player.currentSchool.toLowerCase().includes(searchTerm) ||
            player.parentInfo?.name?.toLowerCase().includes(searchTerm) ||
            player.parentInfo?.email?.toLowerCase().includes(searchTerm) ||
            player.playerId.toLowerCase().includes(searchTerm);

        return matchesShirt && matchesTeam && matchesStatus && matchesPayment && matchesSearch;
    });

    currentPage = 1;
    updatePlayersTable();
    updatePagination();
}

// Update pagination
function updatePagination() {
    const totalPages = Math.ceil(filteredPlayers.length / itemsPerPage);
    const paginationContainer = document.getElementById('pagination');

    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }

    let paginationHTML = '';

    if (currentPage > 1) {
        paginationHTML += `<button class="pagination-btn" onclick="changePage(${
            currentPage - 1
        })">Previous</button>`;
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
        paginationHTML += `<button class="pagination-btn" onclick="changePage(${
            currentPage + 1
        })">Next</button>`;
    }

    paginationContainer.innerHTML = paginationHTML;
}

// Change page
function changePage(page) {
    currentPage = page;
    updatePlayersTable();
    updatePagination();
}

// Open add player modal
function openAddPlayerModal() {
    isEditing = false;
    editingPlayerId = null;

    document.getElementById('modal-title').textContent = 'Add Player';
    document.getElementById('player-form').reset();
    document.getElementById('player-modal').style.display = 'block';
}

// Edit player
function editPlayer(playerId) {
    const player = currentPlayers.find((p) => p.playerId === playerId);
    if (!player) return;

    isEditing = true;
    editingPlayerId = playerId;

    document.getElementById('modal-title').textContent = 'Edit Player';

    // Populate form
    const form = document.getElementById('player-form');
    form.playerName.value = player.playerName || '';
    form.dateOfBirth.value = player.dateOfBirth
        ? new Date(player.dateOfBirth).toISOString().split('T')[0]
        : '';
    form.shirtSize.value = player.shirtSize || '';
    form.chosenTeam.value = player.chosenTeam || '';
    form.jerseyName.value = player.jerseyName || '';
    form.currentSchool.value = player.currentSchool || '';
    form.parentName.value = player.parentInfo?.name || '';
    form.parentEmail.value = player.parentInfo?.email || '';
    form.parentPhone.value = player.parentInfo?.phone || '';
    form.comments.value = player.comments || '';
    form.waiverAccepted.checked = player.waiverAccepted || false;

    document.getElementById('player-modal').style.display = 'block';
}

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const data = {
        playerName: formData.get('playerName'),
        dateOfBirth: formData.get('dateOfBirth'),
        shirtSize: formData.get('shirtSize'),
        chosenTeam: formData.get('chosenTeam'),
        jerseyName: formData.get('jerseyName'),
        currentSchool: formData.get('currentSchool'),
        parentInfo: {
            name: formData.get('parentName'),
            email: formData.get('parentEmail'),
            phone: formData.get('parentPhone'),
        },
        comments: formData.get('comments'),
        waiverAccepted: formData.get('waiverAccepted') === 'on',
        registrationFee: 275,
        paymentMethod: 'pending',
    };

    try {
        showLoading();

        const url = isEditing ? `/api/players/${editingPlayerId}` : '/api/players';
        const method = isEditing ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (result.success) {
            showToast(
                isEditing ? 'Player updated successfully' : 'Player created successfully',
                'success'
            );
            closeModal();
            loadPlayers();
            loadStats();
        } else {
            showToast(result.message || 'Failed to save player', 'error');
        }
    } catch (error) {
        console.error('Error saving player:', error);
        showToast('Error saving player', 'error');
    } finally {
        hideLoading();
    }
}

// Update payment status
function updatePaymentStatus(playerId) {
    const player = currentPlayers.find((p) => p.playerId === playerId);
    if (!player) return;

    editingPlayerId = playerId;
    document.getElementById('new-payment-status').value = player.paymentStatus || 'pending';
    document.getElementById('payment-method').value = player.paymentMethod || '';
    document.getElementById('transaction-id').value = player.transactionId || '';
    document.getElementById('payment-modal').style.display = 'block';
}

// Handle payment update
async function handlePaymentUpdate() {
    const paymentStatus = document.getElementById('new-payment-status').value;
    const paymentMethod = document.getElementById('payment-method').value;
    const transactionId = document.getElementById('transaction-id').value;

    try {
        showLoading();

        const updateData = {
            paymentStatus,
            paymentMethod,
            transactionId,
        };

        // Add payment date if marking as completed
        if (paymentStatus === 'completed') {
            updateData.paymentDate = new Date().toISOString();
            updateData.registrationStatus = 'approved';
        }

        const response = await fetch(`/api/players/${editingPlayerId}/payment`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData),
        });

        const result = await response.json();

        if (result.success) {
            showToast('Payment status updated successfully', 'success');
            closePaymentModal();
            loadPlayers();
            loadStats();
        } else {
            showToast(result.message || 'Failed to update payment status', 'error');
        }
    } catch (error) {
        console.error('Error updating payment status:', error);
        showToast('Error updating payment status', 'error');
    } finally {
        hideLoading();
    }
}

// Confirm delete player
function confirmDeletePlayer(playerId) {
    editingPlayerId = playerId;
    document.getElementById('delete-modal').style.display = 'block';
}

// Handle delete
async function handleDelete() {
    try {
        showLoading();

        const response = await fetch(`/api/players/${editingPlayerId}`, {
            method: 'DELETE',
        });

        const result = await response.json();

        if (result.success) {
            showToast('Player deleted successfully', 'success');
            closeDeleteModal();
            loadPlayers();
            loadStats();
        } else {
            showToast(result.message || 'Failed to delete player', 'error');
        }
    } catch (error) {
        console.error('Error deleting player:', error);
        showToast('Error deleting player', 'error');
    } finally {
        hideLoading();
    }
}

// Show shirt summary
function showShirtSummary() {
    const approvedPlayers = currentPlayers.filter((p) => p.registrationStatus === 'approved');
    const shirtCounts = {};

    const sizes = ['YS', 'YM', 'YL', 'MXL', 'AS', 'AM', 'AL', 'AXL'];
    sizes.forEach((size) => {
        shirtCounts[size] = 0;
    });

    approvedPlayers.forEach((player) => {
        if (player.shirtSize && shirtCounts.hasOwnProperty(player.shirtSize)) {
            shirtCounts[player.shirtSize]++;
        }
    });

    const tbody = document.getElementById('shirt-summary-body');
    const sizeLabels = {
        YS: 'Youth Small',
        YM: 'Youth Medium',
        YL: 'Youth Large',
        YXL: 'Youth X-Large',
        AS: 'Adult Small',
        AM: 'Adult Medium',
        AL: 'Adult Large',
        AXL: 'Adult X-Large',
    };

    tbody.innerHTML = Object.entries(shirtCounts)
        .filter(([size, count]) => count > 0)
        .map(
            ([size, count]) => `
            <tr>
                <td>${sizeLabels[size]} (${size})</td>
                <td><strong>${count}</strong></td>
            </tr>
        `
        )
        .join('');

    if (tbody.innerHTML === '') {
        tbody.innerHTML =
            '<tr><td colspan="2" style="text-align: center;">No approved players</td></tr>';
    }

    // Add total row
    const total = Object.values(shirtCounts).reduce((a, b) => a + b, 0);
    if (total > 0) {
        tbody.innerHTML += `
            <tr style="border-top: 2px solid #333;">
                <td><strong>Total</strong></td>
                <td><strong>${total}</strong></td>
            </tr>
        `;
    }

    document.getElementById('shirt-modal').style.display = 'block';
}

// Export shirt summary
function exportShirtSummary() {
    const approvedPlayers = currentPlayers.filter((p) => p.registrationStatus === 'approved');
    const shirtCounts = {};

    const sizes = ['YS', 'YM', 'YL', 'YXL', 'AS', 'AM', 'AL', 'AXL'];
    sizes.forEach((size) => {
        shirtCounts[size] = 0;
    });

    approvedPlayers.forEach((player) => {
        if (player.shirtSize && shirtCounts.hasOwnProperty(player.shirtSize)) {
            shirtCounts[player.shirtSize]++;
        }
    });

    const csvContent =
        'Size,Count\n' +
        Object.entries(shirtCounts)
            .filter(([size, count]) => count > 0)
            .map(([size, count]) => `${size},${count}`)
            .join('\n') +
        `\nTotal,${Object.values(shirtCounts).reduce((a, b) => a + b, 0)}`;

    downloadCSV(csvContent, 'shirt_summary.csv');
}

// Close modals
function closeModal() {
    document.getElementById('player-modal').style.display = 'none';
    isEditing = false;
    editingPlayerId = null;
}

function closeDeleteModal() {
    document.getElementById('delete-modal').style.display = 'none';
    editingPlayerId = null;
}

function closePaymentModal() {
    document.getElementById('payment-modal').style.display = 'none';
    editingPlayerId = null;
}

function closeShirtModal() {
    document.getElementById('shirt-modal').style.display = 'none';
}

// Export players
function exportPlayers() {
    const csvContent = generatePlayersCSV(filteredPlayers);
    downloadCSV(csvContent, 'practice_players.csv');
}

// Generate CSV content
function generatePlayersCSV(players) {
    const headers = [
        'Player ID',
        'Player Name',
        'Date of Birth',
        'Age',
        'School',
        'Shirt Size',
        'Jersey Name',
        'Team',
        'Parent Name',
        'Parent Email',
        'Parent Phone',
        'Registration Fee',
        'Payment Status',
        'Registration Status',
        'Comments',
        'Waiver Accepted',
        'Registration Date',
    ];

    const rows = players.map((player) => [
        player.playerId,
        player.playerName,
        player.dateOfBirth ? new Date(player.dateOfBirth).toLocaleDateString() : '',
        player.ageAtRegistration || calculateAge(player.dateOfBirth),
        player.jerseyName || player.playerName,
        player.currentSchool,
        player.shirtSize,
        player.chosenTeam,
        player.parentInfo?.name || '',
        player.parentInfo?.email || '',
        player.parentInfo?.phone || '',
        player.registrationFee || 275,
        player.paymentStatus,
        player.registrationStatus,
        player.comments || '',
        player.waiverAccepted ? 'Yes' : 'No',
        player.createdAt ? new Date(player.createdAt).toLocaleDateString() : '',
    ]);

    return [headers, ...rows]
        .map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(','))
        .join('\n');
}

// Utility functions
function calculateAge(birthDate) {
    if (!birthDate) return '';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }

    return age;
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
    }).format(amount);
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
    const table = document.getElementById('players-table-body');
    table.innerHTML =
        '<tr><td colspan="10" style="text-align: center; padding: 2rem;">Loading...</td></tr>';
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

// Make functions globally accessible
window.editPlayer = editPlayer;
window.confirmDeletePlayer = confirmDeletePlayer;
window.updatePaymentStatus = updatePaymentStatus;
window.changePage = changePage;
