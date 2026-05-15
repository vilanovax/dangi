-- Add a non-destructive flag for user-saved checklist templates.
ALTER TABLE "Checklist" ADD COLUMN "isTemplate" BOOLEAN NOT NULL DEFAULT false;
