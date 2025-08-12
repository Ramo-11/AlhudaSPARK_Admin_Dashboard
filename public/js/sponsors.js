// Sponsors JavaScript - sponsors.js

let currentSponsors = [];
let filteredSponsors = [];
let currentPage = 1;
let itemsPerPage = 10;
let isEditing = false;
let editingSponsorId = null;

document.addEventListener('DOMContentLoaded', function() {
    initSponsorsPage();
});

function initSponsorsPage() {
    loadSponsors();
    setupEventListeners();
    initPaymentModal();
}

// Setup event listeners
function setupEventListeners() {
    // Add sponsor button
    document.getElementById('add-sponsor-btn').addEventListener('click', openAddSponsorModal);
    
    // Modal controls
    document.getElementById('close-modal').addEventListener('click', closeModal);
    document.getElementById('cancel-btn').addEventListener('click', closeModal);
    document.getElementById('close-delete-modal').addEventListener('click', closeDeleteModal);
    document.getElementById('cancel-delete').addEventListener('click', closeDeleteModal);
    document.getElementById('close-benefits-modal').addEventListener('click', closeBenefitsModal);
    document.getElementById('cancel-benefits').addEventListener('click', closeBenefitsModal);
    document.getElementById('close-payment-modal').addEventListener('click', closePaymentModal);
    document.getElementById('cancel-payment').addEventListener('click', closePaymentModal);
    
    // Form submission
    document.getElementById('sponsor-form').addEventListener('submit', handleFormSubmit);
    
    // Delete and benefits confirmation
    document.getElementById('confirm-delete').addEventListener('click', handleDelete);
    document.getElementById('confirm-benefits').addEventListener('click', handleBenefitsUpdate);
    
    // Filters
    document.getElementById('tier-filter').addEventListener('change', applyFilters);
    document.getElementById('payment-filter').addEventListener('change', applyFilters);
    document.getElementById('benefits-filter').addEventListener('change', applyFilters);
    document.getElementById('search-input').addEventListener('input', debounce(applyFilters, 300));
    
    // Export button
    document.getElementById('export-btn').addEventListener('click', exportSponsors);
    
    // Amount input validation
    document.querySelector('input[name="amount"]').addEventListener('input', validateAmount);
    document.querySelector('select[name="tier"]').addEventListener('change', updateMinimumAmount);
    
    // Modal backdrop clicks
    document.getElementById('sponsor-modal').addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });
    
    document.getElementById('delete-modal').addEventListener('click', function(e) {
        if (e.target === this) closeDeleteModal();
    });
    
    document.getElementById('benefits-modal').addEventListener('click', function(e) {
        if (e.target === this) closeBenefitsModal();
    });

    document.getElementById('payment-modal').addEventListener('click', function(e) {
        if (e.target === this) closePaymentModal();
    });
}

// Load sponsors from API
async function loadSponsors() {
    try {
        showLoading();
        const response = await fetch('/api/sponsors');
        const result = await response.json();
        
        if (result.success) {
            currentSponsors = result.data;
            filteredSponsors = [...currentSponsors];
            updateSponsorsTable();
            updatePagination();
            updateTierCounts();
        } else {
            showToast('Failed to load sponsors', 'error');
        }
    } catch (error) {
        console.error('Error loading sponsors:', error);
        showToast('Error loading sponsors', 'error');
    } finally {
        hideLoading();
    }
}

// Update tier counts
function updateTierCounts() {
    const tierCounts = {
        diamond: 0,
        platinum: 0,
        gold: 0,
        silver: 0
    };
    
    currentSponsors.forEach(sponsor => {
        if (sponsor.paymentStatus === 'completed' && sponsor.isActive) {
            tierCounts[sponsor.tier]++;
        }
    });
    
    document.getElementById('diamond-count').textContent = tierCounts.diamond;
    document.getElementById('platinum-count').textContent = tierCounts.platinum;
    document.getElementById('gold-count').textContent = tierCounts.gold;
    document.getElementById('silver-count').textContent = tierCounts.silver;
}

