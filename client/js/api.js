/* ============================================
   js/api.js - Centralized API Fetch Wrapper
   ============================================ */

const API_BASE = '/api';

/** Get stored JWT token */
function getToken() {
  return localStorage.getItem('lms_token');
}

/** Get stored user object */
function getUser() {
  const u = localStorage.getItem('lms_user');
  return u ? JSON.parse(u) : null;
}

/** Save login data to localStorage */
function setAuth(token, user) {
  localStorage.setItem('lms_token', token);
  localStorage.setItem('lms_user', JSON.stringify(user));
}

/** Clear auth from storage */
function clearAuth() {
  localStorage.removeItem('lms_token');
  localStorage.removeItem('lms_user');
}

/**
 * Make an API request.
 * @param {string} method  - HTTP method
 * @param {string} endpoint - e.g. '/books'
 * @param {object|FormData} [data] - request body
 * @returns {Promise<object>}
 */
async function apiRequest(method, endpoint, data = null) {
  const headers = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = {
    method: method.toUpperCase(),
    headers,
  };

  if (data instanceof FormData) {
    // Let browser set Content-Type with boundary for multipart
    options.body = data;
  } else if (data) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(data);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, options);
  const json = await response.json();

  if (!response.ok) {
    throw new Error(json.message || 'Request failed');
  }
  return json;
}

/**
 * Guard: redirect if not logged in or wrong role.
 * @param {'admin'|'student'} requiredRole
 */
function requireAuth(requiredRole) {
  const token = getToken();
  const user  = getUser();

  if (!token || !user) {
    window.location.href = '/login.html';
    return false;
  }
  if (requiredRole && user.role !== requiredRole) {
    clearAuth();
    window.location.href = '/login.html';
    return false;
  }
  return true;
}

/** Logout: clear storage and redirect */
function logout() {
  clearAuth();
  window.location.href = '/login.html';
}

/* ── Toast Notification ────────────────────────── */
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
  container.appendChild(toast);

  // Auto-remove after 3.5s
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(30px)';
    toast.style.transition = 'all .3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

/* ── Date Formatting ────────────────────────────── */
function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

/** Days remaining until due date (negative = overdue) */
function daysUntilDue(dueDateStr) {
  const due  = new Date(dueDateStr);
  const now  = new Date();
  const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
  return diff;
}

/* ── Sidebar: Set Active Nav Item ───────────────── */
function setActiveNav() {
  const currentPath = window.location.pathname.replace(/\/$/, '');
  document.querySelectorAll('.nav-item').forEach(link => {
    const href = link.getAttribute('href');
    if (href && currentPath.endsWith(href.split('/').pop().replace('.html', ''))) {
      link.classList.add('active');
    }
  });
}

/* ── Sidebar: Display User Info ─────────────────── */
function renderSidebarUser() {
  const user = getUser();
  if (!user) return;

  const nameEl   = document.getElementById('sidebar-user-name');
  const roleEl   = document.getElementById('sidebar-user-role');
  const avatarEl = document.getElementById('sidebar-avatar');
  const topNameEl = document.getElementById('topbar-user-name');

  if (nameEl)    nameEl.textContent   = user.name;
  if (roleEl)    roleEl.textContent   = user.role;
  if (topNameEl) topNameEl.textContent = user.name;
  if (avatarEl)  avatarEl.textContent  = user.name.charAt(0).toUpperCase();
}

/* ── Sidebar Mobile Toggle ──────────────────────── */
function initSidebarToggle() {
  const toggle  = document.getElementById('menu-toggle');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (!toggle || !sidebar) return;

  toggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlay?.classList.toggle('open');
  });
  overlay?.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
  });
}

/* ── Topbar Date ────────────────────────────────── */
function renderTopbarDate() {
  const el = document.getElementById('topbar-date');
  if (!el) return;
  el.textContent = new Date().toLocaleDateString('en-IN', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
  });
}

/* ── Pagination Helper ──────────────────────────── */
function renderPagination(containerId, currentPage, totalPages, onPageChange) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  if (totalPages <= 1) return;

  const prev = document.createElement('button');
  prev.textContent = '← Prev';
  prev.disabled = currentPage === 1;
  prev.addEventListener('click', () => onPageChange(currentPage - 1));
  container.appendChild(prev);

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    btn.className   = i === currentPage ? 'active' : '';
    btn.addEventListener('click', () => onPageChange(i));
    container.appendChild(btn);
  }

  const next = document.createElement('button');
  next.textContent = 'Next →';
  next.disabled    = currentPage === totalPages;
  next.addEventListener('click', () => onPageChange(currentPage + 1));
  container.appendChild(next);
}

/* ── Confirm Dialog ─────────────────────────────── */
function confirmAction(message, onConfirm) {
  if (window.confirm(message)) onConfirm();
}
