-- CreateIndex
CREATE INDEX "analytics_user_id_idx" ON "analytics"("user_id");

-- CreateIndex
CREATE INDEX "analytics_created_at_idx" ON "analytics"("created_at");

-- CreateIndex
CREATE INDEX "analytics_event_type_idx" ON "analytics"("event_type");

-- CreateIndex
CREATE INDEX "uploads_user_id_idx" ON "uploads"("user_id");

-- CreateIndex
CREATE INDEX "uploads_created_at_idx" ON "uploads"("created_at");