// Update sponsors table
function updateSponsorsTable() {
    const tbody = document.getElementById('sponsors-table-body');
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedSponsors = filteredSponsors.slice(startIndex, endIndex);
    
    if (paginatedSponsors.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 2rem;">
                    No sponsors found
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = paginatedSponsors.map(sponsor => `
        <tr>
            <td>${sponsor.sponsorId}</td>
            <td><strong>${sponsor.companyName}</strong></td>
            <td>${sponsor.contactPerson}</td>
            <td><span class="tier-badge tier-${sponsor.tier}">${formatTier(sponsor.tier)}</span></td>
            <td>${sponsor.amount?.toLocaleString() || '0'}</td>
            <td><span class="status-badge status-${sponsor.paymentStatus}">${sponsor.paymentStatus}</span></td>
            <td>
                <span class="status-badge status-benefits-${sponsor.benefitsSent ? 'sent' : 'pending'}">
                    ${sponsor.benefitsSent ? 'Sent' : 'Pending'}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-small btn-primary" onclick="editSponsor('${sponsor.sponsorId}')">Edit</button>
                    <button class="btn btn-sm btn-warning payment-btn" data-sponsor-id="${sponsor.sponsorId}" data-sponsor-name="${sponsor.companyName}" data-current-status="${sponsor.paymentStatus}">Payment</button>
                    ${!sponsor.benefitsSent && sponsor.paymentStatus === 'completed' ? 
                        `<button class="btn-small btn-secondary" onclick="markBenefitsSent('${sponsor.sponsorId}')">Benefits</button>` : ''}
                    <button class="btn-small btn-danger" onclick="confirmDeleteSponsor('${sponsor.sponsorId}')">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Apply filters
function applyFilters() {
    const tierFilter = document.getElementById('tier-filter').value;
    const paymentFilter = document.getElementById('payment-filter').value;
    const benefitsFilter = document.getElementById('benefits-filter').value;
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    
    filteredSponsors = currentSponsors.filter(sponsor => {
        const matchesTier = !tierFilter || sponsor.tier === tierFilter;
        const matchesPayment = !paymentFilter || sponsor.paymentStatus === paymentFilter;
        const matchesBenefits = !benefitsFilter || 
            (benefitsFilter === 'sent' && sponsor.benefitsSent) ||
            (benefitsFilter === 'pending' && !sponsor.benefitsSent);
        const matchesSearch = !searchTerm || 
            sponsor.companyName.toLowerCase().includes(searchTerm) ||
            sponsor.contactPerson.toLowerCase().includes(searchTerm) ||
            sponsor.email.toLowerCase().includes(searchTerm) ||
            sponsor.sponsorId.toLowerCase().includes(searchTerm);
        
        return matchesTier && matchesPayment && matchesBenefits && matchesSearch;
    });
    
    currentPage = 1;
    updateSponsorsTable();
    updatePagination();
}

// Update pagination
function updatePagination() {
    const totalPages = Math.ceil(filteredSponsors.length / itemsPerPage);
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
    updateSponsorsTable();
    updatePagination();
}

// Open add sponsor modal
function openAddSponsorModal() {
    isEditing = false;
    editingSponsorId = null;
    document.getElementById('modal-title').textContent = 'Add Sponsor';
    document.getElementById('sponsor-form').reset();
    document.getElementById('sponsor-modal').style.display = 'block';
}

// Edit sponsor
function editSponsor(sponsorId) {
    const sponsor = currentSponsors.find(s => s.sponsorId === sponsorId);
    if (!sponsor) return;
    
    isEditing = true;
    editingSponsorId = sponsorId;
    document.getElementById('modal-title').textContent = 'Edit Sponsor';
    
    // Populate form
    const form = document.getElementById('sponsor-form');
    form.companyName.value = sponsor.companyName || '';
    form.contactPerson.value = sponsor.contactPerson || '';
    form.email.value = sponsor.email || '';
    form.phone.value = sponsor.phone || '';
    form.tier.value = sponsor.tier || '';
    form.amount.value = sponsor.amount || '';
    form.website.value = sponsor.website || '';
    form.paymentMethod.value = sponsor.paymentMethod || '';
    form.address.value = sponsor.address || '';
    form.comments.value = sponsor.comments || '';
    
    document.getElementById('sponsor-modal').style.display = 'block';
}

// Update minimum amount based on tier
function updateMinimumAmount() {
    const tierSelect = document.querySelector('select[name="tier"]');
    const amountInput = document.querySelector('input[name="amount"]');
    const selectedTier = tierSelect.value;
    
    const minimumAmounts = {
        'diamond': 10000,
        'platinum': 5000,
        'gold': 2500,
        'silver': 1000
    };
    
    if (selectedTier && minimumAmounts[selectedTier]) {
        amountInput.min = minimumAmounts[selectedTier];
        amountInput.placeholder = `Minimum ${minimumAmounts[selectedTier].toLocaleString()}`;
        
        // If current value is less than minimum, clear it
        if (amountInput.value && parseFloat(amountInput.value) < minimumAmounts[selectedTier]) {
            amountInput.value = '';
        }
    }
}

// Validate amount input
function validateAmount() {
    const amountInput = document.querySelector('input[name="amount"]');
    const tierSelect = document.querySelector('select[name="tier"]');
    const amount = parseFloat(amountInput.value);
    const tier = tierSelect.value;
    
    if (!amount || !tier) return;
    
    const minimumAmounts = {
        'diamond': 10000,
        'platinum': 5000,
        'gold': 2500,
        'silver': 1000
    };
    
    if (amount < minimumAmounts[tier]) {
        amountInput.setCustomValidity(`Amount must be at least ${minimumAmounts[tier].toLocaleString()} for ${formatTier(tier)} tier`);
    } else {
        amountInput.setCustomValidity('');
    }
}

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const sponsorData = Object.fromEntries(formData.entries());
    
    // Convert amount to number
    sponsorData.amount = parseFloat(sponsorData.amount);
    
    try {
        showLoading();
        
        const url = isEditing ? `/api/sponsors/${editingSponsorId}` : '/api/sponsors';
        const method = isEditing ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(sponsorData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast(isEditing ? 'Sponsor updated successfully' : 'Sponsor created successfully', 'success');
            closeModal();
            loadSponsors();
        } else {
            showToast(result.message || 'Failed to save sponsor', 'error');
        }
    } catch (error) {
        console.error('Error saving sponsor:', error);
        showToast('Error saving sponsor', 'error');
    } finally {
        hideLoading();
    }
}

// Payment modal functionality
function initPaymentModal() {
    const modal = document.getElementById('payment-modal');
    const closeBtn = document.getElementById('close-payment-modal');
    const cancelBtn = document.getElementById('cancel-payment');
    const confirmBtn = document.getElementById('confirm-payment');
    
    let currentSponsorId = null;
    
    // Open payment modal
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('payment-btn')) {
            const sponsorId = e.target.dataset.sponsorId;
            const sponsorName = e.target.dataset.sponsorName;
            const currentStatus = e.target.dataset.currentStatus;
            
            currentSponsorId = sponsorId;
            document.getElementById('payment-sponsor-name').textContent = sponsorName;
            document.getElementById('payment-status-select').value = currentStatus;
            document.getElementById('payment-transaction-id').value = '';
            
            modal.style.display = 'block';
        }
    });
    
    // Close modal handlers
    [closeBtn, cancelBtn].forEach(btn => {
        btn.addEventListener('click', () => {
            modal.style.display = 'none';
            currentSponsorId = null;
        });
    });
    
    // Update payment status
    confirmBtn.addEventListener('click', async () => {
        if (!currentSponsorId) return;
        
        const paymentStatus = document.getElementById('payment-status-select').value;
        const transactionId = document.getElementById('payment-transaction-id').value;
        
        try {
            showLoading();
            
            const response = await fetch(`/api/sponsors/${currentSponsorId}/payment`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paymentStatus, transactionId })
            });
            
            const result = await response.json();
            
            if (result.success) {
                modal.style.display = 'none';
                loadSponsors(); // Refresh the table
                showToast('Payment status updated successfully', 'success');
            } else {
                showToast('Failed to update payment status', 'error');
            }
        } catch (error) {
            showToast('Error updating payment status', 'error');
        } finally {
            hideLoading();
        }
        
        currentSponsorId = null;
    });
    
    // Close on outside click
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            currentSponsorId = null;
        }
    });
}

// Mark benefits as sent
function markBenefitsSent(sponsorId) {
    const sponsor = currentSponsors.find(s => s.sponsorId === sponsorId);
    if (!sponsor) return;
    
    editingSponsorId = sponsorId;
    document.getElementById('benefits-sponsor-name').textContent = sponsor.companyName;
    document.getElementById('benefits-notes').value = '';
    document.getElementById('benefits-modal').style.display = 'block';
}

// Handle benefits update
async function handleBenefitsUpdate() {
    const notes = document.getElementById('benefits-notes').value;
    
    try {
        showLoading();
        
        const response = await fetch(`/api/sponsors/${editingSponsorId}/benefits`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                benefitsSent: true,
                notes: notes
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Benefits marked as sent', 'success');
            closeBenefitsModal();
            loadSponsors();
        } else {
            showToast(result.message || 'Failed to update benefits status', 'error');
        }
    } catch (error) {
        console.error('Error updating benefits:', error);
        showToast('Error updating benefits status', 'error');
    } finally {
        hideLoading();
    }
}

// Confirm delete sponsor
function confirmDeleteSponsor(sponsorId) {
    editingSponsorId = sponsorId;
    document.getElementById('delete-modal').style.display = 'block';
}

// Handle delete
async function handleDelete() {
    try {
        showLoading();
        
        const response = await fetch(`/api/sponsors/${editingSponsorId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Sponsor deleted successfully', 'success');
            closeDeleteModal();
            loadSponsors();
        } else {
            showToast(result.message || 'Failed to delete sponsor', 'error');
        }
    } catch (error) {
        console.error('Error deleting sponsor:', error);
        showToast('Error deleting sponsor', 'error');
    } finally {
        hideLoading();
    }
}

// Close modals
function closeModal() {
    document.getElementById('sponsor-modal').style.display = 'none';
    isEditing = false;
    editingSponsorId = null;
}

function closeDeleteModal() {
    document.getElementById('delete-modal').style.display = 'none';
    editingSponsorId = null;
}

function closeBenefitsModal() {
    document.getElementById('benefits-modal').style.display = 'none';
    editingSponsorId = null;
}

function closePaymentModal() {
    document.getElementById('payment-modal').style.display = 'none';
}

// Export sponsors
function exportSponsors() {
    const csvContent = generateSponsorsCSV(filteredSponsors);
    downloadCSV(csvContent, 'sponsors.csv');
}

// Generate CSV content
function generateSponsorsCSV(sponsors) {
    const headers = [
        'Sponsor ID', 'Company Name', 'Contact Person', 'Email', 'Phone',
        'Tier', 'Amount', 'Payment Method', 'Payment Status', 'Benefits Sent',
        'Address', 'Website', 'Comments'
    ];
    
    const rows = sponsors.map(sponsor => [
        sponsor.sponsorId,
        sponsor.companyName,
        sponsor.contactPerson,
        sponsor.email,
        sponsor.phone,
        formatTier(sponsor.tier),
        sponsor.amount,
        sponsor.paymentMethod,
        sponsor.paymentStatus,
        sponsor.benefitsSent ? 'Yes' : 'No',
        sponsor.address,
        sponsor.website,
        sponsor.comments
    ]);
    
    return [headers, ...rows]
        .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
        .join('\n');
}

// Utility functions
function formatTier(tier) {
    return tier ? tier.charAt(0).toUpperCase() + tier.slice(1) : '';
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
    const table = document.getElementById('sponsors-table-body');
    table.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem;">Loading...</td></tr>';
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