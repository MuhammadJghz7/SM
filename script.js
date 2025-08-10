const sessionsContainer = document.getElementById("sessionsContainer");
const classSessionsInput = document.getElementById("classSessions");

function createSessionFields(count) {
  sessionsContainer.innerHTML = ""; // اول پاک کن

  for (let i = 1; i <= count; i++) {
    const sessionDiv = document.createElement("div");
    sessionDiv.classList.add("mb-2", "border", "p-2", "rounded");

    sessionDiv.innerHTML = `
      <label>جلسه ${i}</label>
      <div class="mb-1">
        <input type="text" name="sessionTime${i}" placeholder="زمان برگزاری (مثلاً دوشنبه 10-12)" class="form-control" required />
      </div>
      <div>
        <input type="text" name="sessionLocation${i}" placeholder="محل برگزاری" class="form-control" required />
      </div>
    `;

    sessionsContainer.appendChild(sessionDiv);
  }
}

// وقتی تعداد جلسات تغییر کرد، فیلدها رو بساز
classSessionsInput.addEventListener("input", e => {
  let val = parseInt(e.target.value);
  if (isNaN(val) || val < 1) val = 1;
  if (val > 20) val = 20;
  createSessionFields(val);
});

// موقع باز شدن مودال حداقل 1 جلسه رو بساز
createSessionFields(parseInt(classSessionsInput.value));


// Helper functions for LocalStorage management

function getCourses() {
  return JSON.parse(localStorage.getItem("courses") || "[]");
}

function saveCourses(courses) {
  localStorage.setItem("courses", JSON.stringify(courses));
}

function getTerms() {
  return JSON.parse(localStorage.getItem("terms") || "[]");
}

function saveTerms(terms) {
  localStorage.setItem("terms", JSON.stringify(terms));
}

// محاسبه مجموع واحد درس
function totalUnits(course) {
  return (course.practical || 0) + (course.theoretical || 0);
}

// بررسی اینکه آیا درس پاس شده یا خیر
function isCoursePassed(courseId) {
  const courses = getCourses();
  const course = courses.find(c => c.id === courseId);
  return course ? course.passed : false;
}

// محاسبه معدل ترم (دروس پاس شده)
function calculateTermGPA(term) {
  const courses = getCourses();
  let totalScore = 0;
  let totalUnitsCount = 0;

  for (const termCourse of term.courses) {
    if (termCourse.score >= 10) {
      const course = courses.find(c => c.id === termCourse.courseId);
      if (course) {
        const units = totalUnits(course);
        totalScore += termCourse.score * units;
        totalUnitsCount += units;
      }
    }
  }

  return totalUnitsCount ? (totalScore / totalUnitsCount).toFixed(2) : "--";
}

// محاسبه معدل کل (تمام ترم‌ها)
function calculateOverallGPA() {
  const terms = getTerms();
  let totalScore = 0;
  let totalUnitsCount = 0;
  const courses = getCourses();

  for (const term of terms) {
    for (const termCourse of term.courses) {
      if (termCourse.score >= 10) {
        const course = courses.find(c => c.id === termCourse.courseId);
        if (course) {
          const units = totalUnits(course);
          totalScore += termCourse.score * units;
          totalUnitsCount += units;
        }
      }
    }
  }
  return totalUnitsCount ? (totalScore / totalUnitsCount).toFixed(2) : "--";
}
