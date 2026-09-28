import { Link, useParams } from "react-router-dom";
import "./Category.css";

const CATEGORIES = {
  programming: {
    icon: "💻",
    title: "Programming",
    subtitle: "Software & Coding",
  },
  engineering: {
    icon: "⚙️",
    title: "Engineering",
    subtitle: "Engineering Subjects",
  },
  medical: {
    icon: "🩺",
    title: "Medical",
    subtitle: "Medical Studies",
  },
  mathematics: {
    icon: "📐",
    title: "Mathematics",
    subtitle: "Math & Calculations",
  },
  "exam-prep": {
    icon: "🎯",
    title: "Exam Prep",
    subtitle: "Competitive Exams",
  },
  "study-notes": {
    icon: "📝",
    title: "Study Notes",
    subtitle: "Notes & Materials",
  },
};

function Category() {
  const { name } = useParams();

  const category =
    CATEGORIES[(name || "").toLowerCase()] || null;

  return (
    <main className="category-page">
      <div className="coming-soon-card">
        <div className="coming-soon-icon">
          {category ? category.icon : "📚"}
        </div>

        <p className="coming-soon-label">
          {category
            ? category.subtitle.toUpperCase()
            : "MARKETPLACE CATEGORY"}
        </p>

        <h1>
          {category ? category.title : "Category"}
        </h1>

        <div className="coming-soon-badge">
          <span className="coming-soon-dot"></span>
          Coming Soon
        </div>

        <p className="coming-soon-text">
          {category
            ? `${category.title} books are on the way. Sellers are listing ${category.subtitle.toLowerCase()} right now — check back soon.`
            : "This book section is on the way. Check back soon."}
        </p>

        <div className="coming-soon-actions">
          <Link to="/books">
            <button
              type="button"
              className="coming-soon-primary"
            >
              📚 Browse All Books
            </button>
          </Link>

          <Link to="/sell">
            <button
              type="button"
              className="coming-soon-secondary"
            >
              Sell a Book →
            </button>
          </Link>
        </div>

        <Link
          to="/"
          className="coming-soon-home"
        >
          ← Back to Home
        </Link>
      </div>
    </main>
  );
}

export default Category;
