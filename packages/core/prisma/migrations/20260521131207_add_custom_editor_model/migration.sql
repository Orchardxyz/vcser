-- CreateTable
CREATE TABLE "CustomEditor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "cli" TEXT,
    "appPath" TEXT,
    "extensionsPath" TEXT NOT NULL,
    "settingsPath" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomEditor_slug_key" ON "CustomEditor"("slug");

-- CreateIndex
CREATE INDEX "CustomEditor_slug_idx" ON "CustomEditor"("slug");
