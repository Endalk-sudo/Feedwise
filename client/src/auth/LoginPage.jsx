import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Brand } from "./components/Brand";
import { PasswordInput } from "./components/PasswordInput";
import { SocialLogin } from "./components/SocialLogin";
import { LoadingSpinner } from "./components/LoadingSpinner";
import "./Auth.css";

export const LoginPage = () => {
    const { user, login: contextLogin, clearError, error: serverError, loading } = useAuth();
    const navigate = useNavigate();
    
    // Form state
    const [formValues, setFormValues] = useState({ email: '', password: '' });
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [isValid, setIsValid] = useState(false);
    const [loginSuccess, setLoginSuccess] = useState(false);
    
    const submitButtonRef = useRef();
    
    // --- Ripple Effect ---
    useEffect(() => {
        const button = submitButtonRef.current;
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
    }, [submitButtonRef]);
    
    // --- Navigation Logic ---
    useEffect(() => {
        // Only navigate if login was successful and we have a user
        if (loginSuccess && user) {
            if (user.currentPlan === null || user.subscriptionStatus === 'inactive') {
                navigate('/payment');
            } else {
                navigate('/dashboard');
            }
        }
    }, [loginSuccess, user, navigate]);

    // --- Form Validation ---
    const validate = (values) => {
        const errs = {};
        if (!values.email) errs.email = "Email is required";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errs.email = "Invalid email address";
        if (!values.password) errs.password = "Password is required";
        return errs;
    };
    
    useEffect(() => {
        const validationErrors = validate(formValues);
        setErrors(validationErrors);
        setIsValid(Object.keys(validationErrors).length === 0);
    }, [formValues]);
    
    // --- Event Handlers ---
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormValues({ ...formValues, [name]: value });
        if (touched[name]) {
            const validationErrors = validate({ ...formValues, [name]: value });
            setErrors(validationErrors);
        }
        if (serverError) {
            clearError();
        }
    };
    
    const handleInputBlur = (e) => {
        const { name } = e.target;
        setTouched({ ...touched, [name]: true });
        const validationErrors = validate(formValues);
        setErrors(validationErrors);
    };
    
    // --- FIXED SUBMIT HANDLER ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationErrors = validate(formValues);
        setErrors(validationErrors);
        setTouched(Object.keys(formValues).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
        
        if (Object.keys(validationErrors).length === 0) {
            try {
                await contextLogin(formValues);
                // Set login success flag instead of relying on user state change
                setLoginSuccess(true);
            } catch (error) {
                // The error is already handled by the AuthContext
                // Reset login success flag on error
                setLoginSuccess(false);
                console.error("Login failed. Error handled by context:", error.message);
            }
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
                    <div className={`form-field ${touched.email && errors.email ? 'invalid' : ''}`}>
                        <label className="form-label" htmlFor="email">Email</label>
                        <input
                            id="email"
                            name="email"
                            className={`input ${touched.email && errors.email ? 'input-error' : ''}`}
                            type="email"
                            placeholder=" "
                            value={formValues.email}
                            onChange={handleInputChange}
                            onBlur={handleInputBlur}
                            autoComplete="email"
                            required
                        />
                        {touched.email && errors.email && <div id="email-error" className="field-error">{errors.email}</div>}
                    </div>
                    <div className={`form-field ${touched.password && errors.password ? 'invalid' : ''}`}>
                        <PasswordInput
                            name="password"
                            label="Password"
                            value={formValues.password}
                            onChange={handleInputChange}
                            onBlur={handleInputBlur}
                            autoComplete="current-password"
                            error={errors.password}
                            touched={touched.password}
                        />
                        {touched.password && errors.password && <div id="password-error" className="field-error">{errors.password}</div>}
                    </div>
                    {serverError && <div className="error"><span>{serverError}</span></div>}
                    <button ref={submitButtonRef} className="auth-button" type="submit" disabled={loading || !isValid}>
                        {loading ? <div className="button-loading-content"><LoadingSpinner /><span>Signing in...</span></div> : "Sign in"}
                    </button>
                    <SocialLogin />
                    <p className="switch">Don't have an account? <a href="/register" className="auth-link">Create account</a></p>
                </form>
            </section>
        </div>
    );
};