-- ============================================================================
-- ENTERPRISE-GRADE SAAS DATABASE SCHEMA WITH FULL RBAC
-- Features: Token Auth, Multi-Tenant, Customizable Permissions, Audit Trail
-- WITH PROPER CASCADE BEHAVIOR FOR DATA INTEGRITY
-- USING UUID FOR ALL PRIMARY KEYS
-- ============================================================================

-- ============================================================================
-- CASCADE STRATEGY:
-- - ON DELETE CASCADE: Auto-delete child records (tokens, mappings)
-- - ON DELETE SET NULL: Keep record but remove reference (optional relations)
-- - ON DELETE RESTRICT: Prevent deletion if dependencies exist (critical data)
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. AUTHENTICATION CORE TABLES
-- ============================================================================

-- Core identity table
CREATE TABLE users (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id           UUID NULL REFERENCES tenants(id) ON DELETE SET NULL,
    role_id             UUID NULL REFERENCES roles(id) ON DELETE RESTRICT,
    email               VARCHAR(255) UNIQUE NOT NULL,
    password_hash       VARCHAR(255),
    is_email_verified   BOOLEAN DEFAULT FALSE,
    full_name           VARCHAR(255),
    avatar_url          TEXT,
    status              VARCHAR(20) DEFAULT 'active',  -- active, inactive, suspended
    role_assigned_at    TIMESTAMP NULL,
    role_assigned_by    UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW(),
    deleted_at          TIMESTAMP NULL,
    created_by          UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by          UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_tenant ON users(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX idx_users_role ON users(role_id);
CREATE INDEX idx_users_deleted ON users(deleted_at);
CREATE INDEX idx_users_status ON users(status);

-- Supports email/password AND external login (Google, GitHub, Azure AD, etc.)
CREATE TABLE auth_providers (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider            VARCHAR(100) NOT NULL,   -- google, github, password, etc.
    provider_user_id    VARCHAR(255),            -- google sub, github ID, etc.
    created_at          TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_auth_providers_user ON auth_providers(user_id);

-- Secure, stored server-side. Supports token rotation + invalidation
CREATE TABLE refresh_tokens (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash      VARCHAR(255) NOT NULL,
    expires_at      TIMESTAMP NOT NULL,
    created_at      TIMESTAMP DEFAULT NOW(),
    revoked         BOOLEAN DEFAULT FALSE,
    revoked_at      TIMESTAMP NULL,
    ip_address      VARCHAR(45),
    user_agent      TEXT
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);

-- Access tokens (optional, but good for enterprise logging)
CREATE TABLE access_tokens (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash      VARCHAR(255) NOT NULL,
    expires_at      TIMESTAMP NOT NULL,
    created_at      TIMESTAMP DEFAULT NOW(),
    revoked         BOOLEAN DEFAULT FALSE,
    revoked_at      TIMESTAMP NULL,
    ip_address      VARCHAR(45),
    user_agent      TEXT
);

CREATE INDEX idx_access_tokens_user ON access_tokens(user_id);
CREATE INDEX idx_access_tokens_hash ON access_tokens(token_hash);

-- ============================================================================
-- 2. RBAC (Role-Based Access Control) - ENHANCED VERSION
-- ============================================================================

-- High-level functional areas of your SaaS
CREATE TABLE modules (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(255) NOT NULL UNIQUE,
    code            VARCHAR(100) NOT NULL UNIQUE,
    description     TEXT,
    icon            VARCHAR(100),
    sort_order      INT DEFAULT 0,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW(),
    created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by      UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_modules_code ON modules(code);

-- Permission action types (CREATE, READ, UPDATE, DELETE, EXECUTE, etc.)
CREATE TABLE permission_actions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(50) NOT NULL UNIQUE,
    code            VARCHAR(50) NOT NULL UNIQUE,
    description     TEXT,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- Insert default actions
INSERT INTO permission_actions (name, code, description) VALUES
('Create', 'create', 'Ability to create new resources'),
('Read', 'read', 'Ability to view/read resources'),
('Update', 'update', 'Ability to modify existing resources'),
('Delete', 'delete', 'Ability to remove resources'),
('Execute', 'execute', 'Ability to execute actions/operations'),
('Approve', 'approve', 'Ability to approve requests'),
('Export', 'export', 'Ability to export data'),
('Import', 'import', 'Ability to import data');

-- Permission groups for organizing permissions hierarchically
CREATE TABLE permission_groups (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id       UUID REFERENCES permission_groups(id) ON DELETE CASCADE,
    module_id       UUID REFERENCES modules(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    code            VARCHAR(100) NOT NULL UNIQUE,
    description     TEXT,
    created_at      TIMESTAMP DEFAULT NOW(),
    created_by      UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_permission_groups_module ON permission_groups(module_id);
CREATE INDEX idx_permission_groups_parent ON permission_groups(parent_id);

-- Define atomic permissions
CREATE TABLE permissions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id       UUID NOT NULL REFERENCES modules(id) ON DELETE RESTRICT,
    group_id        UUID REFERENCES permission_groups(id) ON DELETE SET NULL,
    action_id       UUID REFERENCES permission_actions(id) ON DELETE SET NULL,
    name            VARCHAR(255) NOT NULL,
    code            VARCHAR(100) NOT NULL UNIQUE,
    description     TEXT,
    resource        VARCHAR(100),  -- e.g., 'user', 'project', 'invoice'
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW(),
    deleted_at      TIMESTAMP NULL,
    created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by      UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_permissions_module ON permissions(module_id);
CREATE INDEX idx_permissions_code ON permissions(code);
CREATE INDEX idx_permissions_group ON permissions(group_id);
CREATE INDEX idx_permissions_deleted ON permissions(deleted_at);

-- Roles can be global or tenant-specific
CREATE TABLE roles (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    code            VARCHAR(100) NOT NULL,
    description     TEXT,
    is_system       BOOLEAN DEFAULT FALSE,
    priority        INT DEFAULT 0,  -- Higher priority = more permissions in conflict
    status          VARCHAR(20) DEFAULT 'active',
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW(),
    deleted_at      TIMESTAMP NULL,
    created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by      UUID REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE(tenant_id, code)
);

CREATE INDEX idx_roles_tenant ON roles(tenant_id);
CREATE INDEX idx_roles_code ON roles(code);
CREATE INDEX idx_roles_status ON roles(status);
CREATE INDEX idx_roles_deleted ON roles(deleted_at);

-- Mapping between roles and permissions with conditions
CREATE TABLE role_permissions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id         UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id   UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    conditions      JSONB,  -- {"owner_only": true, "department": "engineering"}
    granted_by      UUID REFERENCES users(id) ON DELETE SET NULL,
    granted_at      TIMESTAMP DEFAULT NOW(),
    UNIQUE(role_id, permission_id)
);

CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission ON role_permissions(permission_id);
CREATE INDEX idx_role_permissions_role_perm ON role_permissions(role_id, permission_id);

-- Resource-level permissions (for specific resources)
CREATE TABLE resource_permissions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_id   UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    resource_type   VARCHAR(100) NOT NULL,
    resource_id     UUID NOT NULL,
    granted_by      UUID REFERENCES users(id) ON DELETE SET NULL,
    granted_at      TIMESTAMP DEFAULT NOW(),
    expires_at      TIMESTAMP NULL,
    UNIQUE(user_id, permission_id, resource_type, resource_id)
);

CREATE INDEX idx_resource_permissions_user ON resource_permissions(user_id);
CREATE INDEX idx_resource_permissions_permission ON resource_permissions(permission_id);
CREATE INDEX idx_resource_permissions_resource ON resource_permissions(resource_type, resource_id);

-- ============================================================================
-- 3. MULTI-TENANT SUPPORT
-- ============================================================================

-- Tenants (organizations / companies)
CREATE TABLE tenants (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(255) NOT NULL,
    subdomain       VARCHAR(100) UNIQUE,
    status          VARCHAR(20) DEFAULT 'active',
    settings        JSONB,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW(),
    deleted_at      TIMESTAMP NULL,
    created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by      UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX idx_tenants_status ON tenants(status);

-- Track which user belongs to which tenant
CREATE TABLE tenant_users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id         UUID NULL REFERENCES roles(id) ON DELETE SET NULL,
    is_primary      BOOLEAN DEFAULT FALSE,
    joined_at       TIMESTAMP DEFAULT NOW(),
    UNIQUE(tenant_id, user_id)
);

CREATE INDEX idx_tenant_users_tenant ON tenant_users(tenant_id);
CREATE INDEX idx_tenant_users_user ON tenant_users(user_id);

-- ============================================================================
-- 4. AUDIT LOG
-- ============================================================================

CREATE TABLE audit_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    tenant_id       UUID REFERENCES tenants(id) ON DELETE SET NULL,
    action          VARCHAR(100) NOT NULL,
    resource_type   VARCHAR(100),
    resource_id     UUID,
    changes         JSONB,
    ip_address      VARCHAR(45),
    user_agent      TEXT,
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- ============================================================================
-- 5. HELPER VIEWS FOR QUERY PERFORMANCE
-- ============================================================================

-- View: Get all user permissions in one query
CREATE VIEW user_permissions_view AS
SELECT 
    u.id as user_id,
    u.email,
    u.tenant_id,
    r.id as role_id,
    r.name as role_name,
    r.priority as role_priority,
    m.name as module_name,
    m.code as module_code,
    p.id as permission_id,
    p.name as permission_name,
    p.code as permission_code,
    p.resource,
    pa.name as action_name,
    pa.code as action_code,
    rp.conditions
FROM users u
JOIN roles r ON u.role_id = r.id AND r.deleted_at IS NULL AND r.status = 'active'
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id AND p.deleted_at IS NULL AND p.is_active = TRUE
JOIN modules m ON p.module_id = m.id AND m.is_active = TRUE
LEFT JOIN permission_actions pa ON p.action_id = pa.id
WHERE u.deleted_at IS NULL AND u.status = 'active';

-- View: User role summary
CREATE VIEW user_roles_summary AS
SELECT 
    u.id as user_id,
    u.email,
    u.full_name,
    u.tenant_id,
    t.name as tenant_name,
    r.id as role_id,
    r.name as role_name,
    r.code as role_code,
    u.role_assigned_at,
    COUNT(DISTINCT p.id) as permission_count
FROM users u
LEFT JOIN tenants t ON u.tenant_id = t.id
LEFT JOIN roles r ON u.role_id = r.id AND r.deleted_at IS NULL
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id AND p.deleted_at IS NULL
WHERE u.deleted_at IS NULL
GROUP BY u.id, u.email, u.full_name, u.tenant_id, t.name, r.id, r.name, r.code, u.role_assigned_at;

-- ============================================================================
-- 6. SAMPLE DATA - MODULES
-- ============================================================================

INSERT INTO modules (name, code, description, sort_order) VALUES
('User Management', 'USERS', 'Manage users, roles, and permissions', 1),
('Billing', 'BILLING', 'Handle invoices, payments, and subscriptions', 2),
('Projects', 'PROJECTS', 'Create and manage projects', 3),
('Reports', 'REPORTS', 'View and generate reports', 4),
('Settings', 'SETTINGS', 'System and tenant settings', 5);

-- ============================================================================
-- 7. SAMPLE DATA - PERMISSIONS
-- ============================================================================

-- Get module and action IDs (stored in variables for PostgreSQL)
DO $
DECLARE
    module_users_id UUID;
    module_billing_id UUID;
    module_projects_id UUID;
    action_create_id UUID;
    action_read_id UUID;
    action_update_id UUID;
    action_delete_id UUID;
    action_export_id UUID;
BEGIN
    -- Get module IDs
    SELECT id INTO module_users_id FROM modules WHERE code = 'USERS';
    SELECT id INTO module_billing_id FROM modules WHERE code = 'BILLING';
    SELECT id INTO module_projects_id FROM modules WHERE code = 'PROJECTS';
    
    -- Get action IDs
    SELECT id INTO action_create_id FROM permission_actions WHERE code = 'create';
    SELECT id INTO action_read_id FROM permission_actions WHERE code = 'read';
    SELECT id INTO action_update_id FROM permission_actions WHERE code = 'update';
    SELECT id INTO action_delete_id FROM permission_actions WHERE code = 'delete';
    SELECT id INTO action_export_id FROM permission_actions WHERE code = 'export';

    -- User Management Permissions
    INSERT INTO permissions (module_id, action_id, name, code, description, resource) VALUES
    (module_users_id, action_create_id, 'Create User', 'USER_CREATE', 'Create new users', 'user'),
    (module_users_id, action_read_id, 'View User', 'USER_READ', 'View user details', 'user'),
    (module_users_id, action_update_id, 'Edit User', 'USER_UPDATE', 'Modify user information', 'user'),
    (module_users_id, action_delete_id, 'Delete User', 'USER_DELETE', 'Remove users from system', 'user'),
    (module_users_id, action_create_id, 'Create Role', 'ROLE_CREATE', 'Create new roles', 'role'),
    (module_users_id, action_read_id, 'View Role', 'ROLE_READ', 'View role details', 'role'),
    (module_users_id, action_update_id, 'Edit Role', 'ROLE_UPDATE', 'Modify role information', 'role'),
    (module_users_id, action_delete_id, 'Delete Role', 'ROLE_DELETE', 'Remove roles', 'role');

    -- Billing Permissions
    INSERT INTO permissions (module_id, action_id, name, code, description, resource) VALUES
    (module_billing_id, action_read_id, 'View Billing', 'BILLING_READ', 'View billing information', 'invoice'),
    (module_billing_id, action_create_id, 'Create Invoice', 'INVOICE_CREATE', 'Create new invoices', 'invoice'),
    (module_billing_id, action_update_id, 'Update Invoice', 'INVOICE_UPDATE', 'Modify invoices', 'invoice'),
    (module_billing_id, action_export_id, 'Export Billing', 'BILLING_EXPORT', 'Export billing data', 'invoice');

    -- Project Permissions
    INSERT INTO permissions (module_id, action_id, name, code, description, resource) VALUES
    (module_projects_id, action_create_id, 'Create Project', 'PROJECT_CREATE', 'Create new projects', 'project'),
    (module_projects_id, action_read_id, 'View Project', 'PROJECT_READ', 'View project details', 'project'),
    (module_projects_id, action_update_id, 'Edit Project', 'PROJECT_UPDATE', 'Modify project information', 'project'),
    (module_projects_id, action_delete_id, 'Delete Project', 'PROJECT_DELETE', 'Remove projects', 'project');
END $;

-- ============================================================================
-- 8. SAMPLE DATA - ROLES
-- ============================================================================

INSERT INTO roles (name, code, description, is_system, priority) VALUES
('Super Admin', 'SUPER_ADMIN', 'Full system access with all permissions', TRUE, 100),
('Admin', 'ADMIN', 'Administrative access with most permissions', TRUE, 90),
('Manager', 'MANAGER', 'Management level access', TRUE, 50),
('Editor', 'EDITOR', 'Can create and edit content', TRUE, 30),
('Viewer', 'VIEWER', 'Read-only access', TRUE, 10);

-- ============================================================================
-- 9. ASSIGN PERMISSIONS TO ROLES
-- ============================================================================

-- Super Admin gets all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.code = 'SUPER_ADMIN';

-- Admin gets most permissions (excluding some system-level ones)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.code = 'ADMIN' AND p.code NOT LIKE '%DELETE';

-- Viewer gets only read permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.code = 'VIEWER' AND p.code LIKE '%_READ';

-- ============================================================================
-- 10. UTILITY FUNCTIONS
-- ============================================================================

-- Function to check if user has permission
CREATE OR REPLACE FUNCTION user_has_permission(
    p_user_id BIGINT,
    p_permission_code VARCHAR
) RETURNS BOOLEAN AS $
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_permissions_view
        WHERE user_id = p_user_id 
        AND permission_code = p_permission_code
    );
END;
$ LANGUAGE plpgsql;

-- Function to get user permissions
CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id BIGINT)
RETURNS TABLE (
    permission_code VARCHAR,
    permission_name VARCHAR,
    module_code VARCHAR,
    action_code VARCHAR
) AS $
BEGIN
    RETURN QUERY
    SELECT 
        p.code as permission_code,
        p.name as permission_name,
        m.code as module_code,
        pa.code as action_code
    FROM user_permissions_view upv
    JOIN permissions p ON upv.permission_id = p.id
    JOIN modules m ON p.module_id = m.id
    LEFT JOIN permission_actions pa ON p.action_id = pa.id
    WHERE upv.user_id = p_user_id;
END;
$ LANGUAGE plpgsql;

-- ============================================================================
-- 11. CASCADE BEHAVIOR SUMMARY
-- ============================================================================

/*
CASCADE RULES IMPLEMENTED:

✅ DELETE USER → Cascades to:
   - auth_providers (CASCADE)
   - refresh_tokens (CASCADE)
   - access_tokens (CASCADE)
   - resource_permissions (CASCADE)
   - tenant_users (CASCADE)
   - audit_logs (SET NULL - keeps history)
   - OTHER USERS.role_assigned_by (SET NULL)
   - OTHER USERS.created_by/updated_by (SET NULL)

✅ DELETE ROLE → RESTRICTED:
   - ❌ CANNOT DELETE if any user has this role (RESTRICT)
   - role_permissions (CASCADE - automatically deleted)
   - tenant_users.role_id (SET NULL)
   - 📌 WORKFLOW: Before deleting a role, you must:
       1. Reassign all users to a different role, OR
       2. Set users.role_id = NULL manually, OR
       3. Use soft delete (roles.deleted_at) instead

✅ DELETE TENANT → Cascades to:
   - roles (CASCADE - tenant-specific roles deleted)
   - tenant_users (CASCADE)
   - users.tenant_id (SET NULL - user preserved)
   - audit_logs (SET NULL - keeps history)

✅ DELETE PERMISSION → Cascades to:
   - role_permissions (CASCADE)
   - resource_permissions (CASCADE)

✅ DELETE MODULE → RESTRICTED:
   - permissions (RESTRICT - cannot delete if permissions exist)
   - Must delete permissions first, or change to CASCADE if desired

✅ DELETE PERMISSION GROUP → Cascades to:
   - Child groups (CASCADE - hierarchical delete)
   - permissions.group_id (SET NULL - permission preserved)

⚠️ ROLE DELETION PROTECTION:
   Using ON DELETE RESTRICT prevents accidentally removing roles that users depend on.
   
   To safely delete a role:
   
   -- Option 1: Reassign users first
   UPDATE users SET role_id = <new_role_id> WHERE role_id = <old_role_id>;
   DELETE FROM roles WHERE id = <old_role_id>;
   
   -- Option 2: Use soft delete (RECOMMENDED)
   UPDATE roles SET deleted_at = NOW(), status = 'archived' WHERE id = <role_id>;
   
   -- Option 3: Remove users from role first
   UPDATE users SET role_id = NULL WHERE role_id = <role_id>;
   DELETE FROM roles WHERE id = <role_id>;

⚠️ IMPORTANT NOTES:
   - Each user has ONE primary role (users.role_id)
   - System roles (is_system=TRUE) should be protected at application level
   - SOFT DELETES (deleted_at) are STRONGLY RECOMMENDED for roles
   - Audit logs always use SET NULL to preserve historical data
   - created_by/updated_by/role_assigned_by use SET NULL to keep records even if user deleted
   - If you need multiple roles per user, keep the user_roles table (commented out above)

📌 SIMPLIFIED RBAC MODEL:
   - One user = One role
   - Roles contain multiple permissions
   - Resource-level permissions available for granular control
   - Simpler queries, better performance
   - Role deletion is protected to prevent data integrity issues
   - If user needs different permissions, create a custom role or use resource_permissions
*/

-- ============================================================================
-- 12. TRIGGER FOR ROLE DELETION SAFETY (OPTIONAL)
-- ============================================================================

-- Trigger to prevent deletion of system roles
CREATE OR REPLACE FUNCTION prevent_system_role_deletion()
RETURNS TRIGGER AS $
BEGIN
    IF OLD.is_system = TRUE THEN
        RAISE EXCEPTION 'Cannot delete system role: %. Use soft delete instead.', OLD.name;
    END IF;
    RETURN OLD;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_system_role_deletion
BEFORE DELETE ON roles
FOR EACH ROW
EXECUTE FUNCTION prevent_system_role_deletion();

-- Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_roles_updated_at BEFORE UPDATE ON roles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_permissions_updated_at BEFORE UPDATE ON permissions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_modules_updated_at BEFORE UPDATE ON modules
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_tenants_updated_at BEFORE UPDATE ON tenants
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 13. HELPER FUNCTIONS FOR ROLE MANAGEMENT
-- ============================================================================

-- Function to safely delete a role (reassigns users to default role first)
CREATE OR REPLACE FUNCTION safe_delete_role(
    p_role_id BIGINT,
    p_default_role_id BIGINT DEFAULT NULL
)
RETURNS BOOLEAN AS $
DECLARE
    v_user_count INTEGER;
    v_role_name VARCHAR(255);
BEGIN
    -- Get role info
    SELECT name INTO v_role_name FROM roles WHERE id = p_role_id;
    
    IF v_role_name IS NULL THEN
        RAISE EXCEPTION 'Role with ID % does not exist', p_role_id;
    END IF;
    
    -- Check if system role
    IF EXISTS (SELECT 1 FROM roles WHERE id = p_role_id AND is_system = TRUE) THEN
        RAISE EXCEPTION 'Cannot delete system role: %', v_role_name;
    END IF;
    
    -- Count affected users
    SELECT COUNT(*) INTO v_user_count FROM users WHERE role_id = p_role_id;
    
    IF v_user_count > 0 THEN
        IF p_default_role_id IS NULL THEN
            RAISE EXCEPTION 'Cannot delete role %. % users still assigned. Provide a default_role_id or reassign users first.', 
                v_role_name, v_user_count;
        END IF;
        
        -- Reassign users to default role
        UPDATE users SET role_id = p_default_role_id WHERE role_id = p_role_id;
        RAISE NOTICE 'Reassigned % users from % to new role', v_user_count, v_role_name;
    END IF;
    
    -- Now safe to delete
    DELETE FROM roles WHERE id = p_role_id;
    RAISE NOTICE 'Successfully deleted role: %', v_role_name;
    
    RETURN TRUE;
END;
$ LANGUAGE plpgsql;

-- Function to get users by role
CREATE OR REPLACE FUNCTION get_users_by_role(p_role_id BIGINT)
RETURNS TABLE (
    user_id BIGINT,
    email VARCHAR,
    full_name VARCHAR,
    status VARCHAR
) AS $
BEGIN
    RETURN QUERY
    SELECT u.id, u.email, u.full_name, u.status
    FROM users u
    WHERE u.role_id = p_role_id
    AND u.deleted_at IS NULL;
END;
$ LANGUAGE plpgsql;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================