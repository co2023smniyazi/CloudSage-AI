/**
 * Student Task Management Client-Side Controller
 * Interfaces with Cloudflare Worker REST API backed by Workers KV.
 */
document.addEventListener('DOMContentLoaded', () => {
  // State
  let tasks = [];
  let currentFilterStatus = 'ALL';
  let currentFilterPriority = 'ALL';
  let currentSearchQuery = '';
  let currentSortOrder = 'newest';

  // DOM Elements
  const createTaskForm = document.getElementById('create-task-form');
  const taskTitleInput = document.getElementById('task-title');
  const taskPriorityInput = document.getElementById('task-priority');
  const taskStatusInput = document.getElementById('task-status');
  const btnSubmitTask = document.getElementById('btn-submit-task');

  const tasksTbody = document.getElementById('tasks-tbody');
  const loadingState = document.getElementById('loading-state');
  const emptyState = document.getElementById('empty-state');
  const emptyStateMessage = document.getElementById('empty-state-message');

  const statTotal = document.getElementById('stat-total');
  const statPending = document.getElementById('stat-pending');
  const statCompleted = document.getElementById('stat-completed');
  const statRate = document.getElementById('stat-rate');
  const statProgress = document.getElementById('stat-progress');
  const envBadge = document.getElementById('env-badge');

  const searchInput = document.getElementById('search-input');
  const filterStatusSelect = document.getElementById('filter-status');
  const filterPrioritySelect = document.getElementById('filter-priority');
  const sortOrderSelect = document.getElementById('sort-order');
  const btnRefresh = document.getElementById('btn-refresh');

  // Edit Modal Elements
  const editModal = document.getElementById('edit-modal');
  const editTaskForm = document.getElementById('edit-task-form');
  const editTaskId = document.getElementById('edit-task-id');
  const editTaskTitle = document.getElementById('edit-task-title');
  const editTaskPriority = document.getElementById('edit-task-priority');
  const editTaskStatus = document.getElementById('edit-task-status');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const btnCancelEdit = document.getElementById('btn-cancel-edit');
  const toastContainer = document.getElementById('toast-container');

  // Priority weight for sorting
  const priorityWeight = { 'High': 3, 'Medium': 2, 'Low': 1 };

  // Toast Notification System
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconSvg = '';
    if (type === 'success') {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
    } else if (type === 'error') {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
    } else {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
    }

    toast.innerHTML = `${iconSvg} <span>${message}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // Format Date cleanly
  function formatDate(isoString) {
    if (!isoString) return 'N/A';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  }

  // API Call: Fetch environment details & health check
  async function checkHealth() {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const info = await res.json();
        if (info && info.environment) {
          envBadge.textContent = info.environment.toUpperCase();
        }
      }
    } catch {
      // Fallback silently if health check is not critical
    }
  }

  // API Call: Fetch all tasks
  async function fetchTasks() {
    loadingState.style.display = 'flex';
    emptyState.style.display = 'none';
    tasksTbody.innerHTML = '';

    try {
      const response = await fetch('/api/tasks');
      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }
      const result = await response.json();
      tasks = Array.isArray(result) ? result : (result.data || []);
      render();
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
      showToast(`Error fetching tasks: ${err.message}`, 'error');
      loadingState.style.display = 'none';
      emptyState.style.display = 'flex';
      emptyStateMessage.textContent = 'Could not load tasks from Cloudflare KV. Check connectivity.';
    }
  }

  // API Call: Create new task
  createTaskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = taskTitleInput.value.trim();
    const priority = taskPriorityInput.value;
    const status = taskStatusInput.value;

    if (!title) {
      showToast('Please provide a task title', 'error');
      return;
    }

    btnSubmitTask.disabled = true;
    btnSubmitTask.innerHTML = '<div class="spinner" style="width:16px;height:16px;border-width:2px;"></div> Saving...';

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, priority, status })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      showToast(`Task ${result.data?.id || ''} created successfully!`, 'success');
      taskTitleInput.value = '';
      taskPriorityInput.value = 'Medium';
      taskStatusInput.value = 'Pending';
      taskTitleInput.focus();

      // Refresh task list
      await fetchTasks();
    } catch (err) {
      showToast(`Create failed: ${err.message}`, 'error');
    } finally {
      btnSubmitTask.disabled = false;
      btnSubmitTask.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        Add Task
      `;
    }
  });

  // API Call: Quick Toggle Task Status
  window.toggleTaskStatus = async function (id, currentStatus) {
    const newStatus = currentStatus === 'Completed' ? 'Pending' : 'Completed';
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `HTTP ${response.status}`);
      }

      showToast(`Task ${id} marked as ${newStatus}`, 'success');
      await fetchTasks();
    } catch (err) {
      showToast(`Status update failed: ${err.message}`, 'error');
    }
  };

  // Open Edit Modal
  window.openEditModal = function (id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    editTaskId.value = task.id;
    editTaskTitle.value = task.title;
    editTaskPriority.value = task.priority;
    editTaskStatus.value = task.status;
    document.getElementById('modal-title').textContent = `Edit Task (${task.id})`;
    editModal.style.display = 'flex';
    editTaskTitle.focus();
  };

  function closeEditModal() {
    editModal.style.display = 'none';
  }

  modalCloseBtn.addEventListener('click', closeEditModal);
  btnCancelEdit.addEventListener('click', closeEditModal);

  // API Call: Save Edit Modal Changes
  editTaskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = editTaskId.value;
    const title = editTaskTitle.value.trim();
    const priority = editTaskPriority.value;
    const status = editTaskStatus.value;

    if (!title) {
      showToast('Task title cannot be empty', 'error');
      return;
    }

    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, priority, status })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || `HTTP ${response.status}`);
      }

      showToast(`Task ${id} updated successfully`, 'success');
      closeEditModal();
      await fetchTasks();
    } catch (err) {
      showToast(`Update failed: ${err.message}`, 'error');
    }
  });

  // API Call: Delete Task
  window.deleteTask = async function (id) {
    const confirmed = confirm(`Are you sure you want to permanently delete task ${id}?`);
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || `HTTP ${response.status}`);
      }

      showToast(`Task ${id} deleted`, 'info');
      await fetchTasks();
    } catch (err) {
      showToast(`Delete failed: ${err.message}`, 'error');
    }
  };

  // Update Metrics Dashboard
  function updateMetrics(list) {
    const total = list.length;
    const pending = list.filter(t => t.status === 'Pending').length;
    const completed = list.filter(t => t.status === 'Completed').length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    statTotal.textContent = total;
    statPending.textContent = pending;
    statCompleted.textContent = completed;
    statRate.textContent = `${rate}%`;
    statProgress.style.width = `${rate}%`;
  }

  // Filter & Sort Logic
  function getFilteredAndSortedTasks() {
    return tasks
      .filter(t => {
        // Status filter
        if (currentFilterStatus !== 'ALL' && t.status !== currentFilterStatus) {
          return false;
        }
        // Priority filter
        if (currentFilterPriority !== 'ALL' && t.priority !== currentFilterPriority) {
          return false;
        }
        // Search query
        if (currentSearchQuery) {
          const query = currentSearchQuery.toLowerCase();
          const matchTitle = (t.title || '').toLowerCase().includes(query);
          const matchId = (t.id || '').toLowerCase().includes(query);
          if (!matchTitle && !matchId) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (currentSortOrder === 'newest') {
          return new Date(b.createdDate || 0) - new Date(a.createdDate || 0);
        } else if (currentSortOrder === 'oldest') {
          return new Date(a.createdDate || 0) - new Date(b.createdDate || 0);
        } else if (currentSortOrder === 'priority') {
          const pA = priorityWeight[a.priority] || 0;
          const pB = priorityWeight[b.priority] || 0;
          return pB - pA;
        }
        return 0;
      });
  }

  // Render Table & Metrics
  function render() {
    loadingState.style.display = 'none';
    updateMetrics(tasks);

    const filtered = getFilteredAndSortedTasks();

    if (filtered.length === 0) {
      emptyState.style.display = 'flex';
      tasksTbody.innerHTML = '';
      if (tasks.length === 0) {
        emptyStateMessage.textContent = 'No tasks in database. Add your first student task above!';
      } else {
        emptyStateMessage.textContent = 'No tasks match your current search or filter criteria.';
      }
      return;
    }

    emptyState.style.display = 'none';
    tasksTbody.innerHTML = filtered.map(t => {
      const isCompleted = t.status === 'Completed';
      const toggleLabel = isCompleted ? 'Undo' : 'Complete';
      const toggleClass = isCompleted ? 'completed' : '';
      const toggleIcon = isCompleted
        ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>'
        : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>';

      return `
        <tr>
          <td>
            <span class="task-id-badge">${t.id}</span>
          </td>
          <td class="task-title-cell ${isCompleted ? 'completed' : ''}">
            ${escapeHtml(t.title)}
          </td>
          <td>
            <span class="priority-tag priority-${t.priority}">${t.priority}</span>
          </td>
          <td>
            <span class="status-tag status-${t.status}">${t.status}</span>
          </td>
          <td class="date-cell">
            ${formatDate(t.createdDate)}
          </td>
          <td>
            <div class="actions-cell">
              <button class="btn btn-sm btn-toggle ${toggleClass}" onclick="toggleTaskStatus('${t.id}', '${t.status}')" title="${toggleLabel} Task">
                ${toggleIcon} ${toggleLabel}
              </button>
              <button class="btn btn-sm btn-edit" onclick="openEditModal('${t.id}')" title="Edit Task">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              </button>
              <button class="btn btn-sm btn-delete" onclick="deleteTask('${t.id}')" title="Delete Task">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Utility to prevent XSS in table output
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Event Listeners for Filters & Search
  searchInput.addEventListener('input', (e) => {
    currentSearchQuery = e.target.value.trim();
    render();
  });

  filterStatusSelect.addEventListener('change', (e) => {
    currentFilterStatus = e.target.value;
    render();
  });

  filterPrioritySelect.addEventListener('change', (e) => {
    currentFilterPriority = e.target.value;
    render();
  });

  sortOrderSelect.addEventListener('change', (e) => {
    currentSortOrder = e.target.value;
    render();
  });

  btnRefresh.addEventListener('click', () => {
    fetchTasks();
    showToast('Refreshed tasks from KV', 'info');
  });

  // Close modal on escape key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && editModal.style.display !== 'none') {
      closeEditModal();
    }
  });

  // Initialization
  checkHealth();
  fetchTasks();
});

