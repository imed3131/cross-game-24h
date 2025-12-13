-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_crossword_puzzles" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL DEFAULT 'Puzzle du jour',
    "date" DATETIME NOT NULL,
    "language" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "rows" INTEGER NOT NULL,
    "cols" INTEGER NOT NULL,
    "grid" TEXT NOT NULL,
    "cluesHorizontal" TEXT NOT NULL,
    "cluesVertical" TEXT NOT NULL,
    "solution" TEXT NOT NULL,
    "numbering" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_crossword_puzzles" ("cluesHorizontal", "cluesVertical", "cols", "createdAt", "date", "grid", "id", "isPublished", "language", "numbering", "rows", "solution", "updatedAt") SELECT "cluesHorizontal", "cluesVertical", "cols", "createdAt", "date", "grid", "id", "isPublished", "language", "numbering", "rows", "solution", "updatedAt" FROM "crossword_puzzles";
DROP TABLE "crossword_puzzles";
ALTER TABLE "new_crossword_puzzles" RENAME TO "crossword_puzzles";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
