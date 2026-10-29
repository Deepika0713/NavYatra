
import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return <main className="container section">Loading...</main>;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login({ email, password });

      const destination = location.state?.from;
      const safeDestination =
        destination?.pathname?.startsWith("/") &&
        !destination.pathname.startsWith("//") &&
        !["/login", "/register"].includes(destination.pathname)
          ? `${destination.pathname}${destination.search || ""}${destination.hash || ""}`
          : "/";

      navigate(safeDestination, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="container section">
      <section className="card card-pad" style={{ maxWidth: 480, margin: "2rem auto" }}>
        <p className="badge">Welcome back</p>
        <h1>Log in to NavYatra</h1>
        <p className="muted">
          Sign in to discover places and continue planning your trips.
        </p>

        <form className="grid" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              className="input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              className="input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          {error && <p role="alert">{error}</p>}

          <button
            className="btn btn-primary"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Logging in..." : "Log In"}
          </button>
        </form>

        <p className="muted">
          New to NavYatra? <Link to="/register">Create an account</Link>
        </p>
      </section>
    </main>
  );
}
