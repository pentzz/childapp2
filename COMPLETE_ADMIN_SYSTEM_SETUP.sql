-- =============================================
-- 🎯 מערכת ניהול מנהלים מלאה - Supabase Setup
-- =============================================
-- קובץ זה מכיל את כל הטבלאות והפונקציות הנדרשות
-- למערכת ניהול מתקדמת של מנהלים
-- =============================================

BEGIN;

-- =========================================
-- שלב 1: טבלת users (אם לא קיימת)
-- =========================================

-- וודא שטבלת users קיימת עם כל השדות
DO $$
BEGIN
    -- Add is_admin column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'is_admin'
    ) THEN
        ALTER TABLE public.users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
    END IF;

    -- Add is_super_admin column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'is_super_admin'
    ) THEN
        ALTER TABLE public.users ADD COLUMN is_super_admin BOOLEAN DEFAULT FALSE;
    END IF;

    -- Add role column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'role'
    ) THEN
        ALTER TABLE public.users ADD COLUMN role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin'));
    END IF;

    -- Add last_login_at if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'last_login_at'
    ) THEN
        ALTER TABLE public.users ADD COLUMN last_login_at TIMESTAMPTZ;
    END IF;

    -- Add is_active if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE public.users ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;

    -- Add subscription_tier if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'subscription_tier'
    ) THEN
        ALTER TABLE public.users ADD COLUMN subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'premium', 'enterprise'));
    END IF;

    RAISE NOTICE '✅ טבלת users עודכנה';
END $$;

-- =========================================
-- שלב 2: טבלת admin_activity_logs
-- =========================================

CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
    id BIGSERIAL PRIMARY KEY,
    admin_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

    -- סוג הפעולה
    action_type TEXT NOT NULL CHECK (action_type IN (
        'user_created', 'user_updated', 'user_deleted', 'user_credits_changed',
        'content_deleted', 'content_moderated', 'settings_changed',
        'api_key_added', 'api_key_removed', 'bulk_operation',
        'notification_sent', 'report_generated', 'export_data'
    )),

    -- פרטי הפעולה
    target_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    target_content_id BIGINT,
    action_description TEXT NOT NULL,
    action_data JSONB DEFAULT '{}',

    -- מטאדאטה
    ip_address TEXT,
    user_agent TEXT,

    -- זמנים
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_admin_id ON public.admin_activity_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_action_type ON public.admin_activity_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_target_user ON public.admin_activity_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_created_at ON public.admin_activity_logs(created_at DESC);

RAISE NOTICE '✅ נוצרה טבלת admin_activity_logs';

-- =========================================
-- שלב 3: טבלת system_notifications
-- =========================================

