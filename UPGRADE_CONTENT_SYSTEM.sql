-- =============================================
-- 🚀 שדרוג מערכת התוכן - UI מודרני ושמירה מלאה
-- =============================================
-- קובץ זה משדרג את המערכת:
-- 1. טבלת saved_content - שמירת כל תוכן AI
-- 2. טבלת content_sections - חלוקה לכרטיסיות
-- 3. טבלת user_favorites - שמירת מועדפים
-- 4. טבלת content_shares - שיתוף בין משתמשים
-- 5. RLS Policies מתקדמות
-- =============================================

BEGIN;

-- =========================================
-- שלב 1: יצירת טבלת saved_content
-- =========================================

-- טבלה ראשית לכל תוכן שנוצר ב-AI
CREATE TABLE IF NOT EXISTS public.saved_content (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    profile_id INTEGER REFERENCES public.profiles(id) ON DELETE SET NULL,

    -- סוג התוכן
    content_type TEXT NOT NULL CHECK (content_type IN ('story', 'workbook', 'learning_plan', 'worksheet', 'custom')),

    -- מטאדאטה
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,

    -- תוכן מלא (JSON)
    content_data JSONB NOT NULL DEFAULT '{}',

    -- סטטוס
    is_favorite BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT false,

    -- סטטיסטיקות
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,

    -- תגיות לחיפוש
    tags TEXT[] DEFAULT '{}',

    -- זמנים
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_viewed_at TIMESTAMPTZ,

    -- אינדקסים
    CONSTRAINT saved_content_user_id_idx CHECK (user_id IS NOT NULL),
    CONSTRAINT saved_content_title_not_empty CHECK (LENGTH(TRIM(title)) > 0)
);

