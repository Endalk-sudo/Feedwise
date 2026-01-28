import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Brand } from "./components/Brand";
import { PasswordInput } from "./components/PasswordInput";
import { SocialLogin } from "./components/SocialLogin";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { User, Mail, AlertCircle, CheckCircle } from "lucide-react";
import "./Auth.css";

const registerSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

export const RegisterPage = () => {
    const { register: contextRegister, serverError, isSubmitting, validationErrors, clearError } = useAuth();
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        watch,
        setError,
        formState: { errors, touchedFields },
    } = useForm({
        resolver: zodResolver(registerSchema),
        mode: "onBlur",
    });

    const password = watch("password");
    const confirmPassword = watch("confirmPassword");
    const passwordsMatch = password && confirmPassword && password === confirmPassword;

    // Apply server-side validation errors to form
    useEffect(() => {
        if (validationErrors && Object.keys(validationErrors).length > 0) {
            Object.entries(validationErrors).forEach(([field, message]) => {
                setError(field, {
                    type: "server",
                    message: message,
                });
            });
        }
    }, [validationErrors, setError]);

    // Clear server error when fields change
    const clearOnType = () => {
        if (serverError) clearError();
    };

    const onSubmit = async (data) => {
        try {
            await contextRegister(data);
            toast.success("Account created!", {
                description: "Redirecting you to login...",
            });
            setTimeout(() => navigate('/login'), 1500);
        } catch (error) {
            // Global errors are handled by context and displayed via serverError
            if (!validationErrors || Object.keys(validationErrors).length === 0) {
                toast.error("Registration Failed", {
                    description: error.message || "Something went wrong. Please try again.",
                });
            }
        }
    };

    return (
        <div className="auth-shell">
            <Brand />
            <motion.section
                className="auth-card"
                aria-labelledby="register-title"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
            >
                <header className="auth-header">
                    <h2 id="register-title" className="auth-title">Create account</h2>
                    <p className="auth-subtitle">Join us and start collecting feedback in minutes.</p>
                </header>

                <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
                    <div className="form-field">
                        <label className="form-label" htmlFor="username">User Name</label>
                        <div className="input-wrapper">
                            <span className="input-icon">
                                <User size={18} />
                            </span>
                            <input
                                {...register("username")}
                                id="username"
                                className={`input ${errors.username ? 'input-error' : ''}`}
                                type="text"
                                placeholder=" "
                                autoComplete="username"
                                onInput={clearOnType}
                            />
                        </div>
                        <AnimatePresence>
                            {errors.username && (
                                <motion.div
                                    className="field-error"
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                >
                                    <AlertCircle size={14} />
                                    <span>{errors.username.message}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="form-field">
                        <label className="form-label" htmlFor="email">Email</label>
                        <div className="input-wrapper">
                            <span className="input-icon">
                                <Mail size={18} />
                            </span>
                            <input
                                {...register("email")}
                                id="email"
                                className={`input ${errors.email ? 'input-error' : ''}`}
                                type="email"
                                placeholder=" "
                                autoComplete="email"
                                onInput={clearOnType}
                            />
                        </div>
                        <AnimatePresence>
                            {errors.email && (
                                <motion.div
                                    className="field-error"
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                >
                                    <AlertCircle size={14} />
                                    <span>{errors.email.message}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className={`form-field ${passwordsMatch ? 'glow' : ''}`}>
                        <PasswordInput
                            {...register("password")}
                            label="Password"
                            autoComplete="new-password"
                            error={errors.password}
                            touched={touchedFields.password}
                            onInput={clearOnType}
                        />
                        <p className="char-count">6+ characters</p>
                    </div>

                    <div className={`form-field ${passwordsMatch ? 'glow' : ''}`}>
                        <PasswordInput
                            {...register("confirmPassword")}
                            label="Confirm Password"
                            autoComplete="new-password"
                            error={errors.confirmPassword}
                            touched={touchedFields.confirmPassword}
                            onInput={clearOnType}
                        />
                        <AnimatePresence>
                            {passwordsMatch && (
                                <motion.div
                                    className="field-success"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    style={{ color: '#22c55e', fontSize: '0.75rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                >
                                    <CheckCircle size={14} />
                                    <span>Passwords match</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>


                    <button className="auth-button" type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                            <div className="button-loading-content">
                                <LoadingSpinner />
                                <span>Creating Account...</span>
                            </div>
                        ) : "Create account"}
                    </button>

                    <SocialLogin />

                    <p className="switch">
                        Already have an account?
                        <a href="/login" className="auth-link">Sign in</a>
                    </p>
                </form>
            </motion.section>
        </div>
    );
};