CREATE TABLE IF NOT EXISTS public.system_notifications (
    id BIGSERIAL PRIMARY KEY,

    -- סוג ההודעה
    notification_type TEXT NOT NULL CHECK (notification_type IN (
        'info', 'warning', 'error', 'success', 'maintenance', 'update'
    )),

    -- תוכן ההודעה
    title TEXT NOT NULL,
    message TEXT NOT NULL,

    -- טווח הצגה
    target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'admins', 'users', 'specific')),
    target_user_ids UUID[],

    -- הצגה
    is_active BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 0,

    -- זמנים
    starts_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_system_notifications_active ON public.system_notifications(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_system_notifications_expires ON public.system_notifications(expires_at);

RAISE NOTICE '✅ נוצרה טבלת system_notifications';

-- =========================================
-- שלב 4: טבלת user_sessions
-- =========================================

CREATE TABLE IF NOT EXISTS public.user_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

    -- פרטי המושב
    session_token TEXT NOT NULL UNIQUE,
    ip_address TEXT,
    user_agent TEXT,
    device_type TEXT,
    browser TEXT,
    os TEXT,

    -- מיקום
    country TEXT,
    city TEXT,

    -- סטטוס
    is_active BOOLEAN DEFAULT TRUE,

    -- זמנים
    started_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON public.user_sessions(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity ON public.user_sessions(last_activity_at DESC);

RAISE NOTICE '✅ נוצרה טבלת user_sessions';

-- =========================================
-- שלב 5: טבלת credit_transactions
-- =========================================

CREATE TABLE IF NOT EXISTS public.credit_transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

    -- פרטי העסקה
    amount INTEGER NOT NULL,
    balance_before INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,

    -- סוג העסקה
    transaction_type TEXT NOT NULL CHECK (transaction_type IN (
        'purchase', 'gift', 'refund', 'deduction', 'bonus', 'promo', 'admin_adjustment'
    )),

    -- תיאור
    description TEXT NOT NULL,

    -- קשר לתוכן (אם רלוונטי)
    content_type TEXT,
    content_id BIGINT,

    -- מטאדאטה
    metadata JSONB DEFAULT '{}',

    -- מי ביצע
    performed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,

    -- זמן
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON public.credit_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON public.credit_transactions(created_at DESC);

RAISE NOTICE '✅ נוצרה טבלת credit_transactions';

-- =========================================
-- שלב 6: טבלת system_settings
-- =========================================

CREATE TABLE IF NOT EXISTS public.system_settings (
    id BIGSERIAL PRIMARY KEY,

    -- מפתח-ערך
    setting_key TEXT NOT NULL UNIQUE,
    setting_value JSONB NOT NULL,

    -- מטאדאטה
    setting_type TEXT CHECK (setting_type IN ('string', 'number', 'boolean', 'json', 'array')),
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,

    -- גרסה
    version INTEGER DEFAULT 1,

    -- זמנים
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_system_settings_key ON public.system_settings(setting_key);

RAISE NOTICE '✅ נוצרה טבלת system_settings';

-- =========================================
-- שלב 7: טבלת user_reports
-- =========================================

CREATE TABLE IF NOT EXISTS public.user_reports (
    id BIGSERIAL PRIMARY KEY,

    -- מי דיווח
    reported_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

    -- על מה/מי
    report_type TEXT NOT NULL CHECK (report_type IN ('user', 'content', 'bug', 'feedback', 'abuse')),
    reported_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    reported_content_id BIGINT,

    -- פרטי הדיווח
    reason TEXT NOT NULL,
    description TEXT,
    severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),

    -- סטטוס
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'resolved', 'dismissed')),

    -- טיפול
    handled_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    resolution_notes TEXT,

    -- זמנים
    created_at TIMESTAMPTZ DEFAULT NOW(),
    handled_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_user_reports_reported_by ON public.user_reports(reported_by);
CREATE INDEX IF NOT EXISTS idx_user_reports_status ON public.user_reports(status);
CREATE INDEX IF NOT EXISTS idx_user_reports_type ON public.user_reports(report_type);

RAISE NOTICE '✅ נוצרה טבלת user_reports';

-- =========================================
-- שלב 8: Triggers - Updated At
-- =========================================

DROP TRIGGER IF EXISTS update_system_settings_updated_at ON public.system_settings;
CREATE TRIGGER update_system_settings_updated_at
    BEFORE UPDATE ON public.system_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

RAISE NOTICE '✅ נוצרו Triggers';

-- =========================================
-- שלב 9: RLS Policies
-- =========================================

-- Enable RLS
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;

-- Policies for admin_activity_logs
DROP POLICY IF EXISTS "Admins can view all activity logs" ON public.admin_activity_logs;
CREATE POLICY "Admins can view all activity logs"
    ON public.admin_activity_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND (is_admin = TRUE OR role = 'admin')
        )
    );

DROP POLICY IF EXISTS "Admins can insert activity logs" ON public.admin_activity_logs;
CREATE POLICY "Admins can insert activity logs"
    ON public.admin_activity_logs FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND (is_admin = TRUE OR role = 'admin')
        )
    );

-- Policies for system_notifications
DROP POLICY IF EXISTS "Users can view active notifications" ON public.system_notifications;
CREATE POLICY "Users can view active notifications"
    ON public.system_notifications FOR SELECT
    USING (
        is_active = TRUE
        AND (expires_at IS NULL OR expires_at > NOW())
        AND (
            target_audience = 'all'
            OR (target_audience = 'users')
            OR (target_audience = 'admins' AND EXISTS (
                SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = TRUE
            ))
            OR (target_audience = 'specific' AND auth.uid() = ANY(target_user_ids))
        )
    );

