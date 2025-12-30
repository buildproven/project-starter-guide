import fs from "fs";
import os from "os";
import path from "path";

export default async function globalTeardown() {
  // Clean up test database files
  const dbPath = path.join(__dirname, "../../prisma/test-integration.db");
  const dbJournalPath = path.join(__dirname, "../../prisma/test-integration.db-journal");

  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log("🧹 Cleaned up test database");
  }

  if (fs.existsSync(dbJournalPath)) {
    fs.unlinkSync(dbJournalPath);
    console.log("🧹 Cleaned up test database journal");
  }

  // Clean up temp schema file
  const tempSchemaPath = process.env.TEMP_SCHEMA_PATH || path.join(__dirname, "../../.tmp-schema.test.prisma");
  if (fs.existsSync(tempSchemaPath)) {
    fs.unlinkSync(tempSchemaPath);
    console.log("🧹 Cleaned up temp schema file");
  }

  // Remove parallel execution lock
  const lockFile = path.join(os.tmpdir(), "api-service-test.lock");
  if (fs.existsSync(lockFile)) {
    fs.unlinkSync(lockFile);
    console.log("🧹 Released parallel execution lock");
  }
}
