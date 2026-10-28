-- AlterTable
ALTER TABLE "users" ADD COLUMN "azure_ad_id" TEXT;

-- AlterTable
ALTER TABLE "roles" ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "departments" ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE UNIQUE INDEX "users_azure_ad_id_key" ON "users"("azure_ad_id");