-- אינדקסים לביצועים
CREATE INDEX IF NOT EXISTS idx_saved_content_user_id ON public.saved_content(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_content_profile_id ON public.saved_content(profile_id);
CREATE INDEX IF NOT EXISTS idx_saved_content_content_type ON public.saved_content(content_type);
CREATE INDEX IF NOT EXISTS idx_saved_content_created_at ON public.saved_content(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_content_is_favorite ON public.saved_content(is_favorite) WHERE is_favorite = true;
CREATE INDEX IF NOT EXISTS idx_saved_content_tags ON public.saved_content USING GIN(tags);

RAISE NOTICE '✅ נוצרה טבלת saved_content';

-- =========================================
-- שלב 2: יצירת טבלת content_sections
-- =========================================

-- כרטיסיות בתוך התוכן (לארגון מודולרי)
CREATE TABLE IF NOT EXISTS public.content_sections (
    id BIGSERIAL PRIMARY KEY,
    content_id BIGINT NOT NULL REFERENCES public.saved_content(id) ON DELETE CASCADE,

    -- מידע על הכרטיסייה
    section_order INTEGER NOT NULL,
    section_title TEXT NOT NULL,
    section_type TEXT NOT NULL CHECK (section_type IN ('text', 'image', 'activity', 'quiz', 'video', 'code')),

    -- תוכן הכרטיסייה
    section_data JSONB NOT NULL DEFAULT '{}',

    -- עיצוב
    background_color TEXT,
    icon TEXT,

    -- זמנים
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- אינדקס ייחודיות
    CONSTRAINT unique_section_order UNIQUE(content_id, section_order)
);

CREATE INDEX IF NOT EXISTS idx_content_sections_content_id ON public.content_sections(content_id);
CREATE INDEX IF NOT EXISTS idx_content_sections_order ON public.content_sections(content_id, section_order);

RAISE NOTICE '✅ נוצרה טבלת content_sections';

-- =========================================
-- שלב 3: טבלת user_favorites
-- =========================================

CREATE TABLE IF NOT EXISTS public.user_favorites (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content_id BIGINT NOT NULL REFERENCES public.saved_content(id) ON DELETE CASCADE,

    -- הערות אישיות
    personal_note TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- אינדקס ייחודיות - משתמש יכול לשמור תוכן פעם אחת
    CONSTRAINT unique_user_favorite UNIQUE(user_id, content_id)
);

CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON public.user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_content_id ON public.user_favorites(content_id);

RAISE NOTICE '✅ נוצרה טבלת user_favorites';

-- =========================================
-- שלב 4: טבלת content_shares
-- =========================================

-- שיתוף תוכן בין משתמשים
CREATE TABLE IF NOT EXISTS public.content_shares (
    id BIGSERIAL PRIMARY KEY,
    content_id BIGINT NOT NULL REFERENCES public.saved_content(id) ON DELETE CASCADE,
    shared_by_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    shared_with_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,

    -- הרשאות
    can_edit BOOLEAN DEFAULT false,
    can_delete BOOLEAN DEFAULT false,

    -- הודעה
    share_message TEXT,

    -- זמנים
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,

    -- אינדקס ייחודיות
    CONSTRAINT unique_content_share UNIQUE(content_id, shared_by_user_id, shared_with_user_id)
);

CREATE INDEX IF NOT EXISTS idx_content_shares_content_id ON public.content_shares(content_id);
CREATE INDEX IF NOT EXISTS idx_content_shares_shared_with ON public.content_shares(shared_with_user_id);

RAISE NOTICE '✅ נוצרה טבלת content_shares';

-- =========================================
-- שלב 5: טבלת content_analytics
-- =========================================

-- אנליטיקס מפורט למנהל
CREATE TABLE IF NOT EXISTS public.content_analytics (
    id BIGSERIAL PRIMARY KEY,
    content_id BIGINT NOT NULL REFERENCES public.saved_content(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

    -- סוג האירוע
    event_type TEXT NOT NULL CHECK (event_type IN ('view', 'like', 'share', 'download', 'print', 'edit', 'delete')),

    -- מטאדאטה נוספת
    event_data JSONB DEFAULT '{}',

    -- זמן
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_analytics_content_id ON public.content_analytics(content_id);
CREATE INDEX IF NOT EXISTS idx_content_analytics_user_id ON public.content_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_content_analytics_event_type ON public.content_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_content_analytics_created_at ON public.content_analytics(created_at DESC);

RAISE NOTICE '✅ נוצרה טבלת content_analytics';

-- =========================================
-- שלב 6: Triggers - Updated At
-- =========================================

-- Trigger לעדכון updated_at אוטומטי
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers על הטבלאות
DROP TRIGGER IF EXISTS update_saved_content_updated_at ON public.saved_content;
CREATE TRIGGER update_saved_content_updated_at
    BEFORE UPDATE ON public.saved_content
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_content_sections_updated_at ON public.content_sections;
CREATE TRIGGER update_content_sections_updated_at
    BEFORE UPDATE ON public.content_sections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

RAISE NOTICE '✅ נוצרו Triggers לעדכון אוטומטי';

-- =========================================
-- שלב 7: RLS Policies
-- =========================================

-- הפעלת RLS
ALTER TABLE public.saved_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_analytics ENABLE ROW LEVEL SECURITY;

-- Policies עבור saved_content
DROP POLICY IF EXISTS "Users can view own content" ON public.saved_content;
CREATE POLICY "Users can view own content"
    ON public.saved_content FOR SELECT
    USING (
        auth.uid() = user_id
        OR is_public = true
        OR EXISTS (
            SELECT 1 FROM public.content_shares
            WHERE content_id = id AND shared_with_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert own content" ON public.saved_content;
CREATE POLICY "Users can insert own content"
    ON public.saved_content FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own content" ON public.saved_content;
CREATE POLICY "Users can update own content"
    ON public.saved_content FOR UPDATE
    USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM public.content_shares
            WHERE content_id = id AND shared_with_user_id = auth.uid() AND can_edit = true
        )
    );

DROP POLICY IF EXISTS "Users can delete own content" ON public.saved_content;
CREATE POLICY "Users can delete own content"
    ON public.saved_content FOR DELETE
    USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM public.content_shares
            WHERE content_id = id AND shared_with_user_id = auth.uid() AND can_delete = true
        )
    );

-- Admin מנהל רואה הכל
DROP POLICY IF EXISTS "Admins can view all content" ON public.saved_content;
CREATE POLICY "Admins can view all content"
    ON public.saved_content FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND is_admin = true
        )
    );

