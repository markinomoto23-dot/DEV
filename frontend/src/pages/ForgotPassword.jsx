import { apiUrl } from "../config/api";
import {
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  ArrowLeft,
  Mail,
  CheckCircle2,
  CircleAlert,
} from "lucide-react";

import expertLogo from
  "../assets/expert-technology-logo.png";

import "./Login.css";


const FORGOT_PASSWORD_API =
  apiUrl("/api/accounts/forgot-password/");


function ForgotPassword() {
  const navigate =
    useNavigate();


  const [
    email,
    setEmail,
  ] = useState("");


  const [
    loading,
    setLoading,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState("");


  const [
    success,
    setSuccess,
  ] = useState("");


  // =====================================================
  // API ERROR
  // =====================================================

  const getApiError = (
    data
  ) => {
    if (!data) {
      return (
        "Unable to process your password reset request."
      );
    }


    if (
      typeof data.message ===
      "string"
    ) {
      return data.message;
    }


    if (
      Array.isArray(
        data.email
      ) &&
      data.email.length
    ) {
      return data.email[0];
    }


    if (
      typeof data.detail ===
      "string"
    ) {
      return data.detail;
    }


    const firstValue =
      Object.values(
        data
      )[0];


    if (
      Array.isArray(
        firstValue
      ) &&
      firstValue.length
    ) {
      return firstValue[0];
    }


    if (
      typeof firstValue ===
      "string"
    ) {
      return firstValue;
    }


    return (
      "Unable to process your password reset request."
    );
  };


  // =====================================================
  // SUBMIT
  // =====================================================

  const handleSubmit =
    async (event) => {
      event.preventDefault();


      const cleanEmail =
        email.trim();


      setError("");
      setSuccess("");


      if (!cleanEmail) {
        setError(
          "Please enter your email address."
        );

        return;
      }


      setLoading(true);


      try {
        const response =
          await fetch(
            FORGOT_PASSWORD_API,
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  email:
                    cleanEmail,
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
            getApiError(
              data
            )
          );

          return;
        }


        setSuccess(
          data.message ||
            "If an account exists for this email, password reset instructions have been sent."
        );


      } catch (error) {
        console.error(
          "Forgot password error:",
          error
        );


        setError(
          "Cannot connect to the DEV server."
        );


      } finally {
        setLoading(
          false
        );
      }
    };


  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="login-page">

      <div className="login-card">


        {/* BACK */}

        <button
          type="button"
          className="login-back"
          onClick={() =>
            navigate(
              "/login"
            )
          }
        >
          <ArrowLeft
            size={16}
          />

          Back to sign in
        </button>


        {/* BRAND */}

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


        {/* SUCCESS */}

        {success ? (

          <>

            <div className="login-heading">

              <div
                style={{
                  width:
                    "54px",

                  height:
                    "54px",

                  margin:
                    "0 auto 18px",

                  display:
                    "flex",

                  alignItems:
                    "center",

                  justifyContent:
                    "center",

                  borderRadius:
                    "50%",

                  background:
                    "#eefbf3",

                  color:
                    "#17834c",
                }}
              >

                <CheckCircle2
                  size={28}
                />

              </div>


              <h2>
                Check Your Email
              </h2>


              <p>
                If an account exists
                for that email address,
                password reset
                instructions have been
                generated.
              </p>

            </div>


            <div
              style={{
                display:
                  "flex",

                alignItems:
                  "flex-start",

                gap:
                  "10px",

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
                  flexShrink:
                    0,

                  marginTop:
                    "1px",
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
                navigate(
                  "/login"
                )
              }
            >
              Return to Sign In
            </button>


            <div className="register-text">

              Didn't receive it?{" "}

              <button
                type="button"
                onClick={() => {
                  setSuccess(
                    ""
                  );

                  setError(
                    ""
                  );
                }}
              >
                Try again
              </button>

            </div>

          </>

        ) : (

          <>

            {/* HEADING */}

            <div className="login-heading">

              <div
                style={{
                  width:
                    "52px",

                  height:
                    "52px",

                  margin:
                    "0 auto 18px",

                  display:
                    "flex",

                  alignItems:
                    "center",

                  justifyContent:
                    "center",

                  borderRadius:
                    "50%",

                  background:
                    "#f5f3ff",

                  color:
                    "#7c3aed",
                }}
              >

                <Mail
                  size={25}
                />

              </div>


              <h2>
                Forgot Password?
              </h2>


              <p>
                Enter the email address
                associated with your
                account and we'll send
                password reset
                instructions.
              </p>

            </div>


            {/* ERROR */}

            {error && (

              <div
                className="login-error"
                style={{
                  display:
                    "flex",

                  alignItems:
                    "flex-start",

                  gap:
                    "9px",
                }}
              >

                <CircleAlert
                  size={18}
                  style={{
                    flexShrink:
                      0,

                    marginTop:
                      "1px",
                  }}
                />


                <span>
                  {error}
                </span>

              </div>

            )}


            {/* FORM */}

            <form
              onSubmit={
                handleSubmit
              }
            >

              <div className="login-field">

                <label
                  htmlFor="forgot-email"
                >
                  Email Address
                </label>


                <div
                  style={{
                    position:
                      "relative",
                  }}
                >

                  <Mail
                    size={18}
                    style={{
                      position:
                        "absolute",

                      left:
                        "14px",

                      top:
                        "50%",

                      transform:
                        "translateY(-50%)",

                      color:
                        "#7d8fa3",

                      pointerEvents:
                        "none",
                    }}
                  />


                  <input
                    id="forgot-email"
                    type="email"
                    placeholder="Enter your email address"
                    value={
                      email
                    }
                    onChange={(
                      event
                    ) => {
                      setEmail(
                        event.target.value
                      );


                      if (error) {
                        setError(
                          ""
                        );
                      }
                    }}
                    autoComplete="email"
                    required
                    style={{
                      paddingLeft:
                        "43px",
                    }}
                  />

                </div>

              </div>


              <div
                style={{
                  padding:
                    "11px 13px",

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
                For security, we'll show
                the same confirmation
                whether or not an account
                exists for the email
                address.
              </div>


              <button
                type="submit"
                className="signin-btn"
                disabled={
                  loading
                }
              >

                {loading
                  ? "Sending Instructions..."
                  : "Send Reset Instructions"}

              </button>

            </form>


            {/* FOOTER */}

            <div className="register-text">

              Remember your password?{" "}

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/login"
                  )
                }
              >
                Sign in
              </button>

            </div>

          </>

        )}

      </div>

    </div>
  );
}


export default ForgotPassword;
