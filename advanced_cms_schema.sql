-- ========================================
-- Advanced CMS Schema - Full Website Builder
-- ========================================

-- 1. Sections Table (for dynamic sections)
CREATE TABLE IF NOT EXISTS public.cms_sections (
    id SERIAL PRIMARY KEY,
    section_key TEXT NOT NULL UNIQUE,
    section_type TEXT NOT NULL, -- 'hero', 'features', 'gallery', 'testimonials', 'custom'
    title TEXT,
    subtitle TEXT,
    background_color TEXT DEFAULT '#1a1a1a',
    background_image TEXT,
    padding_top INTEGER DEFAULT 80,
    padding_bottom INTEGER DEFAULT 80,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    is_system BOOLEAN DEFAULT FALSE, -- system sections can't be deleted
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- 2. Section Items Table (content blocks within sections)
CREATE TABLE IF NOT EXISTS public.cms_section_items (
    id SERIAL PRIMARY KEY,
    section_id INTEGER NOT NULL REFERENCES public.cms_sections(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL, -- 'text', 'image', 'button', 'card', 'icon'
    content_text TEXT,
    content_html TEXT,
    image_url TEXT,
    link_url TEXT,
    link_text TEXT,
    icon_name TEXT,
    layout_column INTEGER DEFAULT 1, -- for grid layouts
    layout_row INTEGER DEFAULT 1,
    display_order INTEGER DEFAULT 0,
    styles JSONB, -- custom CSS as JSON
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Menu Items Table (for dynamic navigation)
CREATE TABLE IF NOT EXISTS public.cms_menu_items (
    id SERIAL PRIMARY KEY,
    menu_location TEXT NOT NULL, -- 'header', 'footer', 'mobile'
    label TEXT NOT NULL,
    link_url TEXT NOT NULL,
    icon TEXT,
    parent_id INTEGER REFERENCES public.cms_menu_items(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    target TEXT DEFAULT '_self', -- '_blank', '_self'
    css_class TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Site Settings Table (global settings)
CREATE TABLE IF NOT EXISTS public.cms_site_settings (
    id SERIAL PRIMARY KEY,
    setting_key TEXT NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type TEXT DEFAULT 'text', -- 'text', 'number', 'color', 'image', 'boolean'
    category TEXT DEFAULT 'general', -- 'general', 'design', 'seo', 'advanced'
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Media Library Table
CREATE TABLE IF NOT EXISTS public.cms_media (
    id SERIAL PRIMARY KEY,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL, -- 'image', 'video', 'document'
    file_size INTEGER, -- in bytes
    mime_type TEXT,
    alt_text TEXT,
    caption TEXT,
    uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================================
-- RLS Policies
-- ========================================

-- Enable RLS
ALTER TABLE public.cms_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_section_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_media ENABLE ROW LEVEL SECURITY;

-- Public read access for all CMS content
CREATE POLICY "Public can read active sections"
    ON public.cms_sections FOR SELECT
    TO public
    USING (is_active = TRUE);

CREATE POLICY "Public can read active section items"
    ON public.cms_section_items FOR SELECT
    TO public
    USING (is_active = TRUE);

CREATE POLICY "Public can read active menu items"
    ON public.cms_menu_items FOR SELECT
    TO public
    USING (is_active = TRUE);

CREATE POLICY "Public can read site settings"
    ON public.cms_site_settings FOR SELECT
    TO public
    USING (TRUE);

CREATE POLICY "Public can read media"
    ON public.cms_media FOR SELECT
    TO public
    USING (TRUE);

-- Admin-only write access
CREATE POLICY "Admins can manage sections"
    ON public.cms_sections FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can manage section items"
    ON public.cms_section_items FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can manage menu items"
    ON public.cms_menu_items FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can manage site settings"
    ON public.cms_site_settings FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can manage media"
    ON public.cms_media FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

-- ========================================
-- Triggers for updated_at
-- ========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_cms_sections_updated_at
    BEFORE UPDATE ON public.cms_sections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cms_section_items_updated_at
    BEFORE UPDATE ON public.cms_section_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cms_menu_items_updated_at
    BEFORE UPDATE ON public.cms_menu_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cms_site_settings_updated_at
    BEFORE UPDATE ON public.cms_site_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- Default Data - System Sections
-- ========================================

INSERT INTO public.cms_sections (section_key, section_type, title, subtitle, display_order, is_system) VALUES
('hero', 'hero', 'גאון', 'של אמא', 1, TRUE),
('features', 'features', 'הקסם שלנו', 'גלו איך "גאון" הופכת כל רגע של למידה להרפתקה אישית ומרגשת', 2, TRUE),
('how_it_works', 'steps', 'איך הקסם עובד?', 'בכמה צעדים פשוטים, תפתחו עולם שלם של יצירה ולמידה', 3, TRUE),
('showcase', 'gallery', 'הצצה לעולם הקסום שלנו', 'ראו דוגמאות למה שתוכלו ליצור', 4, TRUE),
('testimonials', 'testimonials', 'הורים ממליצים', 'אל תאמינו רק לנו', 5, TRUE),
('pricing', 'pricing', 'תוכניות מחיר', 'בחרו את התוכנית המתאימה לכם', 6, TRUE),
('about', 'custom', 'אודות', 'קצת עלינו', 7, TRUE)
ON CONFLICT (section_key) DO NOTHING;

-- ========================================
-- Default Data - Menu Items
-- ========================================

INSERT INTO public.cms_menu_items (menu_location, label, link_url, icon, display_order) VALUES
('header', 'ראשי', '#hero', '🏠', 1),
('header', 'תכונות', '#features', '✨', 2),
('header', 'איך זה עובד', '#how-it-works', '🎯', 3),
('header', 'מחירים', '#pricing', '💳', 4),
('header', 'צור קשר', '#about', '📧', 5)
ON CONFLICT DO NOTHING;

-- ========================================
-- Default Data - Site Settings
-- ========================================

INSERT INTO public.cms_site_settings (setting_key, setting_value, setting_type, category, description) VALUES
('site_title', 'גאון - פלטפורמת למידה לילדים', 'text', 'general', 'כותרת האתר'),
('site_description', 'פלטפורמת למידה ויצירה מותאמת אישית לילדים', 'text', 'seo', 'תיאור האתר למנועי חיפוש'),
('primary_color', '#7FD957', 'color', 'design', 'צבע ראשי'),
('secondary_color', '#56D989', 'color', 'design', 'צבע משני'),
('logo_url', '/logo.png', 'image', 'design', 'לוגו האתר'),
('contact_email', 'contact@gaon.com', 'text', 'general', 'אימייל ליצירת קשר'),
('show_animations', 'true', 'boolean', 'design', 'הצג אנימציות'),
('max_width', '1200', 'number', 'design', 'רוחב מקסימלי של תוכן (פיקסלים)')
ON CONFLICT (setting_key) DO NOTHING;

-- ========================================
-- Indexes for Performance
-- ========================================

CREATE INDEX IF NOT EXISTS idx_sections_order ON public.cms_sections(display_order, is_active);
CREATE INDEX IF NOT EXISTS idx_section_items_section ON public.cms_section_items(section_id, display_order);
CREATE INDEX IF NOT EXISTS idx_menu_location ON public.cms_menu_items(menu_location, display_order);
CREATE INDEX IF NOT EXISTS idx_media_type ON public.cms_media(file_type, created_at);

-- ========================================
-- Views for Easy Querying
-- ========================================

CREATE OR REPLACE VIEW cms_sections_with_items AS
SELECT
    s.*,
    COALESCE(
        json_agg(
            json_build_object(
                'id', i.id,
                'item_type', i.item_type,
                'content_text', i.content_text,
                'content_html', i.content_html,
                'image_url', i.image_url,
                'link_url', i.link_url,
                'link_text', i.link_text,
                'icon_name', i.icon_name,
                'layout_column', i.layout_column,
                'layout_row', i.layout_row,
                'display_order', i.display_order,
                'styles', i.styles
            ) ORDER BY i.display_order
        ) FILTER (WHERE i.id IS NOT NULL),
        '[]'::json
    ) AS items
FROM public.cms_sections s
LEFT JOIN public.cms_section_items i ON s.id = i.section_id AND i.is_active = TRUE
WHERE s.is_active = TRUE
GROUP BY s.id
ORDER BY s.display_order;

COMMENT ON TABLE public.cms_sections IS 'Dynamic website sections with customizable layout';
COMMENT ON TABLE public.cms_section_items IS 'Content blocks within each section';
COMMENT ON TABLE public.cms_menu_items IS 'Navigation menu items';
COMMENT ON TABLE public.cms_site_settings IS 'Global site configuration';
COMMENT ON TABLE public.cms_media IS 'Media library for uploaded files';
