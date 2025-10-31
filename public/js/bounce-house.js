// Bounce House JavaScript - bounce-house.js

let currentRegistrations = [];
let filteredRegistrations = [];
let currentPage = 1;
let itemsPerPage = 10;
let editingRegistrationId = null;

document.addEventListener('DOMContentLoaded', function () {
    initBounceHousePage();
});

function initBounceHousePage() {
    loadRegistrations();
    loadStats();
    setupEventListeners();
}

// Setup event listeners
function setupEventListeners() {
    // Modal controls
    document.getElementById('close-details-modal').addEventListener('click', closeDetailsModal);
    document.getElementById('close-details-btn').addEventListener('click', closeDetailsModal);
    document.getElementById('close-edit-modal').addEventListener('click', closeEditModal);
    document.getElementById('cancel-edit-btn').addEventListener('click', closeEditModal);
    document.getElementById('close-delete-modal').addEventListener('click', closeDeleteModal);
    document.getElementById('cancel-delete').addEventListener('click', closeDeleteModal);

    // Form submissions
    document.getElementById('edit-form').addEventListener('submit', handleEditSubmit);
    document.getElementById('confirm-delete').addEventListener('click', handleDelete);

    // Filters
    document.getElementById('status-filter').addEventListener('change', applyFilters);
    document.getElementById('search-input').addEventListener('input', debounce(applyFilters, 300));

    // Export button
    document.getElementById('export-btn').addEventListener('click', exportRegistrations);

    // Modal backdrop clicks
    document.getElementById('details-modal').addEventListener('click', function (e) {
        if (e.target === this) closeDetailsModal();
    });

    document.getElementById('edit-modal').addEventListener('click', function (e) {
        if (e.target === this) closeEditModal();
    });

    document.getElementById('delete-modal').addEventListener('click', function (e) {
        if (e.target === this) closeDeleteModal();
    });
}

// Load registrations from API
async function loadRegistrations() {
    try {
        showLoading();
        const response = await fetch('/api/bounce-house');
        const result = await response.json();

        if (result.success) {
            currentRegistrations = result.data;
            filteredRegistrations = [...currentRegistrations];
            updateRegistrationsTable();
            updatePagination();
        } else {
            showToast('Failed to load registrations', 'error');
        }
    } catch (error) {
        console.error('Error loading registrations:', error);
        showToast('Error loading registrations', 'error');
    } finally {
        hideLoading();
    }
}

