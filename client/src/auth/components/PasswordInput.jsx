import { useState } from "react";
import { EyeIcon } from "./EyeIcon";
import { EyeOffIcon } from "./EyeOffIcon";

export const PasswordInput = ({ name, value, onChange, onBlur, label, autoComplete, error, touched }) => {
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