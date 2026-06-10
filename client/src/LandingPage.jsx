import {
  SignedIn,
  SignedOut,
  SignInButton,
} from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "./components/ThemeToggle";
import "./LandingPage.css";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing">
      {/* Background glow effects */}
      <div className="hero-bg-glow hero-bg-glow-1" />
      <div className="hero-bg-glow hero-bg-glow-2" />

      {/* Navbar */}
      <nav className="landing-nav">
        <div className="landing-logo">
          <div className="landing-logo-icon">#</div>
          <span>PageNum</span>
        </div>
        <div className="landing-nav-actions">
          <ThemeToggle />
          <SignedOut>
            <SignInButton mode="modal">
              <button className="btn btn-ghost">Sign In</button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => navigate("/dashboard")}
            >
              Dashboard
            </button>
          </SignedIn>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-badge">
          <span className="hero-badge-dot" />
          Fast, secure & beautiful
        </div>
        <h1>
          Add Page Numbers to
          <br />
          <span className="text-gradient">Any PDF Instantly</span>
        </h1>
        <p className="hero-subtitle">
          Upload your PDF, choose where page numbers should appear, and
          download your numbered document in seconds. No signup hassle.
        </p>
        <div className="hero-cta">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="btn btn-primary">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
                Get Started — It's Free
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <button
              className="btn btn-primary"
              onClick={() => navigate("/dashboard")}
            >
              Go to Dashboard
            </button>
          </SignedIn>
        </div>
      </section>

      {/* Features */}
      <section className="features">
        <div className="features-title">
          <h2>Why PageNum?</h2>
          <p>Simple, powerful, and built for everyone.</p>
        </div>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <h3>Lightning Fast</h3>
            <p>
              Page numbers are added in seconds, right in your browser.
              No waiting, no queues.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="9" y1="21" x2="9" y2="9" />
              </svg>
            </div>
            <h3>6 Position Options</h3>
            <p>
              Place page numbers exactly where you want — top or bottom,
              left, center, or right.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h3>Secure & Private</h3>
            <p>
              Your files are processed securely and never stored
              permanently. Your data stays yours.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
