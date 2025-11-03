-- =========================================
-- CREDIT COSTS TABLE - REAL-TIME SYNC
-- =========================================
-- This table stores dynamic credit costs for all content creation actions.
-- Only one row should exist at any time (singleton pattern).
-- Real-time changes are broadcast to all connected clients.

-- Create credit_costs table
CREATE TABLE IF NOT EXISTS credit_costs (
    id SERIAL PRIMARY KEY,
    story_part INTEGER NOT NULL DEFAULT 1,
    plan_step INTEGER NOT NULL DEFAULT 2,
    worksheet INTEGER NOT NULL DEFAULT 2,
    workbook INTEGER NOT NULL DEFAULT 3,
    topic_suggestions INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default values if table is empty
INSERT INTO credit_costs (story_part, plan_step, worksheet, workbook, topic_suggestions)
VALUES (1, 2, 2, 3, 1)
ON CONFLICT (id) DO NOTHING;

-- Add comment to table
COMMENT ON TABLE credit_costs IS 'מנהל את עלויות הקרדיטים עבור כל פעולה במערכת. ניתן לעדכן על ידי משתמש העל.';

-- =========================================
-- ENABLE REAL-TIME REPLICATION
-- =========================================
-- This enables real-time broadcasts for any changes to credit_costs
-- All connected clients will receive instant updates when costs change

-- Enable Realtime for credit_costs table
ALTER PUBLICATION supabase_realtime ADD TABLE credit_costs;

-- =========================================
-- ROW LEVEL SECURITY (RLS)
-- =========================================
-- Enable RLS but allow all authenticated users to read
-- Only admins can update (enforced by application logic)

ALTER TABLE credit_costs ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can read credit costs
CREATE POLICY "Anyone can view credit costs"
ON credit_costs FOR SELECT
TO authenticated
USING (true);

-- Policy: Only admins can update credit costs (you'll need to add a check for admin role)
-- For now, we allow all authenticated users to update (admin check is in app)
CREATE POLICY "Admins can update credit costs"
ON credit_costs FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy: Allow inserts for initialization
CREATE POLICY "Allow insert for initialization"
ON credit_costs FOR INSERT
TO authenticated
WITH CHECK (true);

-- =========================================
-- TRIGGER FOR UPDATED_AT
-- =========================================
-- Automatically update the updated_at timestamp when row is modified

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_credit_costs_updated_at
    BEFORE UPDATE ON credit_costs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


