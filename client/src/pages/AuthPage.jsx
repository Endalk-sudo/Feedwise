import { useState, useContext } from "react";
import AuthContext from "../AuthContext.jsx";
import { loginUser, registerUser } from "../services/api.js";
import "./Auth.css";

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
      alert("Login successful!");
      // window.location.href = "/dashboard"; // Redirect if needed
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Login</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>{loading ? "Logging in..." : "Login"}</button>
        {error && <div style={{color: 'red', textAlign: 'center'}}>{error}</div>}
        <p>
          Don't have an account?{' '}
          <span className="auth-link" onClick={onSwitch}>Register</span>
        </p>
      </form>
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
      alert("Registration successful!  Please login.");
      onSwitch();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Register</h2>
        <input
          type="text"
          placeholder="User Name"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>{loading ? "Registering..." : "Register"}</button>
        {error && <div style={{color: 'red', textAlign: 'center'}}>{error}</div>}
        <p>
          Already have an account?{' '}
          <span className="auth-link" onClick={onSwitch}>Login</span>
        </p>
      </form>
    </div>
  );
};

const AuthPage = () => {
  const [showLogin, setShowLogin] = useState(true);
  return showLogin ? (
    <Login onSwitch={() => setShowLogin(false)} />
  ) : (
    <Register onSwitch={() => setShowLogin(true)} />
  );
};

export default AuthPage;
