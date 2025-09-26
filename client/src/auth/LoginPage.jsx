import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Brand } from "./components/Brand";
import { PasswordInput } from "./components/PasswordInput";
import { SocialLogin } from "./components/SocialLogin";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { useForm } from "./hooks/useForm";
import { useRipple } from "./hooks/useRipple";
import "./Auth.css";

export const LoginPage = () => {
    const {user} = useAuth()
    const { login: contextLogin, clearError } = useAuth();
    const navigate = useNavigate();
    
    const { values, errors, touched, loading, serverError, handleChange, handleBlur, handleSubmit, canSubmit } = useForm(
        { email: '', password: '' },
        (vals) => {
            const errs = {};
            if (!vals.email) errs.email = "Email is required";
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(vals.email)) errs.email = "Invalid email address";
            if (!vals.password) errs.password = "Password is required";
            return errs;
        },
        // Use context's login function directly
        (vals) => contextLogin(vals),
        // On success, navigate to paymetn or the dashboard 
        () => {
            if (user?.currentPlan === null || user?.subscriptionStatus === 'inactive') {
                navigate('/payment');
            } else {
                navigate('/dashboard');
            }
        }

    );

    const submitButtonRef = useRef();
    useRipple(submitButtonRef);

    useEffect(() => {
        clearError();
    }, [clearError]);

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
                    <p className="switch">Don't have an account? <a href="/register" className="auth-link">Create account</a></p>
                </form>
            </section>
        </div>
    );
};