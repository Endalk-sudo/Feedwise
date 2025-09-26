import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Brand } from "./components/Brand";
import { PasswordInput } from "./components/PasswordInput";
import { SocialLogin } from "./components/SocialLogin";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { useForm } from "./hooks/useForm";
import { useRipple } from "./hooks/useRipple";
import "./Auth.css";

export const RegisterPage = () => {
    const { register: contextRegister, clearError } = useAuth();
    const navigate = useNavigate();
    const [passwordsMatch, setPasswordsMatch] = useState(false);

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
        // Use context's register function directly
        (vals) => contextRegister(vals),
        // On success, navigate to subscription page
        () => {
            navigate('/payment');
        }
    );

    const submitButtonRef = useRef();
    useRipple(submitButtonRef);

    useEffect(() => {
        setPasswordsMatch(values.password.length > 0 && values.password === values.confirmPassword);
    }, [values.password, values.confirmPassword]);

    useEffect(() => {
        clearError();
    }, [clearError]);

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
                    <p className="switch">Already have an account? <a href="/login" className="auth-link">Sign in</a></p>
                </form>
            </section>
        </div>
    );
};