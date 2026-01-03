const input = document.getElementById('urlInput');
const button = document.getElementById('goButton');
const list = document.querySelector('.adrese ol');

function addAddressToList(addr) {
    const li = document.createElement('li');
    li.draggable = true;
    li.style.cursor = 'grab';

    const span = document.createElement('span');
    span.textContent = addr;
    li.appendChild(span);

    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.style.marginLeft = '10px';
    li.appendChild(editBtn);

    const delBtn = document.createElement('button');
    delBtn.textContent = 'Delete';
    delBtn.style.marginLeft = '5px';
    li.appendChild(delBtn);

    delBtn.addEventListener('click', () => li.remove());

    editBtn.addEventListener('click', () => {
        const newVal = prompt('Edit address:', span.textContent);
        if(newVal && newVal.trim() !== '') span.textContent = newVal.trim();
    });

    li.addEventListener('dragstart', () => li.classList.add('dragging'));
    li.addEventListener('dragend', () => li.classList.remove('dragging'));

    list.addEventListener('dragover', e => {
        e.preventDefault();
        const afterElement = getDragAfterElement(list, e.clientY);
        const dragging = document.querySelector('.dragging');
        if(afterElement == null) list.appendChild(dragging);
        else list.insertBefore(dragging, afterElement);
    });

    list.appendChild(li);
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('li:not(.dragging)')];
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if(offset < 0 && offset > closest.offset) return { offset: offset, element: child };
        else return closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

button.addEventListener('click', () => {
    const addr = input.value.trim();
    if(addr === '') return;
    addAddressToList(addr);
    input.value = '';
});

input.addEventListener('keypress', e => {
    if(e.key === 'Enter') button.click();
});
