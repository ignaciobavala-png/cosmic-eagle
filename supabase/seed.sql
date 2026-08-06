insert into public.trips (title, description, location, start_date, end_date, capacity, status, price, type, schedule, terms)
values
  (
    'Despertar en la Montaña Sagrada',
    'Un viaje de 7 dias de inmersion profunda y silencio consciente para reconectar con el origen.',
    'Valle Sagrado, Peru',
    '2026-09-10',
    '2026-09-17',
    12,
    'open',
    1200,
    'retiro',
    '[]'::jsonb,
    null
  ),
  -- La ceremonia replica el flyer que hoy manda la clienta por WhatsApp: una
  -- jornada (11:00 a 21:00), programa hora por hora, aporte y condiciones.
  (
    'Equinoccio Galactico',
    'Ceremonia de una jornada en honor al equinoccio, con acompañamiento y contencion durante todo el proceso.',
    'Tepoztlan, Mexico',
    '2026-09-22',
    '2026-09-22',
    20,
    'open',
    350,
    'ceremonia',
    '[
      {"time": "11:00", "activity": "Llegada al lugar"},
      {"time": "11:30", "activity": "Introducción y técnicas de vuelo"},
      {"time": "12:30", "activity": "Inicio del viaje"},
      {"time": "17:30", "activity": "Aterrizaje"},
      {"time": "18:30", "activity": "Integración & Comida"},
      {"time": "21:00", "activity": "Fin del encuentro"}
    ]'::jsonb,
    'Inscripciones con formulario de salud aprobado. Pago del 50% para reservar cupo, reembolsable hasta 7 días antes del evento.'
  );
