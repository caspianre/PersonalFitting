import { ConnectButton } from '@rainbow-me/rainbowkit';
import '../styles/Header.css';

export function Header() {
  return (
    <header className="header">
      <div className="header-container">
        <div className="header-content">
          <div className="header-left">
            <div className="header-logo">
              💪
            </div>
            <div>
              <h1 className="header-title">
                FitSecure
              </h1>
              <span className="header-subtitle">Privacy-First Fitness Tracking</span>
            </div>
            <div className="header-badge">FHE Encrypted</div>
          </div>
          <div className="header-actions">
            <ConnectButton />
          </div>
        </div>
      </div>
    </header>
  );
}
