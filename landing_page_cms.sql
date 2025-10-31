-- ========================================
-- Landing Page CMS - Content Management System
-- ========================================

-- Drop existing table if exists
DROP TABLE IF EXISTS public.landing_page_content CASCADE;

-- Create landing_page_content table
CREATE TABLE IF NOT EXISTS public.landing_page_content (
    id SERIAL PRIMARY KEY,
    section_key TEXT NOT NULL UNIQUE, -- e.g., 'hero_title', 'hero_subtitle', 'feature_1_title'
    content_type TEXT NOT NULL DEFAULT 'text', -- 'text', 'image', 'richtext'
    content_value TEXT NOT NULL,
    image_url TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- Create index for faster lookups
CREATE INDEX idx_landing_section_key ON public.landing_page_content(section_key);
CREATE INDEX idx_landing_is_active ON public.landing_page_content(is_active);

-- Enable RLS
ALTER TABLE public.landing_page_content ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Everyone can read, only admins can modify
CREATE POLICY "Anyone can view landing page content"
    ON public.landing_page_content
    FOR SELECT
    USING (true);

CREATE POLICY "Admins can update landing page content"
    ON public.landing_page_content
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can insert landing page content"
    ON public.landing_page_content
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can delete landing page content"
    ON public.landing_page_content
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Insert default content
INSERT INTO public.landing_page_content (section_key, content_type, content_value, display_order) VALUES
-- Hero Section
('hero_title', 'text', 'גאון', 1),
('hero_subtitle', 'text', 'של אמא', 2),
('hero_description', 'text', 'פלטפורמת למידה ויצירה מותאמת אישית. הפכו את ילדכם לגיבור הסיפור, צרו חוברות עבודה חכמות ופתחו עולם שלם של דמיון וידע.', 3),
('hero_cta_text', 'text', 'התחילו ליצור עכשיו', 4),
('hero_logo_url', 'image', '/logo.png', 5),

-- Features Section
('features_title', 'text', 'מה אנחנו מציעים?', 10),
('features_subtitle', 'text', 'כלים חכמים שהופכים למידה ויצירה לחוויה קסומה ומותאמת אישית.', 11),

-- Feature 1
('feature_1_icon', 'text', '📖', 12),
('feature_1_title', 'text', 'סיפורים אישיים מאוירים', 13),
('feature_1_description', 'text', 'הילד שלכם הופך לגיבור בסיפור הרפתקאות עם איורים מרהיבים, שנוצרים במיוחד עבורו תוך שמירה על תווי הפנים שלו.', 14),

-- Feature 2
('feature_2_icon', 'text', '✏️', 15),
('feature_2_title', 'text', 'חוברות למידה חכמות', 16),
('feature_2_description', 'text', 'חוברות עבודה דינמיות המותאמות לגיל, לרמה ולתחומי העניין של הילד שלכם. למידה יעילה וחווייתית בו-זמנית!', 17),

-- Feature 3
('feature_3_icon', 'text', '🧠', 18),
('feature_3_title', 'text', 'תוכניות למידה מותאמות', 19),
('feature_3_description', 'text', 'קבלו תוכנית למידה מקיפה ומפורטת עם עצות פדגוגיות, שמותאמת בדיוק לילד ומטרות הלמידה שלכם.', 20),

-- How It Works
('howitworks_title', 'text', 'איך הקסם עובד?', 30),
('howitworks_subtitle', 'text', 'בכמה צעדים פשוטים, תפתחו עולם שלם של יצירה ולמידה מותאמת אישית.', 31),

-- Step 1
('step_1_number', 'text', '01', 32),
('step_1_title', 'text', 'יוצרים פרופיל', 33),
('step_1_description', 'text', 'הקימו פרופיל אישי לכל ילד, עם תחומי העניין, הגיל ומטרות הלמידה שלו. אפשר גם להעלות תמונה לחוויה אישית במיוחד.', 34),

-- Step 2
('step_2_number', 'text', '02', 35),
('step_2_title', 'text', 'בוחרים פעילות', 36),
('step_2_description', 'text', 'האם תרצו לצאת להרפתקה בסיפור אישי מאויר, או ליצור חוברת עבודה חכמה המבוססת על תחומי העניין של הילד?', 37),

-- Step 3
('step_3_number', 'text', '03', 38),
('step_3_title', 'text', 'יוצרים ולומדים', 39),
('step_3_description', 'text', 'היו שותפים פעילים ביצירה! המערכת תבנה עבורכם תוכן ייחודי, ואתם תוכלו לכוון, לשנות וליהנות מהתוצאה המדהימה.', 40),

-- Showcase
('showcase_title', 'text', 'הצצה לעולם הקסום שלנו', 50),
('showcase_subtitle', 'text', 'ראו דוגמאות למה שתוכלו ליצור עם "גאון" בכמה לחיצות כפתור.', 51),

-- Showcase 1
('showcase_1_image', 'image', 'https://images.unsplash.com/photo-1531362221037-9a6e14a1a516?q=80&w=800&auto=format&fit=crop', 52),
('showcase_1_title', 'text', 'סיפור אישי מאויר', 53),
('showcase_1_description', 'text', 'הילד שלכם הופך לגיבור בסיפור הרפתקאות עם איורים מרהיבים שנוצרים במיוחד עבורו, תוך שמירה על תווי פניו.', 54),

-- Showcase 2
('showcase_2_image', 'image', 'https://images.unsplash.com/photo-1456743625079-86a97ff8bc82?q=80&w=800&auto=format&fit=crop', 55),
('showcase_2_title', 'text', 'חוברת למידה חכמה', 56),
('showcase_2_description', 'text', 'תרגול חשבון הופך למסע בחלל ותרגול אותיות הופך למשימה בממלכת הפיות. הלמידה מותאמת לתחומי העניין של כל ילד.', 57),

-- Testimonials
('testimonials_title', 'text', 'הורים ממליצים', 60),
('testimonials_subtitle', 'text', 'אל תאמינו רק לנו. שמעו מה יש למשפחות אחרות לספר על החוויה שלהן עם "גאון".', 61),

-- Testimonial 1
('testimonial_1_text', 'text', '״הבת שלי, מאיה, אף פעם לא התלהבה כל כך מלימוד אותיות. החוברות שיצרנו עם חדי-קרן ופיות פשוט ריתקו אותה. ממליצה בחום!״', 62),
('testimonial_1_name', 'text', 'יעל כהן', 63),
('testimonial_1_role', 'text', 'אמא של מאיה, בת 5', 64),
('testimonial_1_avatar', 'image', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=100&auto=format&fit=crop', 65),

-- Testimonial 2
('testimonial_2_text', 'text', '״כלי מדהים. הסיפורים האישיים עם התמונה של הבן שלי הפכו לטקס קבוע לפני השינה. הוא מרגיש כמו גיבור-על אמיתי. תודה!״', 66),
('testimonial_2_name', 'text', 'דוד לוי', 67),
('testimonial_2_role', 'text', 'אבא של אורי, בן 6', 68),
('testimonial_2_avatar', 'image', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=100&auto=format&fit=crop', 69)

ON CONFLICT (section_key) DO NOTHING;

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_landing_page_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_landing_page_updated_at
    BEFORE UPDATE ON public.landing_page_content
    FOR EACH ROW
    EXECUTE FUNCTION update_landing_page_updated_at();

-- Grant permissions
GRANT SELECT ON public.landing_page_content TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.landing_page_content TO authenticated;
