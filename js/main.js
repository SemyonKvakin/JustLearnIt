// Конфигурация API
const API_BASE_URL = 'https://exam-api-courses.std-900.ist.mospolytech.ru/api';
const API_KEY = '995a4b68-17ad-4fd0-922c-d070d530e9a9';

// Глобальные переменные
let allCourses = [];
let allTutors = [];
let filteredCourses = [];
let filteredTutors = [];
let currentCoursePage = 1;
const COURSES_PER_PAGE = 3;

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

// Загрузка курсов
async function loadCourses() {
    try {
        console.log('Загрузка курсов...');
        const response = await fetch(`${API_BASE_URL}/courses?api_key=${API_KEY}`);
        console.log('Статус ответа:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Ошибка API:', errorText);
            throw new Error(`Ошибка загрузки курсов: ${response.status}`);
        }
        
        allCourses = await response.json();
        console.log('Курсы загружены:', allCourses.length);
        filteredCourses = [...allCourses];
        displayCourses();
    } catch (error) {
        showNotification(`Не удалось загрузить курсы: ${error.message}. Проверьте консоль браузера.`, 'danger');
        console.error('Детали ошибки:', error);
    }
}

// Отображение курсов
function displayCourses() {
    const coursesList = document.getElementById('courses-list');
    const startIndex = (currentCoursePage - 1) * COURSES_PER_PAGE;
    const endIndex = startIndex + COURSES_PER_PAGE;
    const coursesToDisplay = filteredCourses.slice(startIndex, endIndex);
    
    coursesList.innerHTML = coursesToDisplay.map(course => `
        <div class="col-md-4 mb-4">
            <div class="card course-card h-100">
                <div class="card-body">
                    <h5 class="card-title">${course.name}</h5>
                    <p class="card-text">${course.description}</p>
                    <p class="mb-1"><strong>Преподаватель:</strong> ${course.teacher}</p>
                    <p class="mb-1"><strong>Уровень:</strong> ${course.level}</p>
                    <p class="mb-1"><strong>Продолжительность:</strong> ${course.total_length} недель</p>
                    <p class="mb-1"><strong>Часов в неделю:</strong> ${course.week_length}</p>
                    <p class="mb-3"><strong>Стоимость:</strong> ${course.course_fee_per_hour} руб./час</p>
                    <button class="btn btn-primary w-100" onclick="openCourseModal(${course.id})">Подать заявку</button>
                </div>
            </div>
        </div>
    `).join('');
    
    renderCoursesPagination();
}

// Пагинация курсов
function renderCoursesPagination() {
    const pagination = document.getElementById('courses-pagination');
    const totalPages = Math.ceil(filteredCourses.length / COURSES_PER_PAGE);
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // Кнопка "Назад"
    paginationHTML += `
        <li class="page-item ${currentCoursePage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changeCoursePage(${currentCoursePage - 1}); return false;">Назад</a>
        </li>
    `;
    
    // Номера страниц
    for (let i = 1; i <= totalPages; i++) {
        paginationHTML += `
            <li class="page-item ${i === currentCoursePage ? 'active' : ''}">
                <a class="page-link" href="#" onclick="changeCoursePage(${i}); return false;">${i}</a>
            </li>
        `;
    }
    
    // Кнопка "Вперед"
    paginationHTML += `
        <li class="page-item ${currentCoursePage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changeCoursePage(${currentCoursePage + 1}); return false;">Вперед</a>
        </li>
    `;
    
    pagination.innerHTML = paginationHTML;
}

function changeCoursePage(page) {
    const totalPages = Math.ceil(filteredCourses.length / COURSES_PER_PAGE);
    if (page < 1 || page > totalPages) return;
    currentCoursePage = page;
    displayCourses();
    document.getElementById('courses').scrollIntoView({ behavior: 'smooth' });
}

// Поиск курсов
function searchCourses() {
    const nameQuery = document.getElementById('course-search-name').value.toLowerCase();
    const levelQuery = document.getElementById('course-search-level').value;
    
    filteredCourses = allCourses.filter(course => {
        const matchesName = !nameQuery || course.name.toLowerCase().includes(nameQuery);
        const matchesLevel = !levelQuery || course.level === levelQuery;
        return matchesName && matchesLevel;
    });
    
    currentCoursePage = 1;
    displayCourses();
}

