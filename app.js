const API_URL = 'http://127.0.0.1:5000/api/tasks';
let allTasks = [];
let draggedTaskId = null;

// 1. جلب البيانات من السيرفر
async function loadTasks() {
    try {
        const response = await fetch(API_URL);
        allTasks = await response.json();
        applyFilters(); // عرض وتصفية المهام
    } catch (error) {
        console.error('خطأ في جلب المهام:', error);
    }
}

// 2. تصفية وعرض المهام
function applyFilters() {
    const searchVal = document.getElementById('searchInput').value.toLowerCase();
    const priorityVal = document.getElementById('filterPriority').value;

    const filtered = allTasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchVal);
        const matchesPriority = priorityVal === 'all' || task.priority === priorityVal;
        return matchesSearch && matchesPriority;
    });

    renderBoard(filtered);
    updateProgressBar();
}

// 3. رسم الكروت على اللوحة
function renderBoard(tasksToRender) {
    document.querySelectorAll('.task-list').forEach(list => list.innerHTML = '');
    const counts = { 'todo': 0, 'in-progress': 0, 'done': 0 };

    tasksToRender.forEach(task => {
        counts[task.status] = (counts[task.status] || 0) + 1;
        const card = createTaskCard(task);
        const column = document.querySelector(`#${task.status} .task-list`);
        if (column) column.appendChild(card);
    });

    document.getElementById('count-todo').innerText = counts['todo'] || 0;
    document.getElementById('count-in-progress').innerText = counts['in-progress'] || 0;
    document.getElementById('count-done').innerText = counts['done'] || 0;
}

// 4. إنشاء الكارت
function createTaskCard(task) {
    const div = document.createElement('div');
    div.classList.add('task', `priority-${task.priority || 'medium'}`);
    div.setAttribute('draggable', 'true');

    const dueDateText = task.due_date ? `📅 ${task.due_date}` : '';

    div.innerHTML = `
        <div class="task-header">
            <span>${task.title}</span>
            <button class="delete-btn" onclick="deleteTask(${task.id})">&times;</button>
        </div>
        <div class="task-footer">
            <span>${dueDateText}</span>
        </div>
    `;

    div.addEventListener('dragstart', () => {
        draggedTaskId = task.id;
        div.style.opacity = '0.5';
    });

    div.addEventListener('dragend', () => {
        div.style.opacity = '1';
    });

    return div;
}

// 5. حساب وتحديث شريط نسبة الإنجاز
function updateProgressBar() {
    if (allTasks.length === 0) {
        document.getElementById('progressFill').style.width = '0%';
        document.getElementById('progressPercent').innerText = '0%';
        return;
    }

    const doneCount = allTasks.filter(t => t.status === 'done').length;
    const percentage = Math.round((doneCount / allTasks.length) * 100);

    document.getElementById('progressFill').style.width = `${percentage}%`;
    document.getElementById('progressPercent').innerText = `${percentage}%`;
}

// 6. السحب والإفلات
function allowDrop(e) { e.preventDefault(); }

async function drop(e) {
    e.preventDefault();
    const newStatus = e.currentTarget.id;

    if (draggedTaskId && newStatus) {
        await fetch(`${API_URL}/${draggedTaskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        loadTasks();
    }
}

// 7. إضافة مهمة جديدة
async function addNewTask() {
    const titleInput = document.getElementById('taskInput');
    const prioritySelect = document.getElementById('prioritySelect');
    const dueDateInput = document.getElementById('dueDateInput');

    if (!titleInput.value.trim()) return;

    await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            title: titleInput.value.trim(),
            priority: prioritySelect.value,
            due_date: dueDateInput.value
        })
    });

    titleInput.value = '';
    dueDateInput.value = '';
    loadTasks();
}

// 8. حذف مهمة
async function deleteTask(id) {
    await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    loadTasks();
}

// ==========================================
// 9. التايمر والمقولات
// ==========================================
const quotes = [
    "النجاح هو محصلة اجتهادات صغيرة تتكرر كل يوم.",
    "كل دقيقة تقضيها في التركيز، بتبنيك خطوة إضافية للقمة.",
    "لا تتوقف عندما تتعب، توقف عندما تنتهي."
];
let qIdx = 0;
setInterval(() => {
    qIdx = (qIdx + 1) % quotes.length;
    document.getElementById('quoteText').innerText = `"${quotes[qIdx]}"`;
}, 120000);

let timeLeft = 25 * 60, timerId = null;
function toggleTimer() {
    const btn = document.getElementById('timerBtn');
    if (!timerId) {
        btn.innerText = 'إيقاف ⏸️';
        timerId = setInterval(() => {
            if (timeLeft > 0) {
                timeLeft--;
                const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
                const s = (timeLeft % 60).toString().padStart(2, '0');
                document.getElementById('timerDisplay').innerText = `${m}:${s}`;
            } else {
                clearInterval(timerId);
                alert('انتهى وقت التركيز! خد استراحة 👏');
            }
        }, 1000);
    } else {
        clearInterval(timerId); timerId = null; btn.innerText = 'بدء ⏱️';
    }
}

loadTasks();