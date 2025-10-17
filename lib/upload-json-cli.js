#!/usr/bin/env node

const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

// Try to load .env.local first, then .env
if (fs.existsSync(path.resolve(process.cwd(), ".env.local"))) {
  dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
} else {
  dotenv.config();
}
const { uploadJsonToAzure } = require("./upload-json-to-azure.ts");

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error("Usage: node lib/upload-json-cli.js <json-file-path> [blob-name]");
    process.exit(1);
  }
  const jsonFilePath = args[0];
  const blobName = args[1] || path.basename(jsonFilePath);

  let jsonData;
  try {
    const fileContent = fs.readFileSync(jsonFilePath, "utf-8");
    jsonData = JSON.parse(fileContent);
  } catch (err) {
    console.error("Failed to read or parse JSON file:", err);
    process.exit(1);
  }

  try {
    const url = await uploadJsonToAzure(jsonData, blobName);
    console.log("File uploaded. Blob URL:", url);
  } catch (err) {
    console.error("Upload failed:", err);
    process.exit(1);
  }
}

main();
