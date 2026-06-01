-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "seller_email" TEXT;

-- AlterTable
ALTER TABLE "Payout" ADD COLUMN     "buyer_email" TEXT;
