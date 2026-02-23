import { QdrantClient } from "@qdrant/js-client-rest";

export const qdrantClient = new QdrantClient({ url: "http://localhost:6333" })

const collectionName = "transactions";
const vectorSize = 768;

export const setupQdrant = async () => {
    try {
        const collections = await qdrantClient.getCollections();
        const exists = collections.collections.some((c) => c.name === collectionName);

        if (!exists) {
            await qdrantClient.createCollection(collectionName, {
                vectors: {
                    size: vectorSize,
                    distance: "Cosine"
                }
            })
            console.log("Collection created:", collectionName);
        } else {
            console.log("Collection exists already.");
        }
    } catch (e) {
        console.error("Error setting up Qdrant:", e);
    }
}