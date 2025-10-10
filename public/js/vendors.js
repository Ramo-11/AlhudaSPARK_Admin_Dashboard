// Vendors JavaScript - vendors.js

let currentVendors = [];
let filteredVendors = [];
let currentPage = 1;
let itemsPerPage = 10;
let isEditing = false;
let editingVendorId = null;

document.addEventListener('DOMContentLoaded', function () {
    initVendorsPage();
});

function initVendorsPage() {
    loadVendors();
    setupEventListeners();
}

// Setup event listeners
function setupEventListeners() {
    const addVendorBtn = document.getElementById('add-vendor-btn');
    if (addVendorBtn) {
        addVendorBtn.addEventListener('click', openAddVendorModal);
    }

    // Modal controls
    document.getElementById('close-modal')?.addEventListener('click', closeModal);
    document.getElementById('cancel-btn')?.addEventListener('click', closeModal);
    document.getElementById('close-delete-modal')?.addEventListener('click', closeDeleteModal);
    document.getElementById('cancel-delete')?.addEventListener('click', closeDeleteModal);

    // Payment modal controls
    document.getElementById('close-payment-modal')?.addEventListener('click', closePaymentModal);
    document.getElementById('cancel-payment-btn')?.addEventListener('click', closePaymentModal);
    document.getElementById('payment-form')?.addEventListener('submit', handlePaymentStatusUpdate);

    document.getElementById('payment-modal')?.addEventListener('click', function (e) {
        if (e.target === this) closePaymentModal();
    });

    // Form submission
    document.getElementById('vendor-form')?.addEventListener('submit', handleFormSubmit);

    // Delete confirmation
    document.getElementById('confirm-delete')?.addEventListener('click', handleDelete);

    // Filters
    document.getElementById('type-filter')?.addEventListener('change', applyFilters);
    document.getElementById('payment-filter')?.addEventListener('change', applyFilters);
    document.getElementById('location-filter')?.addEventListener('change', applyFilters);
    document.getElementById('search-input')?.addEventListener('input', debounce(applyFilters, 300));

    // Export button
    document.getElementById('export-btn')?.addEventListener('click', exportVendors);

    // Modal backdrop click
    document.getElementById('vendor-modal')?.addEventListener('click', function (e) {
        if (e.target === this) closeModal();
    });

    document.getElementById('delete-modal')?.addEventListener('click', function (e) {
        if (e.target === this) closeDeleteModal();
    });
}

// Load vendors from API
async function loadVendors() {
    try {
        showLoading();
        const response = await fetch('/api/vendors');
        const result = await response.json();

        if (result.success) {
            currentVendors = result.data;
            filteredVendors = [...currentVendors];
            updateVendorsTable();
            updatePagination();
        } else {
            showToast('Failed to load vendors', 'error');
        }
    } catch (error) {
        console.error('Error loading vendors:', error);
        showToast('Error loading vendors', 'error');
    } finally {
        hideLoading();
    }
}

