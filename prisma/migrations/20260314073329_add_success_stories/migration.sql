-- CreateTable
CREATE TABLE "success_stories" (
    "story_id" SERIAL NOT NULL,
    "client_name" VARCHAR(100) NOT NULL,
    "client_role" VARCHAR(100),
    "industry" VARCHAR(50) NOT NULL,
    "challenge" TEXT NOT NULL,
    "solution" TEXT NOT NULL,
    "results" TEXT NOT NULL,
    "testimonial_quote" TEXT,
    "outcome_type" VARCHAR(50) NOT NULL,
    "metrics" JSONB,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "success_stories_pkey" PRIMARY KEY ("story_id")
);
