-- Step 1: Create a temporary table
CREATE TABLE projects_temp AS SELECT * FROM projects;

-- Step 2: Drop the original table
DROP TABLE projects;

-- Step 3: Recreate the enum with the new value
DROP TYPE IF EXISTS "public"."project_status";
CREATE TYPE "public"."project_status" AS ENUM('pending', 'open', 'in_progress', 'completed', 'cancelled');

-- Step 4: Create the table again with the new enum type
CREATE TABLE "projects" (
  "id" serial PRIMARY KEY NOT NULL,
  "title" text NOT NULL,
  "description" text NOT NULL,
  "client_id" integer NOT NULL,
  "budget" integer NOT NULL,
  "status" "project_status" DEFAULT 'pending',
  "category_id" integer NOT NULL,
  "deadline" timestamp,
  "created_at" timestamp DEFAULT now()
);

-- Step 5: Copy the data back, converting the status to text and then to the new enum
INSERT INTO projects
SELECT 
  id, 
  title,
  description,
  client_id,
  budget,
  CASE 
    WHEN status::text = 'open' THEN 'open'::project_status
    WHEN status::text = 'in_progress' THEN 'in_progress'::project_status
    WHEN status::text = 'completed' THEN 'completed'::project_status
    WHEN status::text = 'cancelled' THEN 'cancelled'::project_status
    ELSE 'pending'::project_status
  END,
  category_id,
  deadline,
  created_at
FROM projects_temp;

-- Step 6: Drop the temporary table
DROP TABLE projects_temp; 