// Load statistics
async function loadStats() {
    try {
        const response = await fetch('/api/bounce-house/stats');
        const result = await response.json();

        if (result.success) {
            document.getElementById('total-registrations').textContent = result.data.total || 0;
            document.getElementById('total-children').textContent = result.data.totalChildren || 0;
            document.getElementById('male-children').textContent = result.data.maleCount || 0;
            document.getElementById('female-children').textContent = result.data.femaleCount || 0;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Update registrations table
function updateRegistrationsTable() {
    const tbody = document.getElementById('registrations-table-body');
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedRegistrations = filteredRegistrations.slice(startIndex, endIndex);

    if (paginatedRegistrations.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 2rem;">
                    No registrations found
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = paginatedRegistrations
        .map(
            (reg) => `
        <tr>
            <td>${new Date(reg.createdAt).toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
                hour12: true,
            })}</td>
            <td><strong>${reg.registrationId}</strong></td>
            <td>${reg.parentName}</td>
            <td>${reg.parentEmail}</td>
            <td>${reg.parentPhone}</td>
            <td>
                <span class="status-badge players-badge">
                    ${reg.children.length} ${reg.children.length === 1 ? 'child' : 'children'}
                </span>
            </td>
            <td>${formatSignatureType(reg.signatureType)}</td>
            <td>
                <span class="status-badge ${reg.isActive ? 'status-approved' : 'status-pending'}">
                    ${reg.isActive ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-small btn-info" onclick="viewDetails('${
                        reg.registrationId
                    }')">View</button>
                    <button class="btn-small btn-primary" onclick="editRegistration('${
                        reg.registrationId
                    }')">Edit</button>
                    <button class="btn-small btn-danger" onclick="confirmDelete('${
                        reg.registrationId
                    }')">Delete</button>
                </div>
            </td>
        </tr>
    `
        )
        .join('');
}

// View registration details
function viewDetails(registrationId) {
    const reg = currentRegistrations.find((r) => r.registrationId === registrationId);
    if (!reg) return;

    const childrenHTML = reg.children
        .map(
            (child, index) => `
        <div style="padding: 1rem; background: #f8f9fa; border-radius: 8px; margin-bottom: 0.5rem;">
            <strong>Child ${index + 1}:</strong> ${child.name} - 
            ${child.age} years old - 
            ${child.gender.charAt(0).toUpperCase() + child.gender.slice(1)}
        </div>
    `
        )
        .join('');

    const detailsHTML = `
        <div style="display: grid; gap: 1.5rem;">
            <div>
                <h3 style="margin-bottom: 1rem; color: #333;">Parent Information</h3>
                <div style="display: grid; gap: 0.5rem;">
                    <p><strong>Name:</strong> ${reg.parentName}</p>
                    <p><strong>Email:</strong> ${reg.parentEmail}</p>
                    <p><strong>Phone:</strong> ${reg.parentPhone}</p>
                </div>
            </div>

            <div>
                <h3 style="margin-bottom: 1rem; color: #333;">Children (${reg.children.length})</h3>
                ${childrenHTML}
            </div>

            <div>
                <h3 style="margin-bottom: 1rem; color: #333;">Signature</h3>
                <div style="border: 2px solid #ddd; border-radius: 8px; padding: 1rem; background: white;">
                    ${
                        reg.signatureType === 'draw'
                            ? `<img src="${reg.signature}" alt="Signature" style="max-width: 100%; height: auto; max-height: 150px;" />`
                            : `<p style="font-family: 'Brush Script MT', cursive; font-size: 2rem; margin: 0;">${reg.signature}</p>`
                    }
                </div>
                <p style="margin-top: 0.5rem; color: #666; font-size: 0.9rem;">
                    Type: ${formatSignatureType(reg.signatureType)}
                </p>
            </div>

            <div>
                <h3 style="margin-bottom: 1rem; color: #333;">Waiver Information</h3>
                <p><strong>Terms Accepted:</strong> ${reg.acceptedTerms ? 'Yes' : 'No'}</p>
                <p><strong>Accepted Date:</strong> ${new Date(
                    reg.acceptedTermsDate
                ).toLocaleString()}</p>
                <p><strong>Registration Date:</strong> ${new Date(
                    reg.createdAt
                ).toLocaleString()}</p>
            </div>

            ${
                reg.notes
                    ? `
                <div>
                    <h3 style="margin-bottom: 1rem; color: #333;">Admin Notes</h3>
                    <p style="white-space: pre-wrap;">${reg.notes}</p>
                </div>
            `
                    : ''
            }
        </div>
    `;

    document.getElementById('details-content').innerHTML = detailsHTML;
    document.getElementById('details-modal').style.display = 'block';
}

// Edit registration
function editRegistration(registrationId) {
    const reg = currentRegistrations.find((r) => r.registrationId === registrationId);
    if (!reg) return;

    editingRegistrationId = registrationId;
    document.getElementById('edit-notes').value = reg.notes || '';
    document.getElementById('edit-is-active').checked = reg.isActive;
    document.getElementById('edit-modal').style.display = 'block';
}

// Handle edit form submission
async function handleEditSubmit(e) {
    e.preventDefault();

    const notes = document.getElementById('edit-notes').value;
    const isActive = document.getElementById('edit-is-active').checked;

    try {
        showLoading();

        const response = await fetch(`/api/bounce-house/${editingRegistrationId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ notes, isActive }),
        });

        const result = await response.json();

        if (result.success) {
            showToast('Registration updated successfully', 'success');
            closeEditModal();
            loadRegistrations();
            loadStats();
        } else {
            showToast(result.message || 'Failed to update registration', 'error');
        }
    } catch (error) {
        console.error('Error updating registration:', error);
        showToast('Error updating registration', 'error');
    } finally {
        hideLoading();
    }
}

// Confirm delete
function confirmDelete(registrationId) {
    editingRegistrationId = registrationId;
    document.getElementById('delete-modal').style.display = 'block';
}

// Handle delete
async function handleDelete() {
    try {
        showLoading();

        const response = await fetch(`/api/bounce-house/${editingRegistrationId}`, {
            method: 'DELETE',
        });

        const result = await response.json();

        if (result.success) {
            showToast('Registration deleted successfully', 'success');
            closeDeleteModal();
            loadRegistrations();
            loadStats();
        } else {
            showToast(result.message || 'Failed to delete registration', 'error');
        }
    } catch (error) {
        console.error('Error deleting registration:', error);
        showToast('Error deleting registration', 'error');
    } finally {
        hideLoading();
    }
}

// Apply filters
function applyFilters() {
    const statusFilter = document.getElementById('status-filter').value;
    const searchTerm = document.getElementById('search-input').value.toLowerCase();

    filteredRegistrations = currentRegistrations.filter((reg) => {
        const matchesStatus =
            !statusFilter ||
            (statusFilter === 'active' && reg.isActive) ||
            (statusFilter === 'inactive' && !reg.isActive);

        const matchesSearch =
            !searchTerm ||
            reg.parentName.toLowerCase().includes(searchTerm) ||
            reg.parentEmail.toLowerCase().includes(searchTerm) ||
            reg.registrationId.toLowerCase().includes(searchTerm) ||
            reg.parentPhone.includes(searchTerm) ||
            reg.children.some((child) => child.name.toLowerCase().includes(searchTerm));

        return matchesStatus && matchesSearch;
    });

    currentPage = 1;
    updateRegistrationsTable();
    updatePagination();
}

// Update pagination
function updatePagination() {
    const totalPages = Math.ceil(filteredRegistrations.length / itemsPerPage);
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
    updateRegistrationsTable();
    updatePagination();
}

// Export registrations
function exportRegistrations() {
    const csvContent = generateCSV(filteredRegistrations);
    downloadCSV(csvContent, 'bounce-house-registrations.csv');
}

// Generate CSV content
function generateCSV(registrations) {
    const headers = [
        'Registration ID',
        'Registration Date',
        'Parent Name',
        'Email',
        'Phone',
        'Number of Children',
        'Child 1 Name',
        'Child 1 Age',
        'Child 1 Gender',
        'Child 2 Name',
        'Child 2 Age',
        'Child 2 Gender',
        'Child 3 Name',
        'Child 3 Age',
        'Child 3 Gender',
        'Child 4 Name',
        'Child 4 Age',
        'Child 4 Gender',
        'Child 5 Name',
        'Child 5 Age',
        'Child 5 Gender',
        'Signature Type',
        'Terms Accepted',
        'Accepted Date',
        'Status',
        'Admin Notes',
    ];

    const rows = registrations.map((reg) => {
        const row = [
            reg.registrationId,
            new Date(reg.createdAt).toLocaleString(),
            reg.parentName,
            reg.parentEmail,
            reg.parentPhone,
            reg.children.length,
        ];

        // Add children data (up to 5 children)
        for (let i = 0; i < 5; i++) {
            if (reg.children[i]) {
                row.push(reg.children[i].name, reg.children[i].age, reg.children[i].gender);
            } else {
                row.push('', '', '');
            }
        }

        row.push(
            formatSignatureType(reg.signatureType),
            reg.acceptedTerms ? 'Yes' : 'No',
            new Date(reg.acceptedTermsDate).toLocaleString(),
            reg.isActive ? 'Active' : 'Inactive',
            reg.notes || ''
        );

        return row;
    });

    return [headers, ...rows]
        .map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(','))
        .join('\n');
}

// Close modals
function closeDetailsModal() {
    document.getElementById('details-modal').style.display = 'none';
}

function closeEditModal() {
    document.getElementById('edit-modal').style.display = 'none';
    editingRegistrationId = null;
}

function closeDeleteModal() {
    document.getElementById('delete-modal').style.display = 'none';
    editingRegistrationId = null;
}

// Utility functions
function formatSignatureType(type) {
    return type === 'draw' ? 'Drawn' : 'Typed';
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
    const table = document.getElementById('registrations-table-body');
    table.innerHTML =
        '<tr><td colspan="9" style="text-align: center; padding: 2rem;">Loading...</td></tr>';
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
