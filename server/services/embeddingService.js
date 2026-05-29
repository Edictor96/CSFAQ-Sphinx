const { pipeline } = require('@xenova/transformers');

let embedder = null;

async function getEmbedder() {
  if (!embedder) {
    embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
      quantized: true,
    });
  }
  return embedder;
}

async function generateEmbedding(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('Text is required for embedding generation');
  }

  const trimmed = text.trim();
  if (trimmed.length < 3) {
    throw new Error('Text must be at least 3 characters');
  }

  try {
    const extractor = await getEmbedder();
    const result = await extractor(trimmed, { pooling: 'mean', normalize: true });
    const embedding = Array.from(result.data);
    return embedding;
  } catch (err) {
    throw new Error(`Embedding generation failed: ${err.message}`);
  }
}

module.exports = { generateEmbedding };
