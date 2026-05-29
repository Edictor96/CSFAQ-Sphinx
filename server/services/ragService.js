const { ChromaClient } = require('chromadb');

const COLLECTION_NAME = 'faq_embeddings';
let client = null;
let collection = null;
let embedder = null;
let isReady = false;

async function initEmbedder() {
  try {
    const { pipeline } = await import('@xenova/transformers');
    embedder = await pipeline('feature-extraction', 'Xenova/bge-small-en-v1.5');
    return true;
  } catch (err) {
    console.warn('RAG: Failed to load embedding model:', err.message);
    return false;
  }
}

async function generateEmbedding(text) {
  if (!embedder) return null;
  try {
    const result = await embedder(text, { pooling: 'mean', normalize: true });
    return Array.from(result.data);
  } catch {
    return null;
  }
}

function cosineSimilarity(a, b) {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB) || 1);
}

async function initChroma() {
  try {
    client = new ChromaClient({
      path: process.env.CHROMA_URL || 'http://localhost:8000',
    });
    await client.heartbeat();
    collection = await client.getOrCreateCollection({
      name: COLLECTION_NAME,
      metadata: { 'hnsw:space': 'cosine' },
    });
    isReady = true;
    console.log('RAG: ChromaDB connected');
    return true;
  } catch (err) {
    console.warn('RAG: ChromaDB not available (start with: chroma run --path ./chroma_data)');
    console.warn('RAG: Falling back to in-memory search');
    isReady = false;
    return false;
  }
}

async function seedFAQs(faqs) {
  if (!isReady || !collection) return 0;

  try {
    const count = await collection.count();
    if (count > 0) return count;
  } catch {
    // collection might be empty
  }

  let seeded = 0;
  for (const faq of faqs) {
    try {
      const embedding = await generateEmbedding(faq.question + ' ' + faq.answer);
      if (!embedding) continue;

      const id = faq._id ? faq._id.toString() : `faq-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      await collection.add({
        ids: [id],
        embeddings: [embedding],
        metadatas: [{
          question: faq.question,
          answer: faq.answer,
          category: faq.category || 'general',
          faqId: id,
        }],
      });
      seeded++;
    } catch {
      continue;
    }
  }

  if (seeded > 0) {
    console.log(`RAG: Seeded ${seeded} FAQs into ChromaDB`);
  }
  return seeded;
}

async function searchSimilar(query, limit = 5) {
  if (!embedder) {
    return { results: [], method: 'unavailable' };
  }

  const queryEmbedding = await generateEmbedding(query);
  if (!queryEmbedding) {
    return { results: [], method: 'unavailable' };
  }

  if (isReady && collection) {
    try {
      const results = await collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: limit,
      });

      if (results.ids?.[0]?.length > 0) {
        const items = results.ids[0].map((id, i) => ({
          id,
          question: results.metadatas[0][i].question,
          answer: results.metadatas[0][i].answer,
          category: results.metadatas[0][i].category,
          score: results.distances?.[0]?.[i] !== undefined
            ? 1 - results.distances[0][i]
            : 0,
        }));
        return { results: items, method: 'chromadb' };
      }
    } catch {
      // fall through to in-memory
    }
  }

  return { results: [], method: 'chromadb_unavailable' };
}

async function searchSimilarInMemory(query, faqs, limit = 5, threshold = 0.3) {
  const queryEmbedding = await generateEmbedding(query);

  if (queryEmbedding) {
    const scored = [];
    for (const faq of faqs) {
      const faqEmbedding = faq.embedding;
      if (faqEmbedding) {
        const score = cosineSimilarity(queryEmbedding, faqEmbedding);
        scored.push({ ...faq.toObject(), score });
      }
    }
    scored.sort((a, b) => b.score - a.score);
    const filtered = scored.filter(s => s.score >= threshold).slice(0, limit);
    if (filtered.length > 0) return filtered;
  }

  // Fallback: word overlap scoring
  const qWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const scored = [];
  for (const faq of faqs) {
    const text = (faq.question + ' ' + faq.answer + ' ' + (faq.tags || []).join(' ')).toLowerCase();
    let matches = 0;
    for (const w of qWords) {
      if (text.includes(w)) matches++;
    }
    const score = qWords.length > 0 ? matches / qWords.length : 0;
    if (score > 0) {
      scored.push({ ...faq.toObject(), score });
    }
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

async function getStatus() {
  return {
    chromadb: isReady,
    embedder: embedder !== null,
    collection: COLLECTION_NAME,
  };
}

module.exports = {
  initChroma,
  initEmbedder,
  generateEmbedding,
  seedFAQs,
  searchSimilar,
  searchSimilarInMemory,
  cosineSimilarity,
  getStatus,
};
