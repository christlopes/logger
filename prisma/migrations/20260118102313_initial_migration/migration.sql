-- CreateTable
CREATE TABLE "public"."EntryType" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "EntryType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Entry" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "date" DATE NOT NULL,
    "type_id" UUID NOT NULL,
    "notes" TEXT,

    CONSTRAINT "Entry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EntryType_name_key" ON "public"."EntryType"("name");

-- AddForeignKey
ALTER TABLE "public"."Entry" ADD CONSTRAINT "Entry_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "public"."EntryType"("id") ON DELETE CASCADE ON UPDATE CASCADE;
