// Food Vendors JavaScript - foodVendors.js

let currentFoodVendors = [];
let filteredFoodVendors = [];
let currentPage = 1;
let itemsPerPage = 10;
let isEditing = false;
let editingVendorId = null;

document.addEventListener('DOMContentLoaded', function() {
    initFoodVendorsPage();
});

function initFoodVendorsPage() {
    loadFoodVendors();
    setupEventListeners();
}

// Setup event listeners
function setupEventListeners() {
    // Modal controls
    document.getElementById('close-modal').addEventListener('click', closeModal);
    document.getElementById('cancel-btn').addEventListener('click', closeModal);
    document.getElementById('close-delete-modal').addEventListener('click', closeDeleteModal);
    document.getElementById('cancel-delete').addEventListener('click', closeDeleteModal);

    // Payment modal controls
    document.getElementById('close-payment-modal').addEventListener('click', closePaymentModal);
    document.getElementById('cancel-payment-btn').addEventListener('click', closePaymentModal);
    document.getElementById('payment-form').addEventListener('submit', handlePaymentStatusUpdate);

    document.getElementById('payment-modal').addEventListener('click', function(e) {
        if (e.target === this) closePaymentModal();
    });

    // Form submission
    document.getElementById('food-vendor-form').addEventListener('submit', handleFormSubmit);
    
    // Delete confirmation
    document.getElementById('confirm-delete').addEventListener('click', handleDelete);
    
    // Filters
    document.getElementById('payment-filter').addEventListener('change', applyFilters);
    document.getElementById('search-input').addEventListener('input', debounce(applyFilters, 300));
    
    // Export button
    document.getElementById('export-btn').addEventListener('click', exportFoodVendors);
    
    // Modal backdrop click
    document.getElementById('food-vendor-modal').addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });
    
    document.getElementById('delete-modal').addEventListener('click', function(e) {
        if (e.target === this) closeDeleteModal();
    });
}

// Load food vendors from API
async function loadFoodVendors() {
    try {
        showLoading();
        const response = await fetch('/api/food-vendors');
        const result = await response.json();
        
        if (result.success) {
            currentFoodVendors = result.data;
            filteredFoodVendors = [...currentFoodVendors];
            updateFoodVendorsTable();
            updatePagination();
        } else {
            showToast('Failed to load food vendors', 'error');
        }
    } catch (error) {
        console.error('Error loading food vendors:', error);
        showToast('Error loading food vendors', 'error');
    } finally {
        hideLoading();
    }
}

