import { useEffect, useState } from "react";
import api from "./api";
import "./App.css";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(localStorage.getItem("user") || "");
  const [isRegister, setIsRegister] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [filter, setFilter] = useState("all");

  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadedImage, setUploadedImage] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const authConfig = () => ({
    headers: { Authorization: `Bearer ${token}` },
  });

  async function loadTasks(currentToken = token) {
    if (!currentToken) return;

    try {
      const response = await api.get("/tasks", {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      setTasks(Array.isArray(response.data) ? response.data : response.data.tasks || []);
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not load tasks.");
    }
  }

  useEffect(() => {
    if (token) loadTasks(token);
  }, [token]);

  async function handleAuth(event) {
    event.preventDefault();
    setMessage("");
    setBusy(true);

    try {
      const endpoint = isRegister ? "/auth/register" : "/auth/login";
      const payload = isRegister
        ? { name, email, password }
        : { email, password };

      const response = await api.post(endpoint, payload);
      const newToken = response.data.token || response.data.accessToken;
      const newUser =
        response.data.user?.name ||
        response.data.name ||
        email;

      if (!newToken) {
        setMessage("Authentication succeeded but no token was returned.");
        return;
      }

      localStorage.setItem("token", newToken);
      localStorage.setItem("user", newUser);
      setToken(newToken);
      setUser(newUser);
      setPassword("");
      setMessage("Welcome to TaskFlow!");
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Login or registration failed. Check your details."
      );
    } finally {
      setBusy(false);
    }
  }

  async function addTask(event) {
    event.preventDefault();
    if (!title.trim()) return;

    setBusy(true);
    setMessage("");

    try {
      await api.post(
        "/tasks",
        { title: title.trim(), description: description.trim() },
        authConfig()
      );

      setTitle("");
      setDescription("");
      setMessage("Task added successfully!");
      await loadTasks();
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not add task.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleTask(task) {
    try {
      await api.put(
        `/tasks/${task._id}`,
        { completed: !task.completed },
        authConfig()
      );
      await loadTasks();
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not update task.");
    }
  }

  async function deleteTask(id) {
    try {
      await api.delete(`/tasks/${id}`, authConfig());
      setTasks((previous) => previous.filter((task) => task._id !== id));
      setMessage("Task deleted.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not delete task.");
    }
  }

  async function uploadImage(event) {
    event.preventDefault();

    if (!selectedImage) {
      setMessage("Please select an image first.");
      return;
    }

    if (!selectedImage.type.startsWith("image/")) {
      setMessage("Please select a valid image file.");
      return;
    }

    if (selectedImage.size > 5 * 1024 * 1024) {
      setMessage("Image must be smaller than 5 MB.");
      return;
    }

    const formData = new FormData();
    formData.append("image", selectedImage);

    setBusy(true);
    setMessage("");

    try {
      const response = await api.post("/upload", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const imagePath =
        response.data.imageUrl ||
        response.data.url ||
        response.data.path;

      if (!imagePath) {
        setMessage("Upload response did not include an image URL.");
        return;
      }

      const fullImageUrl = imagePath.startsWith("http")
        ? imagePath
        : `http://localhost:5003${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;

      setUploadedImage(fullImageUrl);
      setSelectedImage(null);

      const fileInput = document.getElementById("image-file");
      if (fileInput) fileInput.value = "";

      setMessage("Image uploaded successfully!");
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Image upload failed. Check that the backend is running."
      );
    } finally {
      setBusy(false);
    }
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken("");
    setUser("");
    setTasks([]);
    setUploadedImage("");
    setSelectedImage(null);
    setMessage("You have logged out.");
  }

  const visibleTasks = tasks.filter((task) => {
    if (filter === "active") return !task.completed;
    if (filter === "completed") return task.completed;
    return true;
  });

  const completedCount = tasks.filter((task) => task.completed).length;

  if (!token) {
    return (
      <main className="app-shell">
        <section className="auth-card">
          <div className="brand-icon">✓</div>
          <p className="eyebrow">YOUR PERSONAL WORKSPACE</p>
          <h1>TaskFlow</h1>
          <p className="subtitle">
            Plan smarter. Stay organized. Get things done.
          </p>

          <form onSubmit={handleAuth} className="task-form">
            {isRegister && (
              <label>
                Full name
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your name"
                  required
                />
              </label>
            )}

            <label>
              Email address
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                required
                minLength={6}
              />
            </label>

            <button className="primary-button" disabled={busy}>
              {busy
                ? "Please wait..."
                : isRegister
                ? "Create account"
                : "Sign in"}
            </button>
          </form>

          <p className="switch-auth">
            {isRegister ? "Already have an account?" : "New to TaskFlow?"}{" "}
            <button
              type="button"
              className="text-button"
              onClick={() => {
                setIsRegister(!isRegister);
                setMessage("");
              }}
            >
              {isRegister ? "Sign in" : "Create account"}
            </button>
          </p>

          {message && <p className="status-message">{message}</p>}
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-icon small">✓</span>
          <span>TaskFlow</span>
        </div>

        <div className="user-actions">
          <span className="welcome-text">Hi, {user || "there"}!</span>
          <button className="secondary-button" onClick={logout}>
            Log out
          </button>
        </div>
      </header>

      <section className="dashboard">
        <div className="hero">
          <p className="eyebrow">YOUR DASHBOARD</p>
          <h1>Make today count.</h1>
          <p className="subtitle">
            Small steps every day lead to big results.
          </p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <span>Total tasks</span>
            <strong>{tasks.length}</strong>
          </div>
          <div className="stat-card">
            <span>Completed</span>
            <strong>{completedCount}</strong>
          </div>
          <div className="stat-card">
            <span>Remaining</span>
            <strong>{tasks.length - completedCount}</strong>
          </div>
        </div>

        <section className="panel">
          <h2>Create a task</h2>
          <form onSubmit={addTask} className="task-form">
            <label>
              Task title
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Finish my assignment"
                required
              />
            </label>

            <label>
              Description
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Add a few details (optional)"
                rows={3}
              />
            </label>

            <button className="primary-button" disabled={busy}>
              Add task
            </button>
          </form>
        </section>

        <section className="panel">
          <h2>Image upload</h2>
          <p className="subtitle">
            Select an image to upload it securely to your backend.
            Maximum size: 5 MB.
          </p>

          <form onSubmit={uploadImage} className="task-form">
            <label>
              Choose image
              <input
                id="image-file"
                type="file"
                accept="image/*"
                onChange={(event) => {
                  setSelectedImage(event.target.files?.[0] || null);
                  setMessage("");
                }}
              />
            </label>

            {selectedImage && (
              <p className="file-name">
                Selected: {selectedImage.name}
              </p>
            )}

            <button
              type="submit"
              className="primary-button"
              disabled={busy || !selectedImage}
            >
              {busy ? "Working..." : "Upload image"}
            </button>
          </form>

          {uploadedImage && (
            <div className="uploaded-preview">
              <h3>Uploaded image</h3>
              <img src={uploadedImage} alt="Uploaded file preview" />
              <a href={uploadedImage} target="_blank" rel="noreferrer">
                Open image in new tab
              </a>
            </div>
          )}
        </section>

        <section className="panel">
          <div className="tasks-heading">
            <div>
              <h2>Your tasks</h2>
              <p className="subtitle">Keep moving forward.</p>
            </div>

            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              aria-label="Filter tasks"
            >
              <option value="all">All tasks</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {visibleTasks.length === 0 ? (
            <div className="empty-state">
              <span>✦</span>
              <h3>No tasks here yet</h3>
              <p>Add a task above to get started.</p>
            </div>
          ) : (
            <div className="task-list">
              {visibleTasks.map((task) => (
                <article className="task-item" key={task._id}>
                  <input
                    type="checkbox"
                    checked={Boolean(task.completed)}
                    onChange={() => toggleTask(task)}
                    aria-label={`Mark ${task.title} completed`}
                  />

                  <div className="task-content">
                    <h3 className={task.completed ? "completed-task" : ""}>
                      {task.title}
                    </h3>
                    {task.description && <p>{task.description}</p>}
                  </div>

                  <button
                    className="delete-button"
                    onClick={() => deleteTask(task._id)}
                  >
                    Delete
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>

        {message && (
          <p className="status-message" role="status">
            {message}
          </p>
        )}
      </section>

      <footer className="footer">
        TaskFlow · Stay focused. Make progress.
      </footer>
    </main>
  );
}