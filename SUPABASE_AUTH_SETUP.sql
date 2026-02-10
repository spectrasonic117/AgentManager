-- ============================================
-- CONFIGURACIÓN DE BASE DE DATOS PARA SUPABASE
-- Sistema de Autenticación Personalizado
-- ============================================

-- 1. INSTALAR EXTENSIÓN PGCRYPTO (para cifrado bcrypt)
-- Ejecutar en el Editor SQL de Supabase:
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. CREAR TABLA DE USUARIOS
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);

-- 3. CREAR ÍNDICES PARA OPTIMIZACIÓN
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 4. FUNCIÓN: HASHEAR CONTRASEÑA (bcrypt)
CREATE OR REPLACE FUNCTION hash_password(p_password TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN crypt(p_password, gen_salt('bf'));
END;
$$;

-- 5. FUNCIÓN: REGISTRAR USUARIO
CREATE OR REPLACE FUNCTION register_user(
    p_username TEXT,
    p_password TEXT,
    p_email TEXT DEFAULT NULL
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_new_user RECORD;
BEGIN
    -- Verificar que el username no exista
    IF EXISTS (SELECT 1 FROM users WHERE username = p_username) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'El nombre de usuario ya está en uso'
        );
    END IF;

    -- Verificar longitud mínima de contraseña
    IF LENGTH(p_password) < 8 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'La contraseña debe tener al menos 8 caracteres'
        );
    END IF;

    -- Insertar nuevo usuario con contraseña hasheada
    INSERT INTO users (username, password_hash, email)
    VALUES (p_username, hash_password(p_password), p_email)
    RETURNING * INTO v_new_user;

    RETURN json_build_object(
        'success', true,
        'user', json_build_object(
            'id', v_new_user.id,
            'username', v_new_user.username,
            'email', v_new_user.email
        )
    );
END;
$$;

-- 6. FUNCIÓN: AUTENTICAR USUARIO
CREATE OR REPLACE FUNCTION authenticate_user(
    p_username TEXT,
    p_password TEXT
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user RECORD;
    v_is_valid BOOLEAN;
BEGIN
    -- Buscar usuario activo
    SELECT * INTO v_user
    FROM users
    WHERE username = p_username AND is_active = true;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Usuario no encontrado'
        );
    END IF;

    -- Verificar contraseña
    SELECT crypt(p_password, v_user.password_hash) = v_user.password_hash
    INTO v_is_valid;

    IF NOT v_is_valid THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Contraseña incorrecta'
        );
    END IF;

    -- Actualizar último login
    UPDATE users
    SET last_login_at = NOW(), updated_at = NOW()
    WHERE id = v_user.id;

    RETURN json_build_object(
        'success', true,
        'user', json_build_object(
            'id', v_user.id,
            'username', v_user.username,
            'email', v_user.email,
            'avatar_url', v_user.avatar_url
        )
    );
END;
$$;

-- 7. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 8. CREAR POLÍTICAS RLS
-- Los usuarios pueden ver solo su propia información
CREATE POLICY IF NOT EXISTS "users_can_view_own_data" ON users
    FOR SELECT
    USING (auth.uid()::TEXT = id::TEXT);

-- Los usuarios pueden actualizar solo su propia información
CREATE POLICY IF NOT EXISTS "users_can_update_own_data" ON users
    FOR UPDATE
    USING (auth.uid()::TEXT = id::TEXT);

-- ============================================
-- VERIFICACIÓN DE CONFIGURACIÓN
-- ============================================

-- Verificar que las funciones fueron creadas:
-- SELECT * FROM pg_proc WHERE proname IN ('hash_password', 'register_user', 'authenticate_user');

-- Verificar que la tabla existe:
-- SELECT table_name FROM information_schema.tables WHERE table_name = 'users';

-- ============================================
-- EJEMPLO DE USO DESDE LA APLICACIÓN
-- ============================================

-- Registrar usuario:
-- SELECT register_user('mi_usuario', 'MiPassword123!', 'correo@ejemplo.com');

-- Iniciar sesión:
-- SELECT authenticate_user('mi_usuario', 'MiPassword123!');

-- ============================================
-- NOTAS DE SEGURIDAD
-- ============================================
-- 1. Las contraseñas nunca se almacenan en texto plano
-- 2. Se usa bcrypt con salt automático
-- 3. Las funciones son SECURITY DEFINER para acceder a los hashes
-- 4. RLS protege los datos a nivel de fila
-- 5. Los nombres de usuario deben ser únicos