DROP POLICY IF EXISTS "Admins can manage notifications" ON public.system_notifications;
CREATE POLICY "Admins can manage notifications"
    ON public.system_notifications FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- Policies for user_sessions
DROP POLICY IF EXISTS "Users can view own sessions" ON public.user_sessions;
CREATE POLICY "Users can view own sessions"
    ON public.user_sessions FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can end own sessions" ON public.user_sessions;
CREATE POLICY "Users can end own sessions"
    ON public.user_sessions FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all sessions" ON public.user_sessions;
CREATE POLICY "Admins can view all sessions"
    ON public.user_sessions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- Policies for credit_transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON public.credit_transactions;
CREATE POLICY "Users can view own transactions"
    ON public.credit_transactions FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all transactions" ON public.credit_transactions;
CREATE POLICY "Admins can view all transactions"
    ON public.credit_transactions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

DROP POLICY IF EXISTS "Admins can insert transactions" ON public.credit_transactions;
CREATE POLICY "Admins can insert transactions"
    ON public.credit_transactions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- Policies for system_settings
DROP POLICY IF EXISTS "Public settings visible to all" ON public.system_settings;
CREATE POLICY "Public settings visible to all"
    ON public.system_settings FOR SELECT
    USING (is_public = TRUE);

DROP POLICY IF EXISTS "Admins can view all settings" ON public.system_settings;
CREATE POLICY "Admins can view all settings"
    ON public.system_settings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

DROP POLICY IF EXISTS "Admins can manage settings" ON public.system_settings;
CREATE POLICY "Admins can manage settings"
    ON public.system_settings FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- Policies for user_reports
DROP POLICY IF EXISTS "Users can view own reports" ON public.user_reports;
CREATE POLICY "Users can view own reports"
    ON public.user_reports FOR SELECT
    USING (auth.uid() = reported_by);

DROP POLICY IF EXISTS "Users can create reports" ON public.user_reports;
CREATE POLICY "Users can create reports"
    ON public.user_reports FOR INSERT
    WITH CHECK (auth.uid() = reported_by);

DROP POLICY IF EXISTS "Admins can view all reports" ON public.user_reports;
CREATE POLICY "Admins can view all reports"
    ON public.user_reports FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

DROP POLICY IF EXISTS "Admins can manage reports" ON public.user_reports;
CREATE POLICY "Admins can manage reports"
    ON public.user_reports FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

RAISE NOTICE '✅ הוגדרו RLS Policies';

-- =========================================
-- שלב 10: פונקציות עזר למנהלים
-- =========================================

-- פונקציה לקבלת סטטיסטיקות מערכת
CREATE OR REPLACE FUNCTION get_system_stats()
RETURNS TABLE(
    total_users BIGINT,
    active_users BIGINT,
    total_stories BIGINT,
    total_workbooks BIGINT,
    total_plans BIGINT,
    total_credits_spent BIGINT,
    new_users_this_month BIGINT,
    active_sessions BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM public.users)::BIGINT,
        (SELECT COUNT(*) FROM public.users WHERE is_active = TRUE)::BIGINT,
        (SELECT COUNT(*) FROM public.stories)::BIGINT,
        (SELECT COUNT(*) FROM public.workbooks)::BIGINT,
        (SELECT COUNT(*) FROM public.learning_plans)::BIGINT,
        (SELECT COALESCE(SUM(ABS(amount)), 0) FROM public.credit_transactions WHERE amount < 0)::BIGINT,
        (SELECT COUNT(*) FROM public.users WHERE created_at >= DATE_TRUNC('month', NOW()))::BIGINT,
        (SELECT COUNT(*) FROM public.user_sessions WHERE is_active = TRUE)::BIGINT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- פונקציה לרישום פעילות מנהל
CREATE OR REPLACE FUNCTION log_admin_activity(
    p_action_type TEXT,
    p_action_description TEXT,
    p_target_user_id UUID DEFAULT NULL,
    p_action_data JSONB DEFAULT '{}'
)
RETURNS BIGINT AS $$
DECLARE
    new_id BIGINT;
