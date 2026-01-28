import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";

export const PasswordInput = ({ label, error, touched, ...props }) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="form-field">
            <label className="form-label" htmlFor={props.name}>{label}</label>
            <div className="password-wrapper">
                <span className="input-icon">
                    <Lock size={18} />
                </span>
                <input
                    {...props}
                    id={props.name}
                    className={`input ${touched && error ? 'input-error' : ''}`}
                    type={showPassword ? "text" : "password"}
                    placeholder=" "
                    aria-invalid={!!(touched && error)}
                />
                <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            </div>
            {touched && error && (
                <div className="field-error">
                    <span>{error.message || error}</span>
                </div>
            )}
        </div>
    );
};