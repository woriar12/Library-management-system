/* ============================================
   js/admin/books.js - Books CRUD Logic
   ============================================ */
let currentPage = 1;
let currentSearch = '';
let currentCategory = '';
let editingBookId = null;

document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth('admin')) return;
  renderSidebarUser();
  initSidebarToggle();
  renderTopbarDate();

  loadBooks();
  initModalHandlers();
  initSearchHandlers();
});

/* ── Load Books ───────────────────────────────── */
async function loadBooks(page = 1) {
  currentPage = page;
  const tbody = document.getElementById('books-table-body');
  tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted" style="padding:1.5rem;">Loading...</td></tr>';

  try {
    const params = new URLSearchParams({ page, limit: 10 });
    if (currentSearch)   params.append('search', currentSearch);
    if (currentCategory) params.append('category', currentCategory);

    const data = await apiRequest('GET', `/books?${params}`);

    document.getElementById('book-count').textContent = `${data.total} book(s)`;

    if (!data.books.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center" style="padding:2rem;"><div class="empty-state"><div class="icon">📚</div>No books found.</div></td></tr>';
      document.getElementById('books-pagination').innerHTML = '';
      return;
    }

    tbody.innerHTML = data.books.map(book => `
      <tr>
        <td><span class="badge badge-muted">${book.bookId}</span></td>
        <td><strong>${book.name}</strong></td>
        <td>${book.author}</td>
        <td><span class="badge badge-info">${book.category}</span></td>
        <td class="text-center">${book.quantity}</td>
        <td class="text-center">
          <span class="${book.availableQuantity > 0 ? 'text-success fw-semi' : 'text-danger fw-semi'}">
            ${book.availableQuantity}
          </span>
        </td>
        <td>
          ${book.availableQuantity > 0
            ? '<span class="badge badge-success">Available</span>'
            : '<span class="badge badge-danger">Unavailable</span>'
          }
        </td>
        <td>
          <div style="display:flex;gap:.4rem;">
            <button class="btn btn-sm btn-outline" onclick="openEditModal('${book._id}')">✏️ Edit</button>
            <button class="btn btn-sm btn-danger" onclick="deleteBook('${book._id}', '${book.name}')">🗑️</button>
          </div>
        </td>
      </tr>
    `).join('');

    renderPagination('books-pagination', data.page, data.totalPages, loadBooks);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center text-danger" style="padding:1.5rem;">${err.message}</td></tr>`;
  }
}

/* ── Modal Handlers ─────────────────────────────── */
function initModalHandlers() {
  const modal   = document.getElementById('book-modal');
  const form    = document.getElementById('book-form');
  const openBtn = document.getElementById('btn-add-book');
  const closeBtn = document.getElementById('modal-close');
  const cancelBtn = document.getElementById('modal-cancel');

  openBtn?.addEventListener('click', openAddModal);
  closeBtn?.addEventListener('click', closeModal);
  cancelBtn?.addEventListener('click', closeModal);

  // Close on overlay click
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  form?.addEventListener('submit', handleFormSubmit);
}

function openAddModal() {
  editingBookId = null;
  document.getElementById('modal-title').textContent = 'Add Book';
  document.getElementById('modal-submit').textContent = 'Save Book';
  document.getElementById('book-form').reset();
  document.getElementById('book-id').value = '';
  openModal('book-modal');
}

async function openEditModal(bookId) {
  try {
    const data = await apiRequest('GET', `/books/${bookId}`);
    const book = data.book;
    editingBookId = bookId;

    document.getElementById('modal-title').textContent = 'Edit Book';
    document.getElementById('modal-submit').textContent = 'Update Book';
    document.getElementById('book-id').value   = book._id;
    document.getElementById('f-name').value    = book.name;
    document.getElementById('f-author').value  = book.author;
    document.getElementById('f-category').value = book.category;
    document.getElementById('f-qty').value     = book.quantity;

    openModal('book-modal');
  } catch (err) {
    showToast('Failed to load book: ' + err.message, 'error');
  }
}

async function handleFormSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('modal-submit');
  btn.disabled = true;
  btn.textContent = 'Saving...';

  const payload = {
    name:     document.getElementById('f-name').value.trim(),
    author:   document.getElementById('f-author').value.trim(),
    category: document.getElementById('f-category').value.trim(),
    quantity: document.getElementById('f-qty').value,
  };

  if (!payload.name || !payload.author || !payload.category || !payload.quantity) {
    showToast('All fields are required.', 'error');
    btn.disabled = false;
    btn.textContent = editingBookId ? 'Update Book' : 'Save Book';
    return;
  }

  try {
    if (editingBookId) {
      await apiRequest('PUT', `/books/${editingBookId}`, payload);
      showToast('Book updated successfully!', 'success');
    } else {
      await apiRequest('POST', '/books', payload);
      showToast('Book added successfully!', 'success');
    }
    closeModal();
    loadBooks(currentPage);
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = editingBookId ? 'Update Book' : 'Save Book';
  }
}

/* ── Delete Book ────────────────────────────────── */
async function deleteBook(bookId, bookName) {
  confirmAction(`Delete "${bookName}"? This action cannot be undone.`, async () => {
    try {
      await apiRequest('DELETE', `/books/${bookId}`);
      showToast('Book deleted.', 'success');
      loadBooks(currentPage);
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

/* ── Search ─────────────────────────────────────── */
function initSearchHandlers() {
  document.getElementById('btn-search')?.addEventListener('click', () => {
    currentSearch   = document.getElementById('book-search').value.trim();
    currentCategory = document.getElementById('book-category').value.trim();
    loadBooks(1);
  });

  document.getElementById('btn-clear')?.addEventListener('click', () => {
    document.getElementById('book-search').value   = '';
    document.getElementById('book-category').value = '';
    currentSearch = '';
    currentCategory = '';
    loadBooks(1);
  });

  // Search on Enter key
  document.getElementById('book-search')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') document.getElementById('btn-search').click();
  });
}

/* ── Modal Helpers ──────────────────────────────── */
function openModal(id) {
  document.getElementById(id)?.classList.add('open');
}
function closeModal() {
  document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open'));
}
