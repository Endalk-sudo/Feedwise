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
import { Mail, AlertCircle } from "lucide-react";
import "./Auth.css";

const loginSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(1, "Password is required"),
});

export const LoginPage = () => {
    const { user, login: contextLogin, serverError, validationErrors, isSubmitting, clearError } = useAuth();
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        setError,
        formState: { errors, touchedFields },
    } = useForm({
        resolver: zodResolver(loginSchema),
        mode: "onBlur",
    });

    // Handle navigation after successful login
    useEffect(() => {
        if (user) {
            if (user.currentPlan === null || user.subscriptionStatus === 'inactive') {
                navigate('/payment');
            } else {
                navigate('/dashboard');
            }
        }
    }, [user, navigate]);

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
        console.log("Form submitted", data);
        try {
            await contextLogin(data);
            console.log("Login successful");
            toast.success("Welcome back!", {
                description: "You have successfully signed in.",
            });
        } catch (error) {
            console.error("Login caught error:", error);
            // Global errors are handled by context and displayed via serverError
            // Validation errors are handled by the useEffect above
            if (!validationErrors || Object.keys(validationErrors).length === 0) {
                toast.error("Login Failed", {
                    description: error.message || "Invalid credentials, please try again.",
                });
            }
        }
    };

    return (
        <div className="auth-shell">
            <Brand />
            <motion.section
                className="auth-card"
                aria-labelledby="login-title"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <header className="auth-header">
                    <h2 id="login-title" className="auth-title">Sign in</h2>
                    <p className="auth-subtitle">Welcome back. Please enter your details.</p>
                </header>

                <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
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
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                >
                                    <AlertCircle size={14} />
                                    <span>{errors.email.message}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <PasswordInput
                        {...register("password")}
                        label="Password"
                        autoComplete="current-password"
                        error={errors.password}
                        touched={touchedFields.password}
                        onInput={clearOnType}
                    />

                    {serverError && (
                        <div className="error">
                            <span>{serverError}</span>
                        </div>
                    )}

                    <button className="auth-button" type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                            <div className="button-loading-content">
                                <LoadingSpinner />
                                <span>Signing in...</span>
                            </div>
                        ) : "Sign in"}
                    </button>

                    <SocialLogin />

                    <p className="switch">
                        Don't have an account?
                        <a href="/register" className="auth-link">Create account</a>
                    </p>
                </form>
            </motion.section>
        </div>
    );
};