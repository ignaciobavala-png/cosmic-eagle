"use client";

import { useActionState, useRef } from "react";
import { Camera } from "lucide-react";
import { updateAvatar, type AvatarState } from "./actions";

const initialState: AvatarState = { error: null };

export function AvatarUpload({
  avatarUrl,
  fallbackLabel,
}: {
  avatarUrl: string | null;
  fallbackLabel: string;
}) {
  const [state, formAction, pending] = useActionState(updateAvatar, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col items-center gap-2">
      <label
        htmlFor="avatar"
        className="relative group cursor-pointer"
        aria-label="Cambiar foto de perfil"
      >
        <div className="w-24 h-24 rounded-full overflow-hidden bg-surface-container-low border-2 border-primary-fixed-dim/40 flex items-center justify-center">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Foto de perfil" className="w-full h-full object-cover" />
          ) : (
            <span className="font-display text-3xl text-primary-fixed-dim">{fallbackLabel}</span>
          )}
        </div>
        <div className="absolute inset-0 rounded-full bg-void-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Camera size={22} className="text-parchment" />
        </div>
        <input
          id="avatar"
          name="avatar"
          type="file"
          accept="image/*"
          className="sr-only"
          disabled={pending}
          onChange={() => formRef.current?.requestSubmit()}
        />
      </label>
      {pending && <p className="text-xs text-on-surface-variant">Subiendo...</p>}
      {state.error && (
        <p className="text-error text-xs" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
