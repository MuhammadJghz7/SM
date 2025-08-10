// ======== مدیریت داده‌ها در LocalStorage ========

let courses = JSON.parse(localStorage.getItem('courses') || '[]');
let terms = JSON.parse(localStorage.getItem('terms') || '[]');

function saveData() {
    localStorage.setItem('courses', JSON.stringify(courses));
    localStorage.setItem('terms', JSON.stringify(terms));
}

// ======== تغییر ویو ========

const views = document.querySelectorAll('.view');
function showView(id) {
    views.forEach(v => v.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    if (id === 'dashboard') renderDashboard();
    if (id === 'courses') renderCourses();
    if (id === 'terms') renderTerms();
}

document.getElementById('nav-dashboard').onclick = () => showView('dashboard');
document.getElementById('nav-courses').onclick = () => showView('courses');
document.getElementById('nav-terms').onclick = () => showView('terms');

// ======== ثبت درس جدید ========

const totalEl = document.getElementById('course-total');
document.getElementById('course-theory').addEventListener('input', updateTotalUnits);
document.getElementById('course-practical').addEventListener('input', updateTotalUnits);

function updateTotalUnits() {
    const t = parseInt(document.getElementById('course-theory').value || 0);
    const p = parseInt(document.getElementById('course-practical').value || 0);
    totalEl.textContent = t + p;
}

document.getElementById('course-form').addEventListener('submit', e => {
    e.preventDefault();
    const id = document.getElementById('course-id').value.trim();
    const theory = parseInt(document.getElementById('course-theory').value || 0);
    const practical = parseInt(document.getElementById('course-practical').value || 0);
    const prereqs = document.getElementById('course-prereqs').value.split(',').map(s => s.trim()).filter(Boolean);
    const coreqs = document.getElementById('course-coreqs').value.split(',').map(s => s.trim()).filter(Boolean);

    if (courses.some(c => c.id === id)) {
        alert('درس با این شماره قبلاً ثبت شده');
        return;
    }

    courses.push({ id, theory, practical, prereqs, coreqs, grade: null });
    saveData();
    e.target.reset();
    updateTotalUnits();
    renderCourses();
    renderDashboard();
    alert('درس ثبت شد');
});

// ======== نمایش لیست دروس ========

function renderCourses() {
    const tbody = document.querySelector('#courses-table tbody');
    tbody.innerHTML = '';
    courses.forEach((c, i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${c.id}</td>
          <td>${c.theory}</td>
          <td>${c.practical}</td>
          <td>${c.theory + c.practical}</td>
          <td>${[...c.prereqs, ...c.coreqs].join(', ') || '-'}</td>
          <td><input type="number" min="0" max="20" value="${c.grade ?? ''}" data-grade-index="${i}" /></td>
          <td><button class="small-btn" data-del-course="${i}">حذف</button></td>
        `;
        tbody.appendChild(tr);
    });

    tbody.querySelectorAll('[data-del-course]').forEach(btn => {
        btn.onclick = () => {
            if (confirm('حذف این درس؟')) {
                courses.splice(parseInt(btn.dataset.delCourse), 1);
                saveData();
                renderCourses();
                renderDashboard();
            }
        };
    });

    tbody.querySelectorAll('[data-grade-index]').forEach(inp => {
        inp.onchange = () => {
            const val = inp.value ? parseFloat(inp.value) : null;
            courses[parseInt(inp.dataset.gradeIndex)].grade = val;
            saveData();
            renderDashboard();
        };
    });
}

// ======== ترم‌ها ========

document.getElementById('term-form').addEventListener('submit', e => {
    e.preventDefault();
    const id = document.getElementById('term-id').value.trim();
    if (terms.some(t => t.id === id)) {
        alert('ترم با این شناسه قبلاً وجود دارد');
        return;
    }
    terms.push({ id, courses: [] });
    saveData();
    e.target.reset();
    renderTerms();
});

function renderTerms() {
    const tbody = document.querySelector('#terms-table tbody');
    tbody.innerHTML = '';
    terms.forEach((t, i) => {
        const totalUnits = t.courses.reduce((sum, c) => sum + c.totalUnits, 0);
        const gpa = calcTermGPA(t);
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${t.id}</td>
          <td>${totalUnits}</td>
          <td>${gpa ?? '-'}</td>
          <td><button class="small-btn" data-view-term="${i}">مشاهده</button></td>
        `;
        tbody.appendChild(tr);
    });

    tbody.querySelectorAll('[data-view-term]').forEach(btn => {
        btn.onclick = () => showTermDetail(parseInt(btn.dataset.viewTerm));
    });
}

function calcTermGPA(term) {
    const passed = term.courses.filter(c => typeof c.grade === 'number');
    if (!passed.length) return null;
    const sum = passed.reduce((s, c) => s + c.grade * c.totalUnits, 0);
    const units = passed.reduce((s, c) => s + c.totalUnits, 0);
    return (sum / units).toFixed(2);
}

function calcOverallGPA() {
    const passed = [];
    terms.forEach(t => {
        t.courses.forEach(c => {
            if (typeof c.grade === 'number' && c.grade >= 10) passed.push(c);
        });
    });
    if (!passed.length) return null;
    const sum = passed.reduce((s, c) => s + c.grade * c.totalUnits, 0);
    const units = passed.reduce((s, c) => s + c.totalUnits, 0);
    return (sum / units).toFixed(2);
}

// ======== جزئیات ترم ========

let currentTermIndex = null;

function showTermDetail(index) {
    currentTermIndex = index;
    const term = terms[index];
    document.getElementById('term-detail-id').textContent = term.id;
    populateCourseSelect();
    renderTermCourses();
    renderWeeklySchedule();
    showView('term-detail');
}

document.getElementById('back-to-terms').onclick = () => showView('terms');

function populateCourseSelect() {
    const select = document.getElementById('select-course-for-term');
    select.innerHTML = '';
    courses.forEach(c => {
        const alreadyPassed = terms.some(t => 
            t.courses.some(tc => tc.id === c.id && typeof tc.grade === 'number' && tc.grade >= 10)
        );
        if (!alreadyPassed) {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = `${c.id} (${c.theory + c.practical} واحد)`;
            select.appendChild(opt);
        }
    });
}

document.getElementById('select-course-for-term').onchange = updateSessionFields;

function updateSessionFields() {
    const id = document.getElementById('select-course-for-term').value;
    const course = courses.find(c => c.id === id);
    if (!course) return;

    const sessionsNeeded = calcSessionsNeeded(course);
    document.getElementById('required-sessions').textContent = sessionsNeeded;
    const container = document.getElementById('session-fields');
    container.innerHTML = '';

    for (let i = 0; i < sessionsNeeded; i++) {
        const div = document.createElement('div');
        div.className = 'session-group';
        div.innerHTML = `
          <label>روز: 
            <select name="day">
              <option>شنبه</option><option>یکشنبه</option><option>دوشنبه</option>
              <option>سه‌شنبه</option><option>چهارشنبه</option><option>پنجشنبه</option>
            </select>
          </label>
          <label>ساعت شروع:
            <input type="time" name="start" required />
          </label>
          <label>مکان:
            <input name="place" required />
          </label>
          <label>نوع هفته:
            <select name="weektype">
              <option value="هرهفته">هر هفته</option>
              <option value="زوج">زوج</option>
              <option value="فرد">فرد</option>
            </select>
          </label>
        `;
        container.appendChild(div);
    }
}

function calcSessionsNeeded(c) {
    let sessions = 0;
    sessions += c.practical; // هر واحد عملی یک جلسه
    sessions += Math.floor(c.theory / 2); // هر دو واحد تئوری یک جلسه
    if (c.theory % 2 === 1 && c.theory > 1) sessions += 1; // برای 3 واحد تئوری
    return sessions;
}

document.getElementById('add-to-term-form').onsubmit = e => {
    e.preventDefault();
    const courseId = document.getElementById('select-course-for-term').value;
    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    const group = document.getElementById('term-course-group').value.trim();
    const examDate = document.getElementById('exam-date').value;
    const sessions = [];
    const fields = document.querySelectorAll('#session-fields .session-group');
    for (const f of fields) {
        const day = f.querySelector('[name=day]').value;
        const start = f.querySelector('[name=start]').value;
        const place = f.querySelector('[name=place]').value;
        const weektype = f.querySelector('[name=weektype]').value;
        if (day === 'دوشنبه' && start === '10:00') {
            alert('ساعت فرهنگی: دوشنبه ۱۰ تا ۱۲ مجاز نیست');
            return;
        }
        sessions.push({ day, start, place, weektype });
    }

    terms[currentTermIndex].courses.push({
        id: course.id,
        theory: course.theory,
        practical: course.practical,
        totalUnits: course.theory + course.practical,
        group, examDate, sessions,
        grade: null
    });

    saveData();
    renderTermCourses();
    renderWeeklySchedule();
    populateCourseSelect();
    e.target.reset();
    document.getElementById('session-fields').innerHTML = '';
    document.getElementById('required-sessions').textContent = '0';
};

function renderTermCourses() {
    const tbody = document.querySelector('#term-courses-table tbody');
    tbody.innerHTML = '';
    const term = terms[currentTermIndex];
    term.courses.forEach((c, i) => {
        const sessionsText = c.sessions.map(s => `${s.day} ${s.start} (${s.place}) [${s.weektype}]`).join('<br>');
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${c.id}</td>
          <td>${c.group}</td>
          <td>${sessionsText}</td>
          <td>${c.examDate || '-'}</td>
          <td><input type="number" min="0" max="20" value="${c.grade ?? ''}" data-term-grade="${i}" /></td>
          <td><button class="small-btn" data-del-term-course="${i}">حذف</button></td>
        `;
        tbody.appendChild(tr);
    });

    tbody.querySelectorAll('[data-del-term-course]').forEach(btn => {
        btn.onclick = () => {
            if (confirm('حذف این درس از ترم؟')) {
                terms[currentTermIndex].courses.splice(parseInt(btn.dataset.delTermCourse), 1);
                saveData();
                renderTermCourses();
                renderWeeklySchedule();
                populateCourseSelect();
            }
        };
    });

    tbody.querySelectorAll('[data-term-grade]').forEach(inp => {
        inp.onchange = () => {
            const val = inp.value ? parseFloat(inp.value) : null;
            terms[currentTermIndex].courses[parseInt(inp.dataset.termGrade)].grade = val;
            saveData();
            renderTerms();
            renderDashboard();
        };
    });
}

function renderWeeklySchedule() {
    const term = terms[currentTermIndex];
    const scheduleDiv = document.getElementById('weekly-schedule');
    scheduleDiv.innerHTML = '';
    term.courses.forEach(c => {
        c.sessions.forEach(s => {
            const div = document.createElement('div');
            div.textContent = `${c.id} - ${s.day} ${s.start} (${s.place}) [${s.weektype}]`;
            scheduleDiv.appendChild(div);
        });
    });
}

// ======== داشبورد ========

function renderDashboard() {
    document.getElementById('summary-courses').textContent = courses.length;
    document.getElementById('summary-terms').textContent = terms.length;
    const gpa = calcOverallGPA();
    document.getElementById('overall-gpa').textContent = gpa ?? '-';
}

// ======== شروع ========

showView('dashboard');
renderDashboard();
