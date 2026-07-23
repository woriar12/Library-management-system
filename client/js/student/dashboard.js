/* ============================================
   js/student/dashboard.js - Student Dashboard
   ============================================ */
let selectedFineId = null;

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth('student')) return;
  renderSidebarUser();
  initSidebarToggle();
  renderTopbarDate();

  await loadStudentDashboard();
  initReceiptModal();
});

/* ── Load All Dashboard Data ────────────────────── */
async function loadStudentDashboard() {
  try {
    const data = await apiRequest('GET', '/student/stats');

    // Stat cards
    document.getElementById('stat-issued').textContent   = data.counts.issued;
    document.getElementById('stat-returned').textContent = data.counts.returned;
    document.getElementById('stat-fine').textContent     = `₹${data.counts.fines}`;

    renderIssuedBooks(data.issuedBooks);
    renderPendingFines(data.pendingFines);
    renderHistory([...data.issuedBooks, ...data.returnedBooks]);
  } catch (err) {
    showToast('Failed to load dashboard: ' + err.message, 'error');
  }
}

/* ── Render Currently Issued Books ──────────────── */
function renderIssuedBooks(books) {
  const container = document.getElementById('issued-books-list');
  if (!books || books.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="icon">📚</div><p>No books currently issued.</p></div>';
    return;
  }

  container.innerHTML = books.map(issue => {
    const days = daysUntilDue(issue.dueDate);
    let dueBadge;
    if (issue.status === 'overdue' || days < 0) {
      dueBadge = `<span class="badge badge-danger">Overdue by ${Math.abs(days)} day(s)</span>`;
    } else if (days === 0) {
      dueBadge = '<span class="badge badge-warning">Due Today!</span>';
    } else if (days <= 3) {
      dueBadge = `<span class="badge badge-warning">Due in ${days} day(s)</span>`;
    } else {
      dueBadge = `<span class="badge badge-info">Due: ${formatDate(issue.dueDate)}</span>`;
    }

    return `
      <div class="book-item">
        <div class="book-title">${issue.book?.name || '—'}</div>
        <div class="book-meta">${issue.book?.author || ''} &bull; ${issue.book?.category || ''}</div>
        <div style="margin-top:.4rem;">${dueBadge}</div>
      </div>
    `;
  }).join('');
}

/* ── Render Pending Fines ───────────────────────── */
function renderPendingFines(fines) {
  const container = document.getElementById('pending-fines-list');
  if (!fines || fines.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="icon">✅</div><p>No pending fines.</p></div>';
    return;
  }

  container.innerHTML = fines.map(fine => {
    const bookName   = fine.issuedBook?.book?.name || '—';
    const hasReceipt = !!fine.receiptPath;
    const dueDate    = fine.issuedBook?.dueDate;
    const overdueDays = dueDate
      ? Math.ceil((new Date() - new Date(dueDate)) / (1000 * 60 * 60 * 24))
      : null;

    return `
      <div class="fine-card">
        <div class="fine-card-top">
          <div class="fine-book-info">
            <div class="fine-book-name">📖 ${bookName}</div>
            ${overdueDays !== null ? `<div class="fine-overdue-badge">⏰ Overdue by ${overdueDays} day(s)</div>` : ''}
          </div>
          <div class="fine-amount-box">₹${fine.amount}</div>
        </div>
        <div class="fine-card-bottom">
          <div class="fine-receipt-status ${hasReceipt ? 'uploaded' : 'not-uploaded'}">
            ${hasReceipt
              ? '✅ Receipt uploaded — awaiting admin approval'
              : '⚠️ Payment receipt not uploaded yet'}
          </div>
          <button
            class="btn ${hasReceipt ? 'btn-outline' : 'btn-primary'} btn-upload-trigger"
            onclick="openReceiptModal('${fine._id}', '${bookName.replace(/'/g, "\\'")}')"
          >
            ${hasReceipt ? '🔄 Re-upload Receipt' : '📤 Upload Receipt'}
          </button>
        </div>
      </div>
    `;
  }).join('');
}


