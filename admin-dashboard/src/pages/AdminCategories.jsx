import { useEffect, useState } from "react";
import "../components/AdminPanels.css";

function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] =
    useState(null);

  const fetchCategories = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setMessage("Admin login required");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/admin/categories",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message ||
            "Unable to load categories"
        );
        return;
      }

      setCategories(data.categories || []);
      setMessage("");
    } catch (error) {
      console.error(
        "Categories error:",
        error
      );

      setMessage(
        "Unable to connect to server"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddCategory = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");

    if (!token) {
      setMessage("Admin login required");
      return;
    }

    if (!name.trim()) {
      setMessage(
        "Category name is required"
      );
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/admin/categories",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: name.trim(),
            description:
              description.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message ||
            "Unable to create category"
        );
        return;
      }

      setMessage(
        "Category created successfully."
      );

      setName("");
      setDescription("");

      await fetchCategories();
    } catch (error) {
      console.error(
        "Create category error:",
        error
      );

      setMessage(
        "Unable to connect to server"
      );
    }
  };

  const startEdit = (category) => {
    setEditingId(category.id);
    setEditName(category.name || "");
    setEditDescription(
      category.description || ""
    );
  };

  const handleUpdateCategory = async (id) => {
    const token = localStorage.getItem("token");

    if (!token) {
      setMessage("Admin login required");
      return;
    }

    if (!editName.trim()) {
      setMessage(
        "Category name is required"
      );
      return;
    }

    try {
      setSavingId(id);

      const response = await fetch(
        `http://localhost:5000/api/admin/categories/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: editName.trim(),
            description:
              editDescription.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message ||
            "Unable to update category"
        );
        return;
      }

      setMessage(
        "Category updated successfully."
      );

      setEditingId(null);

      await fetchCategories();
    } catch (error) {
      console.error(
        "Update category error:",
        error
      );

      setMessage(
        "Unable to connect to server"
      );
    } finally {
      setSavingId(null);
    }
  };

  const handleToggleActive = async (
    category
  ) => {
    const token = localStorage.getItem("token");

    if (!token) {
      setMessage("Admin login required");
      return;
    }

    const nextActive = !category.is_active;

    if (
      !window.confirm(
        `${nextActive ? "Activate" : "Deactivate"} the "${category.name}" category?` +
          (nextActive
            ? ""
            : " Sellers will no longer see it in the sell form.")
      )
    )
      return;

    try {
      setSavingId(category.id);

      const response = await fetch(
        `http://localhost:5000/api/admin/categories/${category.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            is_active: nextActive,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message ||
            "Unable to update category"
        );
        return;
      }

      setMessage(
        `Category "${category.name}" is now ${nextActive ? "active" : "inactive"}.`
      );

      await fetchCategories();
    } catch (error) {
      console.error(
        "Toggle category error:",
        error
      );

      setMessage(
        "Unable to connect to server"
      );
    } finally {
      setSavingId(null);
    }
  };

  const handleDeleteCategory = async (id) => {
    const token = localStorage.getItem("token");

    if (!token) {
      setMessage("Admin login required");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this category?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/admin/categories/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message ||
            "Unable to delete category"
        );
        return;
      }

      setMessage(
        "Category deleted successfully."
      );

      await fetchCategories();
    } catch (error) {
      console.error(
        "Delete category error:",
        error
      );

      setMessage(
        "Unable to connect to server"
      );
    }
  };

  const filteredCategories =
    categories.filter((category) => {
      const searchText =
        search.toLowerCase();

      return (
        category.name
          .toLowerCase()
          .includes(searchText) ||
        (category.description || "")
          .toLowerCase()
          .includes(searchText)
      );
    });

  // Selected category for the name-button details panel.
  // Defaults to the first visible category.
  const selectedCategory =
    filteredCategories.find(
      (category) => category.id === selectedCategoryId
    ) ||
    filteredCategories[0] ||
    null;

  return (
    <main className="ap-page">
      <section className="ap-header">
        <div className="ap-header-icon">🗂️</div>

        <p className="ap-label">
          ADMIN CONTROL CENTER
        </p>

        <h1>
          Book <span>Categories</span>
        </h1>

        <p>
          Manage book categories used
          throughout USED BOOK MARKET.
        </p>

        <div className="ap-header-line"></div>
      </section>

      {message && (
        <div
          className={`ap-message ${
            message.includes("successfully")
              ? "success"
              : ""
          }`}
        >
          {message.includes("successfully")
            ? "✅ "
            : "⚠️ "}
          {message}
        </div>
      )}

      <section className="ap-form-card">
        <h2>Add Category</h2>

        <p>
          New categories appear in the sell
          form once active.
        </p>

        <form
          className="ap-form-grid"
          onSubmit={handleAddCategory}
        >
          <input
            type="text"
            placeholder="Category name"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            required
          />

          <input
            type="text"
            placeholder="Category description"
            value={description}
            onChange={(e) =>
              setDescription(
                e.target.value
              )
            }
          />

          <button
            type="submit"
            className="ap-btn ap-btn-primary"
          >
            Add Category
          </button>
        </form>
      </section>

      <section className="ap-toolbar">
        <div className="ap-search-box">
          <span>🔍</span>

          <input
            type="text"
            placeholder="Search categories..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
        </div>

        <button
          type="button"
          className="ap-btn ap-btn-ghost"
          onClick={() => setSearch("")}
        >
          Clear
        </button>
      </section>

      <h2 className="ap-section-title">
        Category List (
        {filteredCategories.length})
      </h2>

      {loading ? (
        <div className="ap-loading">
          <div className="ap-spinner"></div>
          <h2>Loading categories...</h2>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="ap-empty">
          <div className="ap-empty-icon">📭</div>
          <h2>No categories found</h2>
          <p>
            Try another search or add a new
            category above.
          </p>
        </div>
      ) : (
        <>
          {/* Category name buttons — 5 per row */}
          <div className="id-btn-grid">
            {filteredCategories.map((category) => (
              <button
                key={category.id}
                type="button"
                className={
                  selectedCategory?.id ===
                  category.id
                    ? "id-btn selected"
                    : "id-btn"
                }
                onClick={() =>
                  setSelectedCategoryId(category.id)
                }
                title={category.name}
                aria-label={`Category ${category.name} details`}
              >
                {category.name}
              </button>
            ))}
          </div>

          {/* Selected category details */}
          {selectedCategory && (
            <div className="id-details-panel">
              <div className="id-details-panel-heading">
                <strong>
                  🗂️ #{selectedCategory.id} —{" "}
                  {editingId ===
                  selectedCategory.id ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) =>
                        setEditName(
                          e.target.value
                        )
                      }
                      className="ap-inline-input"
                    />
                  ) : (
                    selectedCategory.name
                  )}
                </strong>

                <span
                  className={
                    selectedCategory.is_active
                      ? "ap-badge ap-badge-active"
                      : "ap-badge ap-badge-inactive"
                  }
                >
                  {selectedCategory.is_active
                    ? "Active"
                    : "Inactive"}
                </span>
              </div>

              <div className="id-details-grid">
                <div>
                  <small>DESCRIPTION</small>
                  {editingId ===
                  selectedCategory.id ? (
                    <input
                      type="text"
                      value={editDescription}
                      onChange={(e) =>
                        setEditDescription(
                          e.target.value
                        )
                      }
                      className="ap-inline-input"
                    />
                  ) : (
                    <strong>
                      {selectedCategory.description ||
                        "No description"}
                    </strong>
                  )}
                </div>
                <div>
                  <small>BOOKS</small>
                  <strong>
                    {selectedCategory.book_count ??
                      0}
                  </strong>
                </div>
                <div>
                  <small>CREATED</small>
                  <strong>
                    {new Date(
                      selectedCategory.created_at
                    ).toLocaleString()}
                  </strong>
                </div>
              </div>

              <div className="id-details-actions">
                {editingId ===
                selectedCategory.id ? (
                  <>
                    <button
                      type="button"
                      className="ap-btn ap-btn-primary ap-btn-sm"
                      disabled={
                        savingId ===
                        selectedCategory.id
                      }
                      onClick={() =>
                        handleUpdateCategory(
                          selectedCategory.id
                        )
                      }
                    >
                      {savingId ===
                      selectedCategory.id
                        ? "Saving..."
                        : "Save"}
                    </button>
                    <button
                      type="button"
                      className="ap-btn ap-btn-ghost ap-btn-sm"
                      onClick={() =>
                        setEditingId(null)
                      }
                    >
                      ✕
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="ap-btn ap-btn-info ap-btn-sm"
                      onClick={() =>
                        startEdit(selectedCategory)
                      }
                    >
                      ✏️ Edit
                    </button>
                    <button
                      type="button"
                      className="ap-btn ap-btn-ghost ap-btn-sm"
                      disabled={
                        savingId ===
                        selectedCategory.id
                      }
                      onClick={() =>
                        handleToggleActive(
                          selectedCategory
                        )
                      }
                    >
                      {selectedCategory.is_active
                        ? "⏸️ Off"
                        : "✅ On"}
                    </button>
                    <button
                      type="button"
                      className="ap-btn ap-btn-danger ap-btn-sm"
                      onClick={() =>
                        handleDeleteCategory(
                          selectedCategory.id
                        )
                      }
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );
}

export default AdminCategories;
