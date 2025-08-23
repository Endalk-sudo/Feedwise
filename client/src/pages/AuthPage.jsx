import { useState, useContext, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../AuthContext.jsx";
import { loginUser, registerUser } from "../services/api.js";
import "./Auth.css";
import OranizationModal from "../components/OranizationModal.jsx";

// --- Reusable Components ---

const EyeIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <line x1="2" x2="22" y1="2" y2="22" />
  </svg>
);

const LoadingSpinner = () => (
    <svg className="loading-spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);



const PasswordInput = ({ name, value, onChange, onBlur, label, autoComplete, error, touched }) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="form-field">
            <label className="form-label" htmlFor={name}>{label}</label>
            <div className="password-wrapper">
                <input
                    id={name}
                    name={name}
                    className={`input ${touched && error ? 'input-error' : ''}`}
                    type={showPassword ? "text" : "password"}
                    placeholder=" "
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    autoComplete={autoComplete}
                    required
                    aria-invalid={!!(touched && error)}
                    aria-describedby={touched && error ? `${name}-error` : undefined}
                />
                <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
            </div>
        </div>
    );
};

const Logo = () => (
    <svg height="40" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
        <path d="M224 48H32a8 8 0 0 0-8 8v144a8 8 0 0 0 8 8h192a8 8 0 0 0 8-8V56a8 8 0 0 0-8-8Z" fill="none" stroke="var(--color-accent)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></path>
        <path d="M72 128v24a8 8 0 0 0 8 8h32a8 8 0 0 0 8-8v-24" fill="none" stroke="var(--color-accent)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></path>
        <path d="m104 120-16-16-16 16" fill="none" stroke="var(--color-accent)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></path>
        <path d="M144 128h40" fill="none" stroke="var(--color-accent)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></path>
        <path d="M144 160h40" fill="none" stroke="var(--color-accent)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></path>
        <path d="M144 96h40" fill="none" stroke="var(--color-accent)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></path>
    </svg>
);

const Brand = () => (
    <div className="auth-hero">
        <div className="hero-card">
            <Logo />
            <h1 className="hero-title">Feedback AI</h1>
            <p className="hero-copy">
                AI-powered customer insights. Collect feedback via QR/link, get instant AI categorization, and act on clear trends from your dashboard. Fast, intelligent improvements.
            </p>
        </div>
    </div>
);

const GoogleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.36,19.27 5,16.25 5,12C5,7.9 8.2,4.73 12.19,4.73C14.03,4.73 15.1,5.5 15.7,6.09L17.9,3.9C16.2,2.34 14.33,1.5 12.19,1.5C7.03,1.5 3,5.5 3,12C3,18.64 7.03,22.5 12.19,22.5C17.6,22.5 21.5,18.81 21.5,12.33C21.5,11.76 21.45,11.43 21.35,11.1Z"/></svg>
);

const GithubIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12,2A10,10 0 0,0 2,12C2,16.42 4.87,20.17 8.84,21.5C9.34,21.58 9.5,21.27 9.5,21C9.5,20.77 9.5,20.14 9.5,19.31C6.73,19.91 6.14,17.97 6.14,17.97C5.68,16.81 5.03,16.5 5.03,16.5C4.12,15.88 5.1,15.9 5.1,15.9C6.1,15.97 6.63,16.93 6.63,16.93C7.5,18.45 8.97,18 9.54,17.76C9.63,17.11 9.89,16.67 10.17,16.42C7.95,16.17 5.62,15.31 5.62,11.5C5.62,10.39 6,9.5 6.65,8.79C6.55,8.54 6.2,7.5 6.75,6.15C6.75,6.15 7.59,5.88 9.5,7.17C10.29,6.95 11.15,6.84 12,6.84C12.85,6.84 13.71,6.95 14.5,7.17C16.41,5.88 17.25,6.15 17.25,6.15C17.8,7.5 17.45,8.54 17.35,8.79C18,9.5 18.38,10.39 18.38,11.5C18.38,15.32 16.04,16.16 13.83,16.41C14.17,16.72 14.5,17.33 14.5,18.26C14.5,19.6 14.5,20.68 14.5,21C14.5,21.27 14.66,21.59 15.17,21.5C19.14,20.16 22,16.42 22,12A10,10 0 0,0 12,2Z"/></svg>
);

const SocialLogin = () => (
    <div className="social-login">
        <p className="social-login-text">Or continue with</p>
        <div className="social-login-buttons">
            <button className="social-btn google-btn"><GoogleIcon /> Google</button>
            <button className="social-btn github-btn"><GithubIcon /> GitHub</button>
        </div>
    </div>
);

// --- Hooks ---

