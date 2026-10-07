import { useNavigate } from "react-router-dom";
import {
  ClipboardCheck,
  Wrench,
  Users,
  MapPin,
  Monitor,
  ShieldCheck,
} from "lucide-react";

import expertLogo from "../assets/expert-technology-logo.png";
import "./Home.css";


function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-page">

      {/* =====================================
          NAVBAR
      ====================================== */}

      <header className="home-navbar">

        <button
          type="button"
          className="home-brand"
          onClick={() => navigate("/")}
        >
          <img
            src={expertLogo}
            alt="DEV"
          />

          <div>
            <strong>
              DEV
            </strong>

            <span>
              Service Management <em className="dev-badge">DEV</em>
            </span>
          </div>
        </button>


        <div className="home-nav-actions">

          {/* <button
            type="button"
            className="home-login-btn"
            onClick={() =>
              navigate("/login")
            }
          >
            Log in
          </button> */}

          {/* <button
            type="button"
            className="home-register-btn"
            onClick={() =>
              navigate("/register")
            }
          >
            Register
          </button> */}

        </div>

      </header>


      {/* =====================================
          HERO
      ====================================== */}

      <main className="home-hero">

        {/* LEFT */}

        <section className="home-hero-content">

          <div className="home-eyebrow">
            DEV Service Management System
          </div>


          <h1>
            Smarter
            <span>
              Service Management
            </span>
          </h1>


          <p className="home-description">
            Manage customers, locations,
            equipment, warranties, licenses,
            service tickets, technicians,
            billing, and reports in one
            centralized system.
          </p>


          <div className="home-hero-actions">

            <button
              type="button"
              className="home-primary-btn"
              onClick={() =>
                navigate("/login")
              }
            >
              Sign in to continue
            </button>


            {/* <button
              type="button"
              className="home-secondary-btn"
              onClick={() =>
                navigate("/register")
              }
            >
              Create an account
            </button> */}

          </div>


          {/* QUICK FEATURES */}

          <div className="home-feature-row">

            <div>
              <Users size={17} />
              <span>
                Customers
              </span>
            </div>

            <div>
              <Monitor size={17} />
              <span>
                Equipment
              </span>
            </div>

            <div>
              <Wrench size={17} />
              <span>
                Service Tickets
              </span>
            </div>

          </div>

        </section>


        {/* RIGHT ILLUSTRATION */}

        <section className="home-visual">

          <div className="visual-card">

            <div className="visual-grid" />


            <div className="visual-circle visual-circle-one" />

            <div className="visual-circle visual-circle-two" />


            <div className="visual-main-icon">

              <ClipboardCheck
                size={82}
                strokeWidth={1.7}
              />

              <div className="visual-check">

                <ShieldCheck
                  size={39}
                  strokeWidth={2.4}
                />

              </div>

            </div>


            <div className="visual-floating-card customer-card">

              <Users size={19} />

              <div>
                <strong>
                  Customers
                </strong>

                <span>
                  Manage records
                </span>
              </div>

            </div>


            <div className="visual-floating-card location-card">

              <MapPin size={19} />

              <div>
                <strong>
                  Locations
                </strong>

                <span>
                  Track sites
                </span>
              </div>

            </div>


            <div className="visual-floating-card ticket-card">

              <Wrench size={19} />

              <div>
                <strong>
                  Tickets
                </strong>

                <span>
                  Service workflow
                </span>
              </div>

            </div>

          </div>

        </section>

      </main>


      {/* FOOTER */}

      <footer className="home-footer">

        <span>
          DEV
        </span>

        <span>
          Service Management System
        </span>

      </footer>

    </div>
  );
}


export default Home;