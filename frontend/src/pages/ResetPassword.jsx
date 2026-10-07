import { apiUrl } from "../config/api";
import {
  useState,
} from "react";

import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import {
  ArrowLeft,
  Eye,
  EyeOff,
  LockKeyhole,
  CheckCircle2,
  CircleAlert,
} from "lucide-react";

import expertLogo from "../assets/expert-technology-logo.png";

import "./Login.css";


const RESET_PASSWORD_API =
  apiUrl("/api/accounts/reset-password/");


function ResetPassword() {
  const navigate = useNavigate();

  const [searchParams] =
    useSearchParams();

  const uid =
    searchParams.get("uid") || "";

  const resetToken =
    searchParams.get("token") || "";

  const [newPassword, setNewPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    showNewPassword,
    setShowNewPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const validResetLink =
    Boolean(uid && resetToken);


  const getApiError = (data) => {
    if (!data) {
      return "Unable to reset password.";
    }

    if (data.message) {
      return data.message;
    }

    if (
      Array.isArray(data.new_password) &&
      data.new_password.length
    ) {
      return data.new_password[0];
    }

    if (
      Array.isArray(data.confirm_password) &&
      data.confirm_password.length
    ) {
      return data.confirm_password[0];
    }

    const firstValue =
      Object.values(data)[0];

    if (Array.isArray(firstValue)) {
      return firstValue[0];
    }

    if (
      typeof firstValue === "string"
    ) {
      return firstValue;
    }

    return "Unable to reset password.";
  };


  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!validResetLink) {
      setError(
        "This password reset link is invalid or incomplete."
      );
      return;
    }

    if (!newPassword) {
      setError(
        "Please enter a new password."
      );
      return;
    }

    if (newPassword.length < 8) {
      setError(
        "Your new password must contain at least 8 characters."
      );
      return;
    }

    if (!confirmPassword) {
      setError(
        "Please confirm your new password."
      );
      return;
    }

    if (
      newPassword !==
      confirmPassword
    ) {
      setError(
        "Passwords do not match."
      );
      return;
    }

    setLoading(true);

    try {
      const response =
        await fetch(
          RESET_PASSWORD_API,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                uid,
                token:
                  resetToken,
                new_password:
                  newPassword,
                confirm_password:
                  confirmPassword,
              }),
          }
        );

      let data = {};

      try {
        data =
          await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        setError(
          getApiError(data)
        );
        return;
      }

      localStorage.removeItem(
        "token"
      );

      localStorage.removeItem(
        "user"
      );

      setSuccess(
        data.message ||
          "Password reset successfully. You can now sign in with your new password."
      );

      setNewPassword("");
      setConfirmPassword("");

    } catch (error) {
      console.error(
        "Reset password error:",
        error
      );

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

        <button
          type="button"
          className="login-back"
          onClick={() =>
            navigate("/login")
          }
        >
          <ArrowLeft size={16} />
          Back to sign in
        </button>


        <div className="login-brand">

          <img
            src={expertLogo}
            alt="DEV"
            className="expert-logo"
          />

          <span className="service-label">
            Service Management System
          </span>

        </div>


        {success ? (
          <>
            <div className="login-heading">

              <div
                style={{
                  width: "54px",
                  height: "54px",
                  margin:
                    "0 auto 18px",
                  borderRadius:
                    "50%",
                  display:
                    "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  background:
                    "#eefbf3",
                  color:
                    "#17834c",
                }}
              >
                <CheckCircle2
                  size={29}
                />
              </div>

              <h2>
                Password Updated
              </h2>

              <p>
                Your password has been
                reset successfully.
              </p>

            </div>


            <div
              style={{
                display:
                  "flex",
                gap:
                  "10px",
                alignItems:
                  "flex-start",
                padding:
                  "13px 14px",
                marginBottom:
                  "20px",
                border:
                  "1px solid #b7dfc7",
                borderRadius:
                  "7px",
                background:
                  "#eefbf3",
                color:
                  "#176b3a",
                fontSize:
                  "14px",
                lineHeight:
                  "1.5",
              }}
            >
              <CheckCircle2
                size={18}
                style={{
                  flexShrink: 0,
                  marginTop: "1px",
                }}
              />

              <span>
                {success}
              </span>
            </div>


            <button
              type="button"
              className="signin-btn"
              onClick={() =>
                navigate("/login")
              }
            >
              Continue to Sign In
            </button>
          </>

        ) : (
          <>
            <div className="login-heading">

              <div
                style={{
                  width: "52px",
                  height: "52px",
                  margin:
                    "0 auto 18px",
                  borderRadius:
                    "50%",
                  display:
                    "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  background:
                    "#f5f3ff",
                  color:
                    "#7c3aed",
                }}
              >
                <LockKeyhole
                  size={26}
                />
              </div>

              <h2>
                Create New Password
              </h2>

              <p>
                Enter a secure new
                password for your
                account.
              </p>

            </div>


            {!validResetLink && (
              <div
                className="login-error"
                style={{
                  display:
                    "flex",
                  gap:
                    "9px",
                  alignItems:
                    "flex-start",
                }}
              >
                <CircleAlert
                  size={18}
                  style={{
                    flexShrink: 0,
                    marginTop: "1px",
                  }}
                />

                <span>
                  This password reset
                  link is invalid or
                  incomplete. Please
                  request a new reset
                  link.
                </span>
              </div>
            )}


            {error && (
              <div className="login-error">
                {error}
              </div>
            )}


            {validResetLink && (
              <form
                onSubmit={
                  handleSubmit
                }
              >

                <div className="login-field">

                  <label
                    htmlFor="new-password"
                  >
                    New Password
                  </label>

                  <div className="password-wrapper">

                    <input
                      id="new-password"
                      type={
                        showNewPassword
                          ? "text"
                          : "password"
                      }
                      placeholder="Enter new password"
                      value={
                        newPassword
                      }
                      onChange={(
                        event
                      ) => {
                        setNewPassword(
                          event.target.value
                        );

                        if (error) {
                          setError("");
                        }
                      }}
                      autoComplete="new-password"
                      required
                    />

                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() =>
                        setShowNewPassword(
                          !showNewPassword
                        )
                      }
                    >
                      {showNewPassword ? (
                        <EyeOff size={19} />
                      ) : (
                        <Eye size={19} />
                      )}
                    </button>

                  </div>

                </div>


                <div className="login-field">

                  <label
                    htmlFor="confirm-password"
                  >
                    Confirm Password
                  </label>

                  <div className="password-wrapper">

                    <input
                      id="confirm-password"
                      type={
                        showConfirmPassword
                          ? "text"
                          : "password"
                      }
                      placeholder="Re-enter new password"
                      value={
                        confirmPassword
                      }
                      onChange={(
                        event
                      ) => {
                        setConfirmPassword(
                          event.target.value
                        );

                        if (error) {
                          setError("");
                        }
                      }}
                      autoComplete="new-password"
                      required
                    />

                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() =>
                        setShowConfirmPassword(
                          !showConfirmPassword
                        )
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={19} />
                      ) : (
                        <Eye size={19} />
                      )}
                    </button>

                  </div>

                </div>


                <div
                  style={{
                    padding:
                      "11px 13px",
                    marginTop:
                      "-2px",
                    marginBottom:
                      "18px",
                    borderRadius:
                      "7px",
                    background:
                      "#f5f8fb",
                    color:
                      "#66788a",
                    fontSize:
                      "12px",
                    lineHeight:
                      "1.55",
                  }}
                >
                  Use at least 8
                  characters. Avoid
                  common passwords and
                  passwords too similar
                  to your account
                  information.
                </div>


                <button
                  type="submit"
                  className="signin-btn"
                  disabled={loading}
                >
                  {loading
                    ? "Updating Password..."
                    : "Reset Password"}
                </button>

              </form>
            )}


            {!validResetLink && (
              <button
                type="button"
                className="signin-btn"
                onClick={() =>
                  navigate(
                    "/forgot-password"
                  )
                }
              >
                Request New Reset Link
              </button>
            )}
          </>
        )}


        {!success && (
          <div className="register-text">

            Remember your password?{" "}

            <button
              type="button"
              onClick={() =>
                navigate("/login")
              }
            >
              Sign in
            </button>

          </div>
        )}

      </div>

    </div>
  );
}


export default ResetPassword;
