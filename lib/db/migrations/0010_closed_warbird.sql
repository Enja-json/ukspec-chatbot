ALTER TABLE "CompetencyTask" ADD COLUMN "messageId" uuid;--> statement-breakpoint
ALTER TABLE "CompetencyTask" ADD COLUMN "aiModel" varchar(64);--> statement-breakpoint
ALTER TABLE "CompetencyTask" ADD COLUMN "aiResponseData" json;--> statement-breakpoint
ALTER TABLE "TaskCompetency" ADD COLUMN "aiExplanation" text;--> statement-breakpoint
ALTER TABLE "TaskCompetency" ADD COLUMN "sourceType" varchar DEFAULT 'manual_added' NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "CompetencyTask" ADD CONSTRAINT "CompetencyTask_messageId_Message_v2_id_fk" FOREIGN KEY ("messageId") REFERENCES "public"."Message_v2"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
