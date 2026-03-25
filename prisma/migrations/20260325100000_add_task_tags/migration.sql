-- CreateTable
CREATE TABLE "TaskTag" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "TaskTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_TaskToTaskTag" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_TaskToTaskTag_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "TaskTag_name_key" ON "TaskTag"("name");

-- CreateIndex
CREATE INDEX "_TaskToTaskTag_B_index" ON "_TaskToTaskTag"("B");

-- AddForeignKey
ALTER TABLE "_TaskToTaskTag" ADD CONSTRAINT "_TaskToTaskTag_A_fkey" FOREIGN KEY ("A") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TaskToTaskTag" ADD CONSTRAINT "_TaskToTaskTag_B_fkey" FOREIGN KEY ("B") REFERENCES "TaskTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
