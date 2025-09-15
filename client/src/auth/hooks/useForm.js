import { useState } from "react";

export const useForm = (initialValues, validate, apiCall, onSuccess) => {
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