// Открытие модального окна для курса
function openCourseModal(courseId) {
    const course = allCourses.find(c => c.id === courseId);
    if (!course) return;
    
    document.getElementById('course-name-display').value = course.name;
    document.getElementById('course-teacher-display').value = course.teacher;
    document.getElementById('selected-course-id').value = course.id;
    
    // Заполнение дат
    const dateSelect = document.getElementById('course-start-date');
    dateSelect.innerHTML = '<option value="">Выберите дату</option>' + 
        course.start_dates.map(date => {
            const dateObj = new Date(date);
            const dateStr = dateObj.toISOString().split('T')[0];
            return `<option value="${date}">${dateStr}</option>`;
        }).join('');
    
    // Сброс времени
    const timeSelect = document.getElementById('course-start-time');
    timeSelect.disabled = true;
    timeSelect.innerHTML = '<option value="">Сначала выберите дату</option>';
    
    // Отображение продолжительности
    const durationDisplay = document.getElementById('course-duration-display');
    durationDisplay.value = `${course.total_length} недель (последнее занятие: будет рассчитано)`;
    
    // Сброс формы
    document.getElementById('course-students-number').value = 1;
    document.querySelectorAll('#courseModal input[type="checkbox"]').forEach(cb => cb.checked = false);
    document.getElementById('automatic-options').innerHTML = '';
    document.getElementById('total-cost').textContent = '0';
    
    // Сохранение данных курса
    window.currentCourse = course;
    
    const modal = new bootstrap.Modal(document.getElementById('courseModal'));
    modal.show();
}

// Обработка выбора даты
document.addEventListener('DOMContentLoaded', function() {
    const dateSelect = document.getElementById('course-start-date');
    const timeSelect = document.getElementById('course-start-time');
    
    dateSelect.addEventListener('change', function() {
        const selectedDate = this.value;
        if (!selectedDate) {
            timeSelect.disabled = true;
            timeSelect.innerHTML = '<option value="">Сначала выберите дату</option>';
            return;
        }
        
        const course = window.currentCourse;
        const availableTimes = course.start_dates.filter(d => d.startsWith(selectedDate.split('T')[0]));
        
        timeSelect.disabled = false;
        timeSelect.innerHTML = '<option value="">Выберите время</option>' + 
            availableTimes.map(datetime => {
                const time = datetime.split('T')[1].substring(0, 5);
                const endDate = new Date(datetime);
                endDate.setHours(endDate.getHours() + course.week_length);
                const endTime = endDate.toTimeString().substring(0, 5);
                return `<option value="${time}">${time} - ${endTime}</option>`;
            }).join('');
        
        calculateCourseCost();
    });
    
    // Пересчет стоимости при изменении параметров
    timeSelect.addEventListener('change', calculateCourseCost);
    document.getElementById('course-students-number').addEventListener('input', calculateCourseCost);
    document.querySelectorAll('#courseModal input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', calculateCourseCost);
    });
});

// Расчет стоимости курса
function calculateCourseCost() {
    const course = window.currentCourse;
    if (!course) return;
    
    const startDate = document.getElementById('course-start-date').value;
    const startTime = document.getElementById('course-start-time').value;
    const studentsNumber = parseInt(document.getElementById('course-students-number').value) || 1;
    
    if (!startDate || !startTime) {
        document.getElementById('total-cost').textContent = '0';
        return;
    }
    
    const courseFeePerHour = course.course_fee_per_hour;
    const durationInHours = course.total_length * course.week_length;
    
    // Проверка выходных/праздников
    const date = new Date(startDate);
    const dayOfWeek = date.getDay();
    const isWeekendOrHoliday = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.5 : 1;
    
    // Доплаты за время
    const hour = parseInt(startTime.split(':')[0]);
    const morningSurcharge = (hour >= 9 && hour < 12) ? 400 : 0;
    const eveningSurcharge = (hour >= 18 && hour < 20) ? 1000 : 0;
    
    // Базовая стоимость
    let totalCost = ((courseFeePerHour * durationInHours * isWeekendOrHoliday) + morningSurcharge + eveningSurcharge) * studentsNumber;
    
    // Автоматические скидки/надбавки
    const autoOptions = document.getElementById('automatic-options');
    autoOptions.innerHTML = '';
    
    // Ранняя регистрация (месяц вперед)
    const today = new Date();
    const courseStart = new Date(startDate);
    const daysUntilStart = Math.ceil((courseStart - today) / (1000 * 60 * 60 * 24));
    const earlyRegistration = daysUntilStart >= 30;
    
    if (earlyRegistration) {
        totalCost *= 0.9;
        autoOptions.innerHTML += `
            <div class="alert alert-success auto-option">
                ✓ Скидка за раннюю регистрацию: -10%
            </div>
        `;
    }
    
    // Групповая скидка (5+ человек)
    const groupEnrollment = studentsNumber >= 5;
    if (groupEnrollment) {
        totalCost *= 0.85;
        autoOptions.innerHTML += `
            <div class="alert alert-success auto-option">
                ✓ Скидка за групповую запись: -15%
            </div>
        `;
    }
    
    // Интенсивный курс (5+ часов в неделю)
    const intensiveCourse = course.week_length >= 5;
    if (intensiveCourse) {
        totalCost *= 1.2;
        autoOptions.innerHTML += `
            <div class="alert alert-warning auto-option">
                ⚠ Надбавка за интенсивный курс: +20%
            </div>
        `;
    }
    
    // Дополнительные опции
    if (document.getElementById('opt-supplementary').checked) {
        totalCost += 2000 * studentsNumber;
    }
    if (document.getElementById('opt-personalized').checked) {
        totalCost += 1500 * course.total_length;
    }
    if (document.getElementById('opt-excursions').checked) {
        totalCost *= 1.25;
    }
    if (document.getElementById('opt-assessment').checked) {
        totalCost += 300;
    }
    if (document.getElementById('opt-interactive').checked) {
        totalCost *= 1.5;
    }
    
    // Обновление дисплея продолжительности
    const lastClassDate = new Date(courseStart);
    lastClassDate.setDate(lastClassDate.getDate() + (course.total_length * 7));
    document.getElementById('course-duration-display').value = 
        `${course.total_length} недель (последнее занятие: ${lastClassDate.toLocaleDateString('ru-RU')})`;
    
    document.getElementById('total-cost').textContent = Math.round(totalCost);
}

