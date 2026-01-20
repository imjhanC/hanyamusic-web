import { useState, useEffect } from "react";
import { X, Lock, Eye, EyeOff, User } from "lucide-react";

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLoginSuccess: (userData: UserData) => void;
    onSignUpContinue: () => void;
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

export const LoginModal = ({ isOpen, onClose, onLoginSuccess, onSignUpContinue, apiBaseUrl }: LoginModalProps) => {
    const [formData, setFormData] = useState({
        identifier: "", // Can be username or email
        password: ""
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSignUp = () => {
        onSignUpContinue();
    };

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setFormData({
                identifier: "",
                password: ""
            });
            setError(null);
            setShowPassword(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.identifier.trim()) {
            setError("Username or email is required");
            return;
        }

        if (!formData.password) {
            setError("Password is required");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Prepare form data for OAuth2PasswordRequestForm
            // Backend expects raw password and handles verification securely
            const loginFormData = new URLSearchParams();
            loginFormData.append('username', formData.identifier.trim()); // Backend uses 'username' field for both username and email
            loginFormData.append('password', formData.password);

            const response = await fetch(`${apiBaseUrl}/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'ngrok-skip-browser-warning': 'true',
                },
                body: loginFormData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Login failed');
            }

            const tokenData = await response.json();
            console.log('[LoginModal] Login response:', tokenData);

            // Store token in localStorage
            localStorage.setItem('access_token', tokenData.access_token);

            // Fetch user details using the token
            try {
                // First, get the current user info
                const userResponse = await fetch(`${apiBaseUrl}/users/me`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${tokenData.access_token}`,
                        'ngrok-skip-browser-warning': 'true',
                        'Accept': 'application/json'
                    }
                });

                if (userResponse.ok) {
                    const userData = await userResponse.json();
                    console.log('[LoginModal] User data from /users/me:', userData);

                    // Store complete user data
                    const userDataToStore = {
                        id: userData.id,
                        username: userData.username,
                        email: userData.email,
                        display_name: userData.display_name,
                        avatar_url: userData.avatar_url
                    };

                    console.log('[LoginModal] Storing user data:', userDataToStore);
                    localStorage.setItem('user_data', JSON.stringify(userDataToStore));

                    // Call success callback with complete data
                    onLoginSuccess({
                        ...userDataToStore,
                        access_token: tokenData.access_token,
                        token_type: tokenData.token_type
                    });
                } else {
                    throw new Error('Failed to fetch user details');
                }
            } catch (detailsError) {
                console.error('Failed to fetch user details:', detailsError);
                throw new Error('Login successful but failed to load user data');
            }

            // Close modal
            onClose();

            // Reset form
            setFormData({
                identifier: "",
                password: ""
            });

        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-modal-overlay" onClick={onClose}>
            <div className="login-modal-container" onClick={(e) => e.stopPropagation()}>
                {/* Close Button */}
                <button className="login-modal-close-btn" onClick={onClose}>
                    <X size={24} />
                </button>

                <div className="login-modal-content">
                    {/* Header */}
                    <div className="login-modal-header">
                        <h2 className="login-modal-title">Welcome Back</h2>
                        <p className="login-modal-subtitle">Sign in to continue to HanyaMusic</p>
                    </div>

                    {error && (
                        <div className="login-error-message">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="login-form">
                        {/* Username or Email */}
                        <div className="login-form-group">
                            <label htmlFor="identifier" className="login-form-label">
                                <User size={16} />
                                Username or Email
                            </label>
                            <input
                                id="identifier"
                                name="identifier"
                                type="text"
                                className="login-form-input"
                                placeholder="Enter your username or email"
                                value={formData.identifier}
                                onChange={handleInputChange}
                                disabled={isLoading}
                                required
                            />
                        </div>

                        {/* Password */}
                        <div className="login-form-group">
                            <label htmlFor="password" className="login-form-label">
                                <Lock size={16} />
                                Password
                            </label>
                            <div className="login-password-wrapper">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    className="login-form-input"
                                    placeholder="Enter your password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    disabled={isLoading}
                                    required
                                />
                                <button
                                    type="button"
                                    className="login-password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="login-submit-button"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <div className="login-spinner"></div>
                                    Signing In...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    <p className="login-form-footer">
                        Don't have an account? <a href="#" onClick={(e) => { e.preventDefault(); handleSignUp(); }}>Sign up</a>
                    </p>
                </div>
            </div>
        </div>
    );
};
