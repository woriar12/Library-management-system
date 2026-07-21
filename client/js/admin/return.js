/* ============================================
   js/admin/return.js - Return Book Logic
   ============================================ */
let returnPage = 1;
let returnStatusFilter = 'issued';
let selectedIssueId = null;
let selectedIssueData = null;

document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth('admin')) return;
  renderSidebarUser();
  initSidebarToggle();
  renderTopbarDate();

  loadReturnBooks();
  initModal();

  document.getElementById('filter-status')?.addEventListener('change', (e) => {
    returnStatusFilter = e.target.value;
    loadReturnBooks(1);
  });
});

/* ── Load Books to Return ───────────────────────── */
async function loadReturnBooks(page = 1) {
  returnPage = page;
  const tbody = document.getElementById('return-table-body');
  tbody.innerHTML = '<tr><td colspan="8" class="text-center" style="padding:1.5rem;">Loading...</td></tr>';

  try {
    const params = new URLSearchParams({ page, limit: 10 });
    if (returnStatusFilter) params.append('status', returnStatusFilter);

    const data = await apiRequest('GET', `/issues?${params}`);
    document.getElementById('return-count').textContent = `${data.total} record(s)`;

    if (!data.issues.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center" style="padding:2rem;"><div class="empty-state"><div class="icon">📥</div>No issued books found.</div></td></tr>';
      document.getElementById('return-pagination').innerHTML = '';
      return;
    }

    tbody.innerHTML = data.issues.map(issue => {
      const now  = new Date();
      const due  = new Date(issue.dueDate);
      const overdueDays = now > due ? Math.ceil((now - due) / (1000 * 60 * 60 * 24)) : 0;
      const estimatedFine = overdueDays * 5;

      const statusBadge = issue.status === 'overdue'
        ? '<span class="badge badge-danger">Overdue</span>'
        : issue.status === 'returned'
        ? '<span class="badge badge-success">Returned</span>'
        : '<span class="badge badge-info">Issued</span>';

      const canReturn = issue.status !== 'returned';

      return `
        <tr>
          <td><strong>${issue.student?.name || '—'}</strong></td>
          <td><span class="badge badge-muted">${issue.student?.uid || '—'}</span></td>
          <td>${issue.book?.name || '—'}</td>
          <td>${formatDate(issue.issueDate)}</td>
          <td>${formatDate(issue.dueDate)}</td>
          <td>${statusBadge}</td>
          <td>${estimatedFine > 0 ? `<span class="text-danger fw-semi">₹${estimatedFine}</span>` : '<span class="text-success">None</span>'}</td>
          <td>
            ${canReturn
              ? `<button class="btn btn-sm btn-success" onclick="openReturnModal('${issue._id}')">📥 Return</button>`
              : '<span class="text-muted" style="font-size:.8rem;">Returned</span>'
            }
          </td>
        </tr>
      `;
    }).join('');

    renderPagination('return-pagination', data.page, data.totalPages, loadReturnBooks);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center text-danger" style="padding:1.5rem;">${err.message}</td></tr>`;
  }
}

/* ── Open Return Confirm Modal ──────────────────── */
async function openReturnModal(issueId) {
  try {
    // Fetch the specific issue to show details
    const data = await apiRequest('GET', `/issues?page=1&limit=200`);
    const issue = data.issues.find(i => i._id === issueId);

    if (!issue) {
      showToast('Issue record not found.', 'error');
      return;
    }

    selectedIssueId   = issueId;
    selectedIssueData = issue;

    const now = new Date();
    const due = new Date(issue.dueDate);
    const overdueDays = now > due ? Math.ceil((now - due) / (1000 * 60 * 60 * 24)) : 0;
    const estimatedFine = overdueDays * 5;

    // Populate detail box
    document.getElementById('return-detail').innerHTML = `
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Student</div>
          <div class="info-value fw-semi">${issue.student?.name}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Book</div>
          <div class="info-value fw-semi">${issue.book?.name}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Issue Date</div>
          <div class="info-value">${formatDate(issue.issueDate)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Due Date</div>
          <div class="info-value">${formatDate(issue.dueDate)}</div>
        </div>
      </div>
    `;

    const fineBox = document.getElementById('fine-preview');
    if (overdueDays > 0) {
      fineBox.style.background = '#fee2e2';
      fineBox.innerHTML = `⚠️ <strong>Book is overdue by ${overdueDays} day(s).</strong><br>Estimated fine: <strong>₹${estimatedFine}</strong> (₹5/day)`;
    } else {
      fineBox.style.background = '#dcfce7';
      fineBox.innerHTML = `✅ <strong>Book is within due date. No fine.</strong>`;
    }

    openModal('return-modal');
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
}

/* ── Confirm Return ─────────────────────────────── */
async function confirmReturn() {
  if (!selectedIssueId) return;
  const btn = document.getElementById('btn-confirm-return');
  btn.disabled = true;
  btn.textContent = 'Processing...';

  try {
    const res = await apiRequest('PUT', `/issues/${selectedIssueId}/return`);
    showToast(res.message, 'success');
    closeModal();
    loadReturnBooks(returnPage);
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = '✅ Confirm Return';
    selectedIssueId = null;
  }
}

/* ── Modal ──────────────────────────────────────── */
function initModal() {
  document.getElementById('modal-close')?.addEventListener('click', closeModal);
  document.getElementById('modal-cancel')?.addEventListener('click', closeModal);
  document.getElementById('btn-confirm-return')?.addEventListener('click', confirmReturn);
  document.getElementById('return-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'return-modal') closeModal();
  });
}

function openModal(id) { document.getElementById(id)?.classList.add('open'); }
function closeModal()  { document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open')); }
