/**
 * localStorage 数据存储封装
 * 所有数据的读写都通过这里，统一序列化/反序列化
 */

const STORAGE_KEYS = {
  todos: 'journal_todos',
  logs: 'journal_logs',
  excerpts: 'journal_excerpts'
};

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
}

// ============ Todos ============

function getTodos() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.todos) || '[]');
  } catch (e) {
    return [];
  }
}

function saveTodos(todos) {
  localStorage.setItem(STORAGE_KEYS.todos, JSON.stringify(todos));
}

function addTodo(content) {
  const todos = getTodos();
  const todo = {
    id: generateId(),
    content: content.trim(),
    completed: false,
    createdAt: new Date().toISOString(),
    completedAt: null
  };
  todos.unshift(todo);
  saveTodos(todos);
  return todo;
}

function updateTodo(id, updates) {
  const todos = getTodos();
  const index = todos.findIndex(t => t.id === id);
  if (index === -1) return null;
  todos[index] = { ...todos[index], ...updates };
  saveTodos(todos);
  return todos[index];
}

function deleteTodo(id) {
  const todos = getTodos();
  const filtered = todos.filter(t => t.id !== id);
  saveTodos(filtered);
}

function toggleTodo(id) {
  const todos = getTodos();
  const todo = todos.find(t => t.id === id);
  if (!todo) return null;
  todo.completed = !todo.completed;
  todo.completedAt = todo.completed ? new Date().toISOString() : null;
  saveTodos(todos);
  return todo;
}

function getTodosByDate(dateStr) {
  // dateStr: 'YYYY-MM-DD'
  return getTodos().filter(t => {
    const d = new Date(t.createdAt);
    return formatDateStr(d) === dateStr;
  });
}

// ============ Logs ============

function getLogs() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.logs) || '[]');
  } catch (e) {
    return [];
  }
}

function saveLogs(logs) {
  localStorage.setItem(STORAGE_KEYS.logs, JSON.stringify(logs));
}

function addLog(content) {
  const logs = getLogs();
  const log = {
    id: generateId(),
    content: content.trim(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  logs.unshift(log);
  saveLogs(logs);
  return log;
}

function updateLog(id, content) {
  const logs = getLogs();
  const log = logs.find(l => l.id === id);
  if (!log) return null;
  log.content = content.trim();
  log.updatedAt = new Date().toISOString();
  saveLogs(logs);
  return log;
}

function deleteLog(id) {
  const logs = getLogs();
  saveLogs(logs.filter(l => l.id !== id));
}

function getLogsByDate(dateStr) {
  return getLogs().filter(l => {
    const d = new Date(l.createdAt);
    return formatDateStr(d) === dateStr;
  });
}

// ============ Excerpts ============

function getExcerpts() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.excerpts) || '[]');
  } catch (e) {
    return [];
  }
}

function saveExcerpts(excerpts) {
  localStorage.setItem(STORAGE_KEYS.excerpts, JSON.stringify(excerpts));
}

function addExcerpt(content) {
  const excerpts = getExcerpts();
  const excerpt = {
    id: generateId(),
    content: content.trim(),
    source: '',
    createdAt: new Date().toISOString()
  };
  excerpts.unshift(excerpt);
  saveExcerpts(excerpts);
  return excerpt;
}

function updateExcerpt(id, content) {
  const excerpts = getExcerpts();
  const ex = excerpts.find(e => e.id === id);
  if (!ex) return null;
  ex.content = content.trim();
  saveExcerpts(excerpts);
  return ex;
}

function deleteExcerpt(id) {
  const excerpts = getExcerpts();
  saveExcerpts(excerpts.filter(e => e.id !== id));
}

function getExcerptsByDate(dateStr) {
  return getExcerpts().filter(e => {
    const d = new Date(e.createdAt);
    return formatDateStr(d) === dateStr;
  });
}

// ============ Helpers ============

function formatDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getTodayStr() {
  return formatDateStr(new Date());
}

function formatDateCN(dateStr) {
  // dateStr: 'YYYY-MM-DD' → '2024年1月15日 星期一'
  const d = new Date(dateStr);
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${weekdays[d.getDay()]}`;
}

function formatTime(isoStr) {
  const d = new Date(isoStr);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
