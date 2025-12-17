-- =============================================
-- COMPLETE SCHEMA EXPORT FOR DATABASE: dbhg
-- Schema: public
-- Generated: 2025-12-16 13:33:46.933861+00
-- =============================================

-- ===========================================
-- TABLE: access_tokens
-- ===========================================
CREATE TABLE public.access_tokens (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    revoked BOOLEAN NOT NULL DEFAULT false,
    revoked_at TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT
);

-- Primary Key for access_tokens
ALTER TABLE public.access_tokens ADD CONSTRAINT access_tokens_pkey PRIMARY KEY (id);

-- Foreign Key for access_tokens
ALTER TABLE public.access_tokens ADD CONSTRAINT access_tokens_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE;

-- Index for access_tokens
CREATE INDEX idx_access_tokens_user ON public.access_tokens USING btree (user_id);

-- Index for access_tokens
CREATE INDEX idx_access_tokens_hash ON public.access_tokens USING btree (token_hash);

-- ===========================================
-- TABLE: audit_logs
-- ===========================================
CREATE TABLE public.audit_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID,
    tenant_id UUID,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id UUID,
    changes JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Primary Key for audit_logs
ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);

-- Index for audit_logs
CREATE INDEX idx_audit_logs_resource ON public.audit_logs USING btree (resource_type, resource_id);

-- Index for audit_logs
CREATE INDEX idx_audit_logs_created ON public.audit_logs USING btree (created_at);

-- Index for audit_logs
CREATE INDEX idx_audit_logs_user ON public.audit_logs USING btree (user_id);

-- Index for audit_logs
CREATE INDEX idx_audit_logs_tenant ON public.audit_logs USING btree (tenant_id);

-- ===========================================
-- TABLE: auth_providers
-- ===========================================
CREATE TABLE public.auth_providers (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    provider VARCHAR(100) NOT NULL,
    provider_user_id VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Primary Key for auth_providers
ALTER TABLE public.auth_providers ADD CONSTRAINT auth_providers_pkey PRIMARY KEY (id);

-- Foreign Key for auth_providers
ALTER TABLE public.auth_providers ADD CONSTRAINT auth_providers_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE;

-- Index for auth_providers
CREATE INDEX idx_auth_providers_user ON public.auth_providers USING btree (user_id);

-- ===========================================
-- TABLE: module_fields
-- ===========================================
CREATE TABLE public.module_fields (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100) NOT NULL,
    label VARCHAR(255),
    field_type VARCHAR(50),
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    created_by UUID,
    updated_by UUID
);

-- Primary Key for module_fields
ALTER TABLE public.module_fields ADD CONSTRAINT module_fields_pkey PRIMARY KEY (id);

-- Foreign Key for module_fields
ALTER TABLE public.module_fields ADD CONSTRAINT module_fields_module_id_modules_id_fk FOREIGN KEY (module_id) REFERENCES public.modules (id) ON DELETE CASCADE;

-- Index for module_fields
CREATE INDEX idx_module_fields_module ON public.module_fields USING btree (module_id);

-- Index for module_fields
CREATE INDEX idx_module_fields_code ON public.module_fields USING btree (code);

-- Index for module_fields
CREATE UNIQUE INDEX module_fields_module_code_unique ON public.module_fields USING btree (module_id, code);

-- ===========================================
-- TABLE: module_labels
-- ===========================================
CREATE TABLE public.module_labels (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(20) NOT NULL DEFAULT '#3b82f6'::character varying,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    tenant_id UUID NOT NULL
);

-- Primary Key for module_labels
ALTER TABLE public.module_labels ADD CONSTRAINT module_labels_pkey PRIMARY KEY (id);

-- Foreign Key for module_labels
ALTER TABLE public.module_labels ADD CONSTRAINT module_labels_module_id_modules_id_fk FOREIGN KEY (module_id) REFERENCES public.modules (id) ON DELETE CASCADE;

-- Foreign Key for module_labels
ALTER TABLE public.module_labels ADD CONSTRAINT module_labels_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants (id) ON DELETE CASCADE;

-- Index for module_labels
CREATE UNIQUE INDEX module_labels_tenant_module_name_unique ON public.module_labels USING btree (tenant_id, module_id, name);

-- Index for module_labels
CREATE INDEX idx_module_labels_tenant ON public.module_labels USING btree (tenant_id);

-- Index for module_labels
CREATE INDEX idx_module_labels_module ON public.module_labels USING btree (module_id);

-- ===========================================
-- TABLE: modules
-- ===========================================
CREATE TABLE public.modules (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    created_by UUID,
    updated_by UUID
);

-- Primary Key for modules
ALTER TABLE public.modules ADD CONSTRAINT modules_pkey PRIMARY KEY (id);

