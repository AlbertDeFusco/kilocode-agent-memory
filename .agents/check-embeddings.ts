import { env } from "@huggingface/transformers";
import { cosineSimilarity, generateEmbedding } from "../src/embeddings";

// A separate offline invocation verifies the disk cache, not an in-memory model.
if (process.argv.includes("--offline")) env.allowRemoteModels = false;

const texts = [
  "The puppy chased a ball across the garden.",
  "A dog was playing fetch outside.",
  "The database migration added an index to the invoices table.",
];
const vectors = await Promise.all(texts.map(generateEmbedding));
for (const vector of vectors) {
  const norm = Math.hypot(...vector);
  if (vector.length !== 384 || !vector.every(Number.isFinite) || Math.abs(norm - 1) > 0.001) {
    throw new Error(`Invalid embedding: dimensions=${vector.length}, norm=${norm}`);
  }
}
const related = cosineSimilarity(vectors[0]!, vectors[1]!);
const unrelated = cosineSimilarity(vectors[0]!, vectors[2]!);
if (related <= unrelated + 0.2) throw new Error("Semantic ranking failed");
console.log(`Embeddings OK: 384 dimensions; related=${related.toFixed(3)}, unrelated=${unrelated.toFixed(3)}`);