BEGIN
    INSERT INTO public.admin_activity_logs (
        admin_id,
        action_type,
        action_description,
        target_user_id,
        action_data
    ) VALUES (
        auth.uid(),
        p_action_type,
        p_action_description,
        p_target_user_id,
        p_action_data
    )
    RETURNING id INTO new_id;

    RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- פונקציה לשינוי קרדיטים של משתמש עם תיעוד
CREATE OR REPLACE FUNCTION admin_change_user_credits(
    p_user_id UUID,
    p_amount INTEGER,
    p_description TEXT DEFAULT 'Admin adjustment'
)
RETURNS BOOLEAN AS $$
DECLARE
    current_credits INTEGER;
    new_credits INTEGER;
BEGIN
    -- Check if caller is admin
    IF NOT EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND is_admin = TRUE
    ) THEN
        RAISE EXCEPTION 'Only admins can change user credits';
    END IF;

    -- Get current credits
    SELECT credits INTO current_credits
    FROM public.users
    WHERE id = p_user_id;

    -- Calculate new credits
    new_credits := current_credits + p_amount;

    -- Update user credits
    UPDATE public.users
    SET credits = new_credits
    WHERE id = p_user_id;

    -- Log transaction
    INSERT INTO public.credit_transactions (
        user_id,
        amount,
        balance_before,
        balance_after,
        transaction_type,
        description,
        performed_by
    ) VALUES (
        p_user_id,
        p_amount,
        current_credits,
        new_credits,
        'admin_adjustment',
        p_description,
        auth.uid()
    );

    -- Log admin activity
    PERFORM log_admin_activity(
        'user_credits_changed',
        format('Changed credits for user by %s (from %s to %s)', p_amount, current_credits, new_credits),
        p_user_id,
        jsonb_build_object('amount', p_amount, 'before', current_credits, 'after', new_credits)
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- פונקציה לקבלת top users
CREATE OR REPLACE FUNCTION get_top_users(limit_count INTEGER DEFAULT 10)
RETURNS TABLE(
    user_id UUID,
    email TEXT,
    full_name TEXT,
    credits INTEGER,
    content_count BIGINT,
    credits_spent BIGINT,
    last_activity TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.id,
        u.email,
        u.full_name,
        u.credits,
        (
            SELECT COUNT(*)
            FROM public.saved_content
            WHERE user_id = u.id
        )::BIGINT,
        (
            SELECT COALESCE(SUM(ABS(amount)), 0)
            FROM public.credit_transactions
            WHERE user_id = u.id AND amount < 0
        )::BIGINT,
        u.last_login_at
    FROM public.users u
    WHERE u.is_active = TRUE
    ORDER BY (
        SELECT COUNT(*)
        FROM public.saved_content
        WHERE user_id = u.id
    ) DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

RAISE NOTICE '✅ נוצרו פונקציות עזר למנהלים';

-- =========================================
-- שלב 11: סיכום
-- =========================================

DO $$
DECLARE
    total_users INTEGER;
    total_admins INTEGER;
    total_content INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_users FROM public.users;
    SELECT COUNT(*) INTO total_admins FROM public.users WHERE is_admin = TRUE;
    SELECT COUNT(*) INTO total_content FROM public.saved_content;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '🎉 מערכת ניהול מנהלים הותקנה בהצלחה!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '📊 סטטיסטיקות:';
    RAISE NOTICE '  👥 סה"כ משתמשים: %', total_users;
    RAISE NOTICE '  🛡️ סה"כ מנהלים: %', total_admins;
    RAISE NOTICE '  💾 סה"כ תוכן: %', total_content;
    RAISE NOTICE '';
    RAISE NOTICE '✅ המערכת מוכנה לשימוש!';
    RAISE NOTICE '========================================';
END $$;

COMMIT;

-- =============================================
-- 🎯 הוראות שימוש:
-- =============================================
-- 1. הרץ קובץ זה ב-Supabase SQL Editor
-- 2. וודא שיש לך הרשאות admin
-- 3. בדוק את הלוגים לאישור ההתקנה
-- 4. השתמש בפונקציות העזר לניהול המערכת
-- =============================================
