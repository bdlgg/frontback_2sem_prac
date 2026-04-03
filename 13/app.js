const contentDiv = document.getElementById('app-content');
const homeBtn = document.getElementById('home-btn');
const aboutBtn = document.getElementById('about-btn');
const socket = io("http://localhost:3001");

socket.on('taskAdded', (task) => {
    console.log('Задача от другого клиента:', task);
    const notification = document.createElement('div');
    notification.textContent = `Новая задача: ${task.text}`;
    notification.style.cssText = `
        position: fixed; top: 10px; right: 10px;
        background: #4285f4; color: white; padding: 1rem;
        border-radius: 5px; z-index: 1000;
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
});

function setActiveButton(activeId){
    [homeBtn, aboutBtn].forEach(btn => btn.classList.remove('active'));
    document.getElementById(activeId).classList.add('active');
}

function urlBase64ToUint8Array(base64String){
    const padding = '='.repeat((4-base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i){
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

async function subscribeToPush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    try {
        const registration = await navigator.serviceWorker.ready;

        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array('BJRMR9OyvCmFkxWxi5QaB0nGJpD_ZuwN8-EElb6zy6s5Wv6CK7L_YJEa7damkSX7o38ZDBkWGZZlDmPCFp3JSj8')
            });
        }

        await fetch('http://localhost:3001/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subscription)
        });

        console.log('Подписка на push отправлена');
    } catch (err) {
        console.error('Ошибка подписки на push:', err);
    }
}

async function unsubscribeFromPush(){
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
        await fetch('http://localhost:3001/unsubscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: subscription.endpoint})
        });
        await subscription.unsubscribe();
        console.log('Отписка выполнена');
    }
}

async function loadContent(page){
    try {
        const response = await fetch(`/content/${page}.html`);
        const html = await response.text();
        contentDiv.innerHTML = html;
        if (page === 'home'){
            initNotes();
        }
    } catch (err){
        contentDiv.innerHTML = `<p class="is-center text-error">Ошибка загрузки страницы.</p>`;
        console.error(err);
    }
}

homeBtn.addEventListener('click', () => {
    setActiveButton('home-btn');
    loadContent('home');
});

aboutBtn.addEventListener('click', () => {
    setActiveButton('about-btn');
    loadContent('about');
});

loadContent('home');

function initNotes() {
    const form = document.getElementById('note-form');
    const input = document.getElementById('note-input');
    const list = document.getElementById('notes-list');

    function normalizeNotes(notes) {
        return notes.map(note => {
            if (typeof note === 'string') {
                return { id: Date.now() + Math.random(), text: note, datetime: '' };
            }
            return {
                id: note.id ?? Date.now() + Math.random(),
                text: note.text ?? String(note),
                datetime: note.datetime ?? ''
            };
        });
    }

    function loadNotes() {
        const rawNotes = JSON.parse(localStorage.getItem('notes') || '[]');
        const notes = normalizeNotes(rawNotes);
        localStorage.setItem('notes', JSON.stringify(notes));
        list.innerHTML = notes.map(note => `
            <li class="card" style="margin-bottom: 0.5rem; padding: 0.5rem;">
                <div>${note.text}</div>
                ${note.datetime ? `<small style="color: gray;">${note.datetime}</small>` : ''}
            </li>
        `).join('');
    }

    function addNote(text, datetime = '') {
        const rawNotes = JSON.parse(localStorage.getItem('notes') || '[]');
        const notes = normalizeNotes(rawNotes);
        notes.push({
            id: Date.now(),
            text,
            datetime
        });
        localStorage.setItem('notes', JSON.stringify(notes));
        loadNotes();
        socket.emit('newTask', { text, timestamp: Date.now() });
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) return;
        addNote(text);
        input.value = '';
    });
    loadNotes();
}

if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            const reg = await navigator.serviceWorker.register('/sw.js');
            console.log('SW registered');
            const enableBtn = document.getElementById('enable-push');
            const disableBtn = document.getElementById('disable-push');
            if (enableBtn && disableBtn){
                const subscription = await reg.pushManager.getSubscription();
                if (subscription) {
                    enableBtn.style.display = 'none';
                    disableBtn.style.display = 'inline-block';
                }
                enableBtn.addEventListener('click', async () => {
                    if (Notification.permission === 'denied'){
                        alert('Уведомления запрещены. Разрешите их в настройках браузера.');
                        return;
                    }
                    if (Notification.permission === 'default'){
                        const permission = await Notification.requestPermission();
                        if (permission !== 'granted') {
                            alert('Необходимо разрешить уведомления.')
                            return;
                        }
                    }
                    await subscribeToPush();
                    enableBtn.style.display = 'none';
                    disableBtn.style.display = 'inline-block';
                });
                disableBtn.addEventListener('click', async () => {
                    await unsubscribeFromPush();
                    disableBtn.style.display = 'none';
                    enableBtn.style.display = 'inline-block';
                });
            }
        } catch (err){
            console.log('SW registration failed:', err);
        }
    });
}