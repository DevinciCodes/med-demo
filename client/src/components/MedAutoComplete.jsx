import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * Simple, boring, reliable autocomplete:
 * - options: array of strings (med names)
 * - value: controlled string from parent
 * - onChange: (newValue: string) => void
 * - inputStyle: inline style object
 * - placeholder: string
 *
 * Filters by "starts with" the typed text (case-insensitive).
 */
export default function MedAutocomplete({
  options = [],
  value = "",
  onChange,
  inputStyle,
  placeholder = "Medication name",
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(value || "");
  const containerRef = useRef(null);

  // Keep local text synced with parent value
  useEffect(() => {
    setText(value || "");
  }, [value]);

  // Filter options by prefix
  const filtered = useMemo(() => {
    const term = (text || "").trim().toLowerCase();
    if (!term) {
      // If nothing typed, show nothing (or you could show top N)
      return [];
    }
    return options
      .filter((opt) =>
        (opt || "").toLowerCase().startsWith(term)
      )
      .slice(0, 30); // avoid huge lists
  }, [options, text]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setText(val);
    setOpen(true);
    if (onChange) {
      onChange(val);
    }
  };

  const handleOptionClick = (opt) => {
    setText(opt);
    setOpen(false);
    if (onChange) {
      onChange(opt);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", width: "100%" }}
    >
      <input
        style={inputStyle}
        value={text}
        placeholder={placeholder}
        onChange={handleInputChange}
        onFocus={() => setOpen(true)}
      />
      {open && filtered.length > 0 && (
        <ul
          style={{
            position: "absolute",
            zIndex: 20,
            top: "100%",
            left: 0,
            right: 0,
            maxHeight: 200,
            overflowY: "auto",
            marginTop: 4,
            padding: 0,
            listStyle: "none",
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: 8,
            boxShadow: "0 10px 25px rgba(15, 23, 42, 0.12)",
          }}
        >
          {filtered.map((opt) => (
            <li
              key={opt}
              onClick={() => handleOptionClick(opt)}
              style={{
                padding: "8px 10px",
                fontSize: 14,
                cursor: "pointer",
                borderBottom: "1px solid #e2e8f0",
              }}
              onMouseDown={(e) => e.preventDefault()} // prevent input blur before click
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
