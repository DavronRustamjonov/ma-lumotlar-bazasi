let db;
const DB_NAME = 'TodoDB';
const DB_VERSION = 1;
const STORE_NAME = 'tasks';

const request = indexedDB.open(DB_NAME, DB_VERSION);

request.onupgradeneeded = (event) => {
    db = event.target.result;
    if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
    }
};

request.onsuccess = (event) => {
    db = event.target.result;
    displayTasks();
};

request.onerror = (event) => {
    console.error('Xatolik:', event.target.error);
};

// Vazifa qo'shish
document.getElementById('taskForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const taskInput = document.getElementById('taskInput');
    const task = {
        text: taskInput.value.trim(),
        timestamp: new Date().getTime()
    };
    
    if (task.text) {
        addTask(task);
        taskInput.value = '';
    }
});

function addTask(task) {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.add(task);
    displayTasks();
}

function displayTasks() {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
        const tasks = request.result;
        const taskList = document.getElementById('taskList');
        taskList.innerHTML = '';

        tasks.forEach(task => {
            const li = document.createElement('li');
            li.className = 'task-item';
            li.innerHTML = `
                <span>${task.text}</span>
                <div class="actions">
                    <button class="edit-btn" onclick="editTask(${task.id})">Tahrirlash</button>
                    <button class="delete-btn" onclick="deleteTask(${task.id})">O'chirish</button>
                </div>
            `;
            taskList.appendChild(li);
        });
    };
}

function deleteTask(id) {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.delete(id);
    displayTasks();
}

function editTask(id) {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
        const task = getRequest.result;
        const newText = prompt("Vazifani tahrirlang:", task.text);
        if (newText !== null) {
            task.text = newText.trim();
            store.put(task);
            displayTasks();
        }
    };
}

function exportData() {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
        const tasks = request.result;
        if(tasks.length === 0) {
            alert("Saqlangan ma'lumotlar mavjud emas!");
            return;
        }
        
        const dataStr = JSON.stringify(tasks, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `todo_backup_${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
}