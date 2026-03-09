
const API_URL = "/api/tasks";

let sortAscending = true;
let currentUserId = null;
let currentUserName = null;

async function fetchTasks(){

    try {
        let url = API_URL;
        if (currentUserId) {
            url += `?userId=${currentUserId}`;
        }
        const res = await fetch(url);
        const tasks = await res.json();

        // apply status filter if present
        const filterEl = document.getElementById('filterStatus');
        let list = tasks;
        if(filterEl && filterEl.value){
            const val = filterEl.value.toLowerCase();
            list = tasks.filter(t => t.status && t.status.toString().toLowerCase() === val);
        }

        // apply sort by hours
        list.sort((a,b)=>{
            const ha = parseFloat(a.hours)||0;
            const hb = parseFloat(b.hours)||0;
            return sortAscending ? ha-hb : hb-ha;
        });

        const table = document.getElementById("taskTable");

        if(!table) return;

        table.innerHTML = "";

        list.forEach(t=>{
            const statusText = t.status || '';
            const isDone = statusText.toString().toLowerCase().includes('done');
            table.innerHTML += `
<tr>
<td>${t.topic}</td>
<td>${t.status}</td>
<td>${t.hours}</td>
<td>
<button class="btn-edit" onclick="editTask('${t.id.replace(/'/g, "\\'")}', '${t.topic.replace(/'/g, "\\'")}', '${t.status.replace(/'/g, "\\'")}', '${t.hours}')">Edit</button>
<button class="btn-delete" onclick="deleteTask('${t.id.replace(/'/g, "\\'")}')" >Delete</button>
${isDone ? '' : `<button class="btn-complete" onclick="markDone('${t.id.replace(/'/g, "\\'")}')" >Complete</button>`}
</td>
</tr>
`;

        });
    } catch (e) {
        console.error('Failed to fetch tasks:', e);
        alert('Failed to load tasks. Please check if the server is running.');
    }

}

async function addTask(){

    const topic = document.getElementById("topic").value;
    const status = document.getElementById("status").value;
    const hours = document.getElementById("hours").value;

    await fetch(API_URL,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({userId: currentUserId, topic, status, hours})
    });

    fetchTasks();
}

async function addCourse(course){
    // Check if user is logged in
    const loggedIn = localStorage.getItem('loggedIn') === 'true';
    if (!loggedIn) {
        alert('Please login first to add courses to your tracker.');
        window.location.href = 'login.html';
        return;
    }
    
    try {
        // create a tracker entry using course name
        await fetch(API_URL,{
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify({userId: currentUserId, topic:course,status:'Pending',hours:0})
        });
        alert(`${course} added to tracker!`);
        // Optionally redirect to tracker
        // window.location.href = 'tracker.html';
        fetchTasks();
    } catch (e) {
        console.error('Failed to add course:', e);
        alert('Failed to add course. Please check if the server is running.');
    }
}

async function deleteTask(id){
    if (!confirm('Are you sure you want to delete this task?')) {
        return;
    }
    
    try {
        await fetch(`${API_URL}/${id}`,{method:"DELETE"});
        alert('Task deleted successfully!');
        fetchTasks();
    } catch (e) {
        console.error('Failed to delete task:', e);
        alert('Failed to delete task.');
    }
}

async function clearTasks(){
    if(!confirm('Clear all tasks?')) return;
    try{
        const res = await fetch(API_URL);
        const tasks = await res.json();
        for(const t of tasks){
            await fetch(`${API_URL}/${t.id}`,{method:'DELETE'});
        }
    }catch(e){ console.error('clear failed',e); }
    fetchTasks();
}

function toggleSort(){
    sortAscending = !sortAscending;
    const btn = document.getElementById('sortBtn');
    if(btn) btn.textContent = sortAscending ? 'Sort by Hours' : 'Sort by Hours ▼';
    fetchTasks();
}

async function markDone(id){
    try {
        // fetch existing, update status
        const res = await fetch(`${API_URL}/${id}`);
        if(!res.ok) {
            alert('Failed to fetch task details.');
            return;
        }
        const task = await res.json();
        task.status = 'Done';
        await fetch(`${API_URL}/${id}`,{
            method:'PUT',
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify(task)
        });
        alert('Task marked as complete!');
        fetchTasks();
    } catch (e) {
        console.error('Failed to mark task as done:', e);
        alert('Failed to complete task.');
    }
}

async function editTask(id, currentTopic, currentStatus, currentHours){
    const topic = prompt("New topic", currentTopic);
    if (topic === null) return; // User cancelled
    
    const status = prompt("New status (Pending/In Progress/Done)", currentStatus);
    if (status === null) return; // User cancelled
    
    const hoursStr = prompt("New hours", currentHours);
    if (hoursStr === null) return; // User cancelled
    
    const hours = parseFloat(hoursStr) || 0;

    console.log('Updating task:', {id, topic, status, hours}); // Debug log

    try {
        const response = await fetch(`${API_URL}/${id}`,{
            method:"PUT",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify({topic,status,hours})
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        alert('Task updated successfully!');
        fetchTasks();
    } catch (e) {
        console.error('Failed to edit task:', e);
        alert('Failed to update task. Please check if the server is running.');
    }
}

fetchTasks();

// if tracker page is open, update progress bar
updateProgress();

async function updateProgress() {
    const bar = document.querySelector('.progress-bar');
    const text = document.getElementById('progressText');
    if (!bar) return; // not on tracker page
    try {
        const res = await fetch(API_URL);
        const tasks = await res.json();
        if (!tasks.length) {
            if(text) text.textContent = '0% Complete';
            return;
        }
        const done = tasks.filter(t => {
            const s = t.status ? t.status.toString().toLowerCase() : '';
            return s === 'done' || s === 'complete' || s === 'finished';
        }).length;
        const pct = Math.round((done / tasks.length) * 100);
        bar.style.width = pct + '%';
        if(text) text.textContent = pct + '% Complete';
    } catch (e) {
        console.error('progress update failed', e);
    }
}

// Check login status and update nav
function checkLoginStatus() {
    const loggedIn = localStorage.getItem('loggedIn') === 'true';
    const loginLink = document.querySelector('.btn-login');
    const signupLink = document.querySelector('.btn-signup');
    
    if (loggedIn) {
        currentUserId = localStorage.getItem('userId');
        currentUserName = localStorage.getItem('userName');
        
        if (loginLink) {
            loginLink.textContent = 'Logout';
            loginLink.href = '#';
            loginLink.onclick = function(e) {
                e.preventDefault();
                localStorage.removeItem('loggedIn');
                localStorage.removeItem('userId');
                localStorage.removeItem('userName');
                currentUserId = null;
                currentUserName = null;
                alert('Logged out!');
                window.location.reload();
            };
        }
        if (signupLink) {
            signupLink.style.display = 'none';
        }
    } else {
        currentUserId = null;
        currentUserName = null;
    }
}

// Call on load
checkLoginStatus();
