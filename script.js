// Helper functions for LocalStorage management

function getCourses() {
  return JSON.parse(localStorage.getItem("courses") || "[]");
}

function saveCourses(courses) {
  localStorage.setItem("courses", JSON.stringify(courses));
}

function getTerms() {
  function getTerms() {
    let terms = JSON.parse(localStorage.getItem("terms")) || [];

    if (terms.length === 0) {
        const defaultTerms = [
            4021, 4022, 4023,
            4031, 4032, 4033,
            4041, 4042, 4043,
            4051, 4052, 4053,
            4061, 4062, 4063
        ].map(id => ({
            id: id,
            courses: []
        }));
        localStorage.setItem("terms", JSON.stringify(defaultTerms));
        terms = defaultTerms;
    }
    return terms;
}
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
