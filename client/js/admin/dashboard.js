/* ============================================
   js/admin/dashboard.js - Admin Dashboard Logic
   ============================================ */
document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth('admin')) return;
  renderSidebarUser();
  initSidebarToggle();
  renderTopbarDate();
  await loadDashboardStats();
});

let statusChart = null;

async function loadDashboardStats() {
  try {
    const data = await apiRequest('GET', '/admin/stats');
    const { stats, recentIssues } = data;

    // Populate stat cards
    document.getElementById('stat-books').textContent    = stats.totalBooks;
    document.getElementById('stat-students').textContent = stats.totalStudents;
    document.getElementById('stat-issued').textContent   = stats.booksIssued;
    document.getElementById('stat-returned').textContent = stats.booksReturned;
    document.getElementById('stat-overdue').textContent  = stats.overdueBooks;

    // Render Chart
    renderChart(stats);

    // Render Recent Issues
    renderRecentIssues(recentIssues);
  } catch (err) {
    showToast('Failed to load dashboard: ' + err.message, 'error');
  }
}

function renderChart(stats) {
  const ctx = document.getElementById('statusChart');
  if (!ctx) return;

  if (statusChart) statusChart.destroy();

  statusChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Issued', 'Returned', 'Overdue'],
      datasets: [{
        data: [stats.booksIssued, stats.booksReturned, stats.overdueBooks],
        backgroundColor: ['#3b82f6', '#10b981', '#ef4444'],
        borderWidth: 0,
        hoverOffset: 8,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 12, padding: 16, font: { size: 12 } } },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.label}: ${ctx.parsed}`,
          },
        },
      },
      cutout: '65%',
    },
  });
}

function renderRecentIssues(issues) {
  const tbody = document.getElementById('recent-issues-body');
  if (!tbody) return;

  if (!issues || issues.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted" style="padding:1.5rem;">No issued books yet</td></tr>';
    return;
  }

  tbody.innerHTML = issues.map(issue => {
    const days = daysUntilDue(issue.dueDate);
    let statusBadge;
    if (issue.status === 'returned') {
      statusBadge = '<span class="badge badge-success">Returned</span>';
    } else if (issue.status === 'overdue' || days < 0) {
      statusBadge = `<span class="badge badge-danger">Overdue</span>`;
    } else if (days <= 2) {
      statusBadge = `<span class="badge badge-warning">Due Soon</span>`;
    } else {
      statusBadge = '<span class="badge badge-info">Issued</span>';
    }

    return `
      <tr>
        <td>
          <div class="fw-semi">${issue.student?.name || '—'}</div>
          <div class="text-muted" style="font-size:.78rem;">${issue.student?.uid || ''}</div>
        </td>
        <td>
          <div>${issue.book?.name || '—'}</div>
          <div class="text-muted" style="font-size:.78rem;">${issue.book?.author || ''}</div>
        </td>
        <td>${formatDate(issue.dueDate)}</td>
        <td>${statusBadge}</td>
      </tr>
    `;
  }).join('');
}