const useForm = (initialValues, validate, apiCall, onSuccess) => {
    const [values, setValues] = useState(initialValues);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [loading, setLoading] = useState(false);
    const [serverError, setServerError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setValues(prev => ({ ...prev, [name]: value }));
        if (touched[name]) {
            const validationErrors = validate({ ...values, [name]: value });
            setErrors(validationErrors);
        }
    };

    const handleBlur = (e) => {
        const { name } = e.target;
        setTouched(prev => ({ ...prev, [name]: true }));
        const validationErrors = validate(values);
        setErrors(validationErrors);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationErrors = validate(values);
        setErrors(validationErrors);
        setTouched(Object.keys(values).reduce((acc, key) => ({ ...acc, [key]: true }), {}));

        if (Object.keys(validationErrors).length === 0) {
            setLoading(true);
            setServerError('');
            try {
                const data = await apiCall(values);
                onSuccess(data);
            } catch (err) {
                setServerError(err.message);
            } finally {
                setLoading(false);
            }
        }
    };

    const canSubmit = () => {
        return Object.keys(validate(values)).length === 0;
    };

    return {
        values,
        errors,
        touched,
        loading,
        serverError,
        handleChange,
        handleBlur,
        handleSubmit,
        canSubmit,
    };
};

const useRipple = (ref) => {
    useEffect(() => {
        const button = ref.current;
        if (!button) return;

        const createRipple = (event) => {
            const circle = document.createElement("span");
            const diameter = Math.max(button.clientWidth, button.clientHeight);
            const radius = diameter / 2;

            circle.style.width = circle.style.height = `${diameter}px`;
            circle.style.left = `${event.clientX - button.offsetLeft - radius}px`;
            circle.style.top = `${event.clientY - button.offsetTop - radius}px`;
            circle.classList.add("ripple");

            const ripple = button.getElementsByClassName("ripple")[0];
            if (ripple) {
                ripple.remove();
            }

            button.appendChild(circle);
        };

        button.addEventListener("click", createRipple);

        return () => {
            button.removeEventListener("click", createRipple);
        };
    }, [ref]);
};

// --- Auth Components ---

// Login Component
// Handles user login functionality
// On successful login, calls the login function from AuthContext
const Login = ({ onSwitch }) => {
    const { login } = useContext(AuthContext);
    const navigate = useNavigate(); // Add navigation hook
    
    // Form handling with validation
    const { values, errors, touched, loading, serverError, handleChange, handleBlur, handleSubmit, canSubmit } = useForm(
        { email: '', password: '' },
        (vals) => {
            const errs = {};
            if (!vals.email) errs.email = "Email is required";
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(vals.email)) errs.email = "Invalid email address";
            if (!vals.password) errs.password = "Password is required";
            return errs;
        },
        // API call for login
        (vals) => loginUser(vals.email, vals.password),
        // On successful login, call login function with isNew = false (not a new user)
        // Then navigate to the dashboard
        (data) => {
            login(data.user, data.accessToken);
            navigate('/dashborad'); // Navigate to dashboard after successful login
        }
    );
    const submitButtonRef = useRef();
    useRipple(submitButtonRef);

    return (
        <div className="auth-shell">
            <Brand />
            <section className="auth-card" aria-labelledby="login-title">
                <header className="auth-header">
                    <h2 id="login-title" className="auth-title">Sign in</h2>
                    <p className="auth-subtitle">Welcome back. Please enter your details.</p>
                </header>

                <form className="auth-form" onSubmit={handleSubmit} noValidate>
                    <div className={`form-field ${touched.email && errors.email ? 'invalid' : ''}`}>
                        <label className="form-label" htmlFor="email">Email</label>
                        <input
                            id="email"
                            name="email"
                            className={`input ${touched.email && errors.email ? 'input-error' : ''}`}
                            type="email"
                            placeholder=" "
                            value={values.email}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            autoComplete="email"
                            required
                        />
                        {touched.email && errors.email && <div id="email-error" className="field-error">{errors.email}</div>}
                    </div>

                    <div className={`form-field ${touched.password && errors.password ? 'invalid' : ''}`}>
                        <PasswordInput
                            name="password"
                            label="Password"
                            value={values.password}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            autoComplete="current-password"
                            error={errors.password}
                            touched={touched.password}
                        />
                        {touched.password && errors.password && <div id="password-error" className="field-error">{errors.password}</div>}
                    </div>

                    {serverError && <div className="error"><span>{serverError}</span></div>}

                    <button ref={submitButtonRef} className="auth-button" type="submit" disabled={loading || !canSubmit()}>
                        {loading ? <div className="button-loading-content"><LoadingSpinner /><span>Signing in...</span></div> : "Sign in"}
                    </button>

                    <SocialLogin />

                    <p className="switch">Don’t have an account? <span className="auth-link" onClick={onSwitch}>Create account</span></p>
                </form>
            </section>
        </div>
    );
};