// Отправка заявки на курс
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('submit-course-enrollment').addEventListener('click', async function() {
        const course = window.currentCourse;
        const startDateFull = document.getElementById('course-start-date').value;
        const startTime = document.getElementById('course-start-time').value;
        const studentsNumber = parseInt(document.getElementById('course-students-number').value);
        
        if (!startDateFull || !startTime || !studentsNumber) {
            showNotification('Пожалуйста, заполните все обязательные поля', 'warning');
            return;
        }
        
        const requestData = {
            course_id: course.id,
            date_start: startDateFull.split('T')[0],
            time_start: startTime,
            duration: course.total_length * course.week_length,
            persons: studentsNumber,
            price: parseInt(document.getElementById('total-cost').textContent),
            early_registration: document.getElementById('automatic-options').innerHTML.includes('раннюю регистрацию'),
            group_enrollment: document.getElementById('automatic-options').innerHTML.includes('групповую запись'),
            intensive_course: document.getElementById('automatic-options').innerHTML.includes('интенсивный курс'),
            supplementary: document.getElementById('opt-supplementary').checked,
            personalized: document.getElementById('opt-personalized').checked,
            excursions: document.getElementById('opt-excursions').checked,
            assessment: document.getElementById('opt-assessment').checked,
            interactive: document.getElementById('opt-interactive').checked
        };
        
        try {
            const response = await fetch(`${API_BASE_URL}/orders?api_key=${API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Ошибка при создании заявки');
            }
            
            showNotification('Заявка успешно создана!', 'success');
            bootstrap.Modal.getInstance(document.getElementById('courseModal')).hide();
        } catch (error) {
            showNotification(error.message, 'danger');
            console.error(error);
        }
    });
});

// Загрузка репетиторов
async function loadTutors() {
    try {
        const response = await fetch(`${API_BASE_URL}/tutors?api_key=${API_KEY}`);
        if (!response.ok) throw new Error('Ошибка загрузки репетиторов');
        
        allTutors = await response.json();
        filteredTutors = [...allTutors];
        
        // Заполнение фильтра квалификаций
        const qualifications = [...new Set(allTutors.map(t => t.language_level))];
        const qualSelect = document.getElementById('tutor-search-qualification');
        qualSelect.innerHTML = '<option value="">Все квалификации</option>' + 
            qualifications.map(q => `<option value="${q}">${q}</option>`).join('');
        
        displayTutors();
    } catch (error) {
        showNotification('Не удалось загрузить репетиторов', 'danger');
        console.error(error);
    }
}

// Отображение репетиторов
function displayTutors() {
    const tbody = document.getElementById('tutors-table-body');
    tbody.innerHTML = filteredTutors.map(tutor => `
        <tr>
            <td>${tutor.name}</td>
            <td>${tutor.language_level}</td>
            <td>${tutor.languages_offered.join(', ')}</td>
            <td>${tutor.work_experience}</td>
            <td>${tutor.price_per_hour}</td>
            <td>
                <button class="btn btn-sm btn-success" onclick="openTutorModal(${tutor.id})">Выбрать</button>
            </td>
        </tr>
    `).join('');
}

// Поиск репетиторов
function searchTutors() {
    const qualificationQuery = document.getElementById('tutor-search-qualification').value;
    const experienceQuery = parseInt(document.getElementById('tutor-search-experience').value) || 0;
    
    filteredTutors = allTutors.filter(tutor => {
        const matchesQualification = !qualificationQuery || tutor.language_level === qualificationQuery;
        const matchesExperience = !experienceQuery || tutor.work_experience >= experienceQuery;
        return matchesQualification && matchesExperience;
    });
    
    displayTutors();
}

// Открытие модального окна для репетитора
function openTutorModal(tutorId) {
    const tutor = allTutors.find(t => t.id === tutorId);
    if (!tutor) return;
    
    document.getElementById('tutor-name-display').value = tutor.name;
    document.getElementById('selected-tutor-id').value = tutor.id;
    document.getElementById('tutor-price-per-hour').value = tutor.price_per_hour;
    
    // Сброс формы
    document.getElementById('tutor-date-start').value = '';
    document.getElementById('tutor-time-start').value = '';
    document.getElementById('tutor-duration').value = 1;
    document.getElementById('tutor-students-number').value = 1;
    document.getElementById('tutor-total-cost').textContent = '0';
    
    const modal = new bootstrap.Modal(document.getElementById('tutorModal'));
    modal.show();
}

// Расчет стоимости репетитора
document.addEventListener('DOMContentLoaded', function() {
    const tutorInputs = ['tutor-duration', 'tutor-students-number'];
    tutorInputs.forEach(id => {
        document.getElementById(id).addEventListener('input', calculateTutorCost);
    });
});

function calculateTutorCost() {
    const pricePerHour = parseInt(document.getElementById('tutor-price-per-hour').value) || 0;
    const duration = parseInt(document.getElementById('tutor-duration').value) || 1;
    const students = parseInt(document.getElementById('tutor-students-number').value) || 1;
    
    const totalCost = pricePerHour * duration * students;
    document.getElementById('tutor-total-cost').textContent = totalCost;
}

// Отправка заявки к репетитору
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('submit-tutor-request').addEventListener('click', async function() {
        const tutorId = document.getElementById('selected-tutor-id').value;
        const dateStart = document.getElementById('tutor-date-start').value;
        const timeStart = document.getElementById('tutor-time-start').value;
        const duration = parseInt(document.getElementById('tutor-duration').value);
        const persons = parseInt(document.getElementById('tutor-students-number').value);
        
        if (!dateStart || !timeStart || !duration || !persons) {
            showNotification('Пожалуйста, заполните все поля', 'warning');
            return;
        }
        
        const requestData = {
            tutor_id: parseInt(tutorId),
            date_start: dateStart,
            time_start: timeStart,
            duration: duration,
            persons: persons,
            price: parseInt(document.getElementById('tutor-total-cost').textContent),
            early_registration: false,
            group_enrollment: false,
            intensive_course: false,
            supplementary: false,
            personalized: false,
            excursions: false,
            assessment: false,
            interactive: false
        };
        
        try {
            const response = await fetch(`${API_BASE_URL}/orders?api_key=${API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Ошибка при создании заявки');
            }
            
            showNotification('Заявка успешно создана!', 'success');
            bootstrap.Modal.getInstance(document.getElementById('tutorModal')).hide();
        } catch (error) {
            showNotification(error.message, 'danger');
            console.error(error);
        }
    });
});