-- Index for modules
CREATE INDEX idx_modules_code ON public.modules USING btree (code);

-- Index for modules
CREATE UNIQUE INDEX modules_code_unique ON public.modules USING btree (code);

-- Index for modules
CREATE UNIQUE INDEX modules_name_unique ON public.modules USING btree (name);

-- ===========================================
-- TABLE: notes
-- ===========================================
CREATE TABLE public.notes (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active'::character varying,
    is_pinned BOOLEAN DEFAULT false,
    label_ids JSONB DEFAULT '[]'::jsonb,
    custom_fields JSONB DEFAULT '{}'::jsonb,
    created_by UUID NOT NULL,
    updated_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    deleted_at TIMESTAMP
);

-- Primary Key for notes
ALTER TABLE public.notes ADD CONSTRAINT notes_pkey PRIMARY KEY (id);

-- Foreign Key for notes
ALTER TABLE public.notes ADD CONSTRAINT notes_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants (id) ON DELETE CASCADE;

-- Foreign Key for notes
ALTER TABLE public.notes ADD CONSTRAINT notes_updated_by_users_id_fk FOREIGN KEY (updated_by) REFERENCES public.users (id);

-- Foreign Key for notes
ALTER TABLE public.notes ADD CONSTRAINT notes_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users (id);

-- Index for notes
CREATE INDEX idx_notes_tenant ON public.notes USING btree (tenant_id);

-- Index for notes
CREATE INDEX idx_notes_status ON public.notes USING btree (status);

-- ===========================================
-- TABLE: password_reset_tokens
-- ===========================================
CREATE TABLE public.password_reset_tokens (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    used_at TIMESTAMP,
    ip_address VARCHAR(45)
);

-- Primary Key for password_reset_tokens
ALTER TABLE public.password_reset_tokens ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);

-- Foreign Key for password_reset_tokens
ALTER TABLE public.password_reset_tokens ADD CONSTRAINT password_reset_tokens_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE;

-- Index for password_reset_tokens
CREATE UNIQUE INDEX password_reset_tokens_token_unique ON public.password_reset_tokens USING btree (token);

-- Index for password_reset_tokens
CREATE INDEX idx_password_reset_tokens_user ON public.password_reset_tokens USING btree (user_id);

-- Index for password_reset_tokens
CREATE INDEX idx_password_reset_tokens_token ON public.password_reset_tokens USING btree (token);

-- Index for password_reset_tokens
CREATE INDEX idx_password_reset_tokens_expires ON public.password_reset_tokens USING btree (expires_at);

-- ===========================================
-- TABLE: permission_group_items
-- ===========================================
CREATE TABLE public.permission_group_items (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL,
    permission_id UUID NOT NULL
);

-- Primary Key for permission_group_items
ALTER TABLE public.permission_group_items ADD CONSTRAINT permission_group_items_pkey PRIMARY KEY (id);

-- Foreign Key for permission_group_items
ALTER TABLE public.permission_group_items ADD CONSTRAINT permission_group_items_permission_id_permissions_id_fk FOREIGN KEY (permission_id) REFERENCES public.permissions (id) ON DELETE CASCADE;

-- Foreign Key for permission_group_items
ALTER TABLE public.permission_group_items ADD CONSTRAINT permission_group_items_group_id_permission_groups_id_fk FOREIGN KEY (group_id) REFERENCES public.permission_groups (id) ON DELETE CASCADE;

-- Index for permission_group_items
CREATE INDEX idx_pg_items_group ON public.permission_group_items USING btree (group_id);

-- Index for permission_group_items
CREATE UNIQUE INDEX permission_group_items_unique ON public.permission_group_items USING btree (group_id, permission_id);

