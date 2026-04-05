-- AlterTable
ALTER TABLE "registration_fields" ADD COLUMN     "is_for_recruitment" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_for_register" BOOLEAN NOT NULL DEFAULT true;
