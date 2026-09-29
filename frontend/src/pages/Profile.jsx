import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import "./Profile.css";

function Profile() {
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [profilePhoto, setProfilePhoto] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setMessage("Please login first");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          "http://localhost:5000/api/users/profile",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          setMessage(data.message || "Unable to load profile");
          setLoading(false);
          return;
        }

        setUser(data.user);

        // Load saved profile photo for this account (frontend-only).
        try {
          const photoKey = `profilePhoto_${
            data.user?.email || data.user?.id || "guest"
          }`;
          setProfilePhoto(
            localStorage.getItem(photoKey)
          );
        } catch (e) {
          setProfilePhoto(null);
        }
      } catch (error) {
        console.error("Profile error:", error);
        setMessage("Unable to connect to server");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const photoKey = `profilePhoto_${
    user?.email || user?.id || "guest"
  }`;

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("Please choose an image file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage("Photo must be under 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        localStorage.setItem(
          photoKey,
          reader.result
        );
      } catch (e) {
        // storage full — still show preview
      }
      setProfilePhoto(reader.result);
      setMessage("");
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const handlePhotoRemove = () => {
    try {
      localStorage.removeItem(photoKey);
    } catch (e) {}
    setProfilePhoto(null);
  };

  const profileMenu = [
    {
      icon: "📦",
      title: "My Orders",
      text: "View your purchased books and order status.",
      path: "/orders",
    },
    {
      icon: "📚",
      title: "My Listings",
      text: "Manage books you are currently selling.",
      path: "/listings",
    },
    {
      icon: "❤️",
      title: "My Wishlist",
      text: "View books saved for later.",
      path: "/wishlist",
    },
    {
      icon: "💰",
      title: "Sell a Book",
      text: "List your used book for other students.",
      path: "/sell",
    },
    {
      icon: "📊",
      title: "Dashboard",
      text: "Open your complete marketplace dashboard.",
      path: "/dashboard",
    },
  ];

  return (
    <main className="profile-page">

      {/* Background decoration */}
      <div className="profile-orb profile-orb-one"></div>
      <div className="profile-orb profile-orb-two"></div>

      {/* Header */}
      <section className="profile-header">
        <p className="profile-label">
          USED BOOK MARKET
        </p>

        <h1>
          My <span>Profile</span>
        </h1>

        <p>
          Manage your account and marketplace activities.
        </p>
      </section>

      {/* Main profile area */}
      <section className="profile-layout">

        {/* Profile Card */}
        <div className="profile-card">

          <div className="profile-card-glow"></div>

          <div className="profile-photo-wrap">
            <div className="profile-avatar">
              {profilePhoto ? (
                <img
                  src={profilePhoto}
                  alt="Profile"
                  className="profile-avatar-img"
                />
              ) : user ? (
                user.name?.charAt(0).toUpperCase()
              ) : (
                "?"
              )}
            </div>

            <label
              className="profile-photo-edit"
              title="Add / change photo"
            >
              📷
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                hidden
              />
            </label>
          </div>

          {profilePhoto && (
            <button
              type="button"
              className="profile-photo-remove"
              onClick={handlePhotoRemove}
            >
              Remove photo
            </button>
          )}

          {loading && (
            <div className="profile-loading">
              <div className="loading-spinner"></div>
              <p>Loading profile...</p>
            </div>
          )}

          {message && !loading && (
            <div className="profile-message">
              <span>⚠️</span>
              {message}
            </div>
          )}

          {user && !loading && (
            <>
              <div className="profile-name">
                <h2>{user.name}</h2>

                <span className="profile-badge">
                  ✓ Verified Account
                </span>
              </div>

              <div className="profile-info">

                <div className="profile-info-row">
                  <div className="info-icon">
                    📧
                  </div>

                  <div>
                    <span>Email</span>
                    <strong>{user.email}</strong>
                  </div>
                </div>

                <div className="profile-info-row">
                  <div className="info-icon">
                    👤
                  </div>

                  <div>
                    <span>Account Role</span>
                    <strong className="role-text">
                      {user.role}
                    </strong>
                  </div>
                </div>

                <div className="profile-info-row">
                  <div className="info-icon">
                    🆔
                  </div>

                  <div>
                    <span>User ID</span>
                    <strong>{user.id}</strong>
                  </div>
                </div>

              </div>
            </>
          )}
        </div>


        {/* Menu Section */}
        <div className="profile-menu-section">

          <div className="profile-menu-header">
            <p>QUICK ACCESS</p>

            <h2>
              Manage Your Account
            </h2>

            <span>
              Choose an option to continue.
            </span>
          </div>

          <div className="profile-menu">

            {profileMenu.map((item, index) => (
              <Link
                to={item.path}
                key={item.title}
                className="profile-menu-card"
                style={{
                  "--profile-delay": `${index * 0.1}s`,
                }}
              >
                <div className="profile-menu-icon">
                  {item.icon}
                </div>

                <div className="profile-menu-content">
                  <h3>{item.title}</h3>

                  <p>{item.text}</p>
                </div>

                <span className="profile-menu-arrow">
                  →
                </span>
              </Link>
            ))}

          </div>
        </div>

      </section>


      {/* Bottom CTA */}
      <section className="profile-cta">

        <div className="profile-cta-icon">
          📖
        </div>

        <div>
          <h2>
            Ready to explore more books?
          </h2>

          <p>
            Discover affordable books from other students.
          </p>
        </div>

        <Link
          to="/books"
          className="profile-cta-button"
        >
          Browse Books →
        </Link>

      </section>

    </main>
  );
}

export default Profile;