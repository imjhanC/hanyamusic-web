import { X } from "lucide-react";

interface SignUpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SignUpModal = ({ isOpen, onClose }: SignUpModalProps) => {
  if (!isOpen) return null;

  const handleSignUp = () => {
    console.log('Sign up clicked - to be implemented');
    // Placeholder for future sign-up functionality
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose}></div>
      <div className="signup-modal">
        <button className="modal-close-btn" onClick={onClose}>
          <X size={20} />
        </button>
        
        <div className="signup-modal-content">
          <h2 className="signup-modal-title">
            Join <span className="brand-color">Hanya</span>Music
          </h2>
          <p className="signup-modal-subtitle">
            Create your account and unlock a personalized music experience
          </p>

          <div className="signup-benefits">
            <div className="benefit-item">
              <div className="benefit-icon">🎵</div>
              <div className="benefit-text">
                <h3>Personalized Recommendations</h3>
                <p>Discover music tailored to your taste</p>
              </div>
            </div>
            
            <div className="benefit-item">
              <div className="benefit-icon">📋</div>
              <div className="benefit-text">
                <h3>Create Playlists</h3>
                <p>Save and organize your favorite songs</p>
              </div>
            </div>
            
            <div className="benefit-item">
              <div className="benefit-icon">📊</div>
              <div className="benefit-text">
                <h3>Track Your Listening</h3>
                <p>See your music history and statistics</p>
              </div>
            </div>
            
            <div className="benefit-item">
              <div className="benefit-icon">⭐</div>
              <div className="benefit-text">
                <h3>Follow Artists</h3>
                <p>Stay updated with your favorite musicians</p>
              </div>
            </div>
          </div>

          <button className="signup-btn" onClick={handleSignUp}>
            Sign Up Free
          </button>
          
          <p className="signup-footer">
            Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); console.log('Login clicked'); }}>Log in</a>
          </p>
        </div>
      </div>
    </>
  );
};

