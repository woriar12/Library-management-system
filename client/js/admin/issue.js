/* ============================================
   js/admin/issue.js - Issue Book Logic
   ============================================ */
let issuedPage = 1;
let issueStatusFilter = 'issued';

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth('admin')) return;
  renderSidebarUser();
  initSidebarToggle();
  renderTopbarDate();

  // Set today as default issue date
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('f-issue-date').value = today;

  // Set default due date to 14 days from today
  const due = new Date();
  due.setDate(due.getDate() + 14);
  document.getElementById('f-due-date').value = due.toISOString().split('T')[0];

  await Promise.all([loadStudentOptions(), loadBookOptions()]);
  loadIssuedBooks();

  initIssueForm();

  document.getElementById('filter-status')?.addEventListener('change', (e) => {
    issueStatusFilter = e.target.value;
    loadIssuedBooks(1);
  });
});

/* ── Populate Student Dropdown ──────────────────── */
async function loadStudentOptions() {
  const select = document.getElementById('f-student');
  try {
    const data = await apiRequest('GET', '/students?limit=200');
    select.innerHTML = '<option value="">-- Select Student --</option>' +
      data.students.map(s => `<option value="${s._id}">${s.name} (${s.uid})</option>`).join('');
  } catch (err) {
    select.innerHTML = '<option value="">Failed to load students</option>';
  }
}

/* ── Populate Book Dropdown (available only) ────── */
async function loadBookOptions() {
  const select = document.getElementById('f-book');
  try {
    const data = await apiRequest('GET', '/books?limit=200');
    const available = data.books.filter(b => b.availableQuantity > 0);
    select.innerHTML = '<option value="">-- Select Book --</option>' +
      available.map(b => `<option value="${b._id}">${b.name} by ${b.author} (${b.availableQuantity} left)</option>`).join('');
    if (!available.length) {
      select.innerHTML = '<option value="">No books available</option>';
    }
  } catch (err) {
    select.innerHTML = '<option value="">Failed to load books</option>';
  }
}

/* ── Issue Form Submit ──────────────────────────── */
function initIssueForm() {
  const form    = document.getElementById('issue-form');
  const alertEl = document.getElementById('issue-alert');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-issue');

    const studentId = document.getElementById('f-student').value;
    const bookId    = document.getElementById('f-book').value;
    const issueDate = document.getElementById('f-issue-date').value;
    const dueDate   = document.getElementById('f-due-date').value;

    if (!studentId || !bookId || !issueDate || !dueDate) {
      showIssueAlert('All fields are required.', 'error');
      return;
    }

    if (new Date(dueDate) <= new Date(issueDate)) {
      showIssueAlert('Due date must be after issue date.', 'error');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Issuing...';
    hideIssueAlert();

    try {
      await apiRequest('POST', '/issues', { studentId, bookId, issueDate, dueDate });
      showIssueAlert('Book issued successfully!', 'success');
      form.reset();

      // Reset dates
      const today = new Date().toISOString().split('T')[0];
      document.getElementById('f-issue-date').value = today;
      const due = new Date(); due.setDate(due.getDate() + 14);
      document.getElementById('f-due-date').value = due.toISOString().split('T')[0];

      // Refresh dropdowns and table
      await loadBookOptions();
      loadIssuedBooks(1);
    } catch (err) {
      showIssueAlert(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Issue Book';
    }
  });
}

/* ── Load Issued Books Table ────────────────────── */
async function loadIssuedBooks(page = 1) {
  issuedPage = page;
  const tbody = document.getElementById('issued-table-body');
  tbody.innerHTML = '<tr><td colspan="4" class="text-center" style="padding:1rem;">Loading...</td></tr>';

  try {
    const params = new URLSearchParams({ page, limit: 8 });
    if (issueStatusFilter) params.append('status', issueStatusFilter);

    const data = await apiRequest('GET', `/issues?${params}`);

    if (!data.issues.length) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted" style="padding:1.5rem;">No records found.</td></tr>';
      document.getElementById('issued-pagination').innerHTML = '';
      return;
    }

    tbody.innerHTML = data.issues.map(issue => {
      const days = daysUntilDue(issue.dueDate);
      const statusBadge = issue.status === 'overdue'
        ? '<span class="badge badge-danger">Overdue</span>'
        : days <= 2
        ? '<span class="badge badge-warning">Due Soon</span>'
        : '<span class="badge badge-info">Issued</span>';

      return `
        <tr>
          <td>
            <div class="fw-semi">${issue.student?.name || '—'}</div>
            <div style="font-size:.75rem;color:var(--text-muted);">${issue.student?.uid || ''}</div>
          </td>
          <td>${issue.book?.name || '—'}</td>
          <td>${formatDate(issue.dueDate)}</td>
          <td>${statusBadge}</td>
        </tr>
      `;
    }).join('');

    renderPagination('issued-pagination', data.page, data.totalPages, loadIssuedBooks);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center text-danger" style="padding:1rem;">${err.message}</td></tr>`;
  }
}

/* ── Alert Helpers ──────────────────────────────── */
function showIssueAlert(msg, type) {
  const el = document.getElementById('issue-alert');
  if (!el) return;
  el.textContent = msg;
  el.className   = `auth-alert ${type}`;
  el.style.display = 'block';
}
function hideIssueAlert() {
  const el = document.getElementById('issue-alert');
  if (el) el.style.display = 'none';
}
