-- ========================================
-- Security Enhancement & Activity Logging
-- Only ofirbaranesad@gmail.com can edit!
-- ========================================

-- 1. Create Activity Log Table
CREATE TABLE IF NOT EXISTS public.activity_log (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    user_email TEXT NOT NULL,
    action_type TEXT NOT NULL, -- 'create', 'update', 'delete', 'view', 'login', 'logout'
    resource_type TEXT NOT NULL, -- 'section', 'menu', 'setting', 'content', 'user', 'profile'
    resource_id TEXT,
    old_value JSONB,
    new_value JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for fast queries
CREATE INDEX IF NOT EXISTS idx_activity_log_user ON public.activity_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_email ON public.activity_log(user_email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_action ON public.activity_log(action_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_resource ON public.activity_log(resource_type, created_at DESC);

-- Enable RLS
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Only super admin can view logs
CREATE POLICY "Only super admin can view activity logs"
    ON public.activity_log FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.email = 'ofirbaranesad@gmail.com'
            AND users.role = 'admin'
        )
    );

-- All authenticated users can insert (for logging their own actions)
CREATE POLICY "Users can log their own actions"
    ON public.activity_log FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- ========================================
-- Update RLS Policies - SUPER ADMIN ONLY
-- ========================================

-- Drop existing admin policies
DROP POLICY IF EXISTS "Admins can manage sections" ON public.cms_sections;
DROP POLICY IF EXISTS "Admins can manage section items" ON public.cms_section_items;
DROP POLICY IF EXISTS "Admins can manage menu items" ON public.cms_menu_items;
DROP POLICY IF EXISTS "Admins can manage site settings" ON public.cms_site_settings;
DROP POLICY IF EXISTS "Admins can manage media" ON public.cms_media;
DROP POLICY IF EXISTS "Admins can update landing page content" ON public.landing_page_content;

-- Create NEW policies - ONLY ofirbaranesad@gmail.com
CREATE POLICY "Only super admin can manage sections"
    ON public.cms_sections FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.email = 'ofirbaranesad@gmail.com'
            AND users.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.email = 'ofirbaranesad@gmail.com'
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Only super admin can manage section items"
    ON public.cms_section_items FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.email = 'ofirbaranesad@gmail.com'
            AND users.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.email = 'ofirbaranesad@gmail.com'
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Only super admin can manage menu items"
    ON public.cms_menu_items FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.email = 'ofirbaranesad@gmail.com'
            AND users.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.email = 'ofirbaranesad@gmail.com'
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Only super admin can manage site settings"
    ON public.cms_site_settings FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.email = 'ofirbaranesad@gmail.com'
            AND users.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.email = 'ofirbaranesad@gmail.com'
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Only super admin can manage media"
    ON public.cms_media FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.email = 'ofirbaranesad@gmail.com'
            AND users.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.email = 'ofirbaranesad@gmail.com'
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Only super admin can update landing page content"
    ON public.landing_page_content FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.email = 'ofirbaranesad@gmail.com'
            AND users.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.email = 'ofirbaranesad@gmail.com'
            AND users.role = 'admin'
        )
    );

-- ========================================
-- Logging Triggers
-- ========================================

-- Function to log section changes
CREATE OR REPLACE FUNCTION log_cms_section_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        INSERT INTO public.activity_log (user_id, user_email, action_type, resource_type, resource_id, old_value)
        VALUES (
            auth.uid(),
            (SELECT email FROM public.users WHERE id = auth.uid()),
            'delete',
            'section',
            OLD.id::TEXT,
            row_to_json(OLD)::JSONB
        );
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.activity_log (user_id, user_email, action_type, resource_type, resource_id, old_value, new_value)
        VALUES (
            auth.uid(),
            (SELECT email FROM public.users WHERE id = auth.uid()),
            'update',
            'section',
            NEW.id::TEXT,
            row_to_json(OLD)::JSONB,
            row_to_json(NEW)::JSONB
        );
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO public.activity_log (user_id, user_email, action_type, resource_type, resource_id, new_value)
        VALUES (
            auth.uid(),
            (SELECT email FROM public.users WHERE id = auth.uid()),
            'create',
            'section',
            NEW.id::TEXT,
            row_to_json(NEW)::JSONB
        );
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to cms_sections
DROP TRIGGER IF EXISTS log_cms_section_changes_trigger ON public.cms_sections;
CREATE TRIGGER log_cms_section_changes_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.cms_sections
    FOR EACH ROW EXECUTE FUNCTION log_cms_section_changes();

