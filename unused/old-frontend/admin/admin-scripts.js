// Admin Dashboard Scripts
const adminToken = localStorage.getItem('campusx_token_admin');

// ============================================
// AUTHENTICATION & NAVIGATION
// ============================================

if (!adminToken) {
  location.href = '../login.html';
}

document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
  e.preventDefault();
  localStorage.removeItem('campusx_token_admin');
  alert('Logged out successfully.');
  location.href = '../index.html';
});

// Sidebar toggle for mobile
const sidebarToggle = document.getElementById('sidebarToggle');
const adminSidebar = document.querySelector('.admin-sidebar');

sidebarToggle?.addEventListener('click', () => {
  adminSidebar.classList.toggle('active');
});

// Update active nav item
document.querySelectorAll('.nav-item').forEach((link) => {
  const href = link.getAttribute('href');
  if (window.location.pathname.includes(href)) {
    link.classList.add('active');
  } else {
    link.classList.remove('active');
  }
});

// ============================================
// UTILITY FUNCTIONS
// ============================================

const showToast = (message, type = 'info') => {
  const container = document.querySelector('.toast-container') || createToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>✓</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => toast.remove(), 3000);
};

const createToastContainer = () => {
  const container = document.createElement('div');
  container.className = 'toast-container';
  document.body.appendChild(container);
  return container;
};

const formatTimestampTime = (timestamp) =>
  new Date(timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

const fetchAdmin = async (url, options = {}) => {
  const headers = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
    ...options.headers,
  };
  const response = await fetch(`${API_BASE}${url}`, { ...options, headers });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'API Error');
  }
  return response.json();
};

// ============================================
// DASHBOARD FUNCTIONS
// ============================================

const loadDashboardStats = async () => {
  try {
    const stats = await fetchAdmin('/admin/stats');
    document.getElementById('totalStudents').textContent = stats.total_students || 0;
    document.getElementById('totalOrganizers').textContent = stats.total_organizers || 0;
    document.getElementById('totalEvents').textContent = stats.total_events || 0;
    document.getElementById('totalRegistrations').textContent = stats.total_registrations || 0;
    document.getElementById('upcomingEvents').textContent = stats.upcoming_events || 0;
    document.getElementById('ongoingEvents').textContent = stats.ongoing_events || 0;
    document.getElementById('completedEvents').textContent = stats.completed_events || 0;
    document.getElementById('totalCertificates').textContent = stats.total_certificates || 0;
  } catch (error) {
    console.error('Failed to load stats:', error);
    showToast('Failed to load statistics', 'error');
  }
};

const loadRegistrationChart = async () => {
  try {
    const data = await fetchAdmin('/admin/dashboard/charts/registrations');
    const ctx = document.getElementById('registrationChart');
    if (!ctx) return;

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map(item => item.date),
        datasets: [{
          label: 'Registrations',
          data: data.map(item => item.count),
          borderColor: '#f97316',
          backgroundColor: 'rgba(249, 115, 22, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { color: '#8b92a9' },
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
          },
          x: {
            ticks: { color: '#8b92a9' },
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
          },
        },
      },
    });
  } catch (error) {
    console.error('Failed to load registration chart:', error);
  }
};

const loadCategoryChart = async () => {
  try {
    const data = await fetchAdmin('/admin/dashboard/charts/categories');
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;

    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: data.map(item => item.category_name),
        datasets: [{
          data: data.map(item => item.count),
          backgroundColor: [
            'rgba(124, 58, 237, 0.7)',
            'rgba(249, 115, 22, 0.7)',
            'rgba(16, 185, 129, 0.7)',
            'rgba(59, 130, 246, 0.7)',
            'rgba(168, 85, 247, 0.7)',
          ],
          borderColor: '#1a1f2e',
          borderWidth: 2,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: '#e6eef8' },
          },
        },
      },
    });
  } catch (error) {
    console.error('Failed to load category chart:', error);
  }
};

