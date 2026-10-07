import { useEffect, useRef, useState } from "react";
import "./PageGuide.css";

export default function PageGuide({ title, text }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onPointerDown = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <span className="page-guide" ref={ref}>
      <button
        type="button"
        className="page-guide-button"
        aria-label={`What does ${title} do?`}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        ?
      </button>
      {open && (
        <div className="page-guide-popover" role="dialog" aria-label={`${title} user guide`}>
          <strong>{title}</strong>
          <p>{text}</p>
        </div>
      )}
    </span>
  );
}