-- ===========================================
-- TABLE: permission_groups
-- ===========================================
CREATE TABLE public.permission_groups (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id UUID,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Primary Key for permission_groups
ALTER TABLE public.permission_groups ADD CONSTRAINT permission_groups_pkey PRIMARY KEY (id);

-- Foreign Key for permission_groups
ALTER TABLE public.permission_groups ADD CONSTRAINT permission_groups_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants (id) ON DELETE CASCADE;

-- Index for permission_groups
CREATE UNIQUE INDEX permission_groups_tenant_code_unique ON public.permission_groups USING btree (tenant_id, code);

-- ===========================================
-- TABLE: permissions
-- ===========================================
CREATE TABLE public.permissions (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    module VARCHAR(50) NOT NULL,
    resource VARCHAR(50),
    action VARCHAR(50) NOT NULL,
    description TEXT,
    is_dangerous BOOLEAN NOT NULL DEFAULT false,
    requires_mfa BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Primary Key for permissions
ALTER TABLE public.permissions ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);

-- Index for permissions
CREATE INDEX idx_permissions_dangerous ON public.permissions USING btree (is_dangerous);

-- Index for permissions
CREATE UNIQUE INDEX permissions_code_unique ON public.permissions USING btree (code);

-- Index for permissions
CREATE INDEX idx_permissions_module ON public.permissions USING btree (module);

-- Index for permissions
CREATE INDEX idx_permissions_code ON public.permissions USING btree (code);

-- ===========================================
-- TABLE: project_members
-- ===========================================
CREATE TABLE public.project_members (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    project_id UUID NOT NULL,
    user_id UUID NOT NULL,
    role VARCHAR(50) DEFAULT 'member'::character varying,
    hourly_rate NUMERIC(10,2),
    can_edit BOOLEAN DEFAULT false,
    joined_at TIMESTAMP DEFAULT now(),
    left_at TIMESTAMP
);

-- Primary Key for project_members
ALTER TABLE public.project_members ADD CONSTRAINT project_members_pkey PRIMARY KEY (id);

-- Foreign Key for project_members
ALTER TABLE public.project_members ADD CONSTRAINT project_members_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants (id) ON DELETE CASCADE;

-- Foreign Key for project_members
ALTER TABLE public.project_members ADD CONSTRAINT project_members_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE;

-- Foreign Key for project_members
ALTER TABLE public.project_members ADD CONSTRAINT project_members_project_id_projects_id_fk FOREIGN KEY (project_id) REFERENCES public.projects (id) ON DELETE CASCADE;

-- Index for project_members
CREATE UNIQUE INDEX project_members_project_user_unique ON public.project_members USING btree (project_id, user_id);

-- Index for project_members
CREATE INDEX idx_project_members_tenant ON public.project_members USING btree (tenant_id);

-- ===========================================
-- TABLE: project_milestones
-- ===========================================
CREATE TABLE public.project_milestones (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    project_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE,
    amount NUMERIC(15,2),
    status VARCHAR(20) DEFAULT 'pending'::character varying,
    completed_at TIMESTAMP,
    sort_order INTEGER DEFAULT 0,
    created_by UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Primary Key for project_milestones
ALTER TABLE public.project_milestones ADD CONSTRAINT project_milestones_pkey PRIMARY KEY (id);

-- Foreign Key for project_milestones
ALTER TABLE public.project_milestones ADD CONSTRAINT project_milestones_project_id_projects_id_fk FOREIGN KEY (project_id) REFERENCES public.projects (id) ON DELETE CASCADE;

-- Foreign Key for project_milestones
ALTER TABLE public.project_milestones ADD CONSTRAINT project_milestones_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users (id);

-- Foreign Key for project_milestones
ALTER TABLE public.project_milestones ADD CONSTRAINT project_milestones_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants (id) ON DELETE CASCADE;

-- Index for project_milestones
CREATE INDEX idx_project_milestones_project ON public.project_milestones USING btree (project_id);

-- Index for project_milestones
CREATE INDEX idx_project_milestones_tenant ON public.project_milestones USING btree (tenant_id);

-- ===========================================
-- TABLE: projects
-- ===========================================
CREATE TABLE public.projects (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    project_code VARCHAR(50),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    project_type VARCHAR(50),
    status VARCHAR(50) DEFAULT 'open'::character varying,
    priority VARCHAR(20) DEFAULT 'medium'::character varying,
    start_date DATE,
    deadline DATE,
    completed_at TIMESTAMP,
    estimated_hours NUMERIC(10,2),
    actual_hours NUMERIC(10,2) DEFAULT '0'::numeric,
    budget_amount NUMERIC(15,2),
    spent_amount NUMERIC(15,2) DEFAULT '0'::numeric,
    price NUMERIC(15,2),
    currency VARCHAR(10) DEFAULT 'USD'::character varying,
    progress_percentage INTEGER DEFAULT 0,
    billing_type VARCHAR(20) DEFAULT 'fixed'::character varying,
    is_billable BOOLEAN DEFAULT true,
    is_template BOOLEAN DEFAULT false,
    label_ids JSONB DEFAULT '[]'::jsonb,
    custom_fields JSONB DEFAULT '{}'::jsonb,
    settings JSONB DEFAULT '{}'::jsonb,
    notes TEXT,
    created_by UUID NOT NULL,
    updated_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    deleted_at TIMESTAMP
);

-- Primary Key for projects
ALTER TABLE public.projects ADD CONSTRAINT projects_pkey PRIMARY KEY (id);

-- Foreign Key for projects
ALTER TABLE public.projects ADD CONSTRAINT projects_updated_by_users_id_fk FOREIGN KEY (updated_by) REFERENCES public.users (id);

-- Foreign Key for projects
ALTER TABLE public.projects ADD CONSTRAINT projects_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants (id) ON DELETE CASCADE;

-- Foreign Key for projects
ALTER TABLE public.projects ADD CONSTRAINT projects_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users (id);

-- Index for projects
CREATE UNIQUE INDEX projects_project_code_unique ON public.projects USING btree (project_code);

-- Index for projects
CREATE INDEX idx_projects_status ON public.projects USING btree (status);

-- Index for projects
CREATE INDEX idx_projects_tenant ON public.projects USING btree (tenant_id);

-- ===========================================
-- TABLE: refresh_tokens
-- ===========================================
CREATE TABLE public.refresh_tokens (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    revoked BOOLEAN NOT NULL DEFAULT false,
    revoked_at TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT
);

-- Primary Key for refresh_tokens
ALTER TABLE public.refresh_tokens ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);

-- Foreign Key for refresh_tokens
ALTER TABLE public.refresh_tokens ADD CONSTRAINT refresh_tokens_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE;

-- Index for refresh_tokens
CREATE INDEX idx_refresh_tokens_user ON public.refresh_tokens USING btree (user_id);

-- Index for refresh_tokens
CREATE INDEX idx_refresh_tokens_hash ON public.refresh_tokens USING btree (token_hash);

-- ===========================================
-- TABLE: resource_permissions
-- ===========================================
CREATE TABLE public.resource_permissions (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID NOT NULL,
    permission_code VARCHAR(100) NOT NULL,
    granted_by UUID,
    valid_from TIMESTAMP DEFAULT now(),
    valid_until TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Primary Key for resource_permissions
ALTER TABLE public.resource_permissions ADD CONSTRAINT resource_permissions_pkey PRIMARY KEY (id);

-- Foreign Key for resource_permissions
ALTER TABLE public.resource_permissions ADD CONSTRAINT resource_permissions_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants (id) ON DELETE CASCADE;

-- Foreign Key for resource_permissions
ALTER TABLE public.resource_permissions ADD CONSTRAINT resource_permissions_granted_by_users_id_fk FOREIGN KEY (granted_by) REFERENCES public.users (id) ON DELETE SET NULL;

-- Foreign Key for resource_permissions
ALTER TABLE public.resource_permissions ADD CONSTRAINT resource_permissions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE;

-- Index for resource_permissions
CREATE INDEX idx_resource_permissions_resource ON public.resource_permissions USING btree (resource_type, resource_id);

-- Index for resource_permissions
CREATE INDEX idx_resource_permissions_temporal ON public.resource_permissions USING btree (valid_from, valid_until);

-- Index for resource_permissions
CREATE UNIQUE INDEX resource_permissions_unique ON public.resource_permissions USING btree (user_id, resource_type, resource_id, permission_code);

-- Index for resource_permissions
CREATE INDEX idx_resource_permissions_user ON public.resource_permissions USING btree (user_id);

-- ===========================================
-- TABLE: role_field_permissions
-- ===========================================
CREATE TABLE public.role_field_permissions (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL,
    module_id UUID NOT NULL,
    field_id UUID NOT NULL,
    is_visible BOOLEAN NOT NULL DEFAULT false,
    is_editable BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    created_by UUID,
    updated_by UUID
);

-- Primary Key for role_field_permissions
ALTER TABLE public.role_field_permissions ADD CONSTRAINT role_field_permissions_pkey PRIMARY KEY (id);

-- Foreign Key for role_field_permissions
ALTER TABLE public.role_field_permissions ADD CONSTRAINT role_field_permissions_module_id_modules_id_fk FOREIGN KEY (module_id) REFERENCES public.modules (id) ON DELETE CASCADE;

-- Foreign Key for role_field_permissions
ALTER TABLE public.role_field_permissions ADD CONSTRAINT role_field_permissions_role_id_roles_id_fk FOREIGN KEY (role_id) REFERENCES public.roles (id) ON DELETE CASCADE;

-- Foreign Key for role_field_permissions
ALTER TABLE public.role_field_permissions ADD CONSTRAINT role_field_permissions_field_id_module_fields_id_fk FOREIGN KEY (field_id) REFERENCES public.module_fields (id) ON DELETE CASCADE;

-- Index for role_field_permissions
CREATE INDEX idx_role_field_permissions_field ON public.role_field_permissions USING btree (field_id);

-- Index for role_field_permissions
CREATE INDEX idx_role_field_permissions_role ON public.role_field_permissions USING btree (role_id);

-- Index for role_field_permissions
CREATE INDEX idx_role_field_permissions_module ON public.role_field_permissions USING btree (module_id);

-- Index for role_field_permissions
CREATE UNIQUE INDEX role_field_permissions_unique ON public.role_field_permissions USING btree (role_id, module_id, field_id);

-- ===========================================
-- TABLE: role_module_access
-- ===========================================
CREATE TABLE public.role_module_access (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL,
    module_id UUID NOT NULL,
    has_access BOOLEAN NOT NULL DEFAULT false,
    data_access VARCHAR(20) NOT NULL DEFAULT 'none'::character varying,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    created_by UUID,
    updated_by UUID
);

-- Primary Key for role_module_access
ALTER TABLE public.role_module_access ADD CONSTRAINT role_module_access_pkey PRIMARY KEY (id);

-- Foreign Key for role_module_access
ALTER TABLE public.role_module_access ADD CONSTRAINT role_module_access_role_id_roles_id_fk FOREIGN KEY (role_id) REFERENCES public.roles (id) ON DELETE CASCADE;

-- Foreign Key for role_module_access
ALTER TABLE public.role_module_access ADD CONSTRAINT role_module_access_module_id_modules_id_fk FOREIGN KEY (module_id) REFERENCES public.modules (id) ON DELETE CASCADE;

-- Index for role_module_access
CREATE INDEX idx_role_module_access_role ON public.role_module_access USING btree (role_id);

-- Index for role_module_access
CREATE UNIQUE INDEX role_module_access_unique ON public.role_module_access USING btree (role_id, module_id);

-- Index for role_module_access
CREATE INDEX idx_role_module_access_module ON public.role_module_access USING btree (module_id);

-- ===========================================
-- TABLE: role_module_permissions
-- ===========================================
CREATE TABLE public.role_module_permissions (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL,
    module_id UUID NOT NULL,
    permission_id UUID NOT NULL,
    granted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    created_by UUID,
    updated_by UUID
);

-- Primary Key for role_module_permissions
ALTER TABLE public.role_module_permissions ADD CONSTRAINT role_module_permissions_pkey PRIMARY KEY (id);

-- Foreign Key for role_module_permissions
ALTER TABLE public.role_module_permissions ADD CONSTRAINT role_module_permissions_role_id_roles_id_fk FOREIGN KEY (role_id) REFERENCES public.roles (id) ON DELETE CASCADE;

-- Foreign Key for role_module_permissions
ALTER TABLE public.role_module_permissions ADD CONSTRAINT role_module_permissions_permission_id_permissions_id_fk FOREIGN KEY (permission_id) REFERENCES public.permissions (id) ON DELETE CASCADE;

-- Foreign Key for role_module_permissions
ALTER TABLE public.role_module_permissions ADD CONSTRAINT role_module_permissions_module_id_modules_id_fk FOREIGN KEY (module_id) REFERENCES public.modules (id) ON DELETE CASCADE;

-- Index for role_module_permissions
CREATE UNIQUE INDEX role_module_permissions_unique ON public.role_module_permissions USING btree (role_id, module_id, permission_id);

-- Index for role_module_permissions
CREATE INDEX idx_role_module_permissions_permission ON public.role_module_permissions USING btree (permission_id);

-- Index for role_module_permissions
CREATE INDEX idx_role_module_permissions_module ON public.role_module_permissions USING btree (module_id);

-- Index for role_module_permissions
CREATE INDEX idx_role_module_permissions_role ON public.role_module_permissions USING btree (role_id);

-- ===========================================
-- TABLE: role_permissions
-- ===========================================
CREATE TABLE public.role_permissions (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL,
    permission_id UUID NOT NULL,
    conditions JSONB,
    granted_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Primary Key for role_permissions
ALTER TABLE public.role_permissions ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);

-- Foreign Key for role_permissions
ALTER TABLE public.role_permissions ADD CONSTRAINT role_permissions_role_id_roles_id_fk FOREIGN KEY (role_id) REFERENCES public.roles (id) ON DELETE CASCADE;

-- Foreign Key for role_permissions
ALTER TABLE public.role_permissions ADD CONSTRAINT role_permissions_permission_id_permissions_id_fk FOREIGN KEY (permission_id) REFERENCES public.permissions (id) ON DELETE CASCADE;

-- Index for role_permissions
CREATE INDEX idx_role_permissions_role ON public.role_permissions USING btree (role_id);

-- Index for role_permissions
CREATE UNIQUE INDEX role_permissions_role_permission_unique ON public.role_permissions USING btree (role_id, permission_id);

-- Index for role_permissions
CREATE INDEX idx_role_permissions_conditions ON public.role_permissions USING btree (conditions);

-- Index for role_permissions
CREATE INDEX idx_role_permissions_permission ON public.role_permissions USING btree (permission_id);

-- ===========================================
-- TABLE: roles
-- ===========================================
CREATE TABLE public.roles (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id UUID,
    parent_role_id UUID,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT false,
    is_default BOOLEAN NOT NULL DEFAULT false,
    priority INTEGER NOT NULL DEFAULT 0,
    color VARCHAR(7),
    max_users INTEGER,
    status VARCHAR(20) NOT NULL DEFAULT 'active'::character varying,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Primary Key for roles
ALTER TABLE public.roles ADD CONSTRAINT roles_pkey PRIMARY KEY (id);

-- Foreign Key for roles
ALTER TABLE public.roles ADD CONSTRAINT roles_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants (id) ON DELETE CASCADE;

-- Index for roles
CREATE INDEX idx_roles_tenant ON public.roles USING btree (tenant_id);

-- Index for roles
CREATE INDEX idx_roles_code ON public.roles USING btree (code);

-- Index for roles
CREATE INDEX idx_roles_parent ON public.roles USING btree (parent_role_id);

-- Index for roles
CREATE INDEX idx_roles_status ON public.roles USING btree (status);

-- Index for roles
CREATE INDEX idx_roles_priority ON public.roles USING btree (priority);

-- Index for roles
CREATE UNIQUE INDEX roles_tenant_code_unique ON public.roles USING btree (tenant_id, code);

-- ===========================================
-- TABLE: sessions
-- ===========================================
CREATE TABLE public.sessions (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    token_hash TEXT NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    last_activity TIMESTAMP DEFAULT now(),
    expires_at TIMESTAMP NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Primary Key for sessions
ALTER TABLE public.sessions ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);

-- Foreign Key for sessions
ALTER TABLE public.sessions ADD CONSTRAINT sessions_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants (id) ON DELETE CASCADE;

-- Foreign Key for sessions
ALTER TABLE public.sessions ADD CONSTRAINT sessions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE;

-- Index for sessions
CREATE INDEX idx_sessions_user ON public.sessions USING btree (user_id);

-- Index for sessions
CREATE UNIQUE INDEX sessions_token_hash_unique ON public.sessions USING btree (token_hash);

-- Index for sessions
CREATE INDEX idx_sessions_expires ON public.sessions USING btree (expires_at);

-- Index for sessions
CREATE INDEX idx_sessions_activity ON public.sessions USING btree (last_activity);

-- ===========================================
-- TABLE: system_settings
-- ===========================================
CREATE TABLE public.system_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    setting_key TEXT NOT NULL,
    setting_value TEXT NOT NULL,
    category TEXT NOT NULL,
    subcategory TEXT,
    autoload BOOLEAN NOT NULL DEFAULT true,
    data_type TEXT DEFAULT 'string'::text,
    description TEXT,
    is_sensitive BOOLEAN NOT NULL DEFAULT false
);

-- Primary Key for system_settings
ALTER TABLE public.system_settings ADD CONSTRAINT system_settings_pkey PRIMARY KEY (id);

-- Index for system_settings
CREATE UNIQUE INDEX system_settings_key_unique ON public.system_settings USING btree (setting_key);

-- Index for system_settings
CREATE INDEX idx_system_settings_category_subcategory ON public.system_settings USING btree (category, subcategory);

-- Index for system_settings
CREATE INDEX idx_system_settings_autoload ON public.system_settings USING btree (autoload);

-- Index for system_settings
CREATE INDEX idx_system_settings_category ON public.system_settings USING btree (category);

-- ===========================================
-- TABLE: task_checklist_items
-- ===========================================
CREATE TABLE public.task_checklist_items (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    is_completed BOOLEAN DEFAULT false,
    completed_by UUID,
    completed_at TIMESTAMP,
    sort_order INTEGER DEFAULT 0
);

-- Primary Key for task_checklist_items
ALTER TABLE public.task_checklist_items ADD CONSTRAINT task_checklist_items_pkey PRIMARY KEY (id);

-- Foreign Key for task_checklist_items
ALTER TABLE public.task_checklist_items ADD CONSTRAINT task_checklist_items_task_id_tasks_id_fk FOREIGN KEY (task_id) REFERENCES public.tasks (id) ON DELETE CASCADE;

-- Foreign Key for task_checklist_items
ALTER TABLE public.task_checklist_items ADD CONSTRAINT task_checklist_items_completed_by_users_id_fk FOREIGN KEY (completed_by) REFERENCES public.users (id);

-- Index for task_checklist_items
CREATE INDEX idx_task_checklist_task ON public.task_checklist_items USING btree (task_id);

-- ===========================================
-- TABLE: task_collaborators
-- ===========================================
CREATE TABLE public.task_collaborators (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL,
    user_id UUID NOT NULL,
    added_at TIMESTAMP DEFAULT now()
);

-- Primary Key for task_collaborators
ALTER TABLE public.task_collaborators ADD CONSTRAINT task_collaborators_pkey PRIMARY KEY (id);

-- Foreign Key for task_collaborators
ALTER TABLE public.task_collaborators ADD CONSTRAINT task_collaborators_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE;

-- Foreign Key for task_collaborators
ALTER TABLE public.task_collaborators ADD CONSTRAINT task_collaborators_task_id_tasks_id_fk FOREIGN KEY (task_id) REFERENCES public.tasks (id) ON DELETE CASCADE;

-- Index for task_collaborators
CREATE INDEX idx_task_collaborators_task ON public.task_collaborators USING btree (task_id);

-- Index for task_collaborators
CREATE UNIQUE INDEX task_collaborators_task_user_unique ON public.task_collaborators USING btree (task_id, user_id);

-- ===========================================
-- TABLE: tasks
-- ===========================================
CREATE TABLE public.tasks (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    task_code VARCHAR(50),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    project_id UUID,
    milestone_id UUID,
    parent_task_id UUID,
    assigned_to UUID,
    status VARCHAR(50) DEFAULT 'to_do'::character varying,
    priority VARCHAR(20) DEFAULT 'medium'::character varying,
    points INTEGER,
    start_date DATE,
    deadline DATE,
    completed_at TIMESTAMP,
    estimated_hours NUMERIC(10,2),
    actual_hours NUMERIC(10,2) DEFAULT '0'::numeric,
    is_recurring BOOLEAN DEFAULT false,
    recurring_config JSONB,
    is_billable BOOLEAN DEFAULT true,
    label_ids JSONB DEFAULT '[]'::jsonb,
    custom_fields JSONB DEFAULT '{}'::jsonb,
    sort_order INTEGER DEFAULT 0,
    created_by UUID NOT NULL,
    updated_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    deleted_at TIMESTAMP
);

-- Primary Key for tasks
ALTER TABLE public.tasks ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);

-- Foreign Key for tasks
ALTER TABLE public.tasks ADD CONSTRAINT tasks_updated_by_users_id_fk FOREIGN KEY (updated_by) REFERENCES public.users (id);

-- Foreign Key for tasks
ALTER TABLE public.tasks ADD CONSTRAINT tasks_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users (id);

-- Foreign Key for tasks
ALTER TABLE public.tasks ADD CONSTRAINT tasks_assigned_to_users_id_fk FOREIGN KEY (assigned_to) REFERENCES public.users (id) ON DELETE SET NULL;

-- Foreign Key for tasks
ALTER TABLE public.tasks ADD CONSTRAINT tasks_milestone_id_project_milestones_id_fk FOREIGN KEY (milestone_id) REFERENCES public.project_milestones (id) ON DELETE SET NULL;

-- Foreign Key for tasks
ALTER TABLE public.tasks ADD CONSTRAINT tasks_project_id_projects_id_fk FOREIGN KEY (project_id) REFERENCES public.projects (id) ON DELETE CASCADE;

-- Foreign Key for tasks
ALTER TABLE public.tasks ADD CONSTRAINT tasks_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants (id) ON DELETE CASCADE;

-- Index for tasks
CREATE INDEX idx_tasks_status ON public.tasks USING btree (status);

-- Index for tasks
CREATE UNIQUE INDEX tasks_task_code_unique ON public.tasks USING btree (task_code);

-- Index for tasks
CREATE INDEX idx_tasks_tenant ON public.tasks USING btree (tenant_id);

-- ===========================================
-- TABLE: students
-- ===========================================
CREATE TABLE public.students (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    roll_number VARCHAR(50) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(30),
    course VARCHAR(100),
    semester VARCHAR(20),
    admission_date DATE,
    status VARCHAR(20) DEFAULT 'active'::character varying,
    label_ids JSONB DEFAULT '[]'::jsonb,
    custom_fields JSONB DEFAULT '{}'::jsonb,
    created_by UUID NOT NULL,
    updated_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    deleted_at TIMESTAMP
);

-- Primary Key for students
ALTER TABLE public.students ADD CONSTRAINT students_pkey PRIMARY KEY (id);

-- Foreign Key for students
ALTER TABLE public.students ADD CONSTRAINT students_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants (id) ON DELETE CASCADE;
ALTER TABLE public.students ADD CONSTRAINT students_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users (id);
ALTER TABLE public.students ADD CONSTRAINT students_updated_by_users_id_fk FOREIGN KEY (updated_by) REFERENCES public.users (id);

-- Indexes for students
CREATE INDEX idx_students_tenant ON public.students USING btree (tenant_id);
CREATE INDEX idx_students_status ON public.students USING btree (status);
CREATE UNIQUE INDEX students_tenant_roll_unique ON public.students USING btree (tenant_id, roll_number);

-- ===========================================
-- TABLE: tenant_users
-- ===========================================
CREATE TABLE public.tenant_users (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    role_id UUID,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    joined_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Primary Key for tenant_users
ALTER TABLE public.tenant_users ADD CONSTRAINT tenant_users_pkey PRIMARY KEY (id);

-- Foreign Key for tenant_users
ALTER TABLE public.tenant_users ADD CONSTRAINT tenant_users_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants (id) ON DELETE CASCADE;

-- Foreign Key for tenant_users
ALTER TABLE public.tenant_users ADD CONSTRAINT tenant_users_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE;

-- Foreign Key for tenant_users
ALTER TABLE public.tenant_users ADD CONSTRAINT tenant_users_role_id_roles_id_fk FOREIGN KEY (role_id) REFERENCES public.roles (id) ON DELETE SET NULL;

-- Index for tenant_users
CREATE INDEX idx_tenant_users_tenant ON public.tenant_users USING btree (tenant_id);

-- Index for tenant_users
CREATE INDEX idx_tenant_users_user ON public.tenant_users USING btree (user_id);

-- Index for tenant_users
CREATE UNIQUE INDEX tenant_users_tenant_user_unique ON public.tenant_users USING btree (tenant_id, user_id);

-- ===========================================
-- TABLE: tenants
-- ===========================================
CREATE TABLE public.tenants (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    settings JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(20) NOT NULL DEFAULT 'active'::character varying,
    plan VARCHAR(50) NOT NULL DEFAULT 'free'::character varying,
    max_users INTEGER DEFAULT 10,
    trial_ends_at TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    deleted_at TIMESTAMP
);

-- Primary Key for tenants
ALTER TABLE public.tenants ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);

-- Index for tenants
CREATE INDEX idx_tenants_status ON public.tenants USING btree (status);

-- Index for tenants
CREATE INDEX idx_tenants_plan ON public.tenants USING btree (plan);

-- Index for tenants
CREATE INDEX idx_tenants_slug ON public.tenants USING btree (slug);

-- Index for tenants
CREATE UNIQUE INDEX tenants_slug_unique ON public.tenants USING btree (slug);

-- ===========================================
-- TABLE: user_roles
-- ===========================================
CREATE TABLE public.user_roles (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    role_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    granted_by UUID,
    valid_from TIMESTAMP DEFAULT now(),
    valid_until TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb,
    assigned_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Primary Key for user_roles
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);

-- Foreign Key for user_roles
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants (id) ON DELETE CASCADE;

-- Foreign Key for user_roles
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_role_id_roles_id_fk FOREIGN KEY (role_id) REFERENCES public.roles (id) ON DELETE CASCADE;

-- Foreign Key for user_roles
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE;

-- Foreign Key for user_roles
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_granted_by_users_id_fk FOREIGN KEY (granted_by) REFERENCES public.users (id) ON DELETE SET NULL;

-- Index for user_roles
CREATE INDEX idx_user_roles_temporal ON public.user_roles USING btree (valid_from, valid_until);

-- Index for user_roles
CREATE UNIQUE INDEX user_roles_user_role_tenant_unique ON public.user_roles USING btree (user_id, role_id, tenant_id);

-- Index for user_roles
CREATE INDEX idx_user_roles_user ON public.user_roles USING btree (user_id);

-- Index for user_roles
CREATE INDEX idx_user_roles_role ON public.user_roles USING btree (role_id);

-- Index for user_roles
CREATE INDEX idx_user_roles_tenant ON public.user_roles USING btree (tenant_id);

-- ===========================================
-- TABLE: users
-- ===========================================
CREATE TABLE public.users (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id UUID,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255),
    full_name VARCHAR(255),
    avatar_url TEXT,
    phone_number VARCHAR(30),
    job_title VARCHAR(100),
    department VARCHAR(100),
    company_name VARCHAR(255),
    date_of_birth DATE,
    bio TEXT,
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'pending'::character varying,
    email_verified BOOLEAN NOT NULL DEFAULT false,
    two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
    two_factor_secret TEXT,
    timezone VARCHAR(50) DEFAULT 'UTC'::character varying,
    locale VARCHAR(10) DEFAULT 'en'::character varying,
    last_login_at TIMESTAMP,
    last_login_ip VARCHAR(45),
    failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    deleted_at TIMESTAMP
);

-- Primary Key for users
ALTER TABLE public.users ADD CONSTRAINT users_pkey PRIMARY KEY (id);

-- Foreign Key for users
ALTER TABLE public.users ADD CONSTRAINT users_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants (id) ON DELETE CASCADE;

-- Index for users
CREATE INDEX idx_users_status ON public.users USING btree (status);

-- Index for users
CREATE INDEX idx_users_locked ON public.users USING btree (locked_until);

-- Index for users
CREATE INDEX idx_users_deleted ON public.users USING btree (deleted_at);

-- Index for users
CREATE INDEX idx_users_tenant ON public.users USING btree (tenant_id);

-- Index for users
CREATE INDEX idx_users_email ON public.users USING btree (email);

-- Index for users
CREATE UNIQUE INDEX users_tenant_email_unique ON public.users USING btree (tenant_id, email);

