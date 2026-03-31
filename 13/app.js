document.addEventListener('DOMContentLoaded', () => {
    //элементы DOM
    const form = document.getElementById("note-form");
    const input = document.getElementById("note-input");
    const list = document.getElementById("notes-list");
    const offlineIndicator = document.getElementById("offline-indicator");

//Загрузка заметок из localStorage при старте
    function loadNotes() {
        const notes = JSON.parse(localStorage.getItem("notes") || '[]');
        if (notes.length === 0) {
            list.innerHTML = '<li style="color:gray">Список заметок пуст</li>';
        }else {
            list.innerHTML = notes.map(note => `<li class="note-item">${note}</li>`).join('');
        }
    }

//Сохранение заметки
    function addNote(text) {
        const notes = JSON.parse(localStorage.getItem("notes") || '[]');
        notes.push(text);
        localStorage.setItem("notes", JSON.stringify(notes));
        loadNotes();
    }

//Обработка отправки формы
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (text){
            addNote(text);
            input.value = "";
        }
    });

//отслеживание статуса сети
    window.addEventListener('online', () => offlineIndicator.classList.remove('visible'));
    window.addEventListener('offline', () => offlineIndicator.classList.add('visible'));

//первоначальная загрузка
    loadNotes();

//регистрация Service Worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', async () => {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('ServiceWorker зарегистрирован:', registration.scope)
            } catch (err) {
                console.error("Ошибка регистрации ServiceWorker:", err);
            }
        });
    }
});