/* ── Render History Table ───────────────────────── */
function renderHistory(allIssues) {
  const tbody = document.getElementById('history-table-body');
  if (!allIssues || allIssues.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted" style="padding:1.5rem;">No history yet.</td></tr>';
    return;
  }

  // Sort by issue date desc
  allIssues.sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate));

  tbody.innerHTML = allIssues.map(issue => {
    let statusBadge;
    if (issue.status === 'returned') {
      statusBadge = '<span class="badge badge-success">Returned</span>';
    } else if (issue.status === 'overdue') {
      statusBadge = '<span class="badge badge-danger">Overdue</span>';
    } else {
      statusBadge = '<span class="badge badge-info">Issued</span>';
    }

    const fineText = issue.fine > 0
      ? `<span class="${issue.fineStatus === 'paid' ? 'text-success' : 'text-danger'} fw-semi">₹${issue.fine}${issue.fineStatus === 'paid' ? ' (Paid)' : ''}</span>`
      : '<span class="text-success">None</span>';

    return `
      <tr>
        <td><strong>${issue.book?.name || '—'}</strong></td>
        <td>${issue.book?.author || '—'}</td>
        <td>${formatDate(issue.issueDate)}</td>
        <td>${formatDate(issue.dueDate)}</td>
        <td>${issue.returnDate ? formatDate(issue.returnDate) : '—'}</td>
        <td>${fineText}</td>
        <td>${statusBadge}</td>
      </tr>
    `;
  }).join('');
}

/* ── Receipt Upload Modal ───────────────────────── */
function openReceiptModal(fineId, bookName) {
  selectedFineId = fineId;
  document.getElementById('receipt-fine-id').value = fineId;
  document.getElementById('receipt-file').value    = '';
  document.getElementById('receipt-file-label').textContent = 'Click or drag a file here';
  document.getElementById('modal-book-name').textContent = bookName || '';
  hideReceiptAlert();
  document.getElementById('receipt-modal')?.classList.add('open');
}

function initReceiptModal() {
  const form     = document.getElementById('receipt-form');
  const fileInput = document.getElementById('receipt-file');
  const dropzone  = document.getElementById('file-dropzone');
  const fileLabel = document.getElementById('receipt-file-label');

  document.getElementById('modal-close')?.addEventListener('click', closeModal);
  document.getElementById('modal-cancel')?.addEventListener('click', closeModal);
  document.getElementById('receipt-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'receipt-modal') closeModal();
  });

  // Show selected filename in dropzone
  fileInput?.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (file && fileLabel) {
      fileLabel.textContent = `✅ ${file.name}`;
      dropzone?.classList.add('file-selected');
    }
  });

  // Drag & Drop support
  dropzone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.style.background = 'rgba(99,102,241,.15)';
  });
  dropzone?.addEventListener('dragleave', () => {
    dropzone.style.background = '';
  });
  dropzone?.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.style.background = '';
    const file = e.dataTransfer.files[0];
    if (file) {
      // Assign to file input
      const dt = new DataTransfer();
      dt.items.add(file);
      fileInput.files = dt.files;
      if (fileLabel) fileLabel.textContent = `✅ ${file.name}`;
    }
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn  = document.getElementById('btn-upload-receipt');
    const file = fileInput?.files[0];

    if (!file) {
      showReceiptAlert('Please select a file.', 'error');
      return;
    }

    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      showReceiptAlert('Only JPG, PNG, and PDF files are allowed.', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showReceiptAlert('File size must be less than 5MB.', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('receipt', file);

    btn.disabled    = true;
    btn.textContent = '⏳ Uploading...';

    try {
      await apiRequest('POST', `/fines/${selectedFineId}/receipt`, formData);
      showToast('Receipt uploaded successfully! Admin will verify soon.', 'success');
      closeModal();
      await loadStudentDashboard();
    } catch (err) {
      showReceiptAlert(err.message, 'error');
    } finally {
      btn.disabled    = false;
      btn.textContent = '📤 Upload Receipt';
    }
  });
}

function showReceiptAlert(msg, type) {
  const el = document.getElementById('receipt-alert');
  if (!el) return;
  el.textContent = msg;
  el.className   = `auth-alert ${type}`;
  el.style.display = 'block';
}
function hideReceiptAlert() {
  const el = document.getElementById('receipt-alert');
  if (el) el.style.display = 'none';
}
function closeModal() {
  document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open'));
}
