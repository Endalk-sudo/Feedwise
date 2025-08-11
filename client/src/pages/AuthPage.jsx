import { useState, useContext } from "react";
import AuthContext from "../AuthContext.jsx";
import { loginUser, registerUser } from "../services/api.js";
import "./Auth.css";

const Brand = () => (
  <div className="auth-hero">
    <div className="hero-card">
      <h1 className="hero-title">Welcome to Feedback HQ</h1>
      <p className="hero-copy">
        Collect, organize, and act on feedback with clarity. A focused, fast, and secure experience that fits your workflow.
      </p>
    </div>
  </div>
);

const Login = ({ onSwitch }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await loginUser(email, password);
      login(data.user, data.accessToken);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <Brand />
      <section className="auth-card" aria-labelledby="login-title">
        <header className="auth-header">
          <h2 id="login-title" className="auth-title">Sign in</h2>
          <p className="auth-subtitle">Welcome back. Please enter your details.</p>
        </header>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="form-field">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              id="email"
              className="input"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              aria-invalid={!!error}
            />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              className="input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              aria-invalid={!!error}
            />
          </div>

          {error && <div className="error" role="alert">{error}</div>}

          <button className="auth-button" type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Sign in"}
          </button>

          <p className="switch">
            Don’t have an account?{" "}
            <span className="auth-link" onClick={onSwitch} role="button" tabIndex={0}>Create account</span>
          </p>
        </form>
      </section>
    </div>
  );
};

const Register = ({ onSwitch }) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const data = await registerUser(username, email, password);
      login(data.user, data.accessToken);
      onSwitch();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <Brand />
      <section className="auth-card" aria-labelledby="register-title">
        <header className="auth-header">
          <h2 id="register-title" className="auth-title">Create account</h2>
          <p className="auth-subtitle">Join us and start collecting feedback in minutes.</p>
        </header>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="form-field">
            <label className="form-label" htmlFor="username">User Name</label>
            <input
              id="username"
              className="input"
              type="text"
              placeholder="Your name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="reg-email">Email</label>
            <input
              id="reg-email"
              className="input"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="reg-password">Password</label>
            <input
              id="reg-password"
              className="input"
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="confirm-password">Confirm Password</label>
            <input
              id="confirm-password"
              className="input"
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>

          {error && <div className="error" role="alert">{error}</div>}

          <button className="auth-button" type="submit" disabled={loading}>
            {loading ? "Registering..." : "Create account"}
          </button>

          <p className="switch">
            Already have an account?{" "}
            <span className="auth-link" onClick={onSwitch} role="button" tabIndex={0}>Sign in</span>
          </p>
        </form>
      </section>
    </div>
  );
};

const AuthPage = () => {
  const [showLogin, setShowLogin] = useState(true);
  return (
    <div className="auth-container">
      {showLogin ? (
        <Login onSwitch={() => setShowLogin(false)} />
      ) : (
        <Register onSwitch={() => setShowLogin(true)} />
      )}
    </div>
  );
};

export default AuthPage;
