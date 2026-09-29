"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Send } from "lucide-react";
import { subscribeNewsletter, type NewsletterState } from "./newsletter-actions";

/**
 * Alta al newsletter desde el footer. Es el unico formulario del sitio que
 * escribe sin sesion, asi que la validacion vive en tres lados: el `type=email`
 * del input, el regex del server action y el CHECK de la tabla.
 */
export function NewsletterForm() {
  const t = useTranslations("Newsletter");
  const [state, formAction, pending] = useActionState<NewsletterState, FormData>(
    subscribeNewsletter,
    null
  );

  return (
    <form action={formAction} className="space-y-2">
      <div className="flex items-center gap-2 rounded-lg border border-primary-fixed-dim/25 bg-white/[0.03] px-4 py-2.5 focus-within:border-primary-fixed-dim/50 transition-colors">
        <input
          type="email"
          name="email"
          required
          maxLength={320}
          disabled={pending || state?.ok}
          placeholder={t("placeholder")}
          aria-label={t("placeholder")}
          className="w-full bg-transparent text-body-md text-on-surface placeholder:text-on-surface-variant/60 outline-none disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={pending || state?.ok}
          aria-label={t("submit")}
          className="shrink-0 text-primary-fixed-dim transition-opacity hover:opacity-70 disabled:opacity-40"
        >
          <Send size={16} />
        </button>
      </div>

      {state && (
        <p
          role="status"
          className={`text-label-sm ${
            state.ok ? "text-primary-fixed-dim" : "text-error"
          }`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
