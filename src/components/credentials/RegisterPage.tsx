import { useState, useRef, useEffect } from "react";
import { X, Upload, User, Mail, Lock, Eye, EyeOff, Check } from "lucide-react";

interface RegisterPageProps {
    isOpen: boolean;
    onClose: () => void;
    onRegisterSuccess: (userData: UserData) => void;
    onSwitchToLogin?: () => void;
    apiBaseUrl: string;
}

interface UserData {
    id: number;
    username: string;
    email: string;
    display_name?: string;
    avatar_url?: string;
    access_token: string;
    token_type: string;
}

interface PasswordCriteria {
    minLength: boolean;
    hasUpperCase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
}

export const RegisterPage = ({ isOpen, onClose, onRegisterSuccess, onSwitchToLogin, apiBaseUrl }: RegisterPageProps) => {
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        displayName: ""
    });
    const [avatar, setAvatar] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [passwordCriteria, setPasswordCriteria] = useState<PasswordCriteria>({
        minLength: false,
        hasUpperCase: false,
        hasNumber: false,
        hasSpecialChar: false
    });
    const [showPasswordCriteria, setShowPasswordCriteria] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setFormData({
                username: "",
                email: "",
                password: "",
                confirmPassword: "",
                displayName: ""
            });
            setAvatar(null);
            setAvatarPreview(null);
            setError(null);
            setShowPasswordCriteria(false);
            setPasswordCriteria({
                minLength: false,
                hasUpperCase: false,
                hasNumber: false,
                hasSpecialChar: false
            });
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const validatePasswordCriteria = (password: string): PasswordCriteria => {
        return {
            minLength: password.length >= 8,
            hasUpperCase: /[A-Z]/.test(password),
            hasNumber: /[0-9]/.test(password),
            hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
        };
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError(null);

        // Real-time password validation
        if (name === 'password') {
            const criteria = validatePasswordCriteria(value);
            setPasswordCriteria(criteria);
            setShowPasswordCriteria(value.length > 0);
        }
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            if (!['image/jpeg', 'image/png', 'image/gif', 'image/jpg'].includes(file.type)) {
                setError("Invalid image format. Please use JPEG, PNG, or GIF.");
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setError("Image size must be less than 5MB.");
                return;
            }

            setAvatar(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveAvatar = () => {
        setAvatar(null);
        setAvatarPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const isPasswordValid = (): boolean => {
        return passwordCriteria.minLength &&
            passwordCriteria.hasUpperCase &&
            passwordCriteria.hasNumber &&
            passwordCriteria.hasSpecialChar;
    };

    const validateForm = (): boolean => {
        if (!formData.username.trim()) {
            setError("Username is required");
            return false;
        }

        if (formData.username.length < 3) {
            setError("Username must be at least 3 characters");
            return false;
        }

        if (!formData.email.trim()) {
            setError("Email is required");
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError("Please enter a valid email address");
            return false;
        }

        if (!formData.password) {
            setError("Password is required");
            return false;
        }

        if (!isPasswordValid()) {
            setError("Password does not meet all requirements");
            return false;
        }

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const formDataToSend = new FormData();
            formDataToSend.append("username", formData.username.trim());
            formDataToSend.append("email", formData.email.trim());
            formDataToSend.append("password", formData.password);

            if (formData.displayName.trim()) {
                formDataToSend.append("display_name", formData.displayName.trim());
            }

            if (avatar) {
                formDataToSend.append("avatar", avatar);
            }

            const response = await fetch(`${apiBaseUrl}/register`, {
                method: 'POST',
                headers: {
                    'ngrok-skip-browser-warning': 'true',
                },
                body: formDataToSend
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Registration failed');
            }

            const registerData: UserData = await response.json();

            console.log('[RegisterPage] Registration response:', registerData);

            // Store token in localStorage
            localStorage.setItem('access_token', registerData.access_token);

            // Fetch complete user details from /users/{user_id} endpoint
            try {
                console.log('[RegisterPage] Fetching user details for ID:', registerData.id);

                const userDetailsResponse = await fetch(`${apiBaseUrl}/users/${registerData.id}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${registerData.access_token}`,
                        'ngrok-skip-browser-warning': 'true',
                        'Accept': 'application/json'
                    }
                });

                if (userDetailsResponse.ok) {
                    const completeUserData = await userDetailsResponse.json();

                    console.log('[RegisterPage] Complete user data from API:', completeUserData);

                    // Store complete user data
                    const userDataToStore = {
                        id: completeUserData.id,
                        username: completeUserData.username,
                        email: completeUserData.email,
                        display_name: completeUserData.display_name,
                        avatar_url: completeUserData.avatar_url
                    };

                    console.log('[RegisterPage] Storing user data:', userDataToStore);
                    localStorage.setItem('user_data', JSON.stringify(userDataToStore));

                    // Call success callback with complete data
                    onRegisterSuccess({
                        ...registerData,
                        ...userDataToStore
                    });
                } else {
                    // Fallback to registration data if user details fetch fails
                    const userDataToStore = {
                        id: registerData.id,
                        username: registerData.username,
                        email: registerData.email,
                        display_name: registerData.display_name,
                        avatar_url: registerData.avatar_url
                    };

                    localStorage.setItem('user_data', JSON.stringify(userDataToStore));
                    onRegisterSuccess(registerData);
                }
            } catch (detailsError) {
                console.error('Failed to fetch user details:', detailsError);

                // Fallback to registration data
                const userDataToStore = {
                    id: registerData.id,
                    username: registerData.username,
                    email: registerData.email,
                    display_name: registerData.display_name,
                    avatar_url: registerData.avatar_url
                };

                localStorage.setItem('user_data', JSON.stringify(userDataToStore));
                onRegisterSuccess(registerData);
            }

            // Close page
            onClose();

            // Reset form
            setFormData({
                username: "",
                email: "",
                password: "",
                confirmPassword: "",
                displayName: ""
            });
            setAvatar(null);
            setAvatarPreview(null);

        } catch (err: any) {
            console.error('Registration error:', err);
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="register-page-fullscreen">
            {/* Close Button */}
            <button className="register-close-btn" onClick={onClose}>
                <X size={24} />
            </button>

            <div className="register-page-container">
                {/* Left Side - Branding */}
                <div className="register-left-panel">
                    <div className="register-branding">
                        <h1 className="register-brand-title">
                            <span className="brand-color">Hanya</span>Music
                        </h1>
                        <p className="register-brand-tagline">
                            Your journey to unlimited music starts here
                        </p>

                        <div className="register-features">
                            <div className="register-feature-item">
                                <div className="feature-icon">🎵</div>
                                <div className="feature-content">
                                    <h3>Unlimited Access</h3>
                                    <p>Stream millions of songs</p>
                                </div>
                            </div>

                            <div className="register-feature-item">
                                <div className="feature-icon">📋</div>
                                <div className="feature-content">
                                    <h3>Custom Playlists</h3>
                                    <p>Create and share your collections</p>
                                </div>
                            </div>

                            <div className="register-feature-item">
                                <div className="feature-icon">📊</div>
                                <div className="feature-content">
                                    <h3>Track History</h3>
                                    <p>See your listening statistics</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Registration Form */}
                <div className="register-right-panel">
                    <div className="register-form-wrapper">
                        <h2 className="register-form-title">Create Your Account</h2>
                        <p className="register-form-subtitle">Join the community today</p>

                        {error && (
                            <div className="register-error-message">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="register-form-modern">
                            {/* Avatar Upload */}
                            <div className="register-avatar-section">
                                <div className="register-avatar-preview">
                                    {avatarPreview ? (
                                        <div className="register-avatar-image" style={{ backgroundImage: `url(${avatarPreview})` }}>
                                            <button
                                                type="button"
                                                className="register-avatar-remove"
                                                onClick={handleRemoveAvatar}
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="register-avatar-placeholder">
                                            <User size={40} />
                                        </div>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    className="register-avatar-upload-btn"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Upload size={16} />
                                    Upload Photo - Only JPEG , PNG , JPG , GIF allowed
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/gif,image/jpg"
                                    onChange={handleAvatarChange}
                                    style={{ display: 'none' }}
                                />
                            </div>

                            {/* Form Fields */}
                            <div className="register-form-grid">
                                {/* Username */}
                                <div className="register-form-group">
                                    <label htmlFor="username" className="register-form-label">
                                        <User size={16} />
                                        Username
                                    </label>
                                    <input
                                        id="username"
                                        name="username"
                                        type="text"
                                        className="register-form-input"
                                        placeholder="Choose a unique username"
                                        value={formData.username}
                                        onChange={handleInputChange}
                                        disabled={isLoading}
                                        required
                                    />
                                </div>

                                {/* Display Name */}
                                <div className="register-form-group">
                                    <label htmlFor="displayName" className="register-form-label">
                                        <User size={16} />
                                        Display Name <span className="optional-label">(Optional)</span>
                                    </label>
                                    <input
                                        id="displayName"
                                        name="displayName"
                                        type="text"
                                        className="register-form-input"
                                        placeholder="How should we call you?"
                                        value={formData.displayName}
                                        onChange={handleInputChange}
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div className="register-form-group">
                                <label htmlFor="email" className="register-form-label">
                                    <Mail size={16} />
                                    Email Address
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    className="register-form-input"
                                    placeholder="your.email@example.com"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    disabled={isLoading}
                                    required
                                />
                            </div>

                            {/* Password */}
                            <div className="register-form-group">
                                <label htmlFor="password" className="register-form-label">
                                    <Lock size={16} />
                                    Password
                                </label>
                                <div className="register-password-wrapper">
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        className="register-form-input"
                                        placeholder="Create a strong password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        disabled={isLoading}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="register-password-toggle"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>

                                {/* Password Criteria */}
                                {showPasswordCriteria && (
                                    <div className="password-criteria">
                                        <div className={`criteria-item ${passwordCriteria.minLength ? 'valid' : ''}`}>
                                            <Check size={14} />
                                            <span>At least 8 characters</span>
                                        </div>
                                        <div className={`criteria-item ${passwordCriteria.hasUpperCase ? 'valid' : ''}`}>
                                            <Check size={14} />
                                            <span>One uppercase letter</span>
                                        </div>
                                        <div className={`criteria-item ${passwordCriteria.hasNumber ? 'valid' : ''}`}>
                                            <Check size={14} />
                                            <span>One number</span>
                                        </div>
                                        <div className={`criteria-item ${passwordCriteria.hasSpecialChar ? 'valid' : ''}`}>
                                            <Check size={14} />
                                            <span>One special character</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div className="register-form-group">
                                <label htmlFor="confirmPassword" className="register-form-label">
                                    <Lock size={16} />
                                    Confirm Password
                                </label>
                                <div className="register-password-wrapper">
                                    <input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        className="register-form-input"
                                        placeholder="Re-enter your password"
                                        value={formData.confirmPassword}
                                        onChange={handleInputChange}
                                        disabled={isLoading}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="register-password-toggle"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                className="register-submit-button"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <div className="register-spinner"></div>
                                        Creating Account...
                                    </>
                                ) : (
                                    'Create Account'
                                )}
                            </button>
                        </form>

                        <p className="register-form-footer">
                            Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); onSwitchToLogin?.(); }}>Sign in</a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};