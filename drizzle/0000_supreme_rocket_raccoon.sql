CREATE TABLE "chats" (
	"id" TEXT PRIMARY KEY NOT NULL,
	"title" TEXT DEFAULT 'New Chat' NOT NULL,
	"created_at" INTEGER DEFAULT (strftime('%s','now')) NOT NULL,
	"updated_at" INTEGER DEFAULT (strftime('%s','now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" TEXT PRIMARY KEY NOT NULL,
	"chat_id" TEXT NOT NULL,
	"content" TEXT NOT NULL,
	"role" TEXT NOT NULL,
	"created_at" INTEGER DEFAULT (strftime('%s','now')) NOT NULL,
	FOREIGN KEY ("chat_id") REFERENCES "chats"("id") ON DELETE CASCADE
);
--> statement-breakpoint
-- Foreign key already defined inline above for SQLite