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
        <div className="ap-table-wrapper">
          <table className="ap-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Description</th>
                <th>Books</th>
                <th>Status</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredCategories.map(
                (category) => (
                  <tr key={category.id}>
                    <td>
                      <strong>
                        #{category.id}
                      </strong>
                    </td>

                    <td>
                      {editingId ===
                      category.id ? (
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
                        <strong>
                          {category.name}
                        </strong>
                      )}
                    </td>

                    <td>
                      {editingId ===
                      category.id ? (
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
                        <small>
                          {category.description ||
                            "No description"}
                        </small>
                      )}
                    </td>

                    <td>
                      <strong>
                        {category.book_count ??
                          0}
                      </strong>
                    </td>

                    <td>
                      <span
                        className={
                          category.is_active
                            ? "ap-badge ap-badge-active"
                            : "ap-badge ap-badge-inactive"
                        }
                      >
                        {category.is_active
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </td>

                    <td>
                      <small>
                        {new Date(
                          category.created_at
                        ).toLocaleString()}
                      </small>
                    </td>

                    <td>
                      {editingId ===
                      category.id ? (
                        <div className="ap-actions">
                          <button
                            type="button"
                            className="ap-btn ap-btn-primary ap-btn-sm"
                            disabled={
                              savingId ===
                              category.id
                            }
                            onClick={() =>
                              handleUpdateCategory(
                                category.id
                              )
                            }
                          >
                            {savingId ===
                            category.id
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
                        </div>
                      ) : (
                        <div className="ap-actions">
                          <button
                            type="button"
                            className="ap-btn ap-btn-info ap-btn-sm"
                            onClick={() =>
                              startEdit(category)
                            }
                          >
                            ✏️ Edit
                          </button>
                          <button
                            type="button"
                            className="ap-btn ap-btn-ghost ap-btn-sm"
                            disabled={
                              savingId ===
                              category.id
                            }
                            onClick={() =>
                              handleToggleActive(
                                category
                              )
                            }
                          >
                            {category.is_active
                              ? "⏸️ Off"
                              : "✅ On"}
                          </button>
                          <button
                            type="button"
                            className="ap-btn ap-btn-danger ap-btn-sm"
                            onClick={() =>
                              handleDeleteCategory(
                                category.id
                              )
                            }
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

export default AdminCategories;