// Инициализация карты Яндекс
function initMap() {
    ymaps.ready(function() {
        const map = new ymaps.Map('yandex-map', {
            center: [55.751574, 37.573856],
            zoom: 10
        });
        
        // Примеры учебных ресурсов
        const resources = [
            {
                coords: [55.751574, 37.573856],
                name: 'Языковой клуб "Полиглот"',
                description: 'Разговорная практика, еженедельные встречи',
                hours: 'Пн-Пт: 10:00-20:00'
            },
            {
                coords: [55.755826, 37.617300],
                name: 'Библиотека иностранной литературы',
                description: 'Большая коллекция книг на разных языках',
                hours: 'Вт-Вс: 09:00-21:00'
            },
            {
                coords: [55.742125, 37.589156],
                name: 'Культурный центр',
                description: 'Курсы, мероприятия, кино на иностранных языках',
                hours: 'Ежедневно: 10:00-22:00'
            }
        ];
        
        resources.forEach(resource => {
            const placemark = new ymaps.Placemark(resource.coords, {
                balloonContent: `
                    <strong>${resource.name}</strong><br>
                    ${resource.description}<br>
                    <em>${resource.hours}</em>
                `
            }, {
                preset: 'islands#blueDotIcon'
            });
            map.geoObjects.add(placemark);
        });
    });
}

// Обработчики событий
document.addEventListener('DOMContentLoaded', function() {
    // Загрузка данных
    loadCourses();
    loadTutors();
    
    // Инициализация карты
    if (typeof ymaps !== 'undefined') {
        initMap();
    }
    
    // Поиск курсов
    document.getElementById('search-courses-btn').addEventListener('click', searchCourses);
    
    // Поиск репетиторов
    document.getElementById('search-tutors-btn').addEventListener('click', searchTutors);
});
