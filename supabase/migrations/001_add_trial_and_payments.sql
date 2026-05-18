-- BarberFlow — Migración 001: Trial, ciclo de facturación y pagos
-- Ejecutar en: Supabase → SQL Editor → New query

-- 1. Agregar valor 'trial' al enum de plan
ALTER TYPE plan_suscripcion ADD VALUE IF NOT EXISTS 'trial';

-- 2. Nuevas columnas en suscripciones
ALTER TABLE suscripciones
  ADD COLUMN IF NOT EXISTS ciclo_facturacion  text,           -- 'mensual' | 'anual'
  ADD COLUMN IF NOT EXISTS wompi_referencia   text,           -- referencia enviada a Wompi
  ADD COLUMN IF NOT EXISTS wompi_transaction_id text;         -- ID de transacción confirmada

-- 3. Tabla de historial de pagos
CREATE TABLE IF NOT EXISTS pagos (
  id                    uuid          DEFAULT uuid_generate_v4() PRIMARY KEY,
  barberia_id           uuid          REFERENCES barberias(id) ON DELETE CASCADE NOT NULL,
  wompi_transaction_id  text          NOT NULL,
  wompi_referencia      text          NOT NULL UNIQUE,
  monto_centavos        bigint        NOT NULL,
  moneda                text          DEFAULT 'COP',
  estado                text          NOT NULL,  -- APPROVED | DECLINED | VOIDED | ERROR
  plan                  plan_suscripcion NOT NULL,
  ciclo_facturacion     text,
  created_at            timestamptz   DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pagos_barberia    ON pagos(barberia_id);
CREATE INDEX IF NOT EXISTS idx_pagos_referencia  ON pagos(wompi_referencia);
CREATE INDEX IF NOT EXISTS idx_pagos_transaction ON pagos(wompi_transaction_id);

-- 4. RLS para pagos
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner ve sus pagos"
  ON pagos FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM barberias
      WHERE barberias.id = pagos.barberia_id
        AND barberias.owner_id = auth.uid()
    )
  );

-- El service role (webhook) inserta pagos — bypasa RLS automáticamente.
