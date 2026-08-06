import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
    UserPlus,
    Mail,
    Lock,
    User,
    Briefcase,
    CheckCircle,
    XCircle,
    Eye,
    EyeOff,
    ArrowLeft,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export const roleLabels = {
    cdpo: "CDPO",
    ms: "MS",
    anganwadi: "Anganwadi Worker",
    helper: "Helper",
};

export const roleColors = {
    admin: "bg-purple-100 text-purple-800",
    cdpo: "bg-blue-100 text-blue-800",
    ms: "bg-green-100 text-green-800",
    anganwadi: "bg-orange-100 text-orange-800",
    helper: "bg-gray-100 text-gray-800",
};

export default function AddUser() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "helper",
    });
    const [errors, setErrors] = useState({});
    const [success, setSuccess] = useState(false);
    const [apiError, setApiError] = useState("");

    const validatePassword = (password) => {
        const errs = [];
        if (password.length < 8) errs.push("At least 8 characters");
        if (!/[A-Z]/.test(password)) errs.push("One uppercase letter");
        if (!/[a-z]/.test(password)) errs.push("One lowercase letter");
        if (!/[0-9]/.test(password)) errs.push("One number");
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errs.push("One special character");
        return errs;
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = "Name is required";
        } else if (formData.name.trim().length < 2) {
            newErrors.name = "Name must be at least 2 characters";
        }

        if (!formData.email.trim()) {
            newErrors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Please enter a valid email address";
        }

        if (!formData.password) {
            newErrors.password = "Password is required";
        } else {
            const passwordErrors = validatePassword(formData.password);
            if (passwordErrors.length > 0) {
                newErrors.password = `Password must contain: ${passwordErrors.join(", ")}`;
            }
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = "Please confirm your password";
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
        }

        if (!formData.role) {
            newErrors.role = "Please select a role";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: "" }));
        }
        if (apiError) setApiError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        setApiError("");

        try {
            const token = localStorage.getItem("token");

            const response = await axios.post(
                `${API_BASE}/api/auth/register`,
                {
                    name: formData.name.trim(),
                    email: formData.email.trim().toLowerCase(),
                    password: formData.password,
                    role: formData.role,
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.data.success) {
                setSuccess(true);
                setTimeout(() => {
                    setFormData({
                        name: "",
                        email: "",
                        password: "",
                        confirmPassword: "",
                        role: "helper",
                    });
                    setSuccess(false);
                    navigate("/users");
                }, 2000);
            }
        } catch (error) {
            if (error.response) {
                if (error.response.data?.message) {
                    setApiError(error.response.data.message);
                } else if (error.response.data?.errors) {
                    const serverErrors = {};
                    error.response.data.errors.forEach((err) => {
                        serverErrors[err.field] = err.message;
                    });
                    setErrors(serverErrors);
                } else {
                    setApiError("Registration failed. Please try again.");
                }
            } else if (error.request) {
                setApiError("Network error. Please check your connection.");
            } else {
                setApiError("An unexpected error occurred.");
            }
            console.error("Registration error:", error);
        } finally {
            setLoading(false);
        }
    };

    const getPasswordStrength = (password) => {
        if (!password) return { level: 0, label: "None", color: "bg-gray-200" };
        const checks = [
            password.length >= 8,
            /[A-Z]/.test(password),
            /[a-z]/.test(password),
            /[0-9]/.test(password),
            /[!@#$%^&*(),.?":{}|<>]/.test(password),
        ];
        const strength = checks.filter(Boolean).length;
        if (strength <= 2) return { level: 1, label: "Weak", color: "bg-red-500" };
        if (strength <= 3) return { level: 2, label: "Fair", color: "bg-yellow-500" };
        if (strength <= 4) return { level: 3, label: "Good", color: "bg-blue-500" };
        return { level: 4, label: "Strong", color: "bg-green-500" };
    };

    const passwordStrength = getPasswordStrength(formData.password);

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-light/20 via-white to-accent-light/20 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto">
                <button
                    onClick={() => navigate(-1)}
                    className="mb-4 flex items-center gap-2 text-sm text-muted hover:text-ink transition-colors"
                >
                    <ArrowLeft size={16} />
                    Back
                </button>

                <div className="bg-white rounded-2xl shadow-card border border-line overflow-hidden">
                    <div className="bg-primary-dark px-6 py-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/10 rounded-lg">
                                <UserPlus size={20} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">Register New User</h2>
                                <p className="text-xs text-white/70">Create a new user account</p>
                            </div>
                        </div>
                    </div>

                    {success && (
                        <div className="mx-6 mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                            <CheckCircle size={18} className="text-green-600" />
                            <span className="text-sm text-green-700">
                                User registered successfully! Redirecting...
                            </span>
                        </div>
                    )}

                    {apiError && (
                        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                            <XCircle size={18} className="text-red-600" />
                            <span className="text-sm text-red-700">{apiError}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        {/* Name */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-semibold text-ink mb-1.5">
                                Full Name <span className="text-coral">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User size={18} className="text-muted" />
                                </div>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className={`w-full pl-10 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${errors.name
                                            ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                                            : "border-line focus:border-primary focus:ring-primary/20"
                                        }`}
                                    placeholder="Enter full name"
                                    disabled={loading || success}
                                />
                            </div>
                            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
                        </div>

                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-semibold text-ink mb-1.5">
                                Email Address <span className="text-coral">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail size={18} className="text-muted" />
                                </div>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={`w-full pl-10 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${errors.email
                                            ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                                            : "border-line focus:border-primary focus:ring-primary/20"
                                        }`}
                                    placeholder="Enter email address"
                                    disabled={loading || success}
                                />
                            </div>
                            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-semibold text-ink mb-1.5">
                                Password <span className="text-coral">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock size={18} className="text-muted" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={`w-full pl-10 pr-10 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${errors.password
                                            ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                                            : "border-line focus:border-primary focus:ring-primary/20"
                                        }`}
                                    placeholder="Enter password"
                                    disabled={loading || success}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted hover:text-ink"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>

                            {formData.password && (
                                <div className="mt-2">
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                                                style={{ width: `${(passwordStrength.level / 4) * 100}%` }}
                                            />
                                        </div>
                                        <span
                                            className={`text-xs font-medium ${passwordStrength.level <= 1
                                                    ? "text-red-600"
                                                    : passwordStrength.level <= 2
                                                        ? "text-yellow-600"
                                                        : passwordStrength.level <= 3
                                                            ? "text-blue-600"
                                                            : "text-green-600"
                                                }`}
                                        >
                                            {passwordStrength.label}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-xs text-muted">
                                        Password must contain: 8+ chars, uppercase, lowercase, number, special character
                                    </p>
                                </div>
                            )}
                            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-semibold text-ink mb-1.5">
                                Confirm Password <span className="text-coral">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock size={18} className="text-muted" />
                                </div>
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className={`w-full pl-10 pr-10 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${errors.confirmPassword
                                            ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                                            : "border-line focus:border-primary focus:ring-primary/20"
                                        }`}
                                    placeholder="Confirm password"
                                    disabled={loading || success}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted hover:text-ink"
                                >
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {errors.confirmPassword && (
                                <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>
                            )}
                        </div>

                        {/* Role */}
                        <div>
                            <label htmlFor="role" className="block text-sm font-semibold text-ink mb-1.5">
                                Role <span className="text-coral">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Briefcase size={18} className="text-muted" />
                                </div>
                                <select
                                    id="role"
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    className={`w-full pl-10 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${errors.role
                                            ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                                            : "border-line focus:border-primary focus:ring-primary/20"
                                        } bg-white appearance-none`}
                                    disabled={loading || success}
                                >
                                    {Object.entries(roleLabels).map(([value, label]) => (
                                        <option key={value} value={value}>
                                            {label}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <svg className="h-4 w-4 text-muted" fill="none" viewBox="0 0 20 20">
                                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 8l4 4 4-4" />
                                    </svg>
                                </div>
                            </div>
                            {formData.role && (
                                <div className="mt-1.5">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColors[formData.role]}`}>
                                        {roleLabels[formData.role]}
                                    </span>
                                </div>
                            )}
                            {errors.role && <p className="mt-1 text-xs text-red-600">{errors.role}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={loading || success}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Registering...
                                </>
                            ) : (
                                <>
                                    <UserPlus size={18} />
                                    Register User
                                </>
                            )}
                        </button>

                        <div className="text-center">
                            <p className="text-xs text-muted">
                                <span className="text-coral">*</span> Required fields
                            </p>
                        </div>
                    </form>
                </div>

                <div className="mt-4 text-center">
                    <button
                        onClick={() => navigate("/users")}
                        className="text-sm text-primary hover:text-primary-dark font-medium transition-colors"
                    >
                        View all users →
                    </button>
                </div>
            </div>
        </div>
    );
}