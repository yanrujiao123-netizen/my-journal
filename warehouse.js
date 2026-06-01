/**
 * 个人仓库功能 — 个人日志 + 文字摘抄
 */

let currentEntryType = 'log';   // 'log' | 'excerpt'
let currentEntryId = null;      // null = add mode, string = edit mode
let searchQuery = '';

// ============ Render ============

function renderWarehouse() {
  const container = document.getElementById('warehouse-content');
  const emptyEl = document.getElementById('warehouse-empty');
  const q = searchQuery.toLowerCase().trim();

  let logs = getLogs();
  let excerpts = getExcerpts();

  // Filter by search query
  if (q) {
    logs = logs.filter(l => l.content.toLowerCase().includes(q));
    excerpts = excerpts.filter(e => e.content.toLowerCase().includes(q));
  }

  // Sort by time descending
  logs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  excerpts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const hasContent = logs.length > 0 || excerpts.length > 0;

  if (!hasContent && !q) {
    container.innerHTML = '';
    emptyEl.style.display = 'block';
    return;
  }

  emptyEl.style.display = 'none';

  let html = '';

  // Logs Section
  if (logs.length > 0 || (q && getLogs().some(l => l.content.toLowerCase().includes(q)))) {
    html += `<div class="section-title"><span class="dot pink"></span> 个人日志</div>`;
    if (logs.length === 0) {
      html += `<div class="detail-empty">没有匹配的记录</div>`;
    } else {
      html += `<div class="entry-list">${logs.map(l => renderEntryCard(l, 'log')).join('')}</div>`;
    }
  }

  // Excerpts Section
  if (excerpts.length > 0 || (q && getExcerpts().some(e => e.content.toLowerCase().includes(q)))) {
    html += `<div class="section-title"><span class="dot yellow"></span> 文字摘抄</div>`;
    if (excerpts.length === 0) {
      html += `<div class="detail-empty">没有匹配的记录</div>`;
    } else {
      html += `<div class="entry-list">${excerpts.map(e => renderEntryCard(e, 'excerpt')).join('')}</div>`;
    }
  }

  if (!html) {
    emptyEl.style.display = 'block';
    container.innerHTML = '';
  } else {
    container.innerHTML = html;
  }

  // Bind card click events
  container.querySelectorAll('.entry-card').forEach(card => {
    card.addEventListener('click', () => {
      showEntryDetail(card.dataset.id, card.dataset.type);
    });
  });
}

function renderEntryCard(item, type) {
  const cls = type === 'log' ? 'log-card' : 'excerpt-card';
  const dateStr = formatDateStr(new Date(item.createdAt));
  const today = getTodayStr();
  const dateLabel = dateStr === today ? '今天 ' + formatTime(item.createdAt) : dateStr + ' ' + formatTime(item.createdAt);

  return `
    <div class="entry-card ${cls}" data-id="${item.id}" data-type="${type}">
      <div class="entry-header">
        <span class="entry-time">${dateLabel}</span>
      </div>
      <div class="entry-text">${escapeHtml(item.content)}</div>
    </div>
  `;
}

// ============ Add Menu ============

function showAddMenu() {
  const menu = document.getElementById('add-menu');
  const wasHidden = menu.classList.contains('hidden');

  if (wasHidden) {
    menu.classList.remove('hidden');
    setTimeout(() => {
      document.addEventListener('click', hideAddMenu, { once: true });
      document.addEventListener('touchstart', hideAddMenu, { once: true });
    }, 50);
  } else {
    menu.classList.add('hidden');
  }
}

function hideAddMenu() {
  document.getElementById('add-menu').classList.add('hidden');
}

// ============ Entry Modal (Add & Edit) ============

function showAddEntryModal(type) {
  hideAddMenu();
  currentEntryType = type;
  currentEntryId = null; // add mode

  const modal = document.getElementById('modal-entry-input');
  const sheet = document.getElementById('entry-modal-sheet');
  const title = document.getElementById('entry-modal-title');
  const input = document.getElementById('input-entry');

  input.value = '';
  setEntryModalStyle(sheet, title, type, null);
  showDeleteButton(false);
  modal.classList.remove('hidden');
  setTimeout(() => input.focus(), 300);
}

