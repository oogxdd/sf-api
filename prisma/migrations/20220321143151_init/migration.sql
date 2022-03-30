/*
  Warnings:

  - You are about to drop the `Post` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - Added the required column `nickname` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Post";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Song" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "url2" TEXT,
    "cover" TEXT,
    "sum" INTEGER NOT NULL,
    "timeToComplete" TEXT,
    "authorId" INTEGER,
    CONSTRAINT "Song_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Donation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "songId" INTEGER,
    "sum" INTEGER NOT NULL,
    "donatorEmail" TEXT,
    CONSTRAINT "Donation_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "country" TEXT
);
INSERT INTO "new_User" ("email", "id", "password") SELECT "email", "id", "password" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_nickname_key" ON "User"("nickname");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
