let config = {};

async function init() {
  try {
    const res = await fetch('config.json');
    config = await res.json();
    fetchTasks();
  } catch (err) {
    showStatus('Failed to load config.json', true);
  }
}

function showStatus(msg, isError = false) {
  const el = document.getElementById('status-message');
  el.textContent = msg;
  el.style.color = isError ? 'red' : 'green';
  setTimeout(() => { el.textContent = ''; }, 4000);
}

function getHeaders() {
  return {
    'apikey': config.supabasePublishableKey,
    'Authorization': `Bearer ${config.supabasePublishableKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };
}

async function fetchTasks() {
  try {
    const res = await fetch(`${config.supabaseUrl}/rest/v1/${config.tableName}?select=*`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Error fetching tasks');
    const tasks = await res.json();
    renderTasks(tasks);
  } catch (err) {
    showStatus(err.message, true);
  }
}

function renderTasks(tasks) {
  const container = document.getElementById('task-list');
  container.innerHTML = '';

  tasks.forEach(task => {
    const div = document.createElement('div');
    div.className = 'task-item';
    div.setAttribute('data-id', task.id);

    div.innerHTML = `
      <h3 class="task-title ${task.completed ? 'completed' : ''}">${escapeHtml(task.title)}</h3>
      <p class="task-description">${escapeHtml(task.description || '')}</p>
      <p class="task-status">Status: ${task.completed ? 'Completed' : 'Incomplete'}</p>
      <button class="toggle-task">${task.completed ? 'Mark Incomplete' : 'Mark Completed'}</button>
      <button class="edit-task">Edit</button>
      <button class="delete-task">Delete</button>
    `;

    div.querySelector('.toggle-task').addEventListener('click', () => toggleTask(task));
    div.querySelector('.edit-task').addEventListener('click', () => setupEditForm(task));
    div.querySelector('.delete-task').addEventListener('click', () => deleteTask(task.id));

    container.appendChild(div);
  });
}

document.getElementById('task-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('task-id').value;
  const title = document.getElementById('task-title').value.trim();
  const description = document.getElementById('task-description').value.trim();

  if (!title) return;

  if (id) {
    await updateTask(id, { title, description });
  } else {
    await createTask({ title, description, completed: false });
  }

  document.getElementById('task-form').reset();
  document.getElementById('task-id').value = '';
  document.getElementById('task-submit').textContent = 'Add Task';
});

async function createTask(taskData) {
  try {
    const res = await fetch(`${config.supabaseUrl}/rest/v1/${config.tableName}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(taskData)
    });
    if (!res.ok) throw new Error('Failed to create task');
    showStatus('Task created successfully');
    fetchTasks();
  } catch (err) {
    showStatus(err.message, true);
  }
}

async function updateTask(id, taskData) {
  try {
    const res = await fetch(`${config.supabaseUrl}/rest/v1/${config.tableName}?id=eq.${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(taskData)
    });
    if (!res.ok) throw new Error('Failed to update task');
    showStatus('Task updated successfully');
    fetchTasks();
  } catch (err) {
    showStatus(err.message, true);
  }
}

async function toggleTask(task) {
  await updateTask(task.id, { completed: !task.completed });
}

async function deleteTask(id) {
  try {
    const res = await fetch(`${config.supabaseUrl}/rest/v1/${config.tableName}?id=eq.${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete task');
    showStatus('Task deleted');
    fetchTasks();
  } catch (err) {
    showStatus(err.message, true);
  }
}

function setupEditForm(task) {
  document.getElementById('task-id').value = task.id;
  document.getElementById('task-title').value = task.title;
  document.getElementById('task-description').value = task.description || '';
  document.getElementById('task-submit').textContent = 'Save Changes';
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, match => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[match]));
}

window.onload = init;