function hideEntryModal() {
  document.getElementById('modal-entry-input').classList.add('hidden');
  showDeleteButton(false);
  currentEntryType = 'log';
  currentEntryId = null;
}

function setEntryModalStyle(sheet, title, type, dateLabel) {
  if (type === 'log') {
    title.textContent = dateLabel ? '📝 个人日志 - ' + dateLabel : '📝 个人日志';
    sheet.className = 'modal-sheet input-modal log-modal';
  } else {
    title.textContent = dateLabel ? '📋 文字摘抄 - ' + dateLabel : '📋 文字摘抄';
    sheet.className = 'modal-sheet input-modal excerpt-modal';
  }
}

function showDeleteButton(show) {
  let delBtn = document.getElementById('btn-delete-entry');
  if (show) {
    if (!delBtn) {
      delBtn = document.createElement('button');
      delBtn.id = 'btn-delete-entry';
      delBtn.className = 'btn btn-danger btn-sm';
      delBtn.textContent = '删除';
      delBtn.style.marginRight = 'auto';
      const actionsDiv = document.querySelector('#modal-entry-input .modal-actions');
      actionsDiv.insertBefore(delBtn, actionsDiv.firstChild);
    }
    delBtn.style.display = '';
  } else if (delBtn) {
    delBtn.style.display = 'none';
  }
}

// Called by save button (handles both add and edit)
function saveEntryFromModal() {
  const input = document.getElementById('input-entry');
  const content = input.value.trim();

  if (!content) {
    showToast('请输入内容');
    return;
  }

  if (currentEntryId) {
    // Edit mode
    if (currentEntryType === 'log') {
      updateLog(currentEntryId, content);
    } else {
      updateExcerpt(currentEntryId, content);
    }
    showToast('已更新 ✓');
  } else {
    // Add mode
    if (currentEntryType === 'log') {
      addLog(content);
      showToast('日志已保存 📝');
    } else {
      addExcerpt(content);
      showToast('摘抄已保存 📋');
    }
  }

  hideEntryModal();
  renderWarehouse();
}

// Called by delete button
function deleteEntryFromModal() {
  if (!currentEntryId) return;
  if (!confirm('确定要删除这条记录吗？')) return;

  if (currentEntryType === 'log') {
    deleteLog(currentEntryId);
  } else {
    deleteExcerpt(currentEntryId);
  }

  hideEntryModal();
  renderWarehouse();
  showToast('已删除');
}

// ============ View Entry Detail (click card → edit mode) ============

function showEntryDetail(id, type) {
  let item;
  if (type === 'log') {
    item = getLogs().find(l => l.id === id);
  } else {
    item = getExcerpts().find(e => e.id === id);
  }
  if (!item) return;

  currentEntryType = type;
  currentEntryId = id; // edit mode

  const modal = document.getElementById('modal-entry-input');
  const sheet = document.getElementById('entry-modal-sheet');
  const title = document.getElementById('entry-modal-title');
  const input = document.getElementById('input-entry');

  input.value = item.content;

  const dateStr = formatDateStr(new Date(item.createdAt));
  const today = getTodayStr();
  const dateLabel = dateStr === today ? '今天 ' + formatTime(item.createdAt) : dateStr + ' ' + formatTime(item.createdAt);

  setEntryModalStyle(sheet, title, type, dateLabel);
  showDeleteButton(true);
  modal.classList.remove('hidden');
  setTimeout(() => input.focus(), 300);
}

// ============ Init ============

let warehouseInitialized = false;

function initWarehousePage() {
  document.getElementById('warehouse-date').textContent = formatDateCN(getTodayStr());

  // Set up search listener only once
  if (!warehouseInitialized) {
    warehouseInitialized = true;
    let searchTimer;
    document.getElementById('search-input').addEventListener('input', (e) => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        searchQuery = e.target.value;
        renderWarehouse();
      }, 300);
    });
  }

  renderWarehouse();
}

function refreshWarehouse() {
  searchQuery = document.getElementById('search-input')?.value || '';
  renderWarehouse();
}
