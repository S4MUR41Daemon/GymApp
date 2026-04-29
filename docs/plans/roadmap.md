# AusinLifting — Roadmap

App de gym mobile-first con identidad visual estilo *Solo Leveling*. El usuario es un **Leveler** (no usamos "Hunter"
por copyright). Sube de nivel siendo consistente con sus entrenos y batiendo PRs.

---

## Visión

- **Mobile-first**, max-width 480px centrado en desktop, ParticleCanvas como fondo permanente.
- Paleta azul/cyan oscura, fuentes Rajdhani + Barlow Condensed, separadores `— SECCIÓN —`, cards con borde azul glow.
- Tabs: Base ⚡ (dashboard) / Status 🛡️ / Training ⚔️ (blocks) / Quests 📜 / Guild 🏴.
- Datos del Leveler: rank E→S+, level numérico, XP, streak, nickname custom.

---

## Fases

### Fase 0 — Scaffolding visual

- ✅ 0a Schema base: tablas `user_levels` + `xp_events` + `rankEnum`.
- ✅ 0b Shell SL: TopBar + BottomNav + ParticleCanvas + RankBadge + XPBar + fonts.
- 🔄 0c Restyle interno mobile-first: SL primitives, eliminar imagen anime, restyle pantallas, `nickname` en schema.
(`feature-restyle-mobile-first-sl.md`)

### Fase 1 — Identidad del Leveler
- Onboarding: el usuario elige nickname la primera vez.
- Pantalla `/dashboard/status` — card grande "Leveler Status" (rank XL, nickname, level, XP bar, título tipo "Iron
Will").
- Avatar opcional.

### Fase 2 — Mecánicas core (XP / PR / Streak reales)
- Hook XP en server actions: +50 workout, +100 PR, +200 semana, +500 bloque, +150 racha 7d.
- Cálculo de streak real (días consecutivos con entreno).
- Animación level-up con `lvlReveal` + `sysPulse`.
- Badge PR cuando se supera `reference1rm`.

### Fase 3 — Datos y progresión
- ✅ Autocompletado ejercicios.
- Historial por ejercicio + gráfica 1RM.
- Resumen semanal de volumen.

### Fase 4 — Misión Activa
- Card "Misión Activa" en `/dashboard` con bloque/semana en curso.
- Botón "INICIAR ENTRENAMIENTO" → próximo workout pendiente.

### Fase 5 — Quests Diarias
- 3 quests/día generadas por reglas (+300/+150/+500 XP).
- Card "— QUESTS DIARIAS — N/3" con tachado al completar.
- Reset 00:00 timezone del usuario.

### Fase 6 — Guild
- Concepto pendiente (real vs flavor). Tab deshabilitada en BottomNav.

### Fase 7 — Plataforma
- PWA instalable.
- Exportar entreno.

---

## Plans históricos
`docs/plans/done/` contiene plans ejecutados, conservados como referencia.

## Convenciones
- Naming: `feature-<kebab>.md` / `fix-<kebab>.md`.
- Plans en español. UI labels en español, separadores SL en MAYÚSCULAS.
- Workflow: Claude planner, ChatGPT 5.5 ejecutor, Claude review.
