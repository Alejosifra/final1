-- ====================================================================
-- LUAL GASTRO BAR - ENTERPRISE DATABASE RELATIONAL SCHEMA (POSTGRESQL)
-- ====================================================================
-- Highly optimized for POS systems, Supabase integrations, active indices,
-- and immutable auditing trails.

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS SAFELY IF THEY DO NOT EXIST
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_type') THEN
        CREATE TYPE user_role_type AS ENUM ('Admin', 'Supervisor', 'Cajero', 'Mesero', 'Cocina');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'movement_type') THEN
        CREATE TYPE movement_type AS ENUM ('Entrada', 'Salida');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method_type') THEN
        CREATE TYPE payment_method_type AS ENUM ('Efectivo', 'Tarjeta', 'Transf', 'Credito');
    END IF;
END$$;

-- 3. SYSTEM SETTINGS TABLE (Fase 1)
CREATE TABLE IF NOT EXISTS settings (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'biz-primary-config',
    restaurant_name VARCHAR(150) NOT NULL DEFAULT 'LUAL GASTRO BAR',
    logo_url text DEFAULT '🍽️',
    nit VARCHAR(50) NOT NULL DEFAULT '901.342.887-5',
    address text NOT NULL DEFAULT 'Calle 10a #9-44, Medellín, CO',
    phone VARCHAR(50),
    email VARCHAR(100),
    currency VARCHAR(10) DEFAULT 'COP',
    tax_percent DECIMAL(5,2) DEFAULT 8.00,
    tip_percent DECIMAL(5,2) DEFAULT 10.00,
    ticket_footer text,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. USERS PROFILES TABLE (Fase 2)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(150) UNIQUE NOT NULL,
    fullname VARCHAR(150) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    role user_role_type NOT NULL DEFAULT 'Mesero',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    pin VARCHAR(6) NOT NULL DEFAULT '0000',
    avatar VARCHAR(10) DEFAULT '🏃',
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indices for user profiles
CREATE INDEX IF NOT EXISTS idx_users_username ON user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON user_profiles(role);

-- 5. PERMISSIONS TABLE (Fase 3)
CREATE TABLE IF NOT EXISTS permissions (
    key VARCHAR(100) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description text,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. ROLE_PERMISSIONS JUNCTION TABLE (Fase 3 System RBAC)
CREATE TABLE IF NOT EXISTS role_permissions (
    role user_role_type NOT NULL,
    permission_key VARCHAR(100) NOT NULL REFERENCES permissions(key) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role, permission_key)
);

-- 7. ZONES & TABLES TABLE (Fase 4)
CREATE TABLE IF NOT EXISTS zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    color_hint VARCHAR(30) DEFAULT '#00f2ff',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    zone_id UUID REFERENCES zones(id) ON DELETE CASCADE,
    table_number VARCHAR(20) NOT NULL,
    capacity INT DEFAULT 4,
    x_pos DECIMAL(10,2) DEFAULT 0.00,
    y_pos DECIMAL(10,2) DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE (zone_id, table_number),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. INMUTABLE AUDIT LOGS TABLE (Fase 9)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    username VARCHAR(150) NOT NULL,
    role VARCHAR(50) NOT NULL,
    module VARCHAR(50) NOT NULL,
    action text NOT NULL,
    details text,
    client_ip VARCHAR(50) DEFAULT '127.0.0.1'
);

-- Indices for audit log scans
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_module ON audit_logs(module);

-- 9. PRINTER CONFIGURATION TABLE (Fase 5)
CREATE TABLE IF NOT EXISTS printers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    ip_address VARCHAR(50) NOT NULL,
    port INT DEFAULT 9100,
    purpose VARCHAR(50) DEFAULT 'Facturas', -- 'Facturas', 'Cocina', 'Barra'
    paper_size VARCHAR(10) DEFAULT '80mm',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. PRESET BULK DATA SEEDING
INSERT INTO permissions (key, name, category, description) VALUES
('OPEN_CLOSE_CASH', 'Apertura y Cierre de Jornada', 'Caja', 'Permite abrir caja inicial y autorizar el retiro neto diario.'),
('APPLICAR_DESCUENTO', 'Aplicar Descuentos Comerciales', 'Ventas', 'Autorizar reducciones porcentuales sobre la comanda de mesa.'),
('VOID_ORDER', 'Anular u Modificar Cuentas Activas', 'Ventas', 'Permite revocar ítems o tickets confirmados por auditoría.'),
('MANAGE_INVENTORY', 'Modificar Catálogo e Inventario', 'Inventario', 'Creación de platos, modificación de precios y ajustes de Kardex de stock crítico.'),
('VIEW_REPORTS', 'Acceso a Reportes Financieros', 'Reportes', 'Visualizar ventas del día/mes, kpi de utilidad y márgenes.'),
('VIEW_AUDIT', 'Monitorear Bitácora de Auditoría Inmutable', 'Sistema', 'Leer logs críticos del sistema con estampas de cambio.'),
('MANAGE_SETTINGS', 'Modificar Ajustes de Empresa e Impresoras', 'Sistema', 'Editar NIT, dirección, IVA, propinas sugeridas y sockets de impresión.'),
('RESET_SYSTEM', 'Efectuar Reinicios Especiales del Core', 'Sistema', 'Permitir purgar base de datos de transacciones o inventario con llave supervisor.'),
('EXPORT_DATA', 'Exportar Informes Administrativos', 'Reportes', 'Descargar datos de caja, movimientos de Kardex y clientes en formatos Excel/CSV.')
ON CONFLICT (key) DO NOTHING;

-- Seed primary settings
INSERT INTO settings (id, restaurant_name, nit, address, phone, email, currency, tax_percent, tip_percent, ticket_footer)
VALUES ('biz-primary-config', 'LUAL GASTRO BAR', '901.342.887-5', 'Calle 10a #9-44, Medellín, CO', '+57(315)880-9944', 'contacto@lualgastro.com', 'COP', 8.00, 10.00, '¡Gracias por visitarnos! Factura de Venta POS de Régimen Común. Desarrollado por LUAL Gastro Enterprise.')
ON CONFLICT (id) DO NOTHING;
