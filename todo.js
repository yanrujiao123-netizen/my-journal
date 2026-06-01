/**
 * 首页待办功能
 */

// ============ Render ============

function renderTodos() {
  const listEl = document.getElementById('todo-list');
  const emptyEl = document.getElementById('todo-empty');
  const today = getTodayStr();
  const allTodos = getTodos().filter(t => formatDateStr(new Date(t.createdAt)) === today);

  // Sort: incomplete first, then by time desc
  allTodos.sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  if (allTodos.length === 0) {
    listEl.innerHTML = '';
    emptyEl.style.display = 'block';
    return;
  }

  emptyEl.style.display = 'none';
  listEl.innerHTML = allTodos.map(t => `
    <li class="todo-item" data-id="${t.id}" data-type="todo">
      <span class="todo-check ${t.completed ? 'done' : ''}">${t.completed ? '✓' : ''}</span>
      <span class="todo-text ${t.completed ? 'done' : ''}">${escapeHtml(t.content)}</span>
      <span class="todo-time">${formatTime(t.createdAt)}</span>
    </li>
  `).join('');

  // Bind events
  listEl.querySelectorAll('.todo-item').forEach(item => {
    const id = item.dataset.id;

    // Click to toggle
    item.addEventListener('click', (e) => {
      // Don't toggle if we just had a long press
      if (item.dataset.longPressed === 'true') {
        item.dataset.longPressed = 'false';
        return;
      }
      toggleTodo(id);
      renderTodos();
    });

    // Long press detection
    setupLongPress(item, () => {
      item.dataset.longPressed = 'true';
      showContextMenuForTodo(id, item);
    });
  });
}

function showContextMenuForTodo(id, element) {
  const menu = document.getElementById('context-menu');
  const rect = element.getBoundingClientRect();

  // Position menu
  menu.style.top = (rect.bottom + 4) + 'px';
  menu.style.left = (rect.left + 20) + 'px';
  menu.classList.remove('hidden');
  menu.dataset.targetId = id;
  menu.dataset.targetType = 'todo';

  // Close on outside click
  setTimeout(() => {
    document.addEventListener('click', closeContextMenu, { once: true });
    document.addEventListener('touchstart', closeContextMenu, { once: true });
  }, 50);
}

function closeContextMenu() {
  document.getElementById('context-menu').classList.add('hidden');
}

// ============ Add Todo Modal ============

function showAddTodoModal() {
  const modal = document.getElementById('modal-todo-input');
  const input = document.getElementById('input-todo');
  modal.classList.remove('hidden');
  input.value = '';
  setTimeout(() => input.focus(), 300);
}

function hideAddTodoModal() {
  document.getElementById('modal-todo-input').classList.add('hidden');
}

function saveTodo() {
  const input = document.getElementById('input-todo');
  const content = input.value.trim();
  if (!content) {
    showToast('请输入待办内容');
    return;
  }
  addTodo(content);
  hideAddTodoModal();
  renderTodos();
  showToast('待办已添加 ✓');
}

// ============ Edit / Delete Todo ============

function editTodoInline(id) {
  const todos = getTodos();
  const todo = todos.find(t => t.id === id);
  if (!todo) return;

  const modal = document.getElementById('modal-todo-input');
  const input = document.getElementById('input-todo');
  const titleEl = modal.querySelector('.modal-title');

  titleEl.textContent = '编辑待办事项';
  input.value = todo.content;
  modal.classList.remove('hidden');
  setTimeout(() => input.focus(), 300);

  // Override save
  const saveBtn = document.getElementById('btn-save-todo');
  const cancelBtn = document.getElementById('btn-cancel-todo');

  const saveHandler = () => {
    const newContent = input.value.trim();
    if (!newContent) return;
    updateTodo(id, { content: newContent });
    hideAddTodoModal();
    renderTodos();
    showToast('待办已更新 ✓');
    saveBtn.removeEventListener('click', saveHandler);
    cancelBtn.removeEventListener('click', cancelHandler);
    titleEl.textContent = '添加待办事项';
  };

  const cancelHandler = () => {
    hideAddTodoModal();
    saveBtn.removeEventListener('click', saveHandler);
    cancelBtn.removeEventListener('click', cancelHandler);
    titleEl.textContent = '添加待办事项';
  };

  saveBtn.addEventListener('click', saveHandler);
  cancelBtn.addEventListener('click', cancelHandler);
}

function deleteTodoItem(id) {
  if (!confirm('确定要删除这个待办事项吗？')) return;
  deleteTodo(id);
  renderTodos();
  showToast('待办已删除');
}

// ============ Long Press Helper ============

function setupLongPress(element, callback) {
  let timer;
  let moved = false;

  element.addEventListener('touchstart', (e) => {
    moved = false;
    timer = setTimeout(() => {
      if (!moved) {
        callback();
      }
    }, 600);
  }, { passive: true });

  element.addEventListener('touchmove', () => {
    moved = true;
    clearTimeout(timer);
  }, { passive: true });

  element.addEventListener('touchend', () => {
    clearTimeout(timer);
  });
}

// ============ Init ============

function initTodoPage() {
  document.getElementById('todo-date').textContent = formatDateCN(getTodayStr());
  renderTodos();
}
