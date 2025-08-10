/* app.js
   نسخهٔ اولیهٔ منطق برنامه و ذخیره در localStorage
   توضیحات به فارسی داخل کد قرار داده شده است.
*/

// ---------- ابزارهای ذخیره/خواندن ----------
const STORAGE_KEY = "course_manager_v1";

function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { courses: [], terms: [] };
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error("خطا در خواندن داده‌ها:", e);
    return { courses: [], terms: [] };
  }
}
function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
let data = loadData();

// ---------- کمک‌ها ----------
function findCourse(id) {
  return data.courses.find(c => c.id === id);
}
function calcTotalUnits(theory, practical) {
  return Number(theory) + Number(practical);
}
// محاسبهٔ تعداد جلسات مورد نیاز طبق قواعد:
// - هر واحد عملی = 1 جلسه 2 ساعته/هفته
// - هر 2 واحد تئوری = 1 جلسه 2 ساعته/هفته
// - درس 3 واحد تئوری => 1 جلسه ثابت + 1 جلسه زوج/فرد (اضافه)
function requiredSessionsForCourse(course) {
  const practical = Number(course.practical || 0);
  const theory = Number(course.theory || 0);
  const practicalSessions = practical; // هر واحد عملی = 1 جلسه
  const theoryPairs = Math.floor(theory / 2);
  let extraAlternating = 0;
  if (theory === 3) {
    // یک جلسه ثابت + یک جلسه زوج/فرد
    // theoryPairs will be 1 (for the pair), so we add +1 alternating
    extraAlternating = 1;
  }
  return { regular: practicalSessions + theoryPairs, alternating: extraAlternating };
}

// بررسی تداخل: برای هر جلسه جدید، با جلسات موجود در همان ترم مقایسه می‌کنیم.
// جلسه‌ها ساختار: { day, start (HH:MM), end (HH:MM), weekType: "every"/"odd"/"even" }
function timeToMinutes(t) {
  const [h,m] = t.split(":").map(Number);
  return h*60 + m;
}
function sessionsOverlap(a, b) {
  if (a.day !== b.day) return false;
  // اگر هر کدام weekType متفاوت باشند اما هر دو != 'every' و متفاوت باشند،
  // هنوز ممکن است یک روز با هم تلاقی نداشته باشند (مثلاً one odd one even) —
  // اما از آنجایی که آنها در هفته‌های مختلف برگزار می‌شوند، تداخل حقیقی نیست.
  if (a.weekType !== 'every' && b.weekType !== 'every' && a.weekType !== b.weekType) {
    return false; // یک هفته متفاوت؛ تداخل نیست
  }
  const a1 = timeToMinutes(a.start), a2 = timeToMinutes(a.end);
  const b1 = timeToMinutes(b.start), b2 = timeToMinutes(b.end);
  return Math.max(a1,b1) < Math.min(a2,b2);
}

// جلوگیری از ثبت کلاس در دوشنبه 10:00-12:00
function violatesCulturalHour(session) {
  // روز دوشنبه در این سیستم مقدار 'mon'
  if (session.day !== 'mon') return false;
  const start = timeToMinutes(session.start), end = timeToMinutes(session.end);
  const cultStart = 10*60, cultEnd = 12*60;
  return Math.max(start, cultStart) < Math.min(end, cultEnd);
}

// ---------- DOM و UI ----------
const views = {
  dashboard: document.getElementById('dashboard'),
  courses: document.getElementById('courses'),
  terms: document.getElementById('terms'),
  termDetail: document.getElementById('term-detail'),
};
function showView(name) {
  Object.values(views).forEach(v => v.classList.add('hidden'));
  views[name].classList.remove('hidden');
}

// Nav
document.getElementById('nav-dashboard').addEventListener('click', ()=> { showView('dashboard'); renderSummary(); });
document.getElementById('nav-courses').addEventListener('click', ()=> { showView('courses'); renderCoursesTable(); });
document.getElementById('nav-terms').addEventListener('click', ()=> { showView('terms'); renderTermsTable(); });

// dashboard: ثبت درس
const courseForm = document.getElementById('course-form');
const courseTotalEl = document.getElementById('course-total');
function updateCourseTotal() {
  const t = Number(document.getElementById('course-theory').value||0);
  const p = Number(document.getElementById('course-practical').value||0);
  courseTotalEl.textContent = calcTotalUnits(t,p);
}
document.getElementById('course-theory').addEventListener('input', updateCourseTotal);
document.getElementById('course-practical').addEventListener('input', updateCourseTotal);

courseForm.addEventListener('submit', (e)=>{
  e.preventDefault();
  const id = document.getElementById('course-id').value.trim();
  const theory = Number(document.getElementById('course-theory').value||0);
  const practical = Number(document.getElementById('course-practical').value||0);
  const prereqs = document.getElementById('course-prereqs').value.split(',').map(s=>s.trim()).filter(Boolean);
  const coreqs = document.getElementById('course-coreqs').value.split(',').map(s=>s.trim()).filter(Boolean);
  if (!id) return alert("شماره درس وارد شود.");
  if (findCourse(id)) return alert("این شماره درس از قبل وجود دارد.");
  const course = { id, theory, practical, prereqs, coreqs, passed: false, grade: null };
  data.courses.push(course);
  saveData(data);
  alert("درس ثبت شد.");
  courseForm.reset();
  updateCourseTotal();
  renderSummary();
});

// نمایش خلاصه
function renderSummary() {
  document.getElementById('summary-courses').textContent = data.courses.length;
  document.getElementById('summary-terms').textContent = data.terms.length;
}
renderSummary();

// جدول دروس و عملیات (ویرایش نمره، حذف)
function renderCoursesTable() {
  const tbody = document.querySelector('#courses-table tbody');
  tbody.innerHTML = '';
  data.courses.forEach(c=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${c.id}</td>
      <td>${c.theory}</td>
      <td>${c.practical}</td>
      <td>${calcTotalUnits(c.theory,c.practical)}</td>
      <td>${(c.prereqs||[]).join(',')}/${(c.coreqs||[]).join(',')}</td>
      <td>
        <input type="number" min="0" max="20" value="${c.grade ?? ''}" data-course-id="${c.id}" class="grade-input" />
        <div style="font-size:12px;color:${c.passed ? 'green':'#666'}">${c.passed ? 'قبول شده' : ''}</div>
      </td>
      <td>
        <button class="del-course small-btn" data-id="${c.id}">حذف</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // حذف درس
  tbody.querySelectorAll('.del-course').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const id = btn.dataset.id;
      if (!confirm('آیا مطمئن هستید حذف شود؟')) return;
      data.courses = data.courses.filter(x=>x.id !== id);
      // همچنین از همهٔ ترم‌ها اگر وجود دارد حذفش می‌کنیم
      data.terms.forEach(t=>{
        t.courses = (t.courses || []).filter(tc=>tc.courseId !== id);
      });
      saveData(data);
      renderCoursesTable();
      renderTermsTable();
      renderSummary();
    });
  });

  // ثبت نمره
  tbody.querySelectorAll('.grade-input').forEach(inp=>{
    inp.addEventListener('change', ()=>{
      const id = inp.dataset.courseId;
      const g = inp.value === '' ? null : Number(inp.value);
      const course = findCourse(id);
      if (!course) return;
      course.grade = g;
      course.passed = (g !== null && g >= 10);
      saveData(data);
      renderCoursesTable();
      renderTermsTable();
    });
  });
}

// ترم‌ها: ساخت ترم و نمایش لیست
const termForm = document.getElementById('term-form');
termForm.addEventListener('submit', (e)=>{
  e.preventDefault();
  const id = document.getElementById('term-id').value.trim();
  if (!id) return;
  if (data.terms.find(t=>t.id===id)) { alert('این ترم وجود دارد'); return; }
  data.terms.push({ id, courses: [] });
  saveData(data);
  document.getElementById('term-id').value = '';
  renderTermsTable();
  renderSummary();
});

function sumUnitsOfTerm(term) {
  let sum = 0;
  (term.courses || []).forEach(tc=>{
    const c = findCourse(tc.courseId);
    if (c) sum += calcTotalUnits(c.theory, c.practical);
  });
  return sum;
}

function renderTermsTable() {
  const tbody = document.querySelector('#terms-table tbody');
  tbody.innerHTML = '';
  data.terms.forEach(t=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${t.id}</td>
      <td>${sumUnitsOfTerm(t)}</td>
      <td>
        <button class="open-term small-btn" data-id="${t.id}">باز کردن</button>
        <button class="del-term small-btn" data-id="${t.id}">حذف</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('.open-term').forEach(b=>{
    b.addEventListener('click', ()=> openTermDetail(b.dataset.id));
  });
  tbody.querySelectorAll('.del-term').forEach(b=>{
    b.addEventListener('click', ()=>{
      if (!confirm('حذف ترم؟')) return;
      data.terms = data.terms.filter(tt=>tt.id !== b.dataset.id);
      saveData(data);
      renderTermsTable();
      renderSummary();
    });
  });
}

// ---------- صفحه جزئیات ترم ----------
let currentTermId = null;

function openTermDetail(id) {
  currentTermId = id;
  document.getElementById('term-detail-id').textContent = id;
  showView('termDetail');
  populateCourseSelect();
  renderTermCourses();
  renderWeeklySchedule();
  updateRequiredSessionsDisplay();
}

document.getElementById('back-to-terms').addEventListener('click', ()=>{
  showView('terms');
  currentTermId = null;
});

// پر کردن لیست دروس برای اضافه کردن به ترم (فقط دروسی که قبلاً قبول نشده‌اند)
function populateCourseSelect() {
  const sel = document.getElementById('select-course-for-term');
  sel.innerHTML = '';
  data.courses.forEach(c=>{
    const disabled = c.passed ? 'disabled' : '';
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = `${c.id} — ${calcTotalUnits(c.theory,c.practical)} واحد ${c.passed ? '(قبول)' : ''}`;
    if (c.passed) opt.disabled = true;
    sel.appendChild(opt);
  });
  sel.addEventListener('change', updateRequiredSessionsDisplay);
  updateRequiredSessionsDisplay();
}

function getCurrentTerm() {
  return data.terms.find(t => t.id === currentTermId);
}

function updateRequiredSessionsDisplay() {
  const sel = document.getElementById('select-course-for-term');
  const cid = sel.value;
  const course = findCourse(cid);
  const out = document.getElementById('required-sessions');
  if (!course) { out.textContent = '0'; return; }
  const rs = requiredSessionsForCourse(course);
  out.textContent = `${rs.regular} (ثابت) + ${rs.alternating} (زوج/فرد)`;
}

// اضافه کردن درس به ترم
const addToTermForm = document.getElementById('add-to-term-form');
addToTermForm.addEventListener('submit', (e)=>{
  e.preventDefault();
  const term = getCurrentTerm();
  if (!term) return alert('ترمی انتخاب نشده');
  const courseId = document.getElementById('select-course-for-term').value;
  const group = document.getElementById('term-course-group').value || '';
  const location = document.getElementById('term-course-location').value || '';
  const day = document.getElementById('day-select').value;
  const start = document.getElementById('start-time').value;
  const weekType = document.getElementById('week-type').value;
  const exam = document.getElementById('exam-date').value || null;

  const course = findCourse(courseId);
  if (!course) return alert('درس نامعتبر');

  if (course.passed) return alert('این درس قبلاً قبول شده و امکان افزودن آن وجود ندارد.');

  // محاسبهٔ تعداد جلسات مورد نیاز
  const req = requiredSessionsForCourse(course);

  // ساخت جلسات: ما براساس تعداد regular جلسات با weekType 'every' می‌سازیم.
  // برای جلسات alternating (زوج/فرد) از weekType انتخاب‌شده استفاده می‌کنیم.
  // هر جلسه طول ثابت 2 ساعت است.
  const sessions = [];
  const durationMinutes = 120;
  const startMinutes = timeToMinutes(start);
  const endMinutes = startMinutes + durationMinutes;
  const endTime = `${String(Math.floor(endMinutes/60)).padStart(2,'0')}:${String(endMinutes%60).padStart(2,'0')}`;

  // بررسی ممنوعیت ساعت فرهنگی
  const sampleSession = { day, start, end: endTime, weekType: 'every' };
  if (violatesCulturalHour(sampleSession)) return alert('قانون: دوشنبه ساعت 10 تا 12 ساعت فرهنگی است — نمی‌توان کلاس ثبت کرد.');

  // آماده‌سازی جلسات ثابت (regular)
  for (let i=0;i<req.regular;i++){
    sessions.push({ day, start, end: endTime, weekType: 'every', location });
  }
  // اضافه کردنجلسات زوج/فرد
  for (let i=0;i<req.alternating;i++){
    sessions.push({ day, start, end: endTime, weekType, location });
  }

  // بررسی تداخل با جلسات موجود در ترم
  const termExistingSessions = [];
  (term.courses || []).forEach(tc=>{
    (tc.sessions || []).forEach(s=> termExistingSessions.push(s));
  });

  for (const s of sessions) {
    if (violatesCulturalHour(s)) {
      return alert('تداخل با ساعت فرهنگی: دوشنبه 10-12 امکان‌پذیر نیست.');
    }
    for (const ex of termExistingSessions) {
      if (sessionsOverlap(s, ex)) {
        return alert(`تداخل زمانی با جلسه‌ای که قبلاً ثبت شده (روز ${s.day}، شروع ${s.start}). لطفاً زمان دیگری انتخاب کنید.`);
      }
    }
  }

  // افزودن به ترم
  term.courses = term.courses || [];
  term.courses.push({
    courseId,
    group,
    sessions,
    exam
  });
  saveData(data);
  alert('درس به ترم اضافه شد.');
  renderTermCourses();
  renderWeeklySchedule();
  renderTermsTable(); // برای بروز شدن مجموع واحدها
});

// نمایش دروس یک ترم
function renderTermCourses() {
  const tbody = document.querySelector('#term-courses-table tbody');
  tbody.innerHTML = '';
  const term = getCurrentTerm();
  if (!term) return;
  (term.courses || []).forEach((tc, idx)=>{
    const c = findCourse(tc.courseId);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${tc.courseId} ${c ? `(${calcTotalUnits(c.theory,c.practical)} واحد)` : ''}</td>
      <td>${tc.group || ''}</td>
      <td>${(tc.sessions || []).map(s => `${s.day} ${s.start}-${s.end} [${s.weekType}] @${s.location}`).join('<br>')}</td>
      <td>
        <button class="del-term-course small-btn" data-idx="${idx}">حذف</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('.del-term-course').forEach(b=>{
    b.addEventListener('click', ()=>{
      const idx = Number(b.dataset.idx);
      if (!confirm('آیا حذف درس از ترم انجام شود؟')) return;
      const term = getCurrentTerm();
      term.courses.splice(idx,1);
      saveData(data);
      renderTermCourses();
      renderWeeklySchedule();
      renderTermsTable();
    });
  });
}

// رندر سادهٔ برنامهٔ هفتگی
function renderWeeklySchedule() {
  const out = document.getElementById('weekly-schedule');
  out.innerHTML = '';
  const term = getCurrentTerm();
  if (!term) { out.textContent = 'ترم انتخاب نشده'; return; }
  // جمع‌آوری جلسات همراه با مرجع درس
  const rows = [];
  (term.courses || []).forEach(tc=>{
    (tc.sessions || []).forEach(s=>{
      rows.push({ courseId: tc.courseId, group: tc.group, ...s });
    });
  });
  // مرتب‌سازی بر اساس روز و ساعت
  const dayOrder = ['sat','sun','mon','tue','wed','thu','fri'];
  rows.sort((a,b)=>{
    const da = dayOrder.indexOf(a.day), db = dayOrder.indexOf(b.day);
    if (da !== db) return da-db;
    return timeToMinutes(a.start) - timeToMinutes(b.start);
  });

  if (rows.length === 0) { out.textContent = 'جلسه‌ای ثبت نشده.'; return; }

  // نمایش
  rows.forEach(r=>{
    const el = document.createElement('div');
    el.innerHTML = `<strong>${r.courseId}</strong> — ${dayLabel(r.day)} ${r.start}-${r.end} (${r.weekType}) — ${r.location} — گروه: ${r.group}`;
    el.style.padding = '6px 0';
    out.appendChild(el);
  });
}

function dayLabel(k){
  switch(k){
    case 'sat': return 'شنبه';
    case 'sun': return 'یک‌شنبه';
    case 'mon': return 'دوشنبه';
    case 'tue': return 'سه‌شنبه';
    case 'wed': return 'چهارشنبه';
    case 'thu': return 'پنج‌شنبه';
    case 'fri': return 'جمعه';
    default: return k;
  }
}

// رندر اولیه
renderCoursesTable();
renderTermsTable();
