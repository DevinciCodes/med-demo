// src/components/MedAutoComplete.jsx
import { useEffect, useMemo, useRef, useState } from "react";

function filterMedicationNames(query, allNames, limit = 10) {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return (allNames || [])
        .filter((name) => name.toLowerCase().includes(q))
        .slice(0, limit);
}

export default function MedAutocomplete({
    value,
    onChange,
    options = [],              // array of strings
    placeholder = "Medication name",
    inputStyle,
    disabled = false,
    maxResults = 10,
    ...rest
}) {
    const [query, setQuery] = useState(value || "");
    const [open, setOpen] = useState(false);
    const [highlightIndex, setHighlightIndex] = useState(0);
    const containerRef = useRef(null);

    // debug: see when options arrive
    useEffect(() => {
        console.log("[MedAutocomplete] options length =", options.length);
    }, [options]);

    // keep in sync with parent state
    useEffect(() => {
        setQuery(value || "");
    }, [value]);

    const filtered = useMemo(
        () => filterMedicationNames(query, options, maxResults),
        [query, options, maxResults]
    );

    const handleInputChange = (e) => {
        const next = e.target.value;
        setQuery(next);
        if (onChange) onChange(next);
        setOpen(true);
        setHighlightIndex(0);
    };

    const handleSelect = (name) => {
        setQuery(name);
        if (onChange) onChange(name);
        setOpen(false);
    };

    const handleKeyDown = (e) => {
        if (!open || !filtered.length) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlightIndex((i) => (i + 1) % filtered.length);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlightIndex((i) => (i - 1 + filtered.length) % filtered.length);
        } else if (e.key === "Enter") {
            e.preventDefault();
            handleSelect(filtered[highlightIndex]);
        } else if (e.key === "Escape") {
            setOpen(false);
        }
    };

    // close when clicking outside
    useEffect(() => {
        const handleClick = (e) => {
            if (!containerRef.current) return;
            if (!containerRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    return (
        <div ref={containerRef} style={{ position: "relative" }}>
            <input
                className="input"          // styled in your CSS
                style={inputStyle}
                type="text"
                placeholder={placeholder}
                value={query}
                onChange={handleInputChange}
                onFocus={() => query && filtered.length && setOpen(true)}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                autoComplete="off"
                {...rest}
            />

            {open && filtered.length > 0 && (
                <div
                    style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        marginTop: 4,
                        background: "#ffffff",
                        border: "1px solid #e5e7eb",
                        borderRadius: 8,
                        maxHeight: 200,
                        overflowY: "auto",
                        zIndex: 9999,
                        boxShadow: "0 4px 10px rgba(15,23,42,0.15)",
                    }}
                >
                    {filtered.map((name, idx) => (
                        <div
                            key={name}
                            onMouseDown={(e) => {
                                e.preventDefault(); // prevent input blur
                                handleSelect(name);
                            }}
                            style={{
                                padding: "6px 10px",
                                cursor: "pointer",
                                fontSize: 14,
                                backgroundColor:
                                    idx === highlightIndex ? "#e5edff" : "#ffffff",
                            }}
                        >
                            {name}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
