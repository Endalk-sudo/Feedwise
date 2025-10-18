import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Brand } from "./components/Brand";
import { PasswordInput } from "./components/PasswordInput";
import { SocialLogin } from "./components/SocialLogin";
import { LoadingSpinner } from "./components/LoadingSpinner";
import "./Auth.css";

export const RegisterPage = () => {
    const { register: contextRegister, clearError, error: serverError, loading } = useAuth();
    const navigate = useNavigate();
    const [passwordsMatch, setPasswordsMatch] = useState(false);
    
    // Form state
    const [formValues, setFormValues] = useState({ username: '', email: '', password: '', confirmPassword: '' });
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [isValid, setIsValid] = useState(false);
    
    const submitButtonRef = useRef();
    
    // Ripple effect
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
    
    // Validation function
    const validate = (values) => {
        const errs = {};
        if (!values.username.trim()) errs.username = "Username is required";
        if (!values.email) errs.email = "Email is required";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errs.email = "Invalid email address";
        if (!values.password) errs.password = "Password is required";
        else if (values.password.length < 6) errs.password = "Password must be at least 6 characters";
        if (values.password !== values.confirmPassword) errs.confirmPassword = "Passwords do not match";
        return errs;
    };
    
    // Check if form is valid
    useEffect(() => {
        const validationErrors = validate(formValues);
        setErrors(validationErrors);
        setIsValid(Object.keys(validationErrors).length === 0);
    }, [formValues]);
    
    // Check if passwords match
    useEffect(() => {
        setPasswordsMatch(formValues.password.length > 0 && formValues.password === formValues.confirmPassword);
    }, [formValues.password, formValues.confirmPassword]);
    
    // Handle input change
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormValues({ ...formValues, [name]: value });
        if (touched[name]) {
            const validationErrors = validate({ ...formValues, [name]: value });
            setErrors(validationErrors);
        }
        // Clear server error when user starts typing
        if (serverError) {
            clearError();
        }
    };
    
    // Handle input blur
    const handleInputBlur = (e) => {
        const { name } = e.target;
        setTouched({ ...touched, [name]: true });
        const validationErrors = validate(formValues);
        setErrors(validationErrors);
    };
    
    // Handle form submission - FIXED VERSION
    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationErrors = validate(formValues);
        setErrors(validationErrors);
        setTouched(Object.keys(formValues).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
        
        if (Object.keys(validationErrors).length === 0) {
            try {
                await contextRegister(formValues);
                // Only navigate if registration was successful
                navigate('/login');
            } catch (error) {
                // Error is handled by AuthContext, we just catch to prevent unhandled rejection
                console.error("Registration failed:", error.message);
            }
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
                    <div className={`form-field ${touched.username && errors.username ? 'invalid' : ''}`}>
                        <label className="form-label" htmlFor="username">User Name</label>
                        <input
                            id="username"
                            name="username"
                            className={`input ${touched.username && errors.username ? 'input-error' : ''}`}
                            type="text"
                            placeholder=" "
                            value={formValues.username}
                            onChange={handleInputChange}
                            onBlur={handleInputBlur}
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
                            value={formValues.email}
                            onChange={handleInputChange}
                            onBlur={handleInputBlur}
                            autoComplete="email"
                            required
                        />
                        {touched.email && errors.email && <div id="email-error" className="field-error">{errors.email}</div>}
                    </div>
                    <div className={`form-field ${touched.password && errors.password ? 'invalid' : ''} ${passwordsMatch ? 'glow' : ''}`}>
                        <PasswordInput
                            name="password"
                            label="Password"
                            value={formValues.password}
                            onChange={handleInputChange}
                            onBlur={handleInputBlur}
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
                            value={formValues.confirmPassword}
                            onChange={handleInputChange}
                            onBlur={handleInputBlur}
                            autoComplete="new-password"
                            error={errors.confirmPassword}
                            touched={touched.confirmPassword}
                        />
                        {touched.confirmPassword && errors.confirmPassword && <div id="confirmPassword-error" className="field-error">{errors.confirmPassword}</div>}
                    </div>
                    {serverError && <div className="error"><span>{serverError}</span></div>}
                    <button ref={submitButtonRef} className="auth-button" type="submit" disabled={loading || !isValid}>
                        {loading ? <div className="button-loading-content"><LoadingSpinner /><span>Creating Account...</span></div> : "Create account"}
                    </button>
                    <SocialLogin />
                    <p className="switch">Already have an account? <a href="/login" className="auth-link">Sign in</a></p>
                </form>
            </section>
        </div>
    );
};