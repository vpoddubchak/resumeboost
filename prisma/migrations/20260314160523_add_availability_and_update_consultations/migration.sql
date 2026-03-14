/*
  Warnings:

  - Added the required column `updated_at` to the `consultations` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "consultations" ADD COLUMN     "duration_minutes" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "availability_rules" (
    "rule_id" SERIAL NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "availability_rules_pkey" PRIMARY KEY ("rule_id")
);

-- CreateTable
CREATE TABLE "date_overrides" (
    "override_id" SERIAL NOT NULL,
    "date" DATE NOT NULL,
    "is_blocked" BOOLEAN NOT NULL DEFAULT true,
    "start_time" TEXT,
    "end_time" TEXT,
    "reason" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "date_overrides_pkey" PRIMARY KEY ("override_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "availability_rules_day_of_week_start_time_key" ON "availability_rules"("day_of_week", "start_time");

-- CreateIndex
CREATE UNIQUE INDEX "date_overrides_date_key" ON "date_overrides"("date");
