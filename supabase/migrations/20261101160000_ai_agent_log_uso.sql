-- Uso del asistente de IA: tope diario por persona y costo en tokens.
-- 'message' = un mensaje que la persona le manda al asistente (se inserta al
-- empezar el turno, asi un turno abortado igual cuenta para el tope).
-- 'usage'   = los tokens que gasto el turno (se inserta al terminar).
-- El log sigue siendo inmutable: sin UPDATE ni DELETE.

alter table public.ai_agent_log drop constraint ai_agent_log_kind_check;
alter table public.ai_agent_log
  add constraint ai_agent_log_kind_check
  check (kind in ('read', 'write', 'message', 'usage'));

alter table public.ai_agent_log
  add column input_tokens integer,
  add column output_tokens integer;

create index ai_agent_log_user_kind_idx
  on public.ai_agent_log (user_id, kind, created_at desc);
