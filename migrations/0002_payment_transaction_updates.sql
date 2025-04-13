-- Migration for updated schema: 
-- 1. Project status enum update (if not already applied)
-- 2. Payments and Transactions adjustments

-- Check if 'pending' already exists in project_status enum
DO $$
BEGIN
    -- Update project_status enum if it doesn't have 'pending'
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE t.typname = 'project_status'
        AND e.enumlabel = 'pending'
    ) THEN
        -- Add 'pending' to project_status enum
        ALTER TYPE "public"."project_status" RENAME TO "project_status_old";
        CREATE TYPE "public"."project_status" AS ENUM('pending', 'open', 'in_progress', 'completed', 'cancelled');
        
        -- Update the column type
        ALTER TABLE "projects" ALTER COLUMN "status" TYPE "project_status" 
            USING "status"::text::"project_status";
        
        -- Set default value for status column to 'pending'
        ALTER TABLE "projects" ALTER COLUMN "status" SET DEFAULT 'pending';
        
        -- Drop old type
        DROP TYPE "project_status_old";
    END IF;
END $$;

-- Ensure correct types for payment table
ALTER TABLE IF EXISTS "payments" 
    ALTER COLUMN "amount" TYPE numeric(10,2);

-- Create transaction_type enum if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_type') THEN
        CREATE TYPE "transaction_type" AS ENUM('fee', 'payment', 'refund');
    END IF;
END $$;

-- Create transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS "transactions" (
    "id" serial PRIMARY KEY NOT NULL,
    "payment_id" integer NOT NULL,
    "user_id" integer NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "type" "transaction_type" NOT NULL,
    "status" "payment_status" NOT NULL,
    "description" text,
    "created_at" timestamp DEFAULT now() NOT NULL
);

-- Add any missing constraints or relationships for payments table
-- First check the column names in payments table
DO $$
DECLARE
    user_id_exists boolean;
    client_id_exists boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='payments' AND column_name='user_id'
    ) INTO user_id_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='payments' AND column_name='client_id'
    ) INTO client_id_exists;
    
    -- Handle the correct column name for user reference
    IF user_id_exists THEN
        EXECUTE 'ALTER TABLE IF EXISTS "payments"
            DROP CONSTRAINT IF EXISTS "payments_user_id_fkey",
            ADD CONSTRAINT "payments_user_id_fkey" 
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE';
    ELSIF client_id_exists THEN
        EXECUTE 'ALTER TABLE IF EXISTS "payments"
            DROP CONSTRAINT IF EXISTS "payments_client_id_fkey",
            ADD CONSTRAINT "payments_client_id_fkey" 
            FOREIGN KEY ("client_id") REFERENCES "users"("id") ON DELETE CASCADE';
    END IF;
END $$;

-- Add project_id constraint if the column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='payments' AND column_name='project_id'
    ) THEN
        EXECUTE 'ALTER TABLE IF EXISTS "payments"
            DROP CONSTRAINT IF EXISTS "payments_project_id_fkey",
            ADD CONSTRAINT "payments_project_id_fkey" 
            FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL';
    END IF;
END $$;

-- Add constraints for transactions table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transactions') THEN
        -- Check if constraint already exists
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'transactions_payment_id_fkey'
        ) THEN
            EXECUTE 'ALTER TABLE "transactions"
                ADD CONSTRAINT "transactions_payment_id_fkey" 
                FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE';
        END IF;

        -- Check if constraint already exists
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'transactions_user_id_fkey'
        ) THEN
            EXECUTE 'ALTER TABLE "transactions"
                ADD CONSTRAINT "transactions_user_id_fkey" 
                FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE';
        END IF;

        -- Add indexes only if the table exists
        EXECUTE 'CREATE INDEX IF NOT EXISTS "idx_transactions_payment_id" ON "transactions" ("payment_id")';
        EXECUTE 'CREATE INDEX IF NOT EXISTS "idx_transactions_user_id" ON "transactions" ("user_id")';
    END IF;
END $$;

-- Add indexes for payments and projects
CREATE INDEX IF NOT EXISTS "idx_payments_project_id" ON "payments" ("project_id");
CREATE INDEX IF NOT EXISTS "idx_projects_status" ON "projects" ("status"); 