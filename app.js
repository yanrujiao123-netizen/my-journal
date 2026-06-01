/**
 * 主入口 — Tab 切换、全局事件、初始化
 */

// ============ Utilities ============

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.remove('hidden');
  // Re-trigger animation
  toast.style.animation = 'none';
  toast.offsetHeight; // reflow
  toast.style.animation = 'toastIn 0.3s ease, toastOut 0.3s ease 1.5s forwards';
}

// ============ Tab Switching ============

function switchPage(pageName) {
  // Update pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(`page-${pageName}`).classList.add('active');

  // Update tabs
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`.tab-btn[data-page="${pageName}"]`).classList.add('active');

  // Refresh page content
  if (pageName === 'todo') {
    initTodoPage();
  } else if (pageName === 'warehouse') {
    initWarehousePage();
  } else if (pageName === 'calendar') {
    initCalendarPage();
  }

  // Close any open modals
  closeAllModals();
}

function closeAllModals() {
  document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
  document.getElementById('context-menu').classList.add('hidden');
  document.getElementById('add-menu').classList.add('hidden');
}

// ============ Context Menu Actions ============

document.getElementById('context-menu').addEventListener('click', (e) => {
  const menuItem = e.target.closest('.menu-item');
  if (!menuItem) return;

  const action = menuItem.dataset.action;
  const menu = document.getElementById('context-menu');
  const targetId = menu.dataset.targetId;
  const targetType = menu.dataset.targetType;

  menu.classList.add('hidden');

  if (targetType === 'todo') {
    if (action === 'edit') {
      editTodoInline(targetId);
    } else if (action === 'delete') {
      deleteTodoItem(targetId);
    }
  }
});

// ============ Modal Events ============

// --- Todo Input Modal ---
document.getElementById('btn-add-todo').addEventListener('click', showAddTodoModal);
document.getElementById('btn-cancel-todo').addEventListener('click', hideAddTodoModal);
document.getElementById('btn-save-todo').addEventListener('click', saveTodo);
document.getElementById('modal-todo-input').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) hideAddTodoModal();
});
document.getElementById('input-todo').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    saveTodo();
  }
});

// --- Entry Input Modal ---
document.getElementById('btn-add-entry').addEventListener('click', (e) => {
  e.stopPropagation();
  showAddMenu();
});
document.getElementById('btn-cancel-entry').addEventListener('click', hideEntryModal);
document.getElementById('btn-save-entry').addEventListener('click', saveEntryFromModal);
document.getElementById('modal-entry-input').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) hideEntryModal();
});

// Delete button inside entry modal (event delegation - the button may not exist yet)
document.getElementById('modal-entry-input').addEventListener('click', (e) => {
  if (e.target.id === 'btn-delete-entry') {
    deleteEntryFromModal();
  }
});

// Add menu click handlers
document.getElementById('add-menu').addEventListener('click', (e) => {
  const menuItem = e.target.closest('.menu-item');
  if (!menuItem) return;
  const type = menuItem.dataset.type;
  showAddEntryModal(type);
});

// --- Day Detail Modal ---
document.getElementById('modal-day-detail').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) hideDayDetail();
});

// --- Export Modal ---
document.getElementById('btn-export').addEventListener('click', showExportModal);
document.getElementById('btn-cancel-export').addEventListener('click', hideExportModal);
document.getElementById('btn-confirm-export').addEventListener('click', doExport);
document.getElementById('modal-export').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) hideExportModal();
});

// --- Calendar Navigation ---
document.getElementById('btn-prev-month').addEventListener('click', prevMonth);
document.getElementById('btn-next-month').addEventListener('click', nextMonth);

// --- Tab Bar ---
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    switchPage(btn.dataset.page);
  });
});

// --- Close context menu on scroll ---
document.getElementById('content').addEventListener('scroll', () => {
  document.getElementById('context-menu').classList.add('hidden');
  document.getElementById('add-menu').classList.add('hidden');
}, { passive: true });

// ============ Prevent unwanted long-press menu on mobile ============
document.addEventListener('contextmenu', (e) => {
  // Allow context menu on input fields
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  // Prevent on our custom long-press elements
  if (e.target.closest('.todo-item') || e.target.closest('.entry-card')) {
    e.preventDefault();
  }
});

// ============ Init ============

function init() {
  // Set today's dates
  const todayStr = getTodayStr();
  document.getElementById('todo-date').textContent = formatDateCN(todayStr);
  document.getElementById('warehouse-date').textContent = formatDateCN(todayStr);

  // Render initial page
  renderTodos();
  renderWarehouse();

  // Init calendar (set current month/year)
  const now = new Date();
  calendarYear = now.getFullYear();
  calendarMonth = now.getMonth();
}

// Start app
document.addEventListener('DOMContentLoaded', () => {
  init();
});

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {
    // Silent fail - app works without SW
  });
}
