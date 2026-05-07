-- CreateTable
CREATE TABLE "ExtensionNamespaceCache" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "extensionId" TEXT NOT NULL,
    "namespace" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "ExtensionNamespaceCache_namespace_idx" ON "ExtensionNamespaceCache"("namespace");

-- CreateIndex
CREATE UNIQUE INDEX "ExtensionNamespaceCache_extensionId_namespace_key" ON "ExtensionNamespaceCache"("extensionId", "namespace");
