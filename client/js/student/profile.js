/* ============================================
   js/student/profile.js - Student Profile
   ============================================ */
document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth('student')) return;
  renderSidebarUser();
  initSidebarToggle();
  renderTopbarDate();

  await loadProfile();
  initProfileForm();
});

/* ── Load and Display Profile ───────────────────── */
async function loadProfile() {
  try {
    const data = await apiRequest('GET', '/students/profile');
    const s    = data.student;

    // Display info
    document.getElementById('profile-info-body').innerHTML = `
      <div class="profile-header">
        <div class="profile-avatar">${s.name.charAt(0).toUpperCase()}</div>
        <div class="profile-info">
          <div class="profile-name">${s.name}</div>
          <div class="profile-uid">${s.uid}</div>
        </div>
      </div>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Register Number</div>
          <div class="info-value">${s.registerNumber}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Department</div>
          <div class="info-value">${s.department}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Year</div>
          <div class="info-value">${s.year}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Email</div>
          <div class="info-value">${s.email}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Mobile</div>
          <div class="info-value">${s.mobile}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Account Status</div>
          <div class="info-value">
            ${s.isActive
              ? '<span class="badge badge-success">Active</span>'
              : '<span class="badge badge-danger">Blocked</span>'
            }
          </div>
        </div>
        <div class="info-item">
          <div class="info-label">Member Since</div>
          <div class="info-value">${formatDate(s.createdAt)}</div>
        </div>
      </div>
    `;

    // Pre-fill edit form
    document.getElementById('p-name').value   = s.name;
    document.getElementById('p-email').value  = s.email;
    document.getElementById('p-mobile').value = s.mobile;
    document.getElementById('p-dept').value   = s.department;
    document.getElementById('p-year').value   = s.year;
  } catch (err) {
    document.getElementById('profile-info-body').innerHTML =
      `<div class="text-danger" style="padding:1rem;">${err.message}</div>`;
  }
}

/* ── Update Profile Form ────────────────────────── */
function initProfileForm() {
  const form = document.getElementById('profile-form');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-update-profile');

    const payload = {
      name:       document.getElementById('p-name').value.trim(),
      email:      document.getElementById('p-email').value.trim(),
      mobile:     document.getElementById('p-mobile').value.trim(),
      department: document.getElementById('p-dept').value.trim(),
      year:       document.getElementById('p-year').value,
    };

    if (!payload.name || !payload.email || !payload.mobile) {
      showProfileAlert('Name, email, and mobile are required.', 'error');
      return;
    }

    if (!/^[0-9]{10}$/.test(payload.mobile)) {
      showProfileAlert('Enter a valid 10-digit mobile number.', 'error');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Saving...';
    hideProfileAlert();

    try {
      await apiRequest('PUT', '/students/profile', payload);
      showProfileAlert('Profile updated successfully!', 'success');

      // Update sidebar name
      const user = getUser();
      if (user) {
        user.name = payload.name;
        localStorage.setItem('lms_user', JSON.stringify(user));
        renderSidebarUser();
      }

      // Reload profile display
      await loadProfile();
    } catch (err) {
      showProfileAlert(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Save Changes';
    }
  });
}

/* ── Alert Helpers ──────────────────────────────── */
function showProfileAlert(msg, type) {
  const el = document.getElementById('profile-alert');
  if (!el) return;
  el.textContent = msg;
  el.className   = `auth-alert ${type}`;
  el.style.display = 'block';
}
function hideProfileAlert() {
  const el = document.getElementById('profile-alert');
  if (el) el.style.display = 'none';
}
