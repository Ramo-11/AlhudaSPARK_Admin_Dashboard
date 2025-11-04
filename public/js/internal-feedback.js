let currentFeedback = [];
let filteredFeedback = [];
let currentPage = 1;
let itemsPerPage = 10;
let editingFeedbackId = null;
let sortOption = 'createdAt-desc';
let selectedRoleFilter = 'all';

document.addEventListener('DOMContentLoaded', function () {
    initFeedbackPage();
});

function initFeedbackPage() {
    loadFeedback();
    loadStats();
    setupEventListeners();
}

function setupEventListeners() {
    document.getElementById('close-details-modal').addEventListener('click', closeDetailsModal);
    document.getElementById('close-details-btn').addEventListener('click', closeDetailsModal);
    document.getElementById('close-edit-modal').addEventListener('click', closeEditModal);
    document.getElementById('cancel-edit-btn').addEventListener('click', closeEditModal);
    document.getElementById('close-delete-modal').addEventListener('click', closeDeleteModal);
    document.getElementById('cancel-delete').addEventListener('click', closeDeleteModal);

    document.getElementById('edit-form').addEventListener('submit', handleEditSubmit);
    document.getElementById('confirm-delete').addEventListener('click', handleDelete);

    document.getElementById('search-input').addEventListener('input', debounce(applyFilters, 300));
    document.getElementById('export-btn').addEventListener('click', exportFeedback);
    document.getElementById('role-filter').addEventListener('change', handleRoleFilterChange);
    document.getElementById('feedback-sort').addEventListener('change', handleSortChange);

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

function handleSortChange(e) {
    sortOption = e.target.value;
    applyFilters();
}

function handleRoleFilterChange(e) {
    selectedRoleFilter = e.target.value;
    applyFilters();
}

async function loadFeedback() {
    try {
        showLoading();
        const response = await fetch('/api/internal-feedback');
        const result = await response.json();

        if (result.success) {
            currentFeedback = result.data;
            filteredFeedback = [...currentFeedback];
            applyFilters();
        } else {
            showToast('Failed to load feedback', 'error');
        }
    } catch (error) {
        console.error('Error loading feedback:', error);
        showToast('Error loading feedback', 'error');
    } finally {
        hideLoading();
    }
}

async function loadStats() {
    try {
        const response = await fetch('/api/internal-feedback/stats');
        const result = await response.json();

        if (result.success) {
            const data = result.data;

            document.getElementById('total-feedback').textContent = data.total || 0;
            document.getElementById('overall-avg').textContent = data.overallAvg || '0.0';
            document.getElementById('volunteer-again').textContent = data.volunteerAgainCount || 0;
            document.getElementById('help-plan').textContent = data.helpPlanCount || 0;
            document.getElementById('communication-avg').textContent =
                data.averages.communication || '0.0';
            document.getElementById('execution-avg').textContent = data.averages.execution || '0.0';
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

function updateFeedbackTable() {
    const tbody = document.getElementById('feedback-table-body');
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedFeedback = filteredFeedback.slice(startIndex, endIndex);

    if (paginatedFeedback.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 2rem;">
                    No feedback found
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = paginatedFeedback
        .map(
            (fb) => `
        <tr>
            <td>${new Date(fb.createdAt).toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
                hour12: true,
            })}</td>
            <td>${fb.name || 'Anonymous'}</td>
            <td>${fb.email || 'N/A'}</td>
            <td>${formatRoles(fb.roles, fb.otherRole)}</td>
            <td>
                <span style="font-size: 1.1rem;">
                    ${'⭐'.repeat(fb.ratings.overall || 0)}
                </span>
            </td>
            <td><strong>${fb.averageRating}</strong> / 5</td>
            <td>${fb.volunteerAgain ? '✅ Yes' : '❌ No'}</td>
            <td>
                <span class="status-badge ${fb.isActive ? 'status-approved' : 'status-pending'}">
                    ${fb.isActive ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-small btn-info" onclick="viewDetails('${
                        fb.feedbackId
                    }')">View</button>
                    <button class="btn-small btn-primary" onclick="editFeedback('${
                        fb.feedbackId
                    }')">Edit</button>
                    <button class="btn-small btn-danger" onclick="confirmDelete('${
                        fb.feedbackId
                    }')">Delete</button>
                </div>
            </td>
        </tr>
    `
        )
        .join('');
}

function formatRoles(roles, otherRole) {
    const roleLabels = {
        tournament: 'Tournament',
        bazaar: 'Bazaar',
        quran: 'Quran',
        registration: 'Registration',
        food: 'Food',
        volunteer: 'Volunteer',
        setup: 'Setup',
        communications: 'Comms',
        website: 'Website',
        other: 'Other',
    };

    let rolesText = roles.map((r) => roleLabels[r] || r).join(', ');
    if (otherRole) rolesText += ` (${otherRole})`;
    return rolesText;
}

function viewDetails(feedbackId) {
    const fb = currentFeedback.find((f) => f.feedbackId === feedbackId);
    if (!fb) return;

    const roleLabels = {
        tournament: 'Tournament Team',
        bazaar: 'Bazaar Team',
        quran: 'Quran Competition Team',
        registration: 'Registration/Check-in',
        food: 'Food Services',
        volunteer: 'Volunteer Coordinator',
        setup: 'Setup/Facilities',
        communications: 'Communications',
        website: 'Website/Technology',
        other: 'Other',
    };

    const ratingLabels = {
        responsibilities: 'Clarity of Responsibilities',
        communication: 'Team Communication',
        execution: 'Event Day Execution',
        problemHandling: 'Problem Handling',
        resources: 'Resources/Supplies',
        website: 'Website Effectiveness',
        coordination: 'Team Coordination',
        overall: 'Overall Satisfaction',
    };

    const rolesText =
        fb.roles.map((r) => roleLabels[r] || r).join(', ') +
        (fb.otherRole ? ` (${fb.otherRole})` : '');

    const ratingsRows = Object.keys(ratingLabels)
        .filter((key) => fb.ratings[key] !== undefined)
        .map(
            (key) => `
        <div style="display: flex; justify-content: space-between; padding: 0.75rem; background: #f8f9fa; border-radius: 6px; margin-bottom: 0.5rem;">
            <strong>${ratingLabels[key]}:</strong>
            <span style="font-size: 1.1rem;">
                ${'⭐'.repeat(fb.ratings[key])} (${fb.ratings[key]}/5)
            </span>
        </div>
    `
        )
        .join('');

    const detailsHTML = `
        <div style="display: grid; gap: 1.5rem;">
            <div>
                <h3 style="margin-bottom: 1rem; color: #333;">Contact Information</h3>
                ${
                    fb.name
                        ? `<p><strong>Name:</strong> ${fb.name}</p>`
                        : '<p><strong>Name:</strong> Anonymous</p>'
                }
                ${
                    fb.email
                        ? `<p><strong>Email:</strong> ${fb.email}</p>`
                        : '<p><strong>Email:</strong> N/A</p>'
                }
                <p><strong>Role(s):</strong> ${rolesText}</p>
            </div>

            ${
                ratingsRows
                    ? `
            <div>
                <h3 style="margin-bottom: 1rem; color: #333;">Ratings</h3>
                <p style="margin-bottom: 1rem;"><strong>Average Rating:</strong> ${fb.averageRating} / 5</p>
                ${ratingsRows}
            </div>
            `
                    : ''
            }

            ${
                fb.wentWell
                    ? `
            <div>
                <h3 style="margin-bottom: 1rem; color: #333;">What Went Well</h3>
                <p style="white-space: pre-wrap; background: #f8f9fa; padding: 1rem; border-radius: 6px;">${fb.wentWell}</p>
            </div>
            `
                    : ''
            }

            ${
                fb.wentPoorly
                    ? `
            <div>
                <h3 style="margin-bottom: 1rem; color: #333;">What Didn't Go Well</h3>
                <p style="white-space: pre-wrap; background: #f8f9fa; padding: 1rem; border-radius: 6px;">${fb.wentPoorly}</p>
            </div>
            `
                    : ''
            }

            ${
                fb.improvements
                    ? `
            <div>
                <h3 style="margin-bottom: 1rem; color: #333;">Suggested Improvements</h3>
                <p style="white-space: pre-wrap; background: #f8f9fa; padding: 1rem; border-radius: 6px;">${fb.improvements}</p>
            </div>
            `
                    : ''
            }

            ${
                fb.otherComments
                    ? `
            <div>
                <h3 style="margin-bottom: 1rem; color: #333;">Other Comments</h3>
                <p style="white-space: pre-wrap; background: #f8f9fa; padding: 1rem; border-radius: 6px;">${fb.otherComments}</p>
            </div>
            `
                    : ''
            }

            <div>
                <h3 style="margin-bottom: 1rem; color: #333;">Future Involvement</h3>
                <p><strong>Will volunteer again:</strong> ${
                    fb.volunteerAgain ? '✅ Yes' : '❌ No'
                }</p>
                <p><strong>Will help plan next year:</strong> ${
                    fb.helpPlan ? '✅ Yes' : '❌ No'
                }</p>
            </div>

            <div>
                <h3 style="margin-bottom: 1rem; color: #333;">Submission Info</h3>
                <p><strong>Submitted:</strong> ${new Date(fb.createdAt).toLocaleString()}</p>
            </div>

            ${
                fb.notes
                    ? `
            <div>
                <h3 style="margin-bottom: 1rem; color: #333;">Admin Notes</h3>
                <p style="white-space: pre-wrap;">${fb.notes}</p>
            </div>
            `
                    : ''
            }
        </div>
    `;

    document.getElementById('details-content').innerHTML = detailsHTML;
    document.getElementById('details-modal').style.display = 'block';
}

function editFeedback(feedbackId) {
    const fb = currentFeedback.find((f) => f.feedbackId === feedbackId);
    if (!fb) return;

    editingFeedbackId = feedbackId;
    document.getElementById('edit-notes').value = fb.notes || '';
    document.getElementById('edit-is-active').checked = fb.isActive;
    document.getElementById('edit-modal').style.display = 'block';
}

async function handleEditSubmit(e) {
    e.preventDefault();

    const notes = document.getElementById('edit-notes').value;
    const isActive = document.getElementById('edit-is-active').checked;

    try {
        showLoading();

        const response = await fetch(`/api/internal-feedback/${editingFeedbackId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ notes, isActive }),
        });

        const result = await response.json();

        if (result.success) {
            showToast('Feedback updated successfully', 'success');
            closeEditModal();
            loadFeedback();
            loadStats();
        } else {
            showToast(result.message || 'Failed to update feedback', 'error');
        }
    } catch (error) {
        console.error('Error updating feedback:', error);
        showToast('Error updating feedback', 'error');
    } finally {
        hideLoading();
    }
}

function confirmDelete(feedbackId) {
    editingFeedbackId = feedbackId;
    document.getElementById('delete-modal').style.display = 'block';
}

async function handleDelete() {
    try {
        showLoading();

        const response = await fetch(`/api/internal-feedback/${editingFeedbackId}`, {
            method: 'DELETE',
        });

        const result = await response.json();

        if (result.success) {
            showToast('Feedback deleted successfully', 'success');
            closeDeleteModal();
            loadFeedback();
            loadStats();
        } else {
            showToast(result.message || 'Failed to delete feedback', 'error');
        }
    } catch (error) {
        console.error('Error deleting feedback:', error);
        showToast('Error deleting feedback', 'error');
    } finally {
        hideLoading();
    }
}

function applyFilters() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();

    filteredFeedback = currentFeedback.filter((fb) => {
        const matchesSearch =
            !searchTerm ||
            (fb.name && fb.name.toLowerCase().includes(searchTerm)) ||
            (fb.email && fb.email.toLowerCase().includes(searchTerm)) ||
            fb.feedbackId.toLowerCase().includes(searchTerm) ||
            (fb.wentWell && fb.wentWell.toLowerCase().includes(searchTerm)) ||
            (fb.improvements && fb.improvements.toLowerCase().includes(searchTerm));

        const matchesRole = selectedRoleFilter === 'all' || fb.roles.includes(selectedRoleFilter);

        return matchesSearch && matchesRole;
    });

    sortFeedback();

    currentPage = 1;
    updateFeedbackTable();
    updatePagination();
}

function sortFeedback() {
    const [field, direction] = sortOption.split('-');

    filteredFeedback.sort((a, b) => {
        let aVal, bVal;

        switch (field) {
            case 'createdAt':
                aVal = new Date(a.createdAt);
                bVal = new Date(b.createdAt);
                break;
            case 'name':
                aVal = (a.name || 'Anonymous').toLowerCase();
                bVal = (b.name || 'Anonymous').toLowerCase();
                break;
            case 'overall':
                aVal = a.ratings.overall || 0;
                bVal = b.ratings.overall || 0;
                break;
            case 'average':
                aVal = parseFloat(a.averageRating);
                bVal = parseFloat(b.averageRating);
                break;
            default:
                return 0;
        }

        if (aVal instanceof Date && bVal instanceof Date) {
            return direction === 'asc' ? aVal - bVal : bVal - aVal;
        } else if (typeof aVal === 'number' && typeof bVal === 'number') {
            return direction === 'asc' ? aVal - bVal : bVal - aVal;
        } else {
            aVal = String(aVal || '').toLowerCase();
            bVal = String(bVal || '').toLowerCase();
            if (direction === 'asc') {
                return aVal.localeCompare(bVal);
            } else {
                return bVal.localeCompare(aVal);
            }
        }
    });
}

function updatePagination() {
    const totalPages = Math.ceil(filteredFeedback.length / itemsPerPage);
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

function changePage(page) {
    currentPage = page;
    updateFeedbackTable();
    updatePagination();
}

function exportFeedback() {
    const csvContent = generateCSV(filteredFeedback);
    downloadCSV(csvContent, 'internal-team-feedback.csv');
}

function generateCSV(feedbackList) {
    const headers = [
        'Feedback ID',
        'Submission Date',
        'Name',
        'Email',
        'Roles',
        'Other Role',
        'Responsibilities',
        'Communication',
        'Execution',
        'Problem Handling',
        'Resources',
        'Website',
        'Coordination',
        'Overall',
        'Average',
        'Went Well',
        'Went Poorly',
        'Improvements',
        'Other Comments',
        'Volunteer Again',
        'Help Plan',
        'Status',
        'Admin Notes',
    ];

    const rows = feedbackList.map((fb) => {
        return [
            fb.feedbackId,
            new Date(fb.createdAt).toLocaleString(),
            fb.name || '',
            fb.email || '',
            fb.roles.join('; '),
            fb.otherRole || '',
            fb.ratings.responsibilities || '',
            fb.ratings.communication || '',
            fb.ratings.execution || '',
            fb.ratings.problemHandling || '',
            fb.ratings.resources || '',
            fb.ratings.website || '',
            fb.ratings.coordination || '',
            fb.ratings.overall || '',
            fb.averageRating,
            fb.wentWell || '',
            fb.wentPoorly || '',
            fb.improvements || '',
            fb.otherComments || '',
            fb.volunteerAgain ? 'Yes' : 'No',
            fb.helpPlan ? 'Yes' : 'No',
            fb.isActive ? 'Active' : 'Inactive',
            fb.notes || '',
        ];
    });

    return [headers, ...rows]
        .map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(','))
        .join('\n');
}

function closeDetailsModal() {
    document.getElementById('details-modal').style.display = 'none';
}

function closeEditModal() {
    document.getElementById('edit-modal').style.display = 'none';
    editingFeedbackId = null;
}

function closeDeleteModal() {
    document.getElementById('delete-modal').style.display = 'none';
    editingFeedbackId = null;
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
    const table = document.getElementById('feedback-table-body');
    table.innerHTML =
        '<tr><td colspan="9" style="text-align: center; padding: 2rem;">Loading...</td></tr>';
}

function hideLoading() {}

function showToast(message, type) {
    if (window.dashboardUtils && window.dashboardUtils.showToast) {
        window.dashboardUtils.showToast(message, type);
    } else {
        alert(message);
    }
}
