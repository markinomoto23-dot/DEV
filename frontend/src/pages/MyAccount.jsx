import PageGuide from "../components/PageGuide";
﻿import { apiUrl } from "../config/api";
import {
  useEffect,
  useState,
} from "react";

import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import "./MyAccount.css";


const ME_API =
  apiUrl("/api/accounts/me/");

const CHANGE_PASSWORD_API =
  apiUrl("/api/accounts/change-password/");


function MyAccount() {
  const navigate = useNavigate();

  const token =
    localStorage.getItem("token");


  // =========================================
  // PROFILE STATE
  // =========================================

  const [profile, setProfile] =
    useState({
      id: null,
      username: "",
      first_name: "",
      last_name: "",
      email: "",
      role: "",
      is_active: false,
      is_staff: false,
      is_superuser: false,
    });


  const [profileLoading, setProfileLoading] =
    useState(true);

  const [profileSaving, setProfileSaving] =
    useState(false);

  const [profileError, setProfileError] =
    useState("");

  const [profileSuccess, setProfileSuccess] =
    useState("");


  // =========================================
  // PASSWORD STATE
  // =========================================

  const [passwordForm, setPasswordForm] =
    useState({
      current_password: "",
      new_password: "",
      confirm_password: "",
    });


  const [passwordSaving, setPasswordSaving] =
    useState(false);

  const [passwordError, setPasswordError] =
    useState("");

  const [passwordSuccess, setPasswordSuccess] =
    useState("");


  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);


  // =========================================
  // LOGOUT
  // =========================================

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };


  // =========================================
  // LOAD PROFILE
  // =========================================

  useEffect(() => {
    const loadProfile =
      async () => {

        if (!token) {
          logout();
          return;
        }

        try {
          setProfileLoading(true);
          setProfileError("");

          const response =
            await fetch(
              ME_API,
              {
                headers: {
                  Authorization:
                    `Token ${token}`,
                },
              }
            );

          if (response.status === 401) {
            logout();
            return;
          }

          if (!response.ok) {
            throw new Error(
              "Unable to load account information."
            );
          }

          const data =
            await response.json();

          setProfile({
            id:
              data.id ?? null,

            username:
              data.username || "",

            first_name:
              data.first_name || "",

            last_name:
              data.last_name || "",

            email:
              data.email || "",

            role:
              data.role || "User",

            is_active:
              Boolean(data.is_active),

            is_staff:
              Boolean(data.is_staff),

            is_superuser:
              Boolean(data.is_superuser),
          });

        } catch (error) {
          console.error(
            "Profile loading error:",
            error
          );

          setProfileError(
            "Unable to load your account."
          );

        } finally {
          setProfileLoading(false);
        }
      };


    loadProfile();

  }, [token]);


  // =========================================
  // PROFILE FORM
  // =========================================

  const handleProfileChange =
    (event) => {

      const {
        name,
        value,
      } = event.target;

      setProfile(
        (previous) => ({
          ...previous,
          [name]: value,
        })
      );
    };


  const handleProfileSave =
    async (event) => {

      event.preventDefault();

      if (!token) {
        logout();
        return;
      }

      try {
        setProfileSaving(true);
        setProfileError("");
        setProfileSuccess("");

        const response =
          await fetch(
            ME_API,
            {
              method: "PATCH",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Token ${token}`,
              },

              body:
                JSON.stringify({
                  first_name:
                    profile.first_name.trim(),

                  last_name:
                    profile.last_name.trim(),

                  email:
                    profile.email.trim(),
                }),
            }
          );

        if (response.status === 401) {
          logout();
          return;
        }

        const data =
          await response.json();

        if (!response.ok) {
          const firstError =
            Object.values(data)?.[0];

          if (Array.isArray(firstError)) {
            setProfileError(
              firstError[0]
            );

          } else if (
            typeof firstError === "string"
          ) {
            setProfileError(
              firstError
            );

          } else {
            setProfileError(
              "Unable to update profile."
            );
          }

          return;
        }


        if (data.user) {
          setProfile(
            (previous) => ({
              ...previous,
              ...data.user,
            })
          );


          // Keep dashboard profile data updated.

          const storedUser =
            JSON.parse(
              localStorage.getItem("user")
              || "{}"
            );

          localStorage.setItem(
            "user",
            JSON.stringify({
              ...storedUser,

              first_name:
                data.user.first_name,

              last_name:
                data.user.last_name,

              email:
                data.user.email,
            })
          );
        }


        setProfileSuccess(
          "Profile updated successfully."
        );

      } catch (error) {
        console.error(
          "Profile save error:",
          error
        );

        setProfileError(
          "Unable to connect to the server."
        );

      } finally {
        setProfileSaving(false);
      }
    };


  // =========================================
  // PASSWORD FORM
  // =========================================

  const handlePasswordChange =
    (event) => {

      const {
        name,
        value,
      } = event.target;

      setPasswordForm(
        (previous) => ({
          ...previous,
          [name]: value,
        })
      );
    };


  const handlePasswordSave =
    async (event) => {

      event.preventDefault();

      setPasswordError("");
      setPasswordSuccess("");


      if (
        passwordForm.new_password
        !== passwordForm.confirm_password
      ) {
        setPasswordError(
          "New passwords do not match."
        );

        return;
      }


      if (
        passwordForm.new_password.length < 8
      ) {
        setPasswordError(
          "New password must contain at least 8 characters."
        );

        return;
      }


      try {
        setPasswordSaving(true);

        const response =
          await fetch(
            CHANGE_PASSWORD_API,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Token ${token}`,
              },

              body:
                JSON.stringify(
                  passwordForm
                ),
            }
          );


        if (response.status === 401) {
          logout();
          return;
        }


        const data =
          await response.json();


        if (!response.ok) {
          const firstError =
            Object.values(data)?.[0];

          if (Array.isArray(firstError)) {
            setPasswordError(
              firstError[0]
            );

          } else if (
            typeof firstError === "string"
          ) {
            setPasswordError(
              firstError
            );

          } else {
            setPasswordError(
              "Unable to change password."
            );
          }

          return;
        }


        // Backend invalidates the API token after a
        // successful password change. Remove the stale
        // frontend session immediately as well.
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        setPasswordForm({
          current_password: "",
          new_password: "",
          confirm_password: "",
        });

        setPasswordSuccess(
          "Password changed successfully. Redirecting to sign in..."
        );

        // Keep the success message visible briefly, then
        // require a fresh login with the new password.
        window.setTimeout(() => {
          navigate(
            "/login",
            { replace: true }
          );
        }, 900);

      } catch (error) {
        console.error(
          "Password change error:",
          error
        );

        setPasswordError(
          "Unable to connect to the server."
        );

      } finally {
        setPasswordSaving(false);
      }
    };


  // =========================================
  // INITIALS
  // =========================================

  const initials = (
    profile.first_name?.charAt(0)
    || profile.username?.charAt(0)
    || "U"
  ).toUpperCase();


  // =========================================
  // RENDER
  // =========================================

  return (
    <div className="my-account-page">

      <div className="my-account-container">

        {/* BACK */}

        <button
          type="button"
          className="my-account-back"
          onClick={() =>
            navigate("/dashboard")
          }
        >
          <ArrowLeft size={17} />
          Dashboard
        </button>


        {/* HEADER */}

        <div className="my-account-heading">

          <div>

            <h1>
              My Account<PageGuide title="My Account" text="Manage your own account information, profile settings, and available account preferences." />
            </h1>

            <p>
              Manage your personal information
              and account security.
            </p>

          </div>

        </div>


        {profileLoading ? (

          <div className="my-account-loading">
            Loading account...
          </div>

        ) : (

          <div className="my-account-grid">

            {/* =================================
                PROFILE SUMMARY
            ================================= */}

            <aside className="account-summary-card">

              <div className="account-avatar">
                {initials}
              </div>


              <h2>
                {profile.first_name
                  ? `${profile.first_name} ${profile.last_name}`.trim()
                  : profile.username}
              </h2>


              <span className="account-username">
                @{profile.username}
              </span>


              <div className="account-role">

                <ShieldCheck size={16} />

                {profile.role}

              </div>


              <div className="account-summary-divider" />


              <div className="account-status-row">

                <span>
                  Account Status
                </span>

                <strong
                  className={
                    profile.is_active
                      ? "active"
                      : "inactive"
                  }
                >
                  {profile.is_active
                    ? "Active"
                    : "Inactive"}
                </strong>

              </div>

            </aside>


            {/* =================================
                RIGHT SIDE
            ================================= */}

            <div className="account-content">

              {/* PROFILE */}

              <section className="account-card">

                <div className="account-card-header">

                  <div className="account-card-icon">
                    <UserRound size={20} />
                  </div>

                  <div>

                    <h2>
                      Personal Information
                    </h2>

                    <p>
                      Update your account profile.
                    </p>

                  </div>

                </div>


                {profileError && (

                  <div className="account-message error">
                    {profileError}
                  </div>

                )}


                {profileSuccess && (

                  <div className="account-message success">

                    <CheckCircle2 size={16} />

                    {profileSuccess}

                  </div>

                )}


                <form
                  onSubmit={
                    handleProfileSave
                  }
                >

                  <div className="account-form-grid">

                    <div className="account-field">

                      <label>
                        Username
                      </label>

                      <input
                        type="text"
                        value={
                          profile.username
                        }
                        disabled
                      />

                      <small>
                        Username cannot be changed.
                      </small>

                    </div>


                    <div className="account-field">

                      <label>
                        Role
                      </label>

                      <input
                        type="text"
                        value={
                          profile.role
                        }
                        disabled
                      />

                    </div>


                    <div className="account-field">

                      <label>
                        First Name
                      </label>

                      <input
                        type="text"
                        name="first_name"
                        value={
                          profile.first_name
                        }
                        onChange={
                          handleProfileChange
                        }
                        placeholder="First name"
                      />

                    </div>


                    <div className="account-field">

                      <label>
                        Last Name
                      </label>

                      <input
                        type="text"
                        name="last_name"
                        value={
                          profile.last_name
                        }
                        onChange={
                          handleProfileChange
                        }
                        placeholder="Last name"
                      />

                    </div>


                    <div className="account-field full">

                      <label>
                        Email Address
                      </label>

                      <input
                        type="email"
                        name="email"
                        value={
                          profile.email
                        }
                        onChange={
                          handleProfileChange
                        }
                        placeholder="Email address"
                      />

                    </div>

                  </div>


                  <div className="account-actions">

                    <button
                      type="submit"
                      className="account-primary-btn"
                      disabled={
                        profileSaving
                      }
                    >

                      <Save size={17} />

                      {profileSaving
                        ? "Saving..."
                        : "Save Changes"}

                    </button>

                  </div>

                </form>

              </section>


              {/* PASSWORD */}

              <section className="account-card">

                <div className="account-card-header">

                  <div className="account-card-icon">
                    <KeyRound size={20} />
                  </div>

                  <div>

                    <h2>
                      Change Password
                    </h2>

                    <p>
                      Use a strong password to protect
                      your account.
                    </p>

                  </div>

                </div>


                {passwordError && (

                  <div className="account-message error">
                    {passwordError}
                  </div>

                )}


                {passwordSuccess && (

                  <div className="account-message success">

                    <CheckCircle2 size={16} />

                    {passwordSuccess}

                  </div>

                )}


                <form
                  onSubmit={
                    handlePasswordSave
                  }
                >

                  <div className="account-password-fields">

                    <div className="account-field">

                      <label>
                        Current Password
                      </label>

                      <div className="account-password-input">

                        <input
                          type={
                            showCurrentPassword
                              ? "text"
                              : "password"
                          }
                          name="current_password"
                          value={
                            passwordForm.current_password
                          }
                          onChange={
                            handlePasswordChange
                          }
                          required
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowCurrentPassword(
                              !showCurrentPassword
                            )
                          }
                        >
                          {showCurrentPassword
                            ? <EyeOff size={17} />
                            : <Eye size={17} />}
                        </button>

                      </div>

                    </div>


                    <div className="account-field">

                      <label>
                        New Password
                      </label>

                      <div className="account-password-input">

                        <input
                          type={
                            showNewPassword
                              ? "text"
                              : "password"
                          }
                          name="new_password"
                          value={
                            passwordForm.new_password
                          }
                          onChange={
                            handlePasswordChange
                          }
                          minLength="8"
                          required
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowNewPassword(
                              !showNewPassword
                            )
                          }
                        >
                          {showNewPassword
                            ? <EyeOff size={17} />
                            : <Eye size={17} />}
                        </button>

                      </div>

                    </div>


                    <div className="account-field">

                      <label>
                        Confirm New Password
                      </label>

                      <div className="account-password-input">

                        <input
                          type={
                            showConfirmPassword
                              ? "text"
                              : "password"
                          }
                          name="confirm_password"
                          value={
                            passwordForm.confirm_password
                          }
                          onChange={
                            handlePasswordChange
                          }
                          minLength="8"
                          required
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(
                              !showConfirmPassword
                            )
                          }
                        >
                          {showConfirmPassword
                            ? <EyeOff size={17} />
                            : <Eye size={17} />}
                        </button>

                      </div>

                    </div>

                  </div>


                  <div className="account-actions">

                    <button
                      type="submit"
                      className="account-primary-btn"
                      disabled={
                        passwordSaving
                      }
                    >

                      <KeyRound size={17} />

                      {passwordSaving
                        ? "Updating..."
                        : "Change Password"}

                    </button>

                  </div>

                </form>

              </section>

            </div>

          </div>

        )}

      </div>

    </div>
  );
}


export default MyAccount;