/* ============================================
   js/admin/students.js - Student Management
   ============================================ */
let currentPage  = 1;
let searchQuery  = '';

document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth('admin')) return;
  renderSidebarUser();
  initSidebarToggle();
  renderTopbarDate();

  loadStudents();
  initSearch();
  initModal();
});

/* ── Load Students ──────────────────────────────── */
async function loadStudents(page = 1) {
  currentPage = page;
  const tbody = document.getElementById('students-table-body');
  tbody.innerHTML = '<tr><td colspan="9" class="text-center" style="padding:1.5rem;">Loading...</td></tr>';

  try {
    const params = new URLSearchParams({ page, limit: 10 });
    if (searchQuery) params.append('search', searchQuery);

    const data = await apiRequest('GET', `/students?${params}`);
    document.getElementById('student-count').textContent = `${data.total} student(s)`;

    if (!data.students.length) {
      tbody.innerHTML = '<tr><td colspan="9" class="text-center" style="padding:2rem;"><div class="empty-state"><div class="icon">👨‍🎓</div>No students found.</div></td></tr>';
      document.getElementById('students-pagination').innerHTML = '';
      return;
    }

    tbody.innerHTML = data.students.map(s => `
      <tr>
        <td><strong>${s.name}</strong></td>
        <td><span class="badge badge-muted">${s.uid}</span></td>
        <td>${s.registerNumber}</td>
        <td>${s.department}</td>
        <td>${s.year}</td>
        <td>${s.email}</td>
        <td>${s.mobile}</td>
        <td>
          ${s.isActive
            ? '<span class="badge badge-success">Active</span>'
            : '<span class="badge badge-danger">Blocked</span>'
          }
        </td>
        <td>
          <button class="btn btn-sm btn-outline" onclick="viewStudent('${s._id}')">👁️ View</button>
        </td>
      </tr>
    `).join('');

    renderPagination('students-pagination', data.page, data.totalPages, loadStudents);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="9" class="text-center text-danger" style="padding:1.5rem;">${err.message}</td></tr>`;
  }
}

/* ── View Student Detail ────────────────────────── */
async function viewStudent(studentId) {
  try {
    const data = await apiRequest('GET', `/students/${studentId}`);
    const s = data.student;

    const content = document.getElementById('student-detail-content');
    content.innerHTML = `
      <div class="profile-header">
        <div class="profile-avatar">${s.name.charAt(0).toUpperCase()}</div>
        <div class="profile-info">
          <div class="profile-name">${s.name}</div>
          <div class="profile-uid">${s.uid} &nbsp;|&nbsp; ${s.registerNumber}</div>
        </div>
      </div>
      <div class="info-grid">
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
          <div class="info-label">Status</div>
          <div class="info-value">${s.isActive ? '✅ Active' : '🚫 Blocked'}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Books Currently Issued</div>
          <div class="info-value fw-bold text-primary">${data.issuedCount}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Registered On</div>
          <div class="info-value">${formatDate(s.createdAt)}</div>
        </div>
      </div>
    `;

    openModal('student-modal');
  } catch (err) {
    showToast('Failed to load student: ' + err.message, 'error');
  }
}

/* ── Search ─────────────────────────────────────── */
function initSearch() {
  document.getElementById('btn-search')?.addEventListener('click', () => {
    searchQuery = document.getElementById('student-search').value.trim();
    loadStudents(1);
  });

  document.getElementById('btn-clear')?.addEventListener('click', () => {
    document.getElementById('student-search').value = '';
    searchQuery = '';
    loadStudents(1);
  });

  document.getElementById('student-search')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') document.getElementById('btn-search').click();
  });
}

/* ── Modal ──────────────────────────────────────── */
function initModal() {
  document.getElementById('modal-close')?.addEventListener('click', closeModal);
  document.getElementById('modal-cancel')?.addEventListener('click', closeModal);
  document.getElementById('student-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'student-modal') closeModal();
  });
}

function openModal(id) { document.getElementById(id)?.classList.add('open'); }
function closeModal()  { document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open')); }