function updateVendorsTable() {
    const tbody = document.getElementById('vendors-table-body');
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedVendors = filteredVendors.slice(startIndex, endIndex);

    if (paginatedVendors.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" style="text-align: center; padding: 2rem;">
                    No vendors found
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = paginatedVendors
        .map(
            (vendor) => `
        <tr>
            <td>${new Date(vendor.createdAt).toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
                hour12: true,
            })}</td>
            <td><strong>${vendor.businessName}</strong></td>
            <td>${vendor.contactPerson}</td>
            <td>${vendor.email}</td>
            <td>${formatVendorType(vendor.vendorType)}</td>
            <td style="font-size: 0.7rem;">
                ${
                    vendor.businessDescription
                        ? vendor.businessDescription.length > 1000
                            ? vendor.businessDescription.substring(0, 1000) + '...'
                            : vendor.businessDescription
                        : 'N/A'
                }
            </td>
            <td>${vendor.paymentMethod ? vendor.paymentMethod.toUpperCase() : 'N/A'}</td>
            <td>${formatSelectedBooths(vendor.booths)}</td>
            <td>$${vendor.totalBoothPrice?.toLocaleString() || '0'}</td>
            <td><span class="status-badge status-${vendor.paymentStatus}">${
                vendor.paymentStatus
            }</span></td>
            <td>
                <div class="action-buttons">
                    ${
                        vendor.paymentMethod === 'zelle' && vendor.zelleReceipt
                            ? `<button class="btn-small btn-info" onclick="viewReceipt('${vendor.zelleReceipt}', '${vendor.businessName}')">Receipt</button>`
                            : ''
                    }
                    <button class="btn-small btn-primary" onclick="editVendor('${
                        vendor.vendorId
                    }')">Edit</button>
                    <button class="btn-small btn-info" onclick="updatePaymentStatus('${
                        vendor.vendorId
                    }')">Payment</button>
                    <button class="btn-small btn-danger" onclick="confirmDeleteVendor('${
                        vendor.vendorId
                    }')">Delete</button>
                </div>
            </td>
        </tr>
    `
        )
        .join('');
}

function updatePaymentStatus(vendorId) {
    const vendor = currentVendors.find((v) => v.vendorId === vendorId);
    if (!vendor) return;

    editingVendorId = vendorId;
    document.getElementById('current-payment-status').textContent = vendor.paymentStatus;
    document.getElementById('payment-status-select').value = vendor.paymentStatus;
    document.getElementById('payment-modal').style.display = 'block';
}

function formatSelectedBooths(booths) {
    if (!booths || booths.length === 0) return 'None';
    return booths.map((booth) => booth.boothId).join(', ');
}

// Apply filters
function applyFilters() {
    const typeFilter = document.getElementById('type-filter').value;
    const paymentFilter = document.getElementById('payment-filter').value;
    const locationFilter = document.getElementById('location-filter').value;
    const searchTerm = document.getElementById('search-input').value.toLowerCase();

    filteredVendors = currentVendors.filter((vendor) => {
        const matchesType = !typeFilter || vendor.vendorType === typeFilter;
        const matchesPayment = !paymentFilter || vendor.paymentStatus === paymentFilter;
        const matchesLocation = !locationFilter || vendor.boothLocation === locationFilter;
        const matchesSearch =
            !searchTerm ||
            vendor.businessName.toLowerCase().includes(searchTerm) ||
            vendor.contactPerson.toLowerCase().includes(searchTerm) ||
            vendor.email.toLowerCase().includes(searchTerm) ||
            vendor.vendorId.toLowerCase().includes(searchTerm);

        return matchesType && matchesPayment && matchesLocation && matchesSearch;
    });

    currentPage = 1; // Reset to first page
    updateVendorsTable();
    updatePagination();
}

// Update pagination
function updatePagination() {
    const totalPages = Math.ceil(filteredVendors.length / itemsPerPage);
    const paginationContainer = document.getElementById('pagination');

    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }

    let paginationHTML = '';

    // Previous button
    if (currentPage > 1) {
        paginationHTML += `<button class="pagination-btn" onclick="changePage(${
            currentPage - 1
        })">Previous</button>`;
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
        paginationHTML += `<button class="pagination-btn" onclick="changePage(${
            currentPage + 1
        })">Next</button>`;
    }

    paginationContainer.innerHTML = paginationHTML;
}

// Change page
function changePage(page) {
    currentPage = page;
    updateVendorsTable();
    updatePagination();
}

// Open add vendor modal
function openAddVendorModal() {
    isEditing = false;
    editingVendorId = null;
    document.getElementById('modal-title').textContent = 'Add Vendor';
    document.getElementById('vendor-form').reset();
    document.getElementById('vendor-modal').style.display = 'block';
}

// Edit vendor
function editVendor(vendorId) {
    const vendor = currentVendors.find((v) => v.vendorId === vendorId);
    if (!vendor) return;

    isEditing = true;
    editingVendorId = vendorId;
    document.getElementById('modal-title').textContent = 'Edit Vendor';

    // Populate form with matching field names
    const form = document.getElementById('vendor-form');
    form.businessName.value = vendor.businessName || '';
    form.contactPerson.value = vendor.contactPerson || '';
    form.email.value = vendor.email || '';
    form.phone.value = vendor.phone || '';
    form.vendorType.value = vendor.vendorType || '';
    form.website.value = vendor.website || '';
    form.paymentMethod.value = vendor.paymentMethod || '';
    form.address.value = vendor.address || '';
    form.businessDescription.value = vendor.businessDescription || '';
    form.specialRequirements.value = vendor.specialRequirements || '';
    form.comments.value = vendor.comments || '';

    document.getElementById('vendor-modal').style.display = 'block';
}

function updatePaymentStatus(vendorId) {
    const vendor = currentVendors.find((v) => v.vendorId === vendorId);
    if (!vendor) return;

    editingVendorId = vendorId;
    document.getElementById('current-payment-status').textContent = vendor.paymentStatus;
    document.getElementById('payment-status-select').value = vendor.paymentStatus;
    document.getElementById('payment-modal').style.display = 'block';
}

