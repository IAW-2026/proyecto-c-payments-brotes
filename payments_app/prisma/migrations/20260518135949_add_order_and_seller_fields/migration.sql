/*
  Warnings:

  - Added the required column `order_id` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sellerId` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "order_id" TEXT NOT NULL,
ADD COLUMN     "sellerId" TEXT NOT NULL,
ALTER COLUMN "currency" SET DEFAULT 'ARG';

-- AlterTable
ALTER TABLE "Payout" ALTER COLUMN "currency" SET DEFAULT 'ARG';
