"use client";

import {
  createContext,
  useContext,
  useState,
  type ComponentProps,
  type FormEvent,
} from "react";
import { useTranslations } from "next-intl";
import { fieldError } from "./styles";

/**
 * Validación de los formularios del embudo, con la cara del sitio.
 *
 * Hasta el 17/11/2026 cada `<input required>` dejaba la validación al
 * navegador, que muestra su burbuja en **el idioma del navegador** (francés en
 * un Chrome en francés, aunque la persona navegue en `/en`) y con otro estilo.
 * Ahora el `<form>` lleva `noValidate`: el navegador no pinta nada, y al enviar
 * recorremos los campos con la misma Constraint Validation API (`required`,
 * `type=email`, `minLength`, `pattern`) para armar **un** mensaje por campo en
 * el idioma activo, bajo el propio campo.
 *
 * Los textos viven en el namespace `Forms` de `messages/*.json`.
 *
 * Uso: `<ValidatedForm action={formAction}>` en vez de `<form>` y un
 * `<FieldError name="campo" />` bajo cada campo. Los controles de
 * `fields.tsx` ya lo traen.
 */

type Errors = Record<string, string>;
const ErrorsContext = createContext<Errors>({});

type Translate = ReturnType<typeof useTranslations>;
type FieldEl = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

/** El mensaje de un campo inválido, según qué restricción incumple. */
function messageFor(el: FieldEl, t: Translate): string {
  const v = el.validity;
  const type = el instanceof HTMLInputElement ? el.type : "";
  if (v.valueMissing) {
    if (type === "radio") return t("chooseOption");
    if (type === "checkbox") return t("accept");
    if (type === "file") return t("chooseFile");
    return t("required");
  }
  if (v.typeMismatch && type === "email") return t("invalidEmail");
  if (v.tooShort && !(el instanceof HTMLSelectElement)) {
    return t("tooShort", { min: el.minLength });
  }
  if (v.patternMismatch) return t("invalidNumber");
  return t("invalid");
}

export function ValidatedForm(props: ComponentProps<"form">) {
  const t = useTranslations("Forms");
  const [errors, setErrors] = useState<Errors>({});
  const { onSubmit, onInput, onChange, ...rest } = props;

  function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    onSubmit?.(e);
    if (e.defaultPrevented) return;

    const found: Errors = {};
    let first: FieldEl | null = null;

    for (const el of Array.from(e.currentTarget.elements) as FieldEl[]) {
      if (!el.name || !el.willValidate || el.checkValidity()) {
        el.removeAttribute("aria-invalid");
        continue;
      }
      el.setAttribute("aria-invalid", "true");
      // Un grupo de radios comparte nombre: se avisa una sola vez.
      if (found[el.name]) continue;
      found[el.name] = messageFor(el, t);
      first ??= el;
    }

    setErrors(found);
    if (first) {
      // Con el envío cancelado React no llega a correr el `action`.
      e.preventDefault();
      first.focus();
    }
  }

  /** Apenas la persona corrige un campo, se le va su aviso. */
  function clearFor(e: FormEvent<HTMLFormElement>) {
    const el = e.target as FieldEl;
    if (el?.name && errors[el.name]) {
      el.removeAttribute("aria-invalid");
      setErrors((prev) => {
        const next = { ...prev };
        delete next[el.name];
        return next;
      });
    }
  }

  return (
    <ErrorsContext.Provider value={errors}>
      <form
        {...rest}
        noValidate
        onSubmit={handleSubmit}
        onInput={(e) => {
          clearFor(e);
          onInput?.(e);
        }}
        onChange={(e) => {
          clearFor(e);
          onChange?.(e);
        }}
      />
    </ErrorsContext.Provider>
  );
}

/** El aviso de un campo. No pinta nada mientras el campo esté bien. */
export function FieldError({ name }: { name: string }) {
  const message = useContext(ErrorsContext)[name];
  if (!message) return null;
  return (
    <p className={fieldError} role="alert">
      {message}
    </p>
  );
}

/** El asterisco de «obligatorio», para el final de una etiqueta. */
export function RequiredMark() {
  return (
    <span aria-hidden="true" className="ml-0.5 text-primary-container">
      *
    </span>
  );
}

/** La leyenda que explica el asterisco, al comienzo del formulario. */
export function RequiredLegend({ className = "" }: { className?: string }) {
  const t = useTranslations("Forms");
  return (
    <p className={`text-xs text-white/60 ${className}`}>
      <span aria-hidden="true" className="text-primary-container">
        *
      </span>{" "}
      {t("legend")}
    </p>
  );
}
