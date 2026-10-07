import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ShieldX,
} from "lucide-react";

function AccessDenied() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "30px",
        background: "#f5f7fa",
        fontFamily:
          "Arial, Helvetica, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          padding: "45px",
          textAlign: "center",
          border: "1px solid #e0e6eb",
          borderRadius: "12px",
          background: "#ffffff",
          boxShadow:
            "0 12px 35px rgba(0, 0, 0, 0.08)",
        }}
      >
        <div
          style={{
            width: "75px",
            height: "75px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            background: "#fff0f0",
          }}
        >
          <ShieldX
            size={40}
            color="#c14343"
          />
        </div>

        <h1
          style={{
            margin: "22px 0 10px",
            color: "#173049",
            fontSize: "30px",
          }}
        >
          Access Denied
        </h1>

        <p
          style={{
            margin: "0 0 25px",
            color: "#7c8995",
            fontSize: "14px",
            lineHeight: "1.7",
          }}
        >
          Your account does not have
          permission to access this
          section.
        </p>

        <button
          type="button"
          onClick={() =>
            navigate("/dashboard")
          }
          style={{
            padding: "12px 18px",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            border: "none",
            borderRadius: "7px",
            background: "#8b5cf6",
            color: "#ffffff",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          <ArrowLeft size={17} />
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}

export default AccessDenied;