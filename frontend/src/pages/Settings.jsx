import PageGuide from "../components/PageGuide";
﻿import { apiUrl } from "../config/api";
import {
  useEffect,
  useState,
} from "react";

import {
  ArrowLeft,
  Bell,
  Building2,
  CheckCircle2,
  Clock3,
  Save,
  Settings as SettingsIcon,
  ShieldCheck,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import "./Settings.css";


const SETTINGS_API =
  apiUrl("/api/settings/");


function Settings() {
  const navigate = useNavigate();

  const token =
    localStorage.getItem("token");


  const [settings, setSettings] =
    useState({
      system_name:
        "DEV Service Management",

      company_name:
        "DEV",

      support_email:
        "",

      contact_number:
        "",

      ticket_due_soon_days:
        3,

      warranty_expiry_warning_days:
        30,

      license_expiry_warning_days:
        30,

      timezone:
        "Asia/Manila",

      date_format:
        "MM/DD/YYYY",

      session_timeout_minutes:
        60,

      require_strong_password:
        true,

      updated_at:
        "",
    });


  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");


  // =========================================
  // LOGOUT
  // =========================================

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };


  // =========================================
  // LOAD SETTINGS
  // =========================================

  useEffect(() => {
    const loadSettings =
      async () => {

        if (!token) {
          logout();
          return;
        }


        try {
          setLoading(true);
          setError("");

          const response =
            await fetch(
              SETTINGS_API,
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


          if (response.status === 403) {
            navigate(
              "/access-denied"
            );

            return;
          }


          if (!response.ok) {
            throw new Error(
              "Unable to load system settings."
            );
          }


          const data =
            await response.json();


          setSettings(
            (previous) => ({
              ...previous,
              ...data,
            })
          );

        } catch (error) {
          console.error(
            "Settings loading error:",
            error
          );

          setError(
            "Unable to load system settings."
          );

        } finally {
          setLoading(false);
        }
      };


    loadSettings();

  }, [token]);


  // =========================================
  // FORM CHANGE
  // =========================================

  const handleChange =
    (event) => {

      const {
        name,
        value,
        type,
        checked,
      } = event.target;


      setSettings(
        (previous) => ({
          ...previous,

          [name]:
            type === "checkbox"
              ? checked
              : value,
        })
      );


      setSuccess("");
    };


  // =========================================
  // ERROR HELPER
  // =========================================

  const getApiError =
    (data) => {

      if (!data) {
        return (
          "Unable to save system settings."
        );
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


      return (
        "Unable to save system settings."
      );
    };


  // =========================================
  // SAVE SETTINGS
  // =========================================

  const handleSubmit =
    async (event) => {

      event.preventDefault();


      if (!token) {
        logout();
        return;
      }


      try {
        setSaving(true);
        setError("");
        setSuccess("");


        const payload = {
          system_name:
            settings.system_name.trim(),

          company_name:
            settings.company_name.trim(),

          support_email:
            settings.support_email.trim(),

          contact_number:
            settings.contact_number.trim(),

          timezone:
            settings.timezone,

          date_format:
            settings.date_format,

          require_strong_password:
            Boolean(
              settings
                .require_strong_password
            ),
        };


        const optionalNumberFields = [
          "ticket_due_soon_days",
          "warranty_expiry_warning_days",
          "license_expiry_warning_days",
          "session_timeout_minutes",
        ];


        optionalNumberFields.forEach(
          (field) => {
            const rawValue =
              settings[field];

            if (
              rawValue !== ""
              && rawValue !== null
              && rawValue !== undefined
            ) {
              payload[field] =
                Number(rawValue);
            }
          }
        );


        const response =
          await fetch(
            SETTINGS_API,
            {
              method: "PATCH",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Token ${token}`,
              },

              body:
                JSON.stringify(
                  payload
                ),
            }
          );


        if (response.status === 401) {
          logout();
          return;
        }


        if (response.status === 403) {
          navigate(
            "/access-denied"
          );

          return;
        }


        const data =
          await response.json();


        if (!response.ok) {
          setError(
            getApiError(data)
          );

          return;
        }


        if (data.settings) {
          setSettings(
            (previous) => ({
              ...previous,
              ...data.settings,
            })
          );
        }


        setSuccess(
          "System settings updated successfully."
        );

      } catch (error) {
        console.error(
          "Settings save error:",
          error
        );

        setError(
          "Unable to connect to the server."
        );

      } finally {
        setSaving(false);
      }
    };


  // =========================================
  // FORMAT UPDATED DATE
  // =========================================

  const formatUpdatedAt = () => {
    if (!settings.updated_at) {
      return "Not available";
    }


    const date =
      new Date(
        settings.updated_at
      );


    return date.toLocaleString();
  };


  // =========================================
  // RENDER
  // =========================================

  return (
    <div className="settings-page">

      <div className="settings-container">

        {/* BACK */}

        <button
          type="button"
          className="settings-back"
          onClick={() =>
            navigate("/dashboard")
          }
        >
          <ArrowLeft size={17} />

          Dashboard
        </button>


        {/* PAGE HEADER */}

        <div className="settings-heading">

          <div className="settings-heading-icon">
            <SettingsIcon size={25} />
          </div>


          <div>

            <h1>
              System Settings<PageGuide title="System Settings" text="Configure application-wide settings and system behavior." />
            </h1>

            <p>
              Configure general system,
              notification and security
              preferences.
            </p>

          </div>

        </div>


        {loading ? (

          <div className="settings-loading">
            Loading system settings...
          </div>

        ) : (

          <form
            onSubmit={handleSubmit}
          >

            {/* MESSAGES */}

            {error && (

              <div className="settings-message error">
                {error}
              </div>

            )}


            {success && (

              <div className="settings-message success">

                <CheckCircle2
                  size={17}
                />

                {success}

              </div>

            )}


            {/* =================================
                GENERAL SETTINGS
            ================================= */}

            <section className="settings-card">

              <div className="settings-card-header">

                <div className="settings-card-icon">
                  <Building2 size={20} />
                </div>


                <div>

                  <h2>
                    General Settings
                  </h2>

                  <p>
                    Basic information used
                    throughout the system.
                  </p>

                </div>

              </div>


              <div className="settings-form-grid">

                <div className="settings-field">

                  <label>
                    System Name
                  </label>

                  <input
                    type="text"
                    name="system_name"
                    value={
                      settings.system_name
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>


                <div className="settings-field">

                  <label>
                    Company Name
                  </label>

                  <input
                    type="text"
                    name="company_name"
                    value={
                      settings.company_name
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>


                <div className="settings-field">

                  <label>
                    Support Email
                  </label>

                  <input
                    type="email"
                    name="support_email"
                    value={
                      settings.support_email
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="support@company.com"
                  />

                </div>


                <div className="settings-field">

                  <label>
                    Contact Number
                  </label>

                  <input
                    type="text"
                    name="contact_number"
                    value={
                      settings.contact_number
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="+63..."
                  />

                </div>

              </div>

            </section>


            {/* =================================
                NOTIFICATION SETTINGS
            ================================= */}

            <section className="settings-card">

              <div className="settings-card-header">

                <div className="settings-card-icon">
                  <Bell size={20} />
                </div>


                <div>

                  <h2>
                    Notification Settings
                  </h2>

                  <p>
                    Configure advance warning
                    periods for deadlines.
                  </p>

                </div>

              </div>


              <div className="settings-form-grid three">

                <div className="settings-field">

                  <label>
                    Ticket Due Soon
                  </label>

                  <div className="settings-number-input">

                    <input
                      type="number"
                      name="ticket_due_soon_days"
                      min="0"
                      max="30"
                      value={
                        settings
                          .ticket_due_soon_days
                      }
                      onChange={
                        handleChange
                      }
                    />

                    <span>
                      days
                    </span>

                  </div>


                  <small>
                    Notify before ticket
                    deadline.
                  </small>

                </div>


                <div className="settings-field">

                  <label>
                    Warranty Warning
                  </label>

                  <div className="settings-number-input">

                    <input
                      type="number"
                      name="warranty_expiry_warning_days"
                      min="0"
                      max="365"
                      value={
                        settings
                          .warranty_expiry_warning_days
                      }
                      onChange={
                        handleChange
                      }
                    />

                    <span>
                      days
                    </span>

                  </div>


                  <small>
                    Notify before warranty
                    expires.
                  </small>

                </div>


                <div className="settings-field">

                  <label>
                    License Warning
                  </label>

                  <div className="settings-number-input">

                    <input
                      type="number"
                      name="license_expiry_warning_days"
                      min="0"
                      max="365"
                      value={
                        settings
                          .license_expiry_warning_days
                      }
                      onChange={
                        handleChange
                      }
                    />

                    <span>
                      days
                    </span>

                  </div>


                  <small>
                    Notify before license
                    expires.
                  </small>

                </div>

              </div>

            </section>


            {/* =================================
                SYSTEM PREFERENCES
            ================================= */}

            <section className="settings-card">

              <div className="settings-card-header">

                <div className="settings-card-icon">
                  <Clock3 size={20} />
                </div>


                <div>

                  <h2>
                    System Preferences
                  </h2>

                  <p>
                    Configure regional and
                    display preferences.
                  </p>

                </div>

              </div>


              <div className="settings-form-grid">

                <div className="settings-field">

                  <label>
                    Timezone
                  </label>

                  <select
                    name="timezone"
                    value={
                      settings.timezone
                    }
                    onChange={
                      handleChange
                    }
                  >

                    <option value="Asia/Manila">
                      Asia/Manila
                    </option>

                    <option value="UTC">
                      UTC
                    </option>

                    <option value="America/New_York">
                      America/New_York
                    </option>

                    <option value="America/Chicago">
                      America/Chicago
                    </option>

                    <option value="America/Denver">
                      America/Denver
                    </option>

                    <option value="America/Los_Angeles">
                      America/Los_Angeles
                    </option>

                  </select>

                </div>


                <div className="settings-field">

                  <label>
                    Date Format
                  </label>

                  <select
                    name="date_format"
                    value={
                      settings.date_format
                    }
                    onChange={
                      handleChange
                    }
                  >

                    <option value="MM/DD/YYYY">
                      MM/DD/YYYY
                    </option>

                    <option value="DD/MM/YYYY">
                      DD/MM/YYYY
                    </option>

                    <option value="YYYY-MM-DD">
                      YYYY-MM-DD
                    </option>

                  </select>

                </div>

              </div>

            </section>


            {/* =================================
                SECURITY SETTINGS
            ================================= */}

            <section className="settings-card">

              <div className="settings-card-header">

                <div className="settings-card-icon">
                  <ShieldCheck size={20} />
                </div>


                <div>

                  <h2>
                    Security Settings
                  </h2>

                  <p>
                    Configure account security
                    preferences.
                  </p>

                </div>

              </div>


              <div className="settings-form-grid">

                <div className="settings-field">

                  <label>
                    Session Timeout
                  </label>


                  <div className="settings-number-input">

                    <input
                      type="number"
                      name="session_timeout_minutes"
                      min="5"
                      max="1440"
                      value={
                        settings
                          .session_timeout_minutes
                      }
                      onChange={
                        handleChange
                      }
                    />

                    <span>
                      minutes
                    </span>

                  </div>


                  <small>
                    Allowed range:
                    5 to 1440 minutes.
                  </small>

                </div>


                <div className="settings-toggle-field">

                  <div>

                    <strong>
                      Require Strong Password
                    </strong>

                    <p>
                      Require stronger password
                      rules for user accounts.
                    </p>

                  </div>


                  <label className="settings-switch">

                    <input
                      type="checkbox"
                      name="require_strong_password"
                      checked={
                        settings
                          .require_strong_password
                      }
                      onChange={
                        handleChange
                      }
                    />

                    <span className="settings-slider" />

                  </label>

                </div>

              </div>

            </section>


            {/* =================================
                FOOTER
            ================================= */}

            <div className="settings-footer">

              <div>

                <span>
                  Last updated
                </span>

                <strong>
                  {formatUpdatedAt()}
                </strong>

              </div>


              <button
                type="submit"
                className="settings-save-button"
                disabled={saving}
              >

                <Save size={17} />

                {saving
                  ? "Saving..."
                  : "Save Settings"}

              </button>

            </div>

          </form>

        )}

      </div>

    </div>
  );
}


export default Settings;