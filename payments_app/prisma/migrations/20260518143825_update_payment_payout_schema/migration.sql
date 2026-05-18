/*
  Warnings:

  - You are about to drop the column `sellerId` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Payout` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Payout` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[payment_id]` on the table `Payout` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `buyer_id` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `seller_id` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `payment_id` to the `Payout` table without a default value. This is not possible if the table is not empty.
  - Added the required column `seller_id` to the `Payout` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "sellerId",
DROP COLUMN "userId",
ADD COLUMN     "buyer_id" TEXT NOT NULL,
ADD COLUMN     "seller_id" TEXT NOT NULL,
ALTER COLUMN "currency" SET DEFAULT 'ARS';

-- AlterTable
ALTER TABLE "Payout" DROP COLUMN "description",
DROP COLUMN "userId",
ADD COLUMN     "payment_id" TEXT NOT NULL,
ADD COLUMN     "seller_id" TEXT NOT NULL,
ALTER COLUMN "currency" SET DEFAULT 'ARS';

-- CreateIndex
CREATE UNIQUE INDEX "Payout_payment_id_key" ON "Payout"("payment_id");

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