DROP POLICY IF EXISTS "Admins can modify all content" ON public.saved_content;
CREATE POLICY "Admins can modify all content"
    ON public.saved_content FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Policies עבור content_sections
DROP POLICY IF EXISTS "Users can view own sections" ON public.content_sections;
CREATE POLICY "Users can view own sections"
    ON public.content_sections FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.saved_content
            WHERE id = content_id AND user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can modify own sections" ON public.content_sections;
CREATE POLICY "Users can modify own sections"
    ON public.content_sections FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.saved_content
            WHERE id = content_id AND user_id = auth.uid()
        )
    );

-- Policies עבור user_favorites
DROP POLICY IF EXISTS "Users can manage own favorites" ON public.user_favorites;
CREATE POLICY "Users can manage own favorites"
    ON public.user_favorites FOR ALL
    USING (auth.uid() = user_id);

-- Policies עבור content_shares
DROP POLICY IF EXISTS "Users can view shares" ON public.content_shares;
CREATE POLICY "Users can view shares"
    ON public.content_shares FOR SELECT
    USING (auth.uid() = shared_by_user_id OR auth.uid() = shared_with_user_id);

DROP POLICY IF EXISTS "Users can create shares" ON public.content_shares;
CREATE POLICY "Users can create shares"
    ON public.content_shares FOR INSERT
    WITH CHECK (auth.uid() = shared_by_user_id);

DROP POLICY IF EXISTS "Users can delete own shares" ON public.content_shares;
CREATE POLICY "Users can delete own shares"
    ON public.content_shares FOR DELETE
    USING (auth.uid() = shared_by_user_id);

-- Policies עבור content_analytics
DROP POLICY IF EXISTS "Users can insert own analytics" ON public.content_analytics;
CREATE POLICY "Users can insert own analytics"
    ON public.content_analytics FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all analytics" ON public.content_analytics;
CREATE POLICY "Admins can view all analytics"
    ON public.content_analytics FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND is_admin = true
        )
    );

RAISE NOTICE '✅ הוגדרו RLS Policies';

-- =========================================
-- שלב 8: Real-time
-- =========================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.saved_content;
ALTER PUBLICATION supabase_realtime ADD TABLE public.content_sections;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_favorites;
ALTER PUBLICATION supabase_realtime ADD TABLE public.content_shares;

RAISE NOTICE '✅ הופעל Real-time';

-- =========================================
-- שלב 9: פונקציות עזר
-- =========================================

