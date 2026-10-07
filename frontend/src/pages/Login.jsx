import { apiUrl } from "../config/api";
import expertLogo from "../assets/expert-technology-logo.png";

import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  Eye,
  EyeOff,
} from "lucide-react";

import "./Login.css";


function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    const existingToken = localStorage.getItem("token");

    // Visiting /login starts a fresh session. Clear any client-side
    // credentials so returning to a protected route requires sign-in.
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // Best-effort invalidation of the previous backend session.
    if (existingToken) {
      fetch(apiUrl("/api/accounts/logout/"), {
        method: "POST",
        headers: {
          Authorization: `Token ${existingToken}`,
        },
      }).catch((error) => {
        console.warn("Unable to invalidate previous session:", error);
      });
    }
  }, []);

  const [username, setUsername] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);


  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        apiUrl("/api/accounts/login/"),
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            username,
            password,
          }),
        }
      );

      const data =
        await response.json();


      if (!response.ok) {
        setError(
          data.message ||
            "Invalid username or password."
        );

        return;
      }


      localStorage.setItem(
        "token",
        data.token
      );

      localStorage.setItem(
        "user",
        JSON.stringify(
          data.user
        )
      );


      navigate(
        "/dashboard"
      );

    } catch (error) {
      console.error(error);

      setError(
        "Cannot connect to the DEV server."
      );

    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="login-page">

      <div className="login-card">


        {/* BACK */}

        <button
          type="button"
          className="login-back"
          onClick={() =>
            navigate("/")
          }
        >
          Back to home
        </button>


        {/* LOGO */}

        <div className="login-brand">

          <img
            src={expertLogo}
            alt="DEV"
            className="expert-logo"
          />

          <span className="service-label">
            Service Management System <em className="dev-badge">DEV</em>
          </span>

        </div>


        {/* HEADING */}

        <div className="login-heading">

          <h2>
            Welcome Back
          </h2>

          <p>
            Sign in to continue to your
            account.
          </p>

        </div>


        {/* ERROR */}

        {error && (
          <div className="login-error">
            {error}
          </div>
        )}


        {/* LOGIN FORM */}

        <form
          onSubmit={
            handleSubmit
          }
        >


          {/* USERNAME */}

          <div className="login-field">

            <label htmlFor="username">
              Username
            </label>

            <input
              id="username"
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) =>
                setUsername(
                  e.target.value
                )
              }
              autoComplete="username"
              required
            />

          </div>


          {/* PASSWORD */}

          <div className="login-field">

            <label htmlFor="password">
              Password
            </label>


            <div className="password-wrapper">

              <input
                id="password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                placeholder="Enter password"
                value={password}
                onChange={(e) =>
                  setPassword(
                    e.target.value
                  )
                }
                autoComplete="current-password"
                required
              />


              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowPassword(
                    !showPassword
                  )
                }
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
                title={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
              >

                {showPassword ? (
                  <EyeOff
                    size={19}
                  />
                ) : (
                  <Eye
                    size={19}
                  />
                )}

              </button>

            </div>

          </div>


          {/* LOGIN OPTIONS */}

          <div className="login-options">

            <label className="remember">

              <input
                type="checkbox"
              />

              <span>
                Remember me
              </span>

            </label>


            <button
              type="button"
              className="forgot-btn"
              onClick={() =>
                navigate(
                  "/forgot-password"
                )
              }
            >
              Forgot password?
            </button>

          </div>


          {/* SIGN IN */}

          <button
            type="submit"
            className="signin-btn"
            disabled={loading}
          >
            {loading
              ? "Signing in..."
              : "Sign in"}
          </button>

        </form>


        {/* REGISTER */}

        <div className="register-text">

          Don't have an account?{" "}

          <button
            type="button"
            onClick={() =>
              navigate(
                "/register"
              )
            }
          >
            Create an account
          </button>

        </div>

      </div>

    </div>
  );
}


export default Login;
