// Конфигурация API
const API_BASE_URL = 'http://exam-api-courses.std-900.ist.mospolytech.ru/api';
const API_KEY = '995a4b68-17ad-4fd0-922c-d070d530e9a9';

// Глобальные переменные
let allOrders = [];
let allCourses = [];
let allTutors = [];
let currentOrdersPage = 1;
const ORDERS_PER_PAGE = 5;
let orderToDelete = null;

// Утилиты
function showNotification(message, type = 'info') {
    const notificationArea = document.getElementById('notification-area');
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    notificationArea.appendChild(alert);
    
    setTimeout(() => {
        alert.remove();
    }, 5000);
}

// Загрузка заявок
async function loadOrders() {
    try {
        const response = await fetch(`${API_BASE_URL}/orders?api_key=${API_KEY}`);
        if (!response.ok) throw new Error('Ошибка загрузки заявок');
        
        allOrders = await response.json();
        displayOrders();
    } catch (error) {
        showNotification('Не удалось загрузить заявки', 'danger');
        console.error(error);
    }
}

// Загрузка курсов для отображения названий
async function loadCoursesAndTutors() {
    try {
        const [coursesResponse, tutorsResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/courses?api_key=${API_KEY}`),
            fetch(`${API_BASE_URL}/tutors?api_key=${API_KEY}`)
        ]);
        
        if (coursesResponse.ok) {
            allCourses = await coursesResponse.json();
        }
        
        if (tutorsResponse.ok) {
            allTutors = await tutorsResponse.json();
        }
    } catch (error) {
        console.error('Ошибка загрузки курсов и репетиторов:', error);
    }
}

// Отображение заявок
function displayOrders() {
    const tbody = document.getElementById('orders-table-body');
    const startIndex = (currentOrdersPage - 1) * ORDERS_PER_PAGE;
    const endIndex = startIndex + ORDERS_PER_PAGE;
    const ordersToDisplay = allOrders.slice(startIndex, endIndex);
    
    if (ordersToDisplay.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">У вас пока нет заявок</td>
            </tr>
        `;
        document.getElementById('orders-pagination').innerHTML = '';
        return;
    }
    
    tbody.innerHTML = ordersToDisplay.map(order => {
        let courseName = 'Неизвестно';
        
        if (order.course_id) {
            const course = allCourses.find(c => c.id === order.course_id);
            courseName = course ? course.name : `Курс #${order.course_id}`;
        } else if (order.tutor_id) {
            const tutor = allTutors.find(t => t.id === order.tutor_id);
            courseName = tutor ? `Репетитор: ${tutor.name}` : `Репетитор #${order.tutor_id}`;
        }
        
        return `
            <tr>
                <td>${order.id}</td>
                <td>${courseName}</td>
                <td>${order.date_start} ${order.time_start}</td>
                <td>${order.price} руб.</td>
                <td>
                    <button class="btn btn-sm btn-info me-1" onclick="showOrderDetails(${order.id})">Подробнее</button>
                    <button class="btn btn-sm btn-warning me-1" onclick="openEditModal(${order.id})">Изменить</button>
                    <button class="btn btn-sm btn-danger" onclick="openDeleteModal(${order.id})">Удалить</button>
                </td>
            </tr>
        `;
    }).join('');
    
    renderOrdersPagination();
}

// Пагинация заявок
function renderOrdersPagination() {
    const pagination = document.getElementById('orders-pagination');
    const totalPages = Math.ceil(allOrders.length / ORDERS_PER_PAGE);
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // Кнопка "Назад"
    paginationHTML += `
        <li class="page-item ${currentOrdersPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changeOrdersPage(${currentOrdersPage - 1}); return false;">Назад</a>
        </li>
    `;
    
    // Номера страниц
    for (let i = 1; i <= totalPages; i++) {
        paginationHTML += `
            <li class="page-item ${i === currentOrdersPage ? 'active' : ''}">
                <a class="page-link" href="#" onclick="changeOrdersPage(${i}); return false;">${i}</a>
            </li>
        `;
    }
    
    // Кнопка "Вперед"
    paginationHTML += `
        <li class="page-item ${currentOrdersPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changeOrdersPage(${currentOrdersPage + 1}); return false;">Вперед</a>
        </li>
    `;
    
    pagination.innerHTML = paginationHTML;
}

function changeOrdersPage(page) {
    const totalPages = Math.ceil(allOrders.length / ORDERS_PER_PAGE);
    if (page < 1 || page > totalPages) return;
    currentOrdersPage = page;
    displayOrders();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Показать подробную информацию о заявке
async function showOrderDetails(orderId) {
    try {
        const response = await fetch(`${API_BASE_URL}/orders/${orderId}?api_key=${API_KEY}`);
        if (!response.ok) throw new Error('Ошибка загрузки деталей заявки');
        
        const order = await response.json();
        const detailsBody = document.getElementById('details-modal-body');
        
        let courseName = 'Неизвестно';
        let description = '';
        
        if (order.course_id) {
            const course = allCourses.find(c => c.id === order.course_id);
            if (course) {
                courseName = course.name;
                description = course.description;
            }
        } else if (order.tutor_id) {
            const tutor = allTutors.find(t => t.id === order.tutor_id);
            if (tutor) {
                courseName = `Репетитор: ${tutor.name}`;
                description = `Уровень: ${tutor.language_level}, Опыт: ${tutor.work_experience} лет`;
            }
        }
        
        // Расчет скидок/надбавок
        let discounts = [];
        if (order.early_registration) discounts.push('Ранняя регистрация (-10%)');
        if (order.group_enrollment) discounts.push('Групповая запись (-15%)');
        if (order.intensive_course) discounts.push('Интенсивный курс (+20%)');
        
        let additionalOptions = [];
        if (order.supplementary) additionalOptions.push('Дополнительные материалы');
        if (order.personalized) additionalOptions.push('Индивидуальные занятия');
        if (order.excursions) additionalOptions.push('Культурные экскурсии');
        if (order.assessment) additionalOptions.push('Оценка уровня');
        if (order.interactive) additionalOptions.push('Интерактивная платформа');
        
        detailsBody.innerHTML = `
            <p><strong>Номер заказа:</strong> ${order.id}</p>
            <p><strong>Название:</strong> ${courseName}</p>
            <p><strong>Описание:</strong> ${description}</p>
            <p><strong>Дата начала:</strong> ${order.date_start}</p>
            <p><strong>Время начала:</strong> ${order.time_start}</p>
            <p><strong>Продолжительность:</strong> ${order.duration} часов</p>
            <p><strong>Количество студентов:</strong> ${order.persons}</p>
            <p><strong>Общая стоимость:</strong> ${order.price} руб.</p>
            ${discounts.length > 0 ? `<p><strong>Скидки/надбавки:</strong> ${discounts.join(', ')}</p>` : ''}
            ${additionalOptions.length > 0 ? `<p><strong>Дополнительные опции:</strong> ${additionalOptions.join(', ')}</p>` : ''}
        `;
        
        const modal = new bootstrap.Modal(document.getElementById('detailsModal'));
        modal.show();
    } catch (error) {
        showNotification('Не удалось загрузить детали заявки', 'danger');
        console.error(error);
    }
}

// Открыть модальное окно редактирования
async function openEditModal(orderId) {
    try {
        const response = await fetch(`${API_BASE_URL}/orders/${orderId}?api_key=${API_KEY}`);
        if (!response.ok) throw new Error('Ошибка загрузки заявки');
        
        const order = await response.json();
        
        document.getElementById('edit-order-id').value = order.id;
        document.getElementById('edit-date-start').value = order.date_start;
        document.getElementById('edit-time-start').value = order.time_start;
        document.getElementById('edit-duration').value = order.duration;
        document.getElementById('edit-persons').value = order.persons;
        
        document.getElementById('edit-opt-supplementary').checked = order.supplementary || false;
        document.getElementById('edit-opt-personalized').checked = order.personalized || false;
        document.getElementById('edit-opt-excursions').checked = order.excursions || false;
        document.getElementById('edit-opt-assessment').checked = order.assessment || false;
        document.getElementById('edit-opt-interactive').checked = order.interactive || false;
        
        // Сохраняем данные для пересчета
        window.currentEditOrder = order;
        
        calculateEditCost();
        
        const modal = new bootstrap.Modal(document.getElementById('editModal'));
        modal.show();
    } catch (error) {
        showNotification('Не удалось загрузить заявку для редактирования', 'danger');
        console.error(error);
    }
}

// Расчет стоимости при редактировании
function calculateEditCost() {
    const order = window.currentEditOrder;
    if (!order) return;
    
    const duration = parseInt(document.getElementById('edit-duration').value) || 1;
    const persons = parseInt(document.getElementById('edit-persons').value) || 1;
    
    // Простой расчет (пропорционально изменению параметров)
    let baseCost = (order.price / order.duration / order.persons) * duration * persons;
    
    document.getElementById('edit-total-cost').textContent = Math.round(baseCost);
}

// Сохранение изменений заявки
document.addEventListener('DOMContentLoaded', function() {
    // Пересчет стоимости при изменении
    ['edit-duration', 'edit-persons'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', calculateEditCost);
        }
    });
    
    document.querySelectorAll('#editModal input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', calculateEditCost);
    });
    
    const saveBtn = document.getElementById('save-order-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', async function() {
            const orderId = document.getElementById('edit-order-id').value;
            const dateStart = document.getElementById('edit-date-start').value;
            const timeStart = document.getElementById('edit-time-start').value;
            const duration = parseInt(document.getElementById('edit-duration').value);
            const persons = parseInt(document.getElementById('edit-persons').value);
            
            if (!dateStart || !timeStart || !duration || !persons) {
                showNotification('Пожалуйста, заполните все поля', 'warning');
                return;
            }
            
            const requestData = {
                date_start: dateStart,
                time_start: timeStart,
                duration: duration,
                persons: persons,
                price: parseInt(document.getElementById('edit-total-cost').textContent),
                supplementary: document.getElementById('edit-opt-supplementary').checked,
                personalized: document.getElementById('edit-opt-personalized').checked,
                excursions: document.getElementById('edit-opt-excursions').checked,
                assessment: document.getElementById('edit-opt-assessment').checked,
                interactive: document.getElementById('edit-opt-interactive').checked
            };
            
            try {
                const response = await fetch(`${API_BASE_URL}/orders/${orderId}?api_key=${API_KEY}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestData)
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Ошибка при обновлении заявки');
                }
                
                showNotification('Заявка успешно обновлена!', 'success');
                bootstrap.Modal.getInstance(document.getElementById('editModal')).hide();
                
                // Обновляем список заявок
                await loadOrders();
            } catch (error) {
                showNotification(error.message, 'danger');
                console.error(error);
            }
        });
    }
});

// Открыть модальное окно удаления
function openDeleteModal(orderId) {
    orderToDelete = orderId;
    const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
    modal.show();
}

// Подтверждение удаления
document.addEventListener('DOMContentLoaded', function() {
    const confirmBtn = document.getElementById('confirm-delete-btn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', async function() {
            if (!orderToDelete) return;
            
            try {
                const response = await fetch(`${API_BASE_URL}/orders/${orderToDelete}?api_key=${API_KEY}`, {
                    method: 'DELETE'
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Ошибка при удалении заявки');
                }
                
                showNotification('Заявка успешно удалена!', 'success');
                bootstrap.Modal.getInstance(document.getElementById('deleteModal')).hide();
                
                // Обновляем список заявок
                await loadOrders();
                
                // Корректируем текущую страницу пагинации
                const totalPages = Math.ceil(allOrders.length / ORDERS_PER_PAGE);
                if (currentOrdersPage > totalPages && totalPages > 0) {
                    currentOrdersPage = totalPages;
                }
                
                displayOrders();
            } catch (error) {
                showNotification(error.message, 'danger');
                console.error(error);
            }
            
            orderToDelete = null;
        });
    }
});

// Инициализация
document.addEventListener('DOMContentLoaded', async function() {
    await loadCoursesAndTutors();
    await loadOrders();
});