const loadPopularEvents = async () => {
  try {
    const events = await fetchAdmin('/admin/dashboard/charts/popular-events');
    const tbody = document.getElementById('popularEventsBody');
    if (!tbody) return;

    tbody.innerHTML = events.length > 0 
      ? events.map(event => `
          <tr>
            <td>${event.title}</td>
            <td>${event.registrations}</td>
          </tr>
        `).join('')
      : '<tr><td colspan="2" class="text-center">No events found</td></tr>';
  } catch (error) {
    console.error('Failed to load popular events:', error);
    const tbody = document.getElementById('popularEventsBody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="2" class="text-center">Failed to load</td></tr>';
  }
};

const loadDashboardActivity = async () => {
  try {
    const activities = await fetchAdmin('/admin/dashboard/activity');
    const activityList = document.getElementById('activityList');
    if (!activityList) return;

    if (activities.length === 0) {
      activityList.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div><p>No recent activity</p></div>';
      return;
    }

    const typeIcons = {
      student_registration: '📝',
      organizer_registration: '👔',
      event_created: '📅',
      certificate_issued: '🎓',
    };

    activityList.innerHTML = activities.map(activity => `
      <div class="activity-item">
        <div class="activity-icon">${typeIcons[activity.type] || '📌'}</div>
        <div class="activity-content">
          <div class="activity-type">${activity.type.replace(/_/g, ' ')}</div>
          <div class="activity-description">${activity.name}</div>
          <div class="activity-time">${formatDate(activity.timestamp)} at ${formatTimestampTime(activity.timestamp)}</div>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Failed to load activity:', error);
    const activityList = document.getElementById('activityList');
    if (activityList) activityList.innerHTML = '<div class="empty-state"><p>Failed to load activity</p></div>';
  }
};

// ============================================
// DATA MANAGEMENT FUNCTIONS
// ============================================

const loadTable = async (url, tableBodyId, columns, formatter) => {
  try {
    const data = await fetchAdmin(url);
    const tbody = document.getElementById(tableBodyId);
    if (!tbody) return;

    if (data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="${columns.length}" class="text-center">No data found</td></tr>`;
      return;
    }

    tbody.innerHTML = data.map(item => formatter(item, columns)).join('');
  } catch (error) {
    console.error(`Failed to load ${tableBodyId}:`, error);
    const tbody = document.getElementById(tableBodyId);
    if (tbody) tbody.innerHTML = `<tr><td colspan="*" class="text-center">Failed to load data</td></tr>`;
  }
};

const deleteItem = async (endpoint, itemId, itemName) => {
  if (!confirm(`Are you sure you want to delete ${itemName}?`)) return;

  try {
    await fetchAdmin(`${endpoint}/${itemId}`, { method: 'DELETE' });
    showToast(`${itemName} deleted successfully`, 'success');
    location.reload();
  } catch (error) {
    showToast(`Failed to delete ${itemName}: ${error.message}`, 'error');
  }
};

const approveOrganizer = async (organizerId) => {
  if (!confirm('Are you sure you want to approve this organizer?')) return;

  try {
    await fetchAdmin(`/admin/organizers/${organizerId}/approve`, { method: 'PUT' });
    showToast('Organizer approved successfully', 'success');
    location.reload();
  } catch (error) {
    showToast(`Failed to approve organizer: ${error.message}`, 'error');
  }
};

const cancelRegistration = async (registrationId) => {
  if (!confirm('Are you sure you want to cancel this registration?')) return;

  try {
    await fetchAdmin(`/admin/registrations/${registrationId}/cancel`, { method: 'PUT' });
    showToast('Registration cancelled successfully', 'success');
    location.reload();
  } catch (error) {
    showToast(`Failed to cancel registration: ${error.message}`, 'error');
  }
};

const cancelEvent = async (eventId) => {
  if (!confirm('Are you sure you want to cancel this event?')) return;

  try {
    await fetchAdmin(`/admin/events/${eventId}/cancel`, { method: 'PUT' });
    showToast('Event cancelled successfully', 'success');
    location.reload();
  } catch (error) {
    showToast(`Failed to cancel event: ${error.message}`, 'error');
  }
};

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  const page = document.documentElement.getAttribute('data-page');

  if (page === 'admin-dashboard') {
    loadDashboardStats();
    loadRegistrationChart();
    loadCategoryChart();
    loadPopularEvents();
    loadDashboardActivity();
  }
});

// Export for use in other pages
window.adminAPI = {
  fetchAdmin,
  showToast,
  formatDate,
  formatTime: formatTimestampTime,
  loadTable,
  deleteItem,
  approveOrganizer,
  cancelRegistration,
  cancelEvent,
};
