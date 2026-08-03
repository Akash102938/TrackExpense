import React, { useState } from "react";
import { signupStyles } from "../assets/dummyStyles";
import axios from "axios";
import { ArrowLeft, Eye, EyeOff, Mail, User, Lock } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";

function Signup({ onSignup, API_URL = "https://trackexpense-backend-0343.onrender.com" }) {
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const fetchProfile = async (token) => {
        if (!token) return null;

        try {
            const response = await axios.get(`${API_URL}/api/user/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            return response.data?.user || response.data || null;
        } catch (error) {
            console.warn("Profile fetch failed:", error);
            return null;
        }
    };

    const saveAuthData = (profile, token) => {
        const storage = rememberMe ? localStorage : sessionStorage;

        try {
            if (token) storage.setItem("token", token);

            if (profile) storage.setItem("user", JSON.stringify(profile));
        } catch (error) {
            console.error("Storage error:", error);
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!name.trim()) newErrors.name = "Name is required";
        if (!email.trim()) newErrors.email = "Email is required";
        else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Email is invalid";
        if (!password) newErrors.password = "Password is required";
        else if (password.length < 6) newErrors.password = "Password must be at least 6 characters";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        if (!validateForm()) return;

        setIsLoading(true);
        try {
            const res = await axios.post(
                `${API_URL}/api/user/register`,
                { name, email, password },
                { headers: { "Content-Type": "application/json" } }
            );

            const data = res.data || {};
            const token = data.token || null;
            let profile = data.user || null;

            if (!profile) {
                const copy = { ...data };
                delete copy.token;
                delete copy.user;
                if (Object.keys(copy).length) profile = copy;
            }

            if (!profile && token) profile = await fetchProfile(token);
            if (!profile) profile = { name, email };

            saveAuthData(profile, token);

            if (typeof onSignup === "function") onSignup(profile, rememberMe, token);
            else navigate("/");

            setPassword("");
        } catch (err) {
            console.error("Signup error:", err?.response || err);
            if (err.response?.data?.errors) setErrors(err.response.data.errors);
            else if (err.response?.data?.message) setErrors({ api: err.response.data.message });
            else setErrors({ api: err.message || "An unexpected error occurred" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={signupStyles.pageContainer}>
            <div className={signupStyles.cardContainer}>
                <div className={signupStyles.header}>
                    <button onClick={() => navigate(-1)} className={signupStyles.backButton}>
                        <ArrowLeft className="w-5 h-5" />
                    </button>

                    <div className={signupStyles.avatar}>
                        <User className="w-10 h-10 text-white" />
                    </div>

                    <h1 className={signupStyles.headerTitle}>Create Account</h1>
                    <p className={signupStyles.headerSubtitle}>Join Expenses to manage your finances</p>
                </div>

                <div className={signupStyles.formContainer}>
                    {errors.api && <p className={signupStyles.apiError}>{errors.api}</p>}

                    <form onSubmit={handleSubmit} noValidate>
                        <div className="mb-6">
                            <label htmlFor="name" className={signupStyles.label}>
                                Full name
                            </label>
                            <div className={signupStyles.inputContainer}>
                                <div className={signupStyles.inputIcon}>
                                    <User className="w-5 h-5" />
                                </div>
                                <input
                                    type="text"
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className={signupStyles.input}
                                    placeholder="Jon Doe"
                                />
                            </div>

                            {errors.name && <p className={signupStyles.fieldError}>{errors.name}</p>}
                        </div>

                        <div className="mb-6">
                            <label htmlFor="email" className={signupStyles.label}>
                                Email Address
                            </label>
                            <div className={signupStyles.inputContainer}>
                                <div className={signupStyles.inputIcon}>
                                    <Mail className="w-5 h-5" />
                                </div>
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={signupStyles.input}
                                    placeholder="your@example.com"
                                />
                            </div>

                            {errors.email && <p className={signupStyles.fieldError}>{errors.email}</p>}
                        </div>

                        <div className="mb-6">
                            <label htmlFor="password" className={signupStyles.label}>
                                Password
                            </label>
                            <div className={signupStyles.inputContainer}>
                                <div className={signupStyles.inputIcon}>
                                    <Lock className="w-5 h-5" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={signupStyles.passwordInput}
                                    placeholder="*****"
                                />

                                <button type="button" onClick={() => setShowPassword(!showPassword)} className={signupStyles.passwordToggle}>
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>

                            {errors.password && <p className={signupStyles.fieldError}>{errors.password}</p>}
                        </div>

                        <div className={signupStyles.checkboxContainer}>
                            <input
                                type="checkbox"
                                id="remember"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className={signupStyles.checkbox}
                            />

                            <label htmlFor="remember" className={signupStyles.checkboxLabel}>
                                Remember Me
                            </label>
                        </div>

                        <button type="submit" className={`${signupStyles.button} ${isLoading ? signupStyles.buttonDisabled : ""}`} disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <svg className={signupStyles.spinner} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Creating account...
                                </>
                            ) : (
                                "Create Account"
                            )}
                        </button>
                    </form>

                    <div className={signupStyles.signInContainer}>
                        <p className={signupStyles.signInText}>
                            Already have an account? <Link to="/login" className={signupStyles.signInLink}>Sign in</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Signup;