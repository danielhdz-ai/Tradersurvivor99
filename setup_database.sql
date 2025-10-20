-- Instrucciones para configurar las tablas en Supabase
-- Ejecuta estos comandos en el SQL Editor de tu proyecto Supabase

-- 1. Tabla de cuentas de trading
CREATE TABLE accounts (
    id text PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    currency text NOT NULL,
    platform text NOT NULL,
    initial_balance numeric NOT NULL DEFAULT 0,
    balance numeric NOT NULL DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);

-- 2. Tabla de operaciones
CREATE TABLE operations (
    id text PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id text NOT NULL,
    date text NOT NULL,
    instrument text NOT NULL,
    type text NOT NULL,
    entry numeric,
    exit numeric,
    entry_time text,
    exit_time text,
    volume numeric NOT NULL,
    result text NOT NULL,
    pl numeric NOT NULL,
    currency text NOT NULL,
    notes text,
    image_datas text[],
    manual_pl numeric,
    session text,
    created_at timestamp with time zone DEFAULT now()
);

-- 3. Tabla de finanzas
CREATE TABLE finances (
    id serial PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    date text NOT NULL,
    amount numeric NOT NULL,
    currency text NOT NULL,
    notes text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- 4. Tabla de configuraciones de usuario
CREATE TABLE user_settings (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    settings jsonb,
    api_keys jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 5. Configurar Row Level Security (RLS)
-- Esto asegura que cada usuario solo vea sus propios datos

-- Habilitar RLS en todas las tablas
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE finances ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Políticas para la tabla accounts
CREATE POLICY "Users can view own accounts" ON accounts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own accounts" ON accounts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own accounts" ON accounts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own accounts" ON accounts
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para la tabla operations
CREATE POLICY "Users can view own operations" ON operations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own operations" ON operations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own operations" ON operations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own operations" ON operations
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para la tabla finances
CREATE POLICY "Users can view own finances" ON finances
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own finances" ON finances
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own finances" ON finances
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own finances" ON finances
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para la tabla user_settings
CREATE POLICY "Users can view own settings" ON user_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON user_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON user_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own settings" ON user_settings
    FOR DELETE USING (auth.uid() = user_id);

-- 6. Crear índices para mejorar el rendimiento
CREATE INDEX accounts_user_id_idx ON accounts(user_id);
CREATE INDEX operations_user_id_idx ON operations(user_id);
CREATE INDEX operations_account_id_idx ON operations(account_id);
CREATE INDEX operations_date_idx ON operations(date);
CREATE INDEX finances_user_id_idx ON finances(user_id);
CREATE INDEX finances_date_idx ON finances(date);

-- ¡Listo! Ahora tu base de datos está configurada para el trading journal.