import { notFound } from "next/navigation";

/** Cualquier ruta desconocida cae aca (el proxy la reescribe a `/es/...`). */
export default function CatchAll() {
  notFound();
}
