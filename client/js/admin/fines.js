/* ============================================
   js/admin/fines.js - Fine Management Logic
   ============================================ */
let finePage   = 1;
let fineFilter = 'pending';

document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth('admin')) return;
  renderSidebarUser();
  initSidebarToggle();
  renderTopbarDate();

  loadFines();
  loadFineStats();

  document.getElementById('fine-filter')?.addEventListener('change', (e) => {
    fineFilter = e.target.value;
    loadFines(1);
  });
});

/* ── Load Fine Stats ────────────────────────────── */
async function loadFineStats() {
  try {
    // Load all fines to compute totals
    const pending = await apiRequest('GET', '/fines?status=pending&limit=1000');
    const paid    = await apiRequest('GET', '/fines?status=paid&limit=1000');

    const pendingAmount = pending.fines.reduce((sum, f) => sum + f.amount, 0);
    const paidAmount    = paid.fines.reduce((sum, f) => sum + f.amount, 0);

    // Unique students with pending fines
    const uniqueStudents = new Set(pending.fines.map(f => f.student?._id)).size;

    document.getElementById('stat-pending-amount').textContent = `₹${pendingAmount}`;
    document.getElementById('stat-pending-count').textContent  = uniqueStudents;
    document.getElementById('stat-paid-amount').textContent    = `₹${paidAmount}`;
  } catch (err) {
    console.error('Stats error:', err);
  }
}

/* ── Load Fines Table ───────────────────────────── */
async function loadFines(page = 1) {
  finePage = page;
  const tbody = document.getElementById('fines-table-body');
  tbody.innerHTML = '<tr><td colspan="8" class="text-center" style="padding:1.5rem;">Loading...</td></tr>';

  try {
    const params = new URLSearchParams({ page, limit: 10 });
    if (fineFilter) params.append('status', fineFilter);

    const data = await apiRequest('GET', `/fines?${params}`);
    document.getElementById('fine-count').textContent = `${data.total} record(s)`;

    if (!data.fines.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center" style="padding:2rem;"><div class="empty-state"><div class="icon">💰</div>No fines found.</div></td></tr>';
      document.getElementById('fines-pagination').innerHTML = '';
      return;
    }

    tbody.innerHTML = data.fines.map(fine => {
      const bookName = fine.issuedBook?.book?.name || '—';
      const receiptHtml = fine.receiptPath
        ? `<a href="${fine.receiptPath}" target="_blank" class="btn btn-sm btn-outline">📄 View</a>`
        : '<span class="text-muted" style="font-size:.8rem;">None</span>';

      const actionHtml = fine.status === 'pending'
        ? `<button class="btn btn-sm btn-success" onclick="markPaid('${fine._id}')">✅ Mark Paid</button>`
        : '<span class="badge badge-success">Paid</span>';

      return `
        <tr>
          <td><strong>${fine.student?.name || '—'}</strong></td>
          <td><span class="badge badge-muted">${fine.student?.uid || '—'}</span></td>
          <td>${bookName}</td>
          <td class="fw-bold text-danger">₹${fine.amount}</td>
          <td>
            ${fine.status === 'paid'
              ? '<span class="badge badge-success">Paid</span>'
              : '<span class="badge badge-danger">Pending</span>'
            }
          </td>
          <td>${receiptHtml}</td>
          <td>${fine.paidAt ? formatDate(fine.paidAt) : formatDate(fine.createdAt)}</td>
          <td>${actionHtml}</td>
        </tr>
      `;
    }).join('');

    renderPagination('fines-pagination', data.page, data.totalPages, loadFines);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center text-danger" style="padding:1.5rem;">${err.message}</td></tr>`;
  }
}

/* ── Mark Fine as Paid ──────────────────────────── */
async function markPaid(fineId) {
  confirmAction('Mark this fine as paid?', async () => {
    try {
      await apiRequest('PUT', `/fines/${fineId}/pay`);
      showToast('Fine marked as paid!', 'success');
      loadFines(finePage);
      loadFineStats();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}
