-- Add a template marker for user-saved reusable checklists.
ALTER TABLE "Checklist" ADD COLUMN "isTemplate" BOOLEAN NOT NULL DEFAULT false;
