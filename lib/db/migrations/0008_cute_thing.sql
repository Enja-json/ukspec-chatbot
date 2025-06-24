ALTER TABLE "User" ADD COLUMN "stripeCustomerId" varchar(128);--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "subscriptionStatus" varchar DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "subscriptionId" varchar(128);--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "trialEndsAt" timestamp;