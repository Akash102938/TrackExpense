import React, { useState } from "react";
import { loginStyles } from "../assets/dummyStyles";
import {
  Eye,
  EyeOff,
  Mail,
  User,
  Lock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import axios from "axios";

function Login({
  onLogin,
  API_URL = "https://trackexpense-backend-0343.onrender.com",
}) {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Fetch profile if backend returns only token
  const fetchProfile = async (token) => {
    if (!token) return null;

    try {
      const response = await axios.get(
        `${API_URL}/api/user/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data?.user || response.data || null;
    } catch (error) {
      console.warn("Profile fetch failed:", error);
      return null;
    }
  };

  // Save login data
  const saveAuthData = (profile, token) => {
    const storage = rememberMe
      ? localStorage
      : sessionStorage;

    try {
      if (token) {
        storage.setItem("token", token);
      }

      if (profile) {
        storage.setItem(
          "user",
          JSON.stringify(profile)
        );
      }
    } catch (error) {
      console.error("Storage error:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setIsLoading(true);

    try {
      const response = await axios.post(
        `${API_URL}/api/user/login`,
        {
          email,
          password,
        },
        {
          headers: {
            "Content-Type":
              "application/json",
          },
        }
      );

      const data = response.data || {};
      const token = data.token || null;

      let user = data.user || null;

      // If backend sends user data directly
      if (!user) {
        const tempData = { ...data };
        delete tempData.token;
        delete tempData.user;

        if (Object.keys(tempData).length) {
          user = tempData;
        }
      }

      // If only token exists, fetch profile
      if (!user && token) {
        user = await fetchProfile(token);
      }

      // Final fallback
      if (!user) {
        user = { email };
      }

      saveAuthData(user, token);

      if (typeof onLogin === "function") {
        onLogin(user, rememberMe, token);
      } else {
        navigate("/");
      }

      setPassword("");
    } catch (error) {
      console.error(
        "Login failed:",
        error?.response || error
      );

      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Login failed. Please try again.";

      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={loginStyles.pageContainer}>
      <div className={loginStyles.cardContainer}>
        {/* Header */}
        <div className={loginStyles.header}>
          <div className={loginStyles.avatar}>
            <User className="w-10 h-10 text-white" />
          </div>

          <h1 className={loginStyles.headerTitle}>
            Welcome Back
          </h1>

          <p className={loginStyles.headerSubtitle}>
            Sign in to your ExpenseTracker account
          </p>
        </div>

        {/* Form */}
        <div className={loginStyles.formContainer}>
          {error && (
            <div className={loginStyles.errorContainer}>
              <div className={loginStyles.errorIcon}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  />
                </svg>
              </div>

              <span className={loginStyles.errorText}>
                {error}
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div className="mb-6">
              <label
                htmlFor="email"
                className={loginStyles.label}
              >
                Email Address
              </label>

              <div className={loginStyles.inputContainer}>
                <div className={loginStyles.inputIcon}>
                  <Mail className="w-5 h-5" />
                </div>

                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  className={loginStyles.input}
                  placeholder="your@example.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="mb-6">
              <label
                htmlFor="password"
                className={loginStyles.label}
              >
                Password
              </label>

              <div className={loginStyles.inputContainer}>
                <div className={loginStyles.inputIcon}>
                  <Lock className="w-5 h-5" />
                </div>

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  id="password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  className={
                    loginStyles.passwordInput
                  }
                  placeholder="Enter password"
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                  className={
                    loginStyles.passwordToggle
                  }
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div
              className={
                loginStyles.checkboxContainer
              }
            >
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) =>
                  setRememberMe(
                    e.target.checked
                  )
                }
                className={loginStyles.checkbox}
              />

              <label
                htmlFor="remember"
                className={
                  loginStyles.checkboxLabel
                }
              >
                Remember Me
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`${loginStyles.button} ${
                isLoading
                  ? loginStyles.buttonDisabled
                  : ""
              }`}
            >
              {isLoading ? (
                <>
                  <svg
                    className={loginStyles.spinner}
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />

                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 
                      0 0 5.373 0 12h4zm2 
                      5.291A7.962 7.962 0 014 
                      12H0c0 3.042 1.135 5.824 
                      3 7.938l3-2.647z"
                    />
                  </svg>

                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className={loginStyles.signUpContainer}>
            <p className={loginStyles.signUpText}>
               Don't have an account {" "}
               <Link to='/signup' className={loginStyles.signUpLink}>
                 Create one account
               </Link>
            </p>
          </div> 
        </div>
      </div>
    </div>
  );
}

export default Login;