-- Function to log menu changes
CREATE OR REPLACE FUNCTION log_cms_menu_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        INSERT INTO public.activity_log (user_id, user_email, action_type, resource_type, resource_id, old_value)
        VALUES (
            auth.uid(),
            (SELECT email FROM public.users WHERE id = auth.uid()),
            'delete',
            'menu_item',
            OLD.id::TEXT,
            row_to_json(OLD)::JSONB
        );
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.activity_log (user_id, user_email, action_type, resource_type, resource_id, old_value, new_value)
        VALUES (
            auth.uid(),
            (SELECT email FROM public.users WHERE id = auth.uid()),
            'update',
            'menu_item',
            NEW.id::TEXT,
            row_to_json(OLD)::JSONB,
            row_to_json(NEW)::JSONB
        );
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO public.activity_log (user_id, user_email, action_type, resource_type, resource_id, new_value)
        VALUES (
            auth.uid(),
            (SELECT email FROM public.users WHERE id = auth.uid()),
            'create',
            'menu_item',
            NEW.id::TEXT,
            row_to_json(NEW)::JSONB
        );
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to cms_menu_items
DROP TRIGGER IF EXISTS log_cms_menu_changes_trigger ON public.cms_menu_items;
CREATE TRIGGER log_cms_menu_changes_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.cms_menu_items
    FOR EACH ROW EXECUTE FUNCTION log_cms_menu_changes();

-- Function to log settings changes
CREATE OR REPLACE FUNCTION log_cms_settings_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.activity_log (user_id, user_email, action_type, resource_type, resource_id, old_value, new_value)
        VALUES (
            auth.uid(),
            (SELECT email FROM public.users WHERE id = auth.uid()),
            'update',
            'site_setting',
            NEW.setting_key,
            jsonb_build_object('value', OLD.setting_value),
            jsonb_build_object('value', NEW.setting_value)
        );
        RETURN NEW;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to cms_site_settings
DROP TRIGGER IF EXISTS log_cms_settings_changes_trigger ON public.cms_site_settings;
CREATE TRIGGER log_cms_settings_changes_trigger
    AFTER UPDATE ON public.cms_site_settings
    FOR EACH ROW EXECUTE FUNCTION log_cms_settings_changes();

-- ========================================
-- Helper Views for Activity Monitoring
-- ========================================

-- Recent activity view
CREATE OR REPLACE VIEW recent_activity AS
SELECT
    al.id,
    al.user_email,
    al.action_type,
    al.resource_type,
    al.resource_id,
    al.created_at,
    CASE
        WHEN al.action_type = 'update' AND al.old_value IS NOT NULL AND al.new_value IS NOT NULL THEN
            jsonb_build_object(
                'changed_fields',
                (SELECT jsonb_object_agg(key, jsonb_build_object('old', al.old_value->key, 'new', al.new_value->key))
                 FROM jsonb_each(al.new_value)
                 WHERE al.old_value->key IS DISTINCT FROM al.new_value->key)
            )
        ELSE NULL
    END AS changes_summary
FROM public.activity_log al
ORDER BY al.created_at DESC
LIMIT 100;

-- User activity summary
CREATE OR REPLACE VIEW user_activity_summary AS
SELECT
    u.email,
    u.username,
    COUNT(*) FILTER (WHERE al.action_type = 'create') as creates_count,
    COUNT(*) FILTER (WHERE al.action_type = 'update') as updates_count,
    COUNT(*) FILTER (WHERE al.action_type = 'delete') as deletes_count,
    COUNT(*) as total_actions,
    MAX(al.created_at) as last_activity
FROM public.users u
LEFT JOIN public.activity_log al ON u.id = al.user_id
GROUP BY u.id, u.email, u.username
ORDER BY total_actions DESC;

-- Daily activity stats
CREATE OR REPLACE VIEW daily_activity_stats AS
SELECT
    DATE(created_at) as activity_date,
    action_type,
    resource_type,
    COUNT(*) as action_count
FROM public.activity_log
GROUP BY DATE(created_at), action_type, resource_type
ORDER BY activity_date DESC, action_count DESC;

-- Grant access to views (super admin only)
GRANT SELECT ON recent_activity TO authenticated;
GRANT SELECT ON user_activity_summary TO authenticated;
GRANT SELECT ON daily_activity_stats TO authenticated;

COMMENT ON TABLE public.activity_log IS 'Comprehensive activity logging for audit trail';
COMMENT ON VIEW recent_activity IS 'Last 100 activities with change summaries';
COMMENT ON VIEW user_activity_summary IS 'Per-user activity statistics';
COMMENT ON VIEW daily_activity_stats IS 'Daily activity breakdown';
