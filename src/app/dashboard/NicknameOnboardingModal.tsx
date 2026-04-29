"use client";

import { useEffect, useRef } from "react";
import { SLButton, SLInput } from "@/components/ui-sl";
import { updateNickname } from "./actions";

export function NicknameOnboardingModal() {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      style={{
        width: 340,
        maxWidth: "calc(100vw - 32px)",
        padding: 24,
        borderRadius: 12,
        border: "1.5px solid rgba(96,165,250,0.45)",
        background: "linear-gradient(160deg, rgba(10,22,45,0.99), rgba(5,8,18,0.99))",
        boxShadow: "0 0 28px rgba(59,130,246,0.35)",
        color: "#e2e8f0",
        animation: "lvlReveal 0.3s ease",
      }}
      className="backdrop:bg-black/70 backdrop:backdrop-blur-sm"
    >
      <form action={updateNickname} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ textAlign: "center" }}>
          <p
            style={{
              margin: 0,
              fontFamily: "var(--font-barlow), sans-serif",
              fontSize: 11,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "rgba(96,165,250,0.65)",
            }}
          >
            — REGISTRO DEL LEVELER —
          </p>
          <h2
            style={{
              margin: "8px 0 0",
              fontFamily: "var(--font-rajdhani), sans-serif",
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: "0.04em",
              color: "#e2e8f0",
            }}
          >
            Elige tu nickname
          </h2>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: "rgba(148,163,184,0.6)" }}>
            Así aparecerás en tu Status de Leveler.
          </p>
        </div>

        <SLInput
          name="nickname"
          label="Nickname"
          minLength={2}
          maxLength={32}
          required
          autoFocus
          placeholder="Ej. ShadowLifter"
        />

        <SLButton type="submit" variant="primary">
          Confirmar identidad
        </SLButton>
      </form>
    </dialog>
  );
}
