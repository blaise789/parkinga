/*
  Warnings:

  - You are about to drop the column `slot_number` on the `reservations` table. All the data in the column will be lost.
  - Added the required column `end_time` to the `reservations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `start_time` to the `reservations` table without a default value. This is not possible if the table is not empty.
  - Made the column `slot_id` on table `reservations` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "payment_status" AS ENUM ('PAID', 'PENDING', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "session_status" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED', 'OVERDUE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "reservation_status" ADD VALUE 'CANCELLED';
ALTER TYPE "reservation_status" ADD VALUE 'EXPIRED';
ALTER TYPE "reservation_status" ADD VALUE 'COMPLETED';

-- AlterEnum
ALTER TYPE "slot_status" ADD VALUE 'MAINTENANCE';

-- DropForeignKey
ALTER TABLE "reservations" DROP CONSTRAINT "reservations_slot_id_fkey";

-- AlterTable
ALTER TABLE "parking_slots" ADD COLUMN     "hourly_rate" DOUBLE PRECISION NOT NULL DEFAULT 2.50;

-- AlterTable
ALTER TABLE "reservations" DROP COLUMN "slot_number",
ADD COLUMN     "cancelled_at" TIMESTAMP(3),
ADD COLUMN     "end_time" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "start_time" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "slot_id" SET NOT NULL;

-- DropEnum
DROP TYPE "PaymentStatus";

-- CreateTable
CREATE TABLE "parking_sessions" (
    "id" TEXT NOT NULL,
    "session_number" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "vehicle_id" INTEGER NOT NULL,
    "slot_id" TEXT NOT NULL,
    "reservation_id" TEXT,
    "entry_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exit_time" TIMESTAMP(3),
    "paymentStatus" "payment_status" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" "PaymentMethod",
    "totalFee" DOUBLE PRECISION,
    "status" "session_status" NOT NULL DEFAULT 'ACTIVE',
    "prepaid_hours" INTEGER DEFAULT 0,
    "notes" TEXT,
    "checked_in_by" TEXT,
    "checked_out_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parking_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_configs" (
    "id" TEXT NOT NULL,
    "location" "parking_location",
    "vehicleType" "vehicle_type",
    "vehicleSize" "vehicle_size",
    "hourlyRate" DOUBLE PRECISION NOT NULL,
    "effective_from" TIMESTAMP(3) NOT NULL,
    "effective_to" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rate_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "parking_sessions_session_number_key" ON "parking_sessions"("session_number");

-- CreateIndex
CREATE UNIQUE INDEX "parking_sessions_reservation_id_key" ON "parking_sessions"("reservation_id");

-- CreateIndex
CREATE INDEX "parking_sessions_user_id_idx" ON "parking_sessions"("user_id");

-- CreateIndex
CREATE INDEX "parking_sessions_slot_id_idx" ON "parking_sessions"("slot_id");

-- CreateIndex
CREATE INDEX "parking_sessions_status_idx" ON "parking_sessions"("status");

-- CreateIndex
CREATE INDEX "parking_sessions_entry_time_idx" ON "parking_sessions"("entry_time");

-- CreateIndex
CREATE INDEX "parking_sessions_session_number_idx" ON "parking_sessions"("session_number");

-- CreateIndex
CREATE INDEX "reservations_user_id_idx" ON "reservations"("user_id");

-- CreateIndex
CREATE INDEX "reservations_slot_id_idx" ON "reservations"("slot_id");

-- CreateIndex
CREATE INDEX "reservations_status_idx" ON "reservations"("status");

-- CreateIndex
CREATE INDEX "reservations_start_time_idx" ON "reservations"("start_time");

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_slot_id_fkey" FOREIGN KEY ("slot_id") REFERENCES "parking_slots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_sessions" ADD CONSTRAINT "parking_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_sessions" ADD CONSTRAINT "parking_sessions_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_sessions" ADD CONSTRAINT "parking_sessions_slot_id_fkey" FOREIGN KEY ("slot_id") REFERENCES "parking_slots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_sessions" ADD CONSTRAINT "parking_sessions_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
