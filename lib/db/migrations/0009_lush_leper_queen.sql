CREATE TABLE IF NOT EXISTS "CompetencyCode" (
	"id" varchar(8) PRIMARY KEY NOT NULL,
	"category" varchar(1) NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "CompetencyTask" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"source" varchar DEFAULT 'manual' NOT NULL,
	"chatId" uuid,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "TaskCompetency" (
	"taskId" uuid NOT NULL,
	"competencyCodeId" varchar(8) NOT NULL,
	"confidenceScore" numeric(5, 2),
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "TaskCompetency_taskId_competencyCodeId_pk" PRIMARY KEY("taskId","competencyCodeId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "TaskEvidence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"taskId" uuid NOT NULL,
	"fileName" text NOT NULL,
	"fileSize" integer NOT NULL,
	"mimeType" varchar(128) NOT NULL,
	"fileUrl" text NOT NULL,
	"uploadedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "CompetencyTask" ADD CONSTRAINT "CompetencyTask_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "CompetencyTask" ADD CONSTRAINT "CompetencyTask_chatId_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "TaskCompetency" ADD CONSTRAINT "TaskCompetency_taskId_CompetencyTask_id_fk" FOREIGN KEY ("taskId") REFERENCES "public"."CompetencyTask"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "TaskCompetency" ADD CONSTRAINT "TaskCompetency_competencyCodeId_CompetencyCode_id_fk" FOREIGN KEY ("competencyCodeId") REFERENCES "public"."CompetencyCode"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "TaskEvidence" ADD CONSTRAINT "TaskEvidence_taskId_CompetencyTask_id_fk" FOREIGN KEY ("taskId") REFERENCES "public"."CompetencyTask"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
