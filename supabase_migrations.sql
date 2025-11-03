-- Create credit_costs table for managing dynamic credit costs
-- This table allows the super admin to control credit costs for different actions

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
ON CONFLICT DO NOTHING;

-- Create a unique constraint to ensure only one row exists
-- We'll use a simple approach: always update the first row, or insert if none exists
-- Note: This requires the application to handle upsert logic

-- Add comment to table
COMMENT ON TABLE credit_costs IS 'מנהל את עלויות הקרדיטים עבור כל פעולה במערכת. ניתן לעדכן על ידי משתמש העל.';


