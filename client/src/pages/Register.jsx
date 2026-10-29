
import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { user, loading, register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
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

    if (password.length < 8 || password.length > 72) {
      setError("Password must contain 8 to 72 characters.");
      return;
    }

    setSubmitting(true);

    try {
      await register({ name, email, password });
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="container section">
      <section className="card card-pad" style={{ maxWidth: 480, margin: "2rem auto" }}>
        <p className="badge">Start your journey</p>
        <h1>Create your account</h1>
        <p className="muted">
          Join NavYatra and turn your travel bucket list into a plan.
        </p>

        <form className="grid" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="register-name">Full name</label>
            <input
              id="register-name"
              className="input"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              minLength={2}
              maxLength={60}
              required
            />
          </div>

          <div>
            <label htmlFor="register-email">Email</label>
            <input
              id="register-email"
              className="input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="register-password">Password</label>
            <input
              id="register-password"
              className="input"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              maxLength={72}
              required
            />
            <small className="muted">Use at least 8 characters.</small>
          </div>

          {error && <p role="alert">{error}</p>}

          <button
            className="btn btn-primary"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="muted">
          Already registered? <Link to="/login">Log in</Link>
        </p>
      </section>
    </main>
  );
}
