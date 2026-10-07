import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import "./SuccessToast.css";

export const showSuccessToast = (title, message = "") => {
  window.dispatchEvent(new CustomEvent("et-success-toast", { detail: { title, message } }));
};

export default function SuccessToast() {
  const [toast, setToast] = useState(null);
  useEffect(() => {
    let timer;
    const onToast = (event) => {
      clearTimeout(timer);
      setToast({ ...event.detail, key: Date.now() });
      timer = setTimeout(() => setToast(null), 3200);
    };
    window.addEventListener("et-success-toast", onToast);
    return () => { clearTimeout(timer); window.removeEventListener("et-success-toast", onToast); };
  }, []);
  if (!toast) return null;
  return (
    <div className="et-toast-wrap" role="status" aria-live="polite">
      <div className="et-success-toast" key={toast.key}>
        <div className="et-toast-icon"><Check size={18} strokeWidth={3} /></div>
        <div className="et-toast-copy">
          <strong>{toast.title}</strong>
          {toast.message && <span>{toast.message}</span>}
        </div>
        <button className="et-toast-close" type="button" onClick={() => setToast(null)} aria-label="Close notification"><X size={17} /></button>
        <div className="et-toast-progress" />
      </div>
    </div>
  );
}
