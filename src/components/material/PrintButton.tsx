"use client";

import { Printer } from "lucide-react";

/** "Guardar como PDF": el diálogo de impresión del navegador, con la hoja A4. */
export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="material-noprint inline-flex items-center gap-2 rounded-full border border-[#05125a]/30 bg-white px-4 py-2 text-sm text-[#05125a] shadow-sm transition-colors hover:border-[#05125a]"
    >
      <Printer size={15} />
      Guardar como PDF
    </button>
  );
}