-- פונקציה לספירת תוכן לפי סוג
CREATE OR REPLACE FUNCTION count_content_by_type(user_uuid UUID)
RETURNS TABLE(content_type TEXT, count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT sc.content_type, COUNT(*)::BIGINT
    FROM public.saved_content sc
    WHERE sc.user_id = user_uuid AND sc.is_archived = false
    GROUP BY sc.content_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- פונקציה לקבלת תוכן פופולרי
CREATE OR REPLACE FUNCTION get_popular_content(limit_count INTEGER DEFAULT 10)
RETURNS TABLE(
    id BIGINT,
    title TEXT,
    content_type TEXT,
    view_count INTEGER,
    like_count INTEGER,
    share_count INTEGER,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        sc.id,
        sc.title,
        sc.content_type,
        sc.view_count,
        sc.like_count,
        sc.share_count,
        sc.created_at
    FROM public.saved_content sc
    WHERE sc.is_public = true AND sc.is_archived = false
    ORDER BY (sc.view_count + sc.like_count * 2 + sc.share_count * 3) DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- פונקציה להגדלת view_count
CREATE OR REPLACE FUNCTION increment_content_view(content_uuid BIGINT)
RETURNS VOID AS $$
BEGIN
    UPDATE public.saved_content
    SET view_count = view_count + 1,
        last_viewed_at = NOW()
    WHERE id = content_uuid;

    -- רשום אירוע באנליטיקס
    INSERT INTO public.content_analytics (content_id, user_id, event_type)
    VALUES (content_uuid, auth.uid(), 'view');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- פונקציה למחיקת תוכן ישן (ארכיון אוטומטי)
CREATE OR REPLACE FUNCTION auto_archive_old_content(days_old INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
    archived_count INTEGER;
BEGIN
    UPDATE public.saved_content
    SET is_archived = true
    WHERE created_at < NOW() - (days_old || ' days')::INTERVAL
      AND is_favorite = false
      AND is_archived = false;

    GET DIAGNOSTICS archived_count = ROW_COUNT;
    RETURN archived_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

RAISE NOTICE '✅ נוצרו פונקציות עזר';

-- =========================================
-- שלב 10: מיגרציה - העברת תוכן קיים
-- =========================================

-- העברת סיפורים קיימים לטבלה החדשה
INSERT INTO public.saved_content (
    user_id,
    profile_id,
    content_type,
    title,
    content_data,
    created_at,
    updated_at
)
SELECT
    s.user_id,
    s.profile_id,
    'story'::TEXT,
    s.title,
    jsonb_build_object(
        'story_parts', s.story_parts,
        'legacy_id', s.id
    ),
    s.created_at,
    s.updated_at
FROM public.stories s
WHERE NOT EXISTS (
    SELECT 1 FROM public.saved_content sc
    WHERE sc.content_data->>'legacy_id' = s.id::TEXT
      AND sc.content_type = 'story'
)
ON CONFLICT DO NOTHING;

-- העברת workbooks קיימים
INSERT INTO public.saved_content (
    user_id,
    profile_id,
    content_type,
    title,
    content_data,
    created_at,
    updated_at
)
SELECT
    w.user_id,
    w.profile_id,
    'workbook'::TEXT,
    w.title,
    jsonb_build_object(
        'workbook_data', w.workbook_data,
        'legacy_id', w.id
    ),
    w.created_at,
    w.updated_at
FROM public.workbooks w
WHERE NOT EXISTS (
    SELECT 1 FROM public.saved_content sc
    WHERE sc.content_data->>'legacy_id' = w.id::TEXT
      AND sc.content_type = 'workbook'
)
ON CONFLICT DO NOTHING;

-- העברת learning plans
INSERT INTO public.saved_content (
    user_id,
    profile_id,
    content_type,
    title,
    content_data,
    created_at,
    updated_at
)
SELECT
    lp.user_id,
    lp.profile_id,
    'learning_plan'::TEXT,
    lp.topic,
    jsonb_build_object(
        'topic', lp.topic,
        'plan_steps', lp.plan_steps,
        'current_step', lp.current_step,
        'legacy_id', lp.id
    ),
    lp.created_at,
    lp.updated_at
FROM public.learning_plans lp
WHERE NOT EXISTS (
    SELECT 1 FROM public.saved_content sc
    WHERE sc.content_data->>'legacy_id' = lp.id::TEXT
      AND sc.content_type = 'learning_plan'
)
ON CONFLICT DO NOTHING;

RAISE NOTICE '✅ הועבר תוכן קיים לטבלה החדשה';

-- =========================================
-- שלב 11: סיכום
-- =========================================

DO $$
DECLARE
    total_content INTEGER;
    total_sections INTEGER;
    total_favorites INTEGER;
    total_shares INTEGER;
    total_analytics INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_content FROM public.saved_content;
    SELECT COUNT(*) INTO total_sections FROM public.content_sections;
    SELECT COUNT(*) INTO total_favorites FROM public.user_favorites;
    SELECT COUNT(*) INTO total_shares FROM public.content_shares;
    SELECT COUNT(*) INTO total_analytics FROM public.content_analytics;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '🎉 שדרוג מערכת התוכן הושלם בהצלחה!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '📊 סטטיסטיקות:';
    RAISE NOTICE '  💾 סה"כ תוכן שמור: %', total_content;
    RAISE NOTICE '  📑 סה"כ כרטיסיות: %', total_sections;
    RAISE NOTICE '  ⭐ סה"כ מועדפים: %', total_favorites;
    RAISE NOTICE '  🔗 סה"כ שיתופים: %', total_shares;
    RAISE NOTICE '  📈 סה"כ אירועי אנליטיקס: %', total_analytics;
    RAISE NOTICE '';
    RAISE NOTICE '✅ המערכת מוכנה לשימוש!';
    RAISE NOTICE '========================================';
END $$;

COMMIT;

-- =============================================
-- 🎯 סיום
-- =============================================
