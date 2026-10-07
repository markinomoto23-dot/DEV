import {
  ArrowLeft,
  Home,
  SearchX,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import "./NotFound.css";


function NotFound() {
  const navigate =
    useNavigate();

  const token =
    localStorage.getItem(
      "token"
    );

  const goHome = () => {
    navigate(
      token
        ? "/dashboard"
        : "/"
    );
  };


  return (
    <div className="not-found-page">

      <div className="not-found-card">

        <div className="not-found-icon">
          <SearchX size={42} />
        </div>

        <div className="not-found-code">
          404
        </div>

        <h1>
          Page Not Found
        </h1>

        <p>
          The page you're looking for
          doesn't exist, may have been
          moved, or the address may be
          incorrect.
        </p>

        <div className="not-found-actions">

          <button
            type="button"
            className="not-found-back"
            onClick={() =>
              navigate(-1)
            }
          >
            <ArrowLeft size={17} />

            Go Back
          </button>

          <button
            type="button"
            className="not-found-home"
            onClick={goHome}
          >
            <Home size={17} />

            {token
              ? "Dashboard"
              : "Home"}
          </button>

        </div>

      </div>

    </div>
  );
}


export default NotFound;