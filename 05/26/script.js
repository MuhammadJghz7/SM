let courses = JSON.parse(localStorage.getItem("courses")) || defaultCourses;

// رنگ پس‌زمینه کارت‌ها
const typeClassMap = {
  "عمومی": "type-omumi",
  "پایه": "type-paye",
  "اختیاری": "type-ekhtiari",
  "اصلی": "type-asli"
};

function saveCourses() {
  localStorage.setItem("courses", JSON.stringify(courses));
}

// 📌 مدیریت صفحه دروس
if (document.getElementById("addCourseForm")) {
  const courseList = document.getElementById("courseList");
  const typeOrder = { "عمومی": 1, "پایه": 2, "اختیاری": 3, "اصلی": 4 };

  document.getElementById("addCourseForm").addEventListener("submit", function(e) {
    e.preventDefault();
    const name = document.getElementById("courseName").value.trim();
    const code = parseInt(document.getElementById("courseCode").value);
    const practical = parseInt(document.getElementById("coursePractical").value);
    const theory = parseInt(document.getElementById("courseTheory").value);
    const type = document.getElementById("courseType").value;
    courses.push({ name, code, practical, theory, type });
    saveCourses();
    renderCourses();
    this.reset();
  });

  function renderCourses() {
    courseList.innerHTML = "";
    courses.sort((a,b) => {
      if (typeOrder[a.type] !== typeOrder[b.type]) return typeOrder[a.type]-typeOrder[b.type];
      return a.code - b.code;
    });
    courses.forEach(c => {
      const card = document.createElement("div");
      card.className = `course-card ${typeClassMap[c.type]}`;
      card.innerHTML = `
        <div class="course-actions">
          <button onclick="deleteCourse(${c.code})">🗑️</button>
        </div>
        <div class="course-icon">📘</div>
        <h3>${c.name}</h3>
        <p>کد: ${c.code}</p>
        <p>عملی: ${c.practical} | تئوری: ${c.theory}</p>
        <p>کل واحد: ${c.practical + c.theory}</p>
        <p>نوع: ${c.type}</p>
      `;
      courseList.appendChild(card);
    });
  }

  window.deleteCourse = function(code) {
    courses = courses.filter(c => c.code !== code);
    saveCourses();
    renderCourses();
  };

  renderCourses();
}

// 📌 مدیریت صفحه جزئیات ترم
if (document.getElementById("availableCourses")) {
  const params = new URLSearchParams(window.location.search);
  const term = params.get("term");
  document.getElementById("termTitle").textContent = `📅 ترم ${term}`;

  const select = document.getElementById("availableCourses");
  courses.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c.code;
    opt.textContent = `${c.name} (${c.code})`;
    select.appendChild(opt);
  });

  let termData = JSON.parse(localStorage.getItem(`term_${term}`)) || [];

  document.getElementById("addToTerm").addEventListener("click", () => {
    const code = parseInt(select.value);
    const group = document.getElementById("group").value;
    const exam = document.getElementById("exam").value;
    const course = courses.find(c => c.code === code);
    termData.push({ ...course, group, exam });
    localStorage.setItem(`term_${term}`, JSON.stringify(termData));
    renderTerm();
  });

  function renderTerm() {
    const list = document.getElementById("termCourses");
    list.innerHTML = "";
    termData.forEach(c => {
      const li = document.createElement("li");
      li.textContent = `${c.name} - گروه ${c.group} - امتحان: ${c.exam}`;
      list.appendChild(li);
    });
  }

  renderTerm();
}