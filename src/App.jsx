import { useState } from "react";
import "./App.css";
import tiktokLogo from "./assets/tiktok-logo.png";

/* =========================
   ICONS
========================= */

const QRIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      x="3"
      y="3"
      width="7"
      height="7"
      stroke="currentColor"
      strokeWidth="2"
    />
    <rect x="5" y="5" width="3" height="3" fill="currentColor" />

    <rect
      x="14"
      y="3"
      width="7"
      height="7"
      stroke="currentColor"
      strokeWidth="2"
    />
    <rect x="16" y="5" width="3" height="3" fill="currentColor" />

    <rect
      x="3"
      y="14"
      width="7"
      height="7"
      stroke="currentColor"
      strokeWidth="2"
    />
    <rect x="5" y="16" width="3" height="3" fill="currentColor" />

    <path
      d="M14 14H17V17H14V14ZM18 14H21V17H18V14ZM14 18H17V21H14V18ZM18 18H21V21H18V18Z"
      fill="currentColor"
    />
  </svg>
);

const PersonIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="12" cy="7" r="4" />
    <path d="M4 21C4 16.58 7.58 13 12 13C16.42 13 20 16.58 20 21H4Z" />
  </svg>
);

const FacebookIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="12" cy="12" r="12" fill="#1877F2" />

    <path
      d="M13.5 21V13.35H16.05L16.45 10.35H13.5V8.43C13.5 7.56 13.74 6.97 14.98 6.97H16.56V4.29C16.29 4.25 15.36 4.17 14.28 4.17C12.02 4.17 10.47 5.55 10.47 8.09V10.35H7.93V13.35H10.47V21H13.5Z"
      fill="white"
    />
  </svg>
);

const HelpIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="21"
    height="21"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="12" cy="12" r="9" />

    <path d="M9.8 9.2C9.8 7.7 10.8 6.7 12.3 6.7C13.8 6.7 14.8 7.6 14.8 9C14.8 10.2 14.2 10.8 13.2 11.5C12.3 12.1 11.8 12.7 11.8 14" />

    <circle cx="11.8" cy="17" r="0.8" fill="currentColor" stroke="none" />
  </svg>
);

/* =========================
   APP
========================= */

function App() {
  /* =========================
     SCREEN
  ========================= */

  const [screen, setScreen] = useState("main");

  /* =========================
     LOGIN
  ========================= */

  const [loginMethod, setLoginMethod] = useState("password");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [phone, setPhone] = useState("");
  const [phonePassword, setPhonePassword] = useState("");

  /* =========================
     SIGN UP
  ========================= */

  const [signupUsername, setSignupUsername] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  const [signupMethod, setSignupMethod] = useState("email");

  /* =========================
     OTHER
  ========================= */

  const [loading, setLoading] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);

  const [message, setMessage] = useState("");

  const [loggedInUser, setLoggedInUser] = useState(null);

  /* =========================================================
     PASSWORD LOGIN
  ========================================================= */

  const handlePasswordLogin = async (e) => {
    e.preventDefault();

    setMessage("");

    if (!username || !password) {
      setMessage("Please enter your username/email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          username: username,
          password: password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setLoggedInUser(data.user);
        setScreen("dashboard");
        setMessage("");
      } else {
        setMessage(data.message || "Invalid username/email or password.");
      }
    } catch (error) {
      console.error("Login error:", error);

      setMessage(
        "Cannot connect to the server. Make sure Node.js is running on http://localhost:5000.",
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     PHONE LOGIN
     No 6-digit code
  ========================================================= */

  const handlePhoneLogin = async (e) => {
    e.preventDefault();

    setMessage("");

    if (!phone || !phonePassword) {
      setMessage("Please enter your phone number and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("http://localhost:5000/api/login-phone", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          phone: phone,
          password: phonePassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setLoggedInUser(data.user);
        setScreen("dashboard");
        setMessage("");
      } else {
        setMessage(data.message || "Invalid phone number or password.");
      }
    } catch (error) {
      console.error("Phone login error:", error);

      setMessage(
        "Cannot connect to the server. Make sure Node.js is running on http://localhost:5000.",
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     SIGN UP
  ========================================================= */

  const handleSignup = async (e) => {
    e.preventDefault();

    setMessage("");

    if (!signupUsername || !signupPassword) {
      setMessage("Username and password are required.");
      return;
    }

    if (signupMethod === "email" && !signupEmail) {
      setMessage("Please enter your email address.");
      return;
    }

    if (signupMethod === "phone" && !signupPhone) {
      setMessage("Please enter your phone number.");
      return;
    }

    if (signupUsername.length < 3) {
      setMessage("Username must be at least 3 characters.");
      return;
    }

    if (signupMethod === "email" && !signupEmail.includes("@")) {
      setMessage("Please enter a valid email address.");
      return;
    }

    if (signupMethod === "phone" && signupPhone.length < 10) {
      setMessage("Please enter a valid phone number.");
      return;
    }

    if (signupPassword.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }

    try {
      setSignupLoading(true);

      const response = await fetch("http://localhost:5000/api/signup", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          username: signupUsername,

          email: signupMethod === "email" ? signupEmail : null,

          phone: signupMethod === "phone" ? signupPhone : null,

          password: signupPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage("Account created successfully! You can now log in.");

        setUsername(signupUsername);
        setPassword("");

        setSignupUsername("");
        setSignupEmail("");
        setSignupPhone("");
        setSignupPassword("");

        setTimeout(() => {
          setScreen("account");
          setMessage("Account created successfully. Please log in.");
        }, 1000);
      } else {
        setMessage(data.message || "Unable to create account.");
      }
    } catch (error) {
      console.error("Signup error:", error);

      setMessage(
        "Cannot connect to the server. Make sure Node.js is running on http://localhost:5000.",
      );
    } finally {
      setSignupLoading(false);
    }
  };

  /* =========================================================
     LOGOUT
  ========================================================= */

  const handleLogout = () => {
    setLoggedInUser(null);

    setUsername("");
    setPassword("");

    setPhone("");
    setPhonePassword("");

    setMessage("");

    setScreen("main");
  };

  /* =========================================================
     MAIN SCREEN
  ========================================================= */

  if (screen === "main") {
    return (
      <div className="app">
        <header className="topbar">
          <div
            className="brand"
            onClick={() => {
              setScreen("main");
              setMessage("");
            }}
          >
            <img src={tiktokLogo} className="brand-logo" alt="TikTok" />
          </div>

          <div className="help">
            <HelpIcon />
            <span>Feedback and help</span>
          </div>
        </header>

        <main className="main-content">
          <section className="login-card">
            <h1>Log in to Tiktok</h1>

            <p className="description">
              Manage your account, check notifications,
              <br />
              comment on videos, and more.
            </p>

            <button
              className="login-option"
              onClick={() => {
                setMessage("QR login is not configured yet.");
              }}
            >
              <span className="option-icon">
                <QRIcon />
              </span>

              <span>Use QR code</span>
            </button>

            <button
              className="login-option"
              onClick={() => {
                setScreen("account");
                setLoginMethod("password");
                setMessage("");
              }}
            >
              <span className="option-icon">
                <PersonIcon />
              </span>

              <span>Use phone / email / username</span>
            </button>

            <button
              className="login-option"
              onClick={() => {
                setMessage("Facebook login requires OAuth configuration.");
              }}
            >
              <span className="option-icon">
                <FacebookIcon />
              </span>

              <span>Continue with Facebook</span>
            </button>

            <p className="terms">
              By continuing with an account, you agree to our{" "}
              <strong>Terms of Service</strong> and acknowledge that you have
              read our <strong>Privacy Policy</strong>.
            </p>
          </section>

          {message && <div className="main-message">{message}</div>}
        </main>

        <footer>
          <div className="signup">
            <span>Don't have an account?</span>

            <button
              onClick={() => {
                setScreen("signup");
                setMessage("");
              }}
            >
              Sign up
            </button>
          </div>

          <div className="footer-bottom">
            <button className="language">English (US)</button>

            <span>© 2026 Tiktok</span>
          </div>
        </footer>
      </div>
    );
  }

  /* =========================================================
     SIGN UP SCREEN
  ========================================================= */

  if (screen === "signup") {
    return (
      <div className="app">
        <header className="topbar">
          <div
            className="brand"
            onClick={() => {
              setScreen("main");
              setMessage("");
            }}
          >
            <img src={tiktokLogo} className="brand-logo" alt="TikTok" />

            <span>Tiktok</span>
          </div>

          <div className="help">
            <HelpIcon />
            <span>Feedback and help</span>
          </div>
        </header>

        <main className="account-content">
          <section className="account-card">
            <h1>Sign up</h1>

            <p className="description">Create your TikTok account</p>

            <form onSubmit={handleSignup}>
              <input
                className="full-input"
                type="text"
                placeholder="Username"
                value={signupUsername}
                onChange={(e) => setSignupUsername(e.target.value)}
                autoComplete="username"
              />

              <div className="signup-method">
                <label className="signup-label">Sign up with</label>

                <select
                  className="full-input signup-select"
                  value={signupMethod}
                  onChange={(e) => {
                    setSignupMethod(e.target.value);
                    setMessage("");
                  }}
                >
                  <option value="email">Email</option>

                  <option value="phone">Phone number</option>
                </select>
              </div>

              {signupMethod === "email" && (
                <input
                  className="full-input"
                  type="email"
                  placeholder="Email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  autoComplete="email"
                />
              )}

              {signupMethod === "phone" && (
                <div className="phone-input">
                  <div className="country">PH +63</div>

                  <input
                    type="tel"
                    placeholder="Phone number"
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value)}
                    autoComplete="tel"
                  />
                </div>
              )}

              <input
                className="full-input"
                type="password"
                placeholder="Password"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                autoComplete="new-password"
              />

              <button
                type="submit"
                className="primary-login"
                disabled={signupLoading}
              >
                {signupLoading ? "Creating account..." : "Sign up"}
              </button>
            </form>

            {message && <div className="account-message">{message}</div>}

            <button
              className="back-button"
              onClick={() => {
                setScreen("main");
                setMessage("");
              }}
            >
              ← Go back
            </button>
          </section>
        </main>

        <footer>
          <div className="signup">
            <span>Already have an account?</span>

            <button
              onClick={() => {
                setScreen("account");
                setMessage("");
              }}
            >
              Log in
            </button>
          </div>

          <div className="footer-bottom">
            <button className="language">English (US)</button>

            <span>© 2026 Tiktok</span>
          </div>
        </footer>
      </div>
    );
  }

  /* =========================================================
     DASHBOARD
  ========================================================= */

  if (screen === "dashboard") {
    return (
      <div className="dashboard-page">
        <header className="dashboard-header">
          <div className="dashboard-brand">
            <img src={tiktokLogo} className="brand-logo" alt="TikTok" />

            <span>Tiktok</span>
          </div>

          <div className="dashboard-right">
            <span className="online-dot"></span>

            <span>{loggedInUser?.username}</span>

            <button className="logout-button" onClick={handleLogout}>
              Log out
            </button>
          </div>
        </header>

        <main className="dashboard-content">
          <section className="welcome-card">
            <div className="welcome-text">
              <span className="welcome-small">Welcome back!</span>

              <h1>
                Hello, <span>{loggedInUser?.username}</span>!
              </h1>

              <p>You are successfully logged in to your Tiktok account.</p>
            </div>

            <div className="profile-circle">
              {loggedInUser?.username?.charAt(0)?.toUpperCase()}
            </div>
          </section>

          <section className="dashboard-grid">
            <div className="dashboard-card">
              <div className="dashboard-icon">👤</div>

              <h3>My Profile</h3>

              <p>View and manage your account information.</p>

              <button>View Profile</button>
            </div>

            <div className="dashboard-card">
              <div className="dashboard-icon">🔔</div>

              <h3>Notifications</h3>

              <p>Check your latest account notifications.</p>

              <button>View Notifications</button>
            </div>

            <div className="dashboard-card">
              <div className="dashboard-icon">🎬</div>

              <h3>Videos</h3>

              <p>Explore and interact with your videos.</p>

              <button>Explore Videos</button>
            </div>

            <div className="dashboard-card">
              <div className="dashboard-icon">⚙️</div>

              <h3>Settings</h3>

              <p>Manage your account settings and preferences.</p>

              <button>Settings</button>
            </div>
          </section>

          <section className="account-info-card">
            <h2>Account Information</h2>

            <div className="info-row">
              <span>Username</span>

              <strong>{loggedInUser?.username}</strong>
            </div>

            <div className="info-row">
              <span>Email</span>

              <strong>{loggedInUser?.email || "Not provided"}</strong>
            </div>

            <div className="info-row">
              <span>Phone</span>

              <strong>{loggedInUser?.phone || "Not provided"}</strong>
            </div>

            <div className="info-row">
              <span>Login status</span>

              <strong className="status-success">● Online</strong>
            </div>
          </section>
        </main>

        <footer className="dashboard-footer">
          <span>© 2026 Tiktok</span>

          <span>Your account is securely connected.</span>
        </footer>
      </div>
    );
  }

  /* =========================================================
     ACCOUNT LOGIN SCREEN
  ========================================================= */

  return (
    <div className="app">
      <header className="topbar">
        <div
          className="brand"
          onClick={() => {
            setScreen("main");
            setMessage("");
          }}
        >
          <img src={tiktokLogo} className="brand-logo" alt="TikTok" />

          <span>Tiktok</span>
        </div>

        <div className="help">
          <HelpIcon />
          <span>Feedback and help</span>
        </div>
      </header>

      <main className="account-content">
        <section className="account-card">
          <h1>Log in</h1>

          {/* PHONE LOGIN */}

          {loginMethod === "phone" ? (
            <form onSubmit={handlePhoneLogin}>
              <div className="method-header">
                <strong>Phone</strong>

                <button
                  type="button"
                  className="switch-link"
                  onClick={() => {
                    setLoginMethod("password");
                    setMessage("");
                  }}
                >
                  Log in with email or username
                </button>
              </div>

              <div className="phone-input">
                <div className="country">PH +63</div>

                <input
                  type="tel"
                  placeholder="Phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              {/* NO 6-DIGIT CODE */}

              <input
                className="full-input"
                type="password"
                placeholder="Password"
                value={phonePassword}
                onChange={(e) => setPhonePassword(e.target.value)}
                autoComplete="current-password"
              />

              <button
                type="submit"
                className="primary-login"
                disabled={loading}
              >
                {loading ? "Logging in..." : "Log in"}
              </button>
            </form>
          ) : (
            /* EMAIL / USERNAME LOGIN */

            <form onSubmit={handlePasswordLogin}>
              <div className="method-header">
                <strong>Email or username</strong>

                <button
                  type="button"
                  className="switch-link"
                  onClick={() => {
                    setLoginMethod("phone");
                    setMessage("");
                  }}
                >
                  Log in with phone
                </button>
              </div>

              <input
                className="full-input"
                type="text"
                placeholder="Email or username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />

              <input
                className="full-input"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />

              <button
                type="button"
                className="forgot"
                onClick={() =>
                  setMessage("Password recovery is not configured yet.")
                }
              >
                Forgot password?
              </button>

              <button
                type="submit"
                className="primary-login"
                disabled={loading}
              >
                {loading ? "Logging in..." : "Log in"}
              </button>
            </form>
          )}

          {message && <div className="account-message">{message}</div>}

          <button
            className="back-button"
            onClick={() => {
              setScreen("main");
              setMessage("");
            }}
          >
            ← Go back
          </button>
        </section>
      </main>

      <footer>
        <div className="signup">
          <span>Don't have an account?</span>

          <button
            onClick={() => {
              setScreen("signup");
              setMessage("");
            }}
          >
            Sign up
          </button>
        </div>

        <div className="footer-bottom">
          <button className="language">English (US)</button>

          <span>© 2026 Tiktok</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
