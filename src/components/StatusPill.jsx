import React from "react";
import { Check, X } from "lucide-react";

export default function StatusPill({ value }) {
  const isYes = value === "હા" || value === true || value === "Yes";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
        isYes ? "bg-primary-light text-primary-dark" : "bg-coral-light text-coral"
      }`}
    >
      {isYes ? <Check size={12} strokeWidth={3} /> : <X size={12} strokeWidth={3} />}
      {isYes ? "હા" : "ના"}
    </span>
  );
}
