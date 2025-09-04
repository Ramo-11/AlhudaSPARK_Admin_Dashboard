// Dashboard JavaScript - dashboard.js

document.addEventListener('DOMContentLoaded', function() {
    // Initialize dashboard
    initDashboard();
});

// Dashboard initialization
function initDashboard() {
    loadDashboardStats();
    loadRecentActivity();
    setupEventListeners();
}

// Load dashboard statistics
async function loadDashboardStats() {
    try {
        showLoading();
        
        // Fetch stats from API
        const response = await fetch('/api/dashboard/stats');
        const stats = await response.json();
        
        if (stats.success) {
            updateStatsDisplay(stats.data);
        } else {
            showToast('Failed to load dashboard statistics', 'error');
        }
    } catch (error) {
        console.error('Error loading stats:', error);
        showToast('Error loading dashboard statistics', 'error');
    } finally {
        hideLoading();
    }
}

// Update stats display
function updateStatsDisplay(data) {
    // Update vendors stats
    const vendorsCount = document.getElementById('vendors-count');
    const activeVendors = document.getElementById('active-vendors');
    
    // Add food vendors stats
    const foodVendorsCount = document.getElementById('food-vendors-count');
    const activeFoodVendors = document.getElementById('active-food-vendors');
    
    const teamsCount = document.getElementById('teams-count');
    const approvedTeams = document.getElementById('approved-teams');
    const sponsorsCount = document.getElementById('sponsors-count');
    const activeSponsors = document.getElementById('active-sponsors');
    const revenueCount = document.getElementById('revenue-count');
    const pendingPayments = document.getElementById('pending-payments');
    const practicePlayersCount = document.getElementById('practice-players-count');
    const approvedPracticePlayers = document.getElementById('approved-practice-players');

    if (vendorsCount) vendorsCount.textContent = data.vendors?.total || 0;
    if (activeVendors) activeVendors.textContent = data.vendors?.active || 0;
    
    // Add food vendors display update
    if (foodVendorsCount) foodVendorsCount.textContent = data.foodVendors?.total || 0;
    if (activeFoodVendors) activeFoodVendors.textContent = data.foodVendors?.active || 0;
    
    if (teamsCount) teamsCount.textContent = data.teams?.total || 0;
    if (approvedTeams) approvedTeams.textContent = data.teams?.approved || 0;
    if (sponsorsCount) sponsorsCount.textContent = data.sponsors?.total || 0;
    if (activeSponsors) activeSponsors.textContent = data.sponsors?.active || 0;
    if (revenueCount) revenueCount.textContent = formatCurrency(data.revenue?.total || 0);
    if (pendingPayments) pendingPayments.textContent = data.revenue?.pending || 0;
    if (practicePlayersCount) practicePlayersCount.textContent = data.players?.total || 0;
    if (approvedPracticePlayers) approvedPracticePlayers.textContent = data.players?.approved || 0;
}

// Load recent activity
async function loadRecentActivity() {
    try {
        const response = await fetch('/api/dashboard/activity');
        const activity = await response.json();
        
        if (activity.success) {
            updateActivityDisplay(activity.data);
        } else {
            showToast('Failed to load recent activity', 'error');
        }
    } catch (error) {
        console.error('Error loading activity:', error);
        const activityList = document.getElementById('activity-list');
        if (activityList) {
            activityList.innerHTML = '<p>Unable to load recent activity</p>';
        }
    }
}

// Update activity display
function updateActivityDisplay(activities) {
    const activityList = document.getElementById('activity-list');
    
    if (!activityList) {
        return;
    }
    
    if (!activities || activities.length === 0) {
        activityList.innerHTML = '<p>No recent activity</p>';
        return;
    }
    
    const activityHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon">${getActivityIcon(activity.type)}</div>
            <div class="activity-content">
                <div class="activity-title">${activity.title}</div>
                <div class="activity-time">${formatRelativeTime(activity.timestamp)}</div>
            </div>
        </div>
    `).join('');
    
    activityList.innerHTML = activityHTML;
}

// Get activity icon based on type
function getActivityIcon(type) {
    const icons = {
        'vendor': '🏪',
        'food-vendor': '🍔',
        'team': '👥',
        'sponsor': '🤝',
        'payment': '💰',
        'default': '📝'
    };
    return icons[type] || icons.default;
}

// Setup event listeners
function setupEventListeners() {
    // Navigation links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            // Update active state
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Mobile menu toggle (if needed)
    setupMobileMenu();
    
    // Auto-refresh stats every 5 minutes
    setInterval(loadDashboardStats, 5 * 60 * 1000);
}

// Setup mobile menu
function setupMobileMenu() {
    // Add mobile menu button if needed
    if (window.innerWidth <= 768) {
        addMobileMenuButton();
    }
    
    // Listen for window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth <= 768) {
            addMobileMenuButton();
        } else {
            removeMobileMenuButton();
        }
    });
}

function addMobileMenuButton() {
    if (document.querySelector('.mobile-menu-btn')) return;
    
    const menuBtn = document.createElement('button');
    menuBtn.className = 'mobile-menu-btn';
    menuBtn.innerHTML = '☰';
    menuBtn.style.cssText = `
        position: fixed;
        top: 1rem;
        left: 1rem;
        z-index: 1001;
        background: #667eea;
        color: white;
        border: none;
        padding: 0.5rem;
        border-radius: 4px;
        font-size: 1.2rem;
        cursor: pointer;
    `;
    
    menuBtn.addEventListener('click', function() {
        document.querySelector('.sidebar').classList.toggle('show');
    });
    
    document.body.appendChild(menuBtn);
}

function removeMobileMenuButton() {
    const menuBtn = document.querySelector('.mobile-menu-btn');
    if (menuBtn) {
        menuBtn.remove();
    }
}

// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0
    }).format(amount);
}

function formatRelativeTime(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now - time) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

function showLoading() {
    // Add loading spinner to stats cards
    document.querySelectorAll('.stat-info h3').forEach(el => {
        el.innerHTML = '<span class="loading"></span>';
    });
}

function hideLoading() {
    // Loading will be hidden when stats are updated
}

function showToast(message, type = 'info') {
    // Remove existing toasts
    document.querySelectorAll('.toast').forEach(toast => toast.remove());
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Export functions for use in other scripts
window.dashboardUtils = {
    formatCurrency,
    formatRelativeTime,
    showToast,
    showLoading,
    hideLoading
};