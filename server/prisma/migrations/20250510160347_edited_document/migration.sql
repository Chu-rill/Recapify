/*
  Warnings:

  - You are about to drop the column `fileUrl` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `public_id` on the `Document` table. All the data in the column will be lost.
  - Made the column `extractedText` on table `Document` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Document" DROP COLUMN "fileUrl",
DROP COLUMN "public_id",
ALTER COLUMN "extractedText" SET NOT NULL;