function updateFoodVendorsTable() {
    const tbody = document.getElementById('food-vendors-table-body');
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedVendors = filteredFoodVendors.slice(startIndex, endIndex);
    
    if (paginatedVendors.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 2rem;">
                    No food vendors found
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = paginatedVendors.map(vendor => `
        <tr>
            <td>${vendor.vendorId}</td>
            <td><strong>${vendor.businessName}</strong></td>
            <td>${vendor.contactPerson}</td>
            <td>${vendor.email}</td>
            <td style="font-size: 0.85rem; max-width: 200px;">
                ${vendor.menuDescription ? 
                    (vendor.menuDescription.length > 60 ? 
                        vendor.menuDescription.substring(0, 60) + '...' : 
                        vendor.menuDescription) : 
                    'N/A'}
            </td>
            <td>${vendor.paymentMethod ? vendor.paymentMethod.toUpperCase() : 'N/A'}</td>
            <td>$${vendor.vendorFee?.toLocaleString() || '3,000'}</td>
            <td><span class="status-badge status-${vendor.paymentStatus}">${vendor.paymentStatus}</span></td>
            <td>
                <div class="action-buttons">
                    ${vendor.paymentMethod === 'zelle' && vendor.zelleReceipt ? 
                        `<button class="btn-small btn-info" onclick="viewReceipt('${vendor.zelleReceipt}', '${vendor.businessName}')">Receipt</button>` : 
                        ''}
                    <button class="btn-small btn-primary" onclick="editFoodVendor('${vendor.vendorId}')">Edit</button>
                    <button class="btn-small btn-info" onclick="updatePaymentStatus('${vendor.vendorId}')">Payment</button>
                    <button class="btn-small btn-danger" onclick="confirmDeleteFoodVendor('${vendor.vendorId}')">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Update payment status
function updatePaymentStatus(vendorId) {
    const vendor = currentFoodVendors.find(v => v.vendorId === vendorId);
    if (!vendor) return;
    
    editingVendorId = vendorId;
    document.getElementById('current-payment-status').textContent = vendor.paymentStatus;
    document.getElementById('payment-status-select').value = vendor.paymentStatus;
    document.getElementById('payment-modal').style.display = 'block';
}

// Apply filters
function applyFilters() {
    const paymentFilter = document.getElementById('payment-filter').value;
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    
    filteredFoodVendors = currentFoodVendors.filter(vendor => {
        const matchesPayment = !paymentFilter || vendor.paymentStatus === paymentFilter;
        const matchesSearch = !searchTerm || 
            vendor.businessName.toLowerCase().includes(searchTerm) ||
            vendor.contactPerson.toLowerCase().includes(searchTerm) ||
            vendor.email.toLowerCase().includes(searchTerm) ||
            vendor.vendorId.toLowerCase().includes(searchTerm) ||
            (vendor.menuDescription && vendor.menuDescription.toLowerCase().includes(searchTerm));
        
        return matchesPayment && matchesSearch;
    });
    
    currentPage = 1; // Reset to first page
    updateFoodVendorsTable();
    updatePagination();
}

// Update pagination
function updatePagination() {
    const totalPages = Math.ceil(filteredFoodVendors.length / itemsPerPage);
    const paginationContainer = document.getElementById('pagination');
    
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // Previous button
    if (currentPage > 1) {
        paginationHTML += `<button class="pagination-btn" onclick="changePage(${currentPage - 1})">Previous</button>`;
    }
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === currentPage) {
            paginationHTML += `<button class="pagination-btn active">${i}</button>`;
        } else if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            paginationHTML += `<button class="pagination-btn" onclick="changePage(${i})">${i}</button>`;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            paginationHTML += `<span class="pagination-ellipsis">...</span>`;
        }
    }
    
    // Next button
    if (currentPage < totalPages) {
        paginationHTML += `<button class="pagination-btn" onclick="changePage(${currentPage + 1})">Next</button>`;
    }
    
    paginationContainer.innerHTML = paginationHTML;
}

// Change page
function changePage(page) {
    currentPage = page;
    updateFoodVendorsTable();
    updatePagination();
}

// Edit food vendor
function editFoodVendor(vendorId) {
    const vendor = currentFoodVendors.find(v => v.vendorId === vendorId);
    if (!vendor) return;
    
    isEditing = true;
    editingVendorId = vendorId;
    document.getElementById('modal-title').textContent = 'Edit Food Vendor';
    
    // Populate form
    const form = document.getElementById('food-vendor-form');
    form.businessName.value = vendor.businessName || '';
    form.contactPerson.value = vendor.contactPerson || '';
    form.email.value = vendor.email || '';
    form.phone.value = vendor.phone || '';
    form.address.value = vendor.address || '';
    form.website.value = vendor.website || '';
    form.menuDescription.value = vendor.menuDescription || '';
    form.specialRequirements.value = vendor.specialRequirements || '';
    form.comments.value = vendor.comments || '';
    
    document.getElementById('food-vendor-modal').style.display = 'block';
}

// Handle payment status update
async function handlePaymentStatusUpdate(e) {
    e.preventDefault();
    
    const newStatus = document.getElementById('payment-status-select').value;
    const transactionId = document.getElementById('transaction-id').value;
    
    try {
        showLoading();
        
        const response = await fetch(`/api/food-vendors/${editingVendorId}/payment`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                paymentStatus: newStatus,
                transactionId: transactionId || null
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Payment status updated successfully', 'success');
            closePaymentModal();
            loadFoodVendors();
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

function closePaymentModal() {
    document.getElementById('payment-modal').style.display = 'none';
    editingVendorId = null;
    document.getElementById('payment-form').reset();
}

// View receipt in modal
function viewReceipt(receiptUrl, businessName) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>${businessName} - Zelle Receipt</h2>
                <button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="modal-body" style="text-align: center;">
                <img src="${receiptUrl}" alt="${businessName} Receipt" style="max-width: 100%; height: auto; border-radius: 8px;">
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    modal.addEventListener('click', function(e) {
        if (e.target === this) this.remove();
    });
}

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const vendorData = Object.fromEntries(formData.entries());
    
    // Fixed vendor fee
    vendorData.vendorFee = 3000;
    
    try {
        showLoading();
        
        // Only update, never create
        const response = await fetch(`/api/food-vendors/${editingVendorId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(vendorData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Food vendor updated successfully', 'success');
            closeModal();
            loadFoodVendors();
        } else {
            showToast(result.message || 'Failed to update food vendor', 'error');
        }
    } catch (error) {
        console.error('Error saving food vendor:', error);
        showToast('Error saving food vendor', 'error');
    } finally {
        hideLoading();
    }
}

// Confirm delete food vendor
function confirmDeleteFoodVendor(vendorId) {
    editingVendorId = vendorId;
    document.getElementById('delete-modal').style.display = 'block';
}

// Handle delete
async function handleDelete() {
    try {
        showLoading();
        
        const response = await fetch(`/api/food-vendors/${editingVendorId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Food vendor deleted successfully', 'success');
            closeDeleteModal();
            loadFoodVendors();
        } else {
            showToast(result.message || 'Failed to delete food vendor', 'error');
        }
    } catch (error) {
        console.error('Error deleting food vendor:', error);
        showToast('Error deleting food vendor', 'error');
    } finally {
        hideLoading();
    }
}

// Close modal
function closeModal() {
    document.getElementById('food-vendor-modal').style.display = 'none';
    isEditing = false;
    editingVendorId = null;
}

// Close delete modal
function closeDeleteModal() {
    document.getElementById('delete-modal').style.display = 'none';
    editingVendorId = null;
}

// Export food vendors
function exportFoodVendors() {
    const csvContent = generateFoodVendorsCSV(filteredFoodVendors);
    downloadCSV(csvContent, 'food-vendors.csv');
}

// Generate CSV content
function generateFoodVendorsCSV(vendors) {
    const headers = [
        'Vendor ID', 'Business Name', 'Contact Person', 'Email', 'Phone', 
        'Menu Description', 'Vendor Fee', 
        'Payment Status', 'Address', 'Website', 
        'Special Requirements', 'Transaction ID', 'Payment Date'
    ];
    
    const rows = vendors.map(vendor => [
        vendor.vendorId,
        vendor.businessName,
        vendor.contactPerson,
        vendor.email,
        vendor.phone,
        vendor.menuDescription || '',
        vendor.vendorFee || 3000,
        vendor.paymentStatus,
        vendor.address || '',
        vendor.website || '',
        vendor.specialRequirements || '',
        vendor.transactionId || '',
        vendor.paymentDate || ''
    ]);
    
    return [headers, ...rows]
        .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
        .join('\n');
}

// Utility functions
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
    const table = document.getElementById('food-vendors-table-body');
    table.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 2rem;">Loading...</td></tr>';
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