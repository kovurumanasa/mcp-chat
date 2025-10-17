
import { BlobServiceClient } from "@azure/storage-blob";
import { ClientSecretCredential } from "@azure/identity";

const tenantId = process.env.AZURE_TENANT_ID;
const clientId = process.env.AZURE_CLIENT_ID;
const clientSecret = process.env.AZURE_CLIENT_SECRET;
const storageAccountName = process.env.AZURE_STORAGE_ACCOUNT;
const containerName = process.env.AZURE_STORAGE_CONTAINER;

// Accept JSON data and blob name as arguments
export async function uploadJsonToAzure(jsonData: object, blobName: string = "data.json") {
  if (!tenantId || !clientId || !clientSecret || !storageAccountName || !containerName) {
    throw new Error("Missing one or more required Azure environment variables.");
  }
  const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
  const blobServiceClient = new BlobServiceClient(
    `https://${storageAccountName}.blob.core.windows.net`,
    credential
  );
  const containerClient = blobServiceClient.getContainerClient(containerName);
  await containerClient.createIfNotExists();
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  const content = JSON.stringify(jsonData);
  await blockBlobClient.upload(content, Buffer.byteLength(content));
  const blobUrl = blockBlobClient.url;
  return blobUrl;
}

// Example usage:
// (async () => {
//   const url = await uploadJsonToAzure({ key: "value" }, "data.json");
//   console.log("File URL:", url);
// })();