// Register Component
// Handles new user registration
// On successful registration, calls the login function with isNew = true to show organization modal
const Register = ({ onSwitch }) => {
    const { login } = useContext(AuthContext);
    const navigate = useNavigate(); // Add navigation hook
    const [passwordsMatch, setPasswordsMatch] = useState(false);

    // Form handling with validation for registration
    const { values, errors, touched, loading, serverError, handleChange, handleBlur, handleSubmit, canSubmit } = useForm(
        { username: '', email: '', password: '', confirmPassword: '' },
        (vals) => {
            const errs = {};
            if (!vals.username.trim()) errs.username = "Username is required";
            if (!vals.email) errs.email = "Email is required";
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(vals.email)) errs.email = "Invalid email address";
            if (!vals.password) errs.password = "Password is required";
            else if (vals.password.length < 6) errs.password = "Password must be at least 6 characters";
            if (vals.password !== vals.confirmPassword) errs.confirmPassword = "Passwords do not match";
            return errs;
        },
        // API call for registration
        (vals) => registerUser(vals.username, vals.email, vals.password),
        // On successful registration, call login function with isNew = true
        // This triggers the organization modal to show for new users
        // Then navigate to the dashboard
        (data) => {
            login(data.user, data.accessToken, true);
            navigate('/dashborad'); // Navigate to dashboard after successful registration
        }
    );
    const submitButtonRef = useRef();
    useRipple(submitButtonRef);

    useEffect(() => {
        setPasswordsMatch(values.password.length > 0 && values.password === values.confirmPassword);
    }, [values.password, values.confirmPassword]);

    return (
        <div className="auth-shell">
            <Brand />
            <section className="auth-card" aria-labelledby="register-title">
                <header className="auth-header">
                    <h2 id="register-title" className="auth-title">Create account</h2>
                    <p className="auth-subtitle">Join us and start collecting feedback in minutes.</p>
                </header>

                <form className="auth-form" onSubmit={handleSubmit} noValidate>
                    <div className={`form-field ${touched.username && errors.username ? 'invalid' : ''}`}>
                        <label className="form-label" htmlFor="username">User Name</label>
                        <input
                            id="username"
                            name="username"
                            className={`input ${touched.username && errors.username ? 'input-error' : ''}`}
                            type="text"
                            placeholder=" "
                            value={values.username}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            autoComplete="username"
                            required
                        />
                        {touched.username && errors.username && <div id="username-error" className="field-error">{errors.username}</div>}
                    </div>

                    <div className={`form-field ${touched.email && errors.email ? 'invalid' : ''}`}>
                        <label className="form-label" htmlFor="email">Email</label>
                        <input
                            id="email"
                            name="email"
                            className={`input ${touched.email && errors.email ? 'input-error' : ''}`}
                            type="email"
                            placeholder=" "
                            value={values.email}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            autoComplete="email"
                            required
                        />
                        {touched.email && errors.email && <div id="email-error" className="field-error">{errors.email}</div>}
                    </div>

                    <div className={`form-field ${touched.password && errors.password ? 'invalid' : ''} ${passwordsMatch ? 'glow' : ''}`}>
                        <PasswordInput
                            name="password"
                            label="Password"
                            value={values.password}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            autoComplete="new-password"
                            error={errors.password}
                            touched={touched.password}
                        />
                        {touched.password && errors.password && <div id="password-error" className="field-error">{errors.password}</div>}
                        <p className="char-count">6+ characters</p>
                    </div>

                    <div className={`form-field ${touched.confirmPassword && errors.confirmPassword ? 'invalid' : ''} ${passwordsMatch ? 'glow' : ''}`}>
                        <PasswordInput
                            name="confirmPassword"
                            label="Confirm Password"
                            value={values.confirmPassword}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            autoComplete="new-password"
                            error={errors.confirmPassword}
                            touched={touched.confirmPassword}
                        />
                        {touched.confirmPassword && errors.confirmPassword && <div id="confirmPassword-error" className="field-error">{errors.confirmPassword}</div>}
                    </div>

                    {serverError && <div className="error"><span>{serverError}</span></div>}

                    <button ref={submitButtonRef} className="auth-button" type="submit" disabled={loading || !canSubmit()}>
                        {loading ? <div className="button-loading-content"><LoadingSpinner /><span>Creating Account...</span></div> : "Create account"}
                    </button>

                    <SocialLogin />

                    <p className="switch">Already have an account? <span className="auth-link" onClick={onSwitch}>Sign in</span></p>
                </form>
            </section>
        </div>
    );
};

// AuthPage Component
// Main authentication page that toggles between login and registration views
const AuthPage = () => {
    const [showLogin, setShowLogin] = useState(true);
    const [displayComponent, setDisplayComponent] = useState(showLogin ? 'login' : 'register');

    const handleSwitch = () => {
        setShowLogin(!showLogin);
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setDisplayComponent(showLogin ? 'login' : 'register');
        }, 300); // Match CSS transition duration

        return () => clearTimeout(timeoutId);
    }, [showLogin]);

    return (
        <div className="auth-container">
            <div className={`auth-wrapper ${showLogin ? 'show-login' : 'show-register'}`}>
                <div className="auth-shell-container">
                    {displayComponent === 'login' && <Login onSwitch={handleSwitch} />}
                </div>
                <div className="auth-shell-container">
                    {displayComponent === 'register' && <Register onSwitch={handleSwitch} />}
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