async function handlePaymentStatusUpdate(e) {
    e.preventDefault();

    const newStatus = document.getElementById('payment-status-select').value;
    const transactionId = document.getElementById('transaction-id').value;

    try {
        showLoading();

        const response = await fetch(`/api/vendors/${editingVendorId}/payment`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                paymentStatus: newStatus,
                transactionId: transactionId || null,
            }),
        });

        const result = await response.json();

        if (result.success) {
            showToast('Payment status updated successfully', 'success');
            closePaymentModal();
            loadVendors();
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
}

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

    modal.addEventListener('click', function (e) {
        if (e.target === this) this.remove();
    });
}

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const vendorData = Object.fromEntries(formData.entries());

    try {
        showLoading();

        const url = isEditing ? `/api/vendors/${editingVendorId}` : '/api/vendors';
        const method = isEditing ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(vendorData),
        });

        const result = await response.json();

        if (result.success) {
            showToast(
                isEditing ? 'Vendor updated successfully' : 'Vendor created successfully',
                'success'
            );
            closeModal();
            loadVendors();
        } else {
            showToast(result.message || 'Failed to save vendor', 'error');
        }
    } catch (error) {
        console.error('Error saving vendor:', error);
        showToast('Error saving vendor', 'error');
    } finally {
        hideLoading();
    }
}

// Confirm delete vendor
function confirmDeleteVendor(vendorId) {
    editingVendorId = vendorId;
    document.getElementById('delete-modal').style.display = 'block';
}

// Handle delete
async function handleDelete() {
    try {
        showLoading();

        const response = await fetch(`/api/vendors/${editingVendorId}`, {
            method: 'DELETE',
        });

        const result = await response.json();

        if (result.success) {
            showToast('Vendor deleted successfully', 'success');
            closeDeleteModal();
            loadVendors();
        } else {
            showToast(result.message || 'Failed to delete vendor', 'error');
        }
    } catch (error) {
        console.error('Error deleting vendor:', error);
        showToast('Error deleting vendor', 'error');
    } finally {
        hideLoading();
    }
}

// Close modal
function closeModal() {
    document.getElementById('vendor-modal').style.display = 'none';
    isEditing = false;
    editingVendorId = null;
}

// Close delete modal
function closeDeleteModal() {
    document.getElementById('delete-modal').style.display = 'none';
    editingVendorId = null;
}

// Export vendors
function exportVendors() {
    const csvContent = generateVendorsCSV(filteredVendors);
    downloadCSV(csvContent, 'vendors.csv');
}

// Generate CSV content
function generateVendorsCSV(vendors) {
    const headers = [
        'Vendor ID',
        'Business Name',
        'Contact Person',
        'Email',
        'Phone',
        'Vendor Type',
        'Selected Booths',
        'Total Price',
        'Payment Method',
        'Payment Status',
        'Address',
        'Website',
        'Business Description',
        'Special Requirements',
        'Transaction ID',
    ];

    const rows = vendors.map((vendor) => [
        vendor.vendorId,
        vendor.businessName,
        vendor.contactPerson,
        vendor.email,
        vendor.phone,
        formatVendorType(vendor.vendorType),
        formatSelectedBooths(vendor.booths),
        vendor.totalBoothPrice,
        vendor.paymentMethod,
        vendor.paymentStatus,
        vendor.address,
        vendor.website,
        vendor.businessDescription,
        vendor.specialRequirements,
        vendor.transactionId || '',
    ]);

    return [headers, ...rows]
        .map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(','))
        .join('\n');
}

// Utility functions
function formatVendorType(type) {
    const typeMap = {
        food: 'Food & Beverages',
        clothing: 'Clothing & Apparel',
        accessories: 'Accessories',
        books: 'Books & Education',
        toys: 'Toys & Games',
        sports: 'Sports & Fitness',
        services: 'Services',
        other: 'Other',
    };
    return typeMap[type] || type;
}

function formatBoothLocation(location) {
    const locationMap = {
        back: 'Back Area',
        central: 'Central Aisle',
        side_corner: 'Side Corner',
        front_corner: 'Front Corner',
    };
    return locationMap[location] || location;
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
    // Show loading state
    const table = document.getElementById('vendors-table-body');
    table.innerHTML =
        '<tr><td colspan="9" style="text-align: center; padding: 2rem;">Loading...</td></tr>';
}

function hideLoading() {
    // Loading will be hidden when table is updated
}

function showToast(message, type) {
    // Use the dashboard utility function
    if (window.dashboardUtils && window.dashboardUtils.showToast) {
        window.dashboardUtils.showToast(message, type);
    } else {
        alert(message);
    }
}
