-- AlterTable
ALTER TABLE "public"."Entry" ADD COLUMN     "difficulty" TEXT DEFAULT 'Medium';

-- CreateTable
CREATE TABLE "public"."Vocabulary" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "word" TEXT NOT NULL,
    "meaning" TEXT NOT NULL,
    "entry_id" UUID NOT NULL,

    CONSTRAINT "Vocabulary_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Vocabulary" ADD CONSTRAINT "Vocabulary_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "public"."Entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
