/* ============================================
   js/auth.js - Login & Register Page Logic
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  // Redirect if already logged in
  const existingToken = getToken();
  const existingUser  = getUser();
  if (existingToken && existingUser) {
    redirectToDashboard(existingUser.role);
    return;
  }

  initTabs();
  initAdminLoginForm();
  initStudentLoginForm();
  initRegisterForm();
});

/* ── Redirect based on role ─────────────────────── */
function redirectToDashboard(role) {
  if (role === 'admin') {
    window.location.href = '/admin/dashboard.html';
  } else {
    window.location.href = '/student/dashboard.html';
  }
}

/* ── Tab Switcher (Admin / Student) ─────────────── */
function initTabs() {
  const tabs = document.querySelectorAll('.role-tab');
  if (!tabs.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Update tab active state
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Show corresponding form
      const target = tab.dataset.tab;
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      const targetEl = document.getElementById(target);
      if (targetEl) targetEl.classList.add('active');
    });
  });
}

/* ── Admin Login Form ───────────────────────────── */
function initAdminLoginForm() {
  const form = document.getElementById('admin-login-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn   = form.querySelector('button[type="submit"]');
    const alert = document.getElementById('admin-alert');

    const adminId  = form.querySelector('#admin-id').value.trim();
    const password = form.querySelector('#admin-password').value;

    if (!adminId || !password) {
      showAlert(alert, 'Please fill in all fields.', 'error');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Logging in...';
    hideAlert(alert);

    try {
      const res = await apiRequest('POST', '/auth/admin/login', { adminId, password });
      setAuth(res.token, res.user);
      showToast('Welcome, ' + res.user.name + '!', 'success');
      setTimeout(() => redirectToDashboard('admin'), 500);
    } catch (err) {
      showAlert(alert, err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Login as Admin';
    }
  });
}

/* ── Student Login Form ─────────────────────────── */
function initStudentLoginForm() {
  const form = document.getElementById('student-login-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn   = form.querySelector('button[type="submit"]');
    const alert = document.getElementById('student-alert');

    const uid            = form.querySelector('#student-uid').value.trim();
    const registerNumber = form.querySelector('#student-reg').value.trim();
    const password       = form.querySelector('#student-password').value;

    if (!uid || !registerNumber || !password) {
      showAlert(alert, 'Please fill in all fields.', 'error');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Logging in...';
    hideAlert(alert);

    try {
      const res = await apiRequest('POST', '/auth/student/login', { uid, registerNumber, password });
      setAuth(res.token, res.user);
      showToast('Welcome, ' + res.user.name + '!', 'success');
      setTimeout(() => redirectToDashboard('student'), 500);
    } catch (err) {
      showAlert(alert, err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Login as Student';
    }
  });
}

/* ── Register Form ──────────────────────────────── */
function initRegisterForm() {
  const form = document.getElementById('register-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn   = form.querySelector('button[type="submit"]');
    const alert = document.getElementById('register-alert');

    const data = {
      name:           form.querySelector('#reg-name').value.trim(),
      uid:            form.querySelector('#reg-uid').value.trim(),
      registerNumber: form.querySelector('#reg-register').value.trim(),
      department:     form.querySelector('#reg-dept').value.trim(),
      year:           form.querySelector('#reg-year').value,
      email:          form.querySelector('#reg-email').value.trim(),
      mobile:         form.querySelector('#reg-mobile').value.trim(),
      password:       form.querySelector('#reg-password').value,
      confirmPassword:form.querySelector('#reg-confirm').value,
    };

    // Client-side validation
    if (Object.values(data).some(v => !v)) {
      showAlert(alert, 'All fields are required.', 'error');
      return;
    }
    if (data.password !== data.confirmPassword) {
      showAlert(alert, 'Passwords do not match.', 'error');
      return;
    }
    if (data.password.length < 6) {
      showAlert(alert, 'Password must be at least 6 characters.', 'error');
      return;
    }
    if (!/^[0-9]{10}$/.test(data.mobile)) {
      showAlert(alert, 'Enter a valid 10-digit mobile number.', 'error');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Registering...';
    hideAlert(alert);

    try {
      await apiRequest('POST', '/auth/student/register', data);
      showAlert(alert, '✅ Registration successful! Redirecting to login...', 'success');
      setTimeout(() => { window.location.href = '/login.html'; }, 2000);
    } catch (err) {
      showAlert(alert, err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Create Account';
    }
  });
}

/* ── Alert Helpers ──────────────────────────────── */
function showAlert(el, msg, type = 'error') {
  if (!el) return;
  el.textContent = msg;
  el.className   = `auth-alert show ${type}`;
}
function hideAlert(el) {
  if (!el) return;
  el.className = 'auth-alert';
  el.textContent = '';
}
