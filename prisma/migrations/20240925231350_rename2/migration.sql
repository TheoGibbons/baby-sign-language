-- AlterTable
ALTER TABLE "signs" ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "image_url" DROP NOT NULL,
ALTER COLUMN "youtube_url" DROP NOT NULL;
