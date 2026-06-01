/**
 * 日历页面功能
 */

let calendarYear, calendarMonth;

// ============ Render Calendar ============

function renderCalendar() {
  const grid = document.getElementById('calendar-grid');
  const title = document.getElementById('month-title');

  title.textContent = `${calendarYear}年 ${calendarMonth + 1}月`;

  const weekHeaders = ['日', '一', '二', '三', '四', '五', '六'];
  let html = weekHeaders.map((d, i) =>
    `<div class="day-header${i === 0 || i === 6 ? ' weekend' : ''}">${d}</div>`
  ).join('');

  // First day of month and last day
  const firstDay = new Date(calendarYear, calendarMonth, 1);
  const lastDay = new Date(calendarYear, calendarMonth + 1, 0);
  const startDayOfWeek = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  const todayStr = getTodayStr();

  // Previous month filler
  const prevLastDay = new Date(calendarYear, calendarMonth, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = prevLastDay - i;
    html += `<div class="calendar-cell other-month">${d}</div>`;
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isToday = dateStr === todayStr;
    const dayData = getDaySummary(dateStr);

    let dotHtml = '';
    if (dayData.hasTodos) {
      const cls = dayData.allDone ? 'green' : 'orange';
      dotHtml = `<div class="dots"><span class="dot-indicator ${cls}"></span></div>`;
    }

    html += `
      <div class="calendar-cell${isToday ? ' today' : ''}" data-date="${dateStr}">
        ${d}
        ${dotHtml}
      </div>
    `;
  }

  // Next month filler
  const totalCells = startDayOfWeek + daysInMonth;
  const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  for (let d = 1; d <= remainingCells; d++) {
    html += `<div class="calendar-cell other-month">${d}</div>`;
  }

  grid.innerHTML = html;

  // Bind click events
  grid.querySelectorAll('.calendar-cell:not(.other-month)').forEach(cell => {
    cell.addEventListener('click', () => {
      showDayDetail(cell.dataset.date);
    });
  });
}

function getDaySummary(dateStr) {
  const todos = getTodosByDate(dateStr);
  const hasTodos = todos.length > 0;
  const allDone = hasTodos && todos.every(t => t.completed);
  return { hasTodos, allDone };
}

// ============ Day Detail Modal ============

function showDayDetail(dateStr) {
  const modal = document.getElementById('modal-day-detail');
  const title = document.getElementById('day-detail-title');
  const content = document.getElementById('day-detail-content');

  title.textContent = formatDateCN(dateStr);

  const todos = getTodosByDate(dateStr);
  const logs = getLogsByDate(dateStr);
  const excerpts = getExcerptsByDate(dateStr);

  let html = '';

  // Todo section (light green)
  html += `<div class="detail-section todo-section">`;
  html += `<h3>✅ 待办事项</h3>`;
  if (todos.length === 0) {
    html += `<div class="detail-empty">当天没有待办事项</div>`;
  } else {
    todos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    html += todos.map(t => `
      <div class="detail-item ${t.completed ? 'todo-done' : 'todo-undone'}">
        <span class="item-time">${formatTime(t.createdAt)}</span>
        ${t.completed ? '✓ ' : '○ '}${escapeHtml(t.content)}
      </div>
    `).join('');
  }
  html += `</div>`;

  // Log section (light pink)
  html += `<div class="detail-section log-section">`;
  html += `<h3>📝 个人日志</h3>`;
  if (logs.length === 0) {
    html += `<div class="detail-empty">当天没有日志记录</div>`;
  } else {
    logs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    html += logs.map(l => `
      <div class="detail-item">
        <span class="item-time">${formatTime(l.createdAt)}</span>
        ${escapeHtml(l.content.length > 100 ? l.content.slice(0, 100) + '...' : l.content)}
      </div>
    `).join('');
  }
  html += `</div>`;

  // Excerpt section (light yellow)
  html += `<div class="detail-section excerpt-section">`;
  html += `<h3>📋 文字摘抄</h3>`;
  if (excerpts.length === 0) {
    html += `<div class="detail-empty">当天没有摘抄记录</div>`;
  } else {
    excerpts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    html += excerpts.map(e => `
      <div class="detail-item">
        <span class="item-time">${formatTime(e.createdAt)}</span>
        ${escapeHtml(e.content.length > 100 ? e.content.slice(0, 100) + '...' : e.content)}
      </div>
    `).join('');
  }
  html += `</div>`;

  content.innerHTML = html;
  modal.classList.remove('hidden');
}

function hideDayDetail() {
  document.getElementById('modal-day-detail').classList.add('hidden');
}

// ============ Month Navigation ============

function prevMonth() {
  calendarMonth--;
  if (calendarMonth < 0) {
    calendarMonth = 11;
    calendarYear--;
  }
  renderCalendar();
}

function nextMonth() {
  calendarMonth++;
  if (calendarMonth > 11) {
    calendarMonth = 0;
    calendarYear++;
  }
  renderCalendar();
}

// ============ Init ============

let calendarInitialized = false;

function initCalendarPage() {
  if (!calendarInitialized) {
    const now = new Date();
    calendarYear = now.getFullYear();
    calendarMonth = now.getMonth();
    calendarInitialized = true;
  }
  renderCalendar();
}
