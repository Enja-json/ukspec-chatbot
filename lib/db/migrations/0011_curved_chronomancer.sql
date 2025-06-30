ALTER TABLE "User" ADD COLUMN "linkedinId" varchar(128);--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "name" varchar(128);--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "image" text;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "onboardingCompleted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "onboardingData" json;