const { ChromaClient } = require('chromadb');
const axios = require('axios');
const Faq = require('../models/Faq');
const { generateEmbedding } = require('./embeddingService');
const { fetchOverview } = require('./internshipOverview');

const CHROMA_HOST = process.env.CHROMA_HOST || 'localhost';
const CHROMA_PORT = parseInt(process.env.CHROMA_PORT, 10) || 8000;
const CHROMA_COLLECTION = process.env.CHROMA_COLLECTION || 'faq_embeddings';

const LLM_ENDPOINT = process.env.LLM_ENDPOINT || 'https://api.openai.com/v1/chat/completions';
const LLM_API_KEY = process.env.LLM_API_KEY || process.env.OPENAI_API_KEY || '';
const LLM_MODEL = process.env.LLM_MODEL || 'gpt-4o-mini';

let chromaClient = null;
let collection = null;
let chromaAvailable = false;

function initChroma() {
  if (chromaClient) return;
  try {
    chromaClient = new ChromaClient({ host: CHROMA_HOST, port: CHROMA_PORT });
  } catch {
    chromaAvailable = false;
  }
}

async function ensureCollection() {
  if (collection) return collection;
  initChroma();
  if (!chromaClient) return null;
  try {
    collection = await chromaClient.getOrCreateCollection({ name: CHROMA_COLLECTION });
    chromaAvailable = true;
    return collection;
  } catch {
    chromaAvailable = false;
    return null;
  }
}

function cosineSimilarity(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

async function indexFaq(faq) {
  if (!faq || !faq._id) throw new Error('Valid FAQ with _id is required');

  const text = `${faq.question} ${faq.answer}`;
  const embedding = await generateEmbedding(text);

  const col = await ensureCollection();
  if (col) {
    try {
      await col.upsert({
        ids: [faq._id.toString()],
        embeddings: [embedding],
        metadatas: [{
          faqId: faq._id.toString(),
          question: faq.question,
          category: faq.category || '',
        }],
        documents: [`${faq.question} ${faq.answer}`],
      });
      return;
    } catch {
      // fall through to in-memory
    }
  }
}

async function deleteFaqIndex(faqId) {
  const col = await ensureCollection();
  if (col) {
    try {
      await col.delete({ ids: [faqId.toString()] });
    } catch {
      // ignore
    }
  }
}

async function searchSimilar(query, limit = 5) {
  if (!query || query.trim().length < 3) {
    return [];
  }

  const queryEmbedding = await generateEmbedding(query);
  const col = await ensureCollection();

  if (col && chromaAvailable) {
    try {
      const result = await col.query({
        queryEmbeddings: [queryEmbedding],
        nResults: limit,
        include: ['metadatas', 'distances', 'documents'],
      });

      const sources = [];
      if (result && result.ids && result.ids[0]) {
        for (let i = 0; i < result.ids[0].length; i++) {
          const dist = result.distances?.[0]?.[i] || 0;
          const score = Math.max(0, Math.min(1, 1 - dist / 2));
          sources.push({
            faqId: result.ids[0][i],
            question: result.metadatas?.[0]?.[i]?.question || '',
            category: result.metadatas?.[0]?.[i]?.category || '',
            document: result.documents?.[0]?.[i] || '',
            score: Math.round(score * 100) / 100,
          });
        }
      }
      return sources.sort((a, b) => b.score - a.score);
    } catch {
      // fall through to in-memory
    }
  }

  const faqs = await Faq.find({ isPublished: true }).select('_id question answer category').lean();
  const scored = [];

  for (const faq of faqs) {
    const text = `${faq.question} ${faq.answer}`;
    try {
      const faqEmbedding = await generateEmbedding(text);
      const score = cosineSimilarity(queryEmbedding, faqEmbedding);
      scored.push({
        faqId: faq._id.toString(),
        question: faq.question,
        category: faq.category,
        document: `${faq.question} ${faq.answer}`,
        score: Math.round(score * 100) / 100,
      });
    } catch {
      // skip individual FAQ on embedding error
    }
  }

  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}

async function getSuggestions(query) {
  const results = await searchSimilar(query, 5);
  return results.map(r => ({
    faqId: r.faqId,
    question: r.question,
    score: r.score,
  }));
}

async function generateAnswer(userQuery, sources) {
  if (!sources || sources.length === 0) {
    return {
      answer: 'No relevant information found in the knowledge base.',
      confidence: 0,
    };
  }

  const context = sources
    .map((s, i) => `[${i + 1}] Q: ${s.question}\n    A: ${s.document.replace(s.question, '').trim()}`)
    .join('\n\n');

  const avgScore = sources.reduce((sum, s) => sum + s.score, 0) / sources.length;
  const confidence = Math.round(avgScore * 100) / 100;

  if (!LLM_API_KEY) {
    const best = sources[0];
    const answer = best.document.replace(best.question, '').trim();
    return {
      answer: answer || best.question,
      confidence,
    };
  }

  const systemPrompt = `You are a helpful FAQ assistant. Answer the user's question based only on the provided context. Be concise and direct. If the context has related information, use it to answer even if the wording is different.`;

  const userPrompt = `Context:\n${context}\n\nQuestion: ${userQuery}\n\nAnswer based only on the context above.`;

  try {
    const { data } = await axios.post(
      LLM_ENDPOINT,
      {
        model: LLM_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 512,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${LLM_API_KEY}`,
        },
        timeout: 10000,
      }
    );

    const answer = data.choices?.[0]?.message?.content?.trim() || '';
    return { answer, confidence };
  } catch {
    const best = sources[0];
    const answer = best.document.replace(best.question, '').trim();
    return {
      answer: answer || best.question,
      confidence,
    };
  }
}

async function indexAllFaqs() {
  const faqs = await Faq.find({ isPublished: true }).lean();
  let indexed = 0;

  for (const faq of faqs) {
    try {
      await indexFaq(faq);
      indexed++;
    } catch {
      // skip individual failures during bulk index
    }
  }

  try {
    await indexOverview();
    indexed++;
  } catch {
    // overview index failed, non-critical
  }

  return indexed;
}

async function indexOverview() {
  const existingIds = ['overview-about', 'overview-badges', 'overview-expectations', 'overview-project', 'overview-interview', 'overview-logistics', 'overview-cost'];
  const col = await ensureCollection();
  if (col) {
    try { await col.delete({ ids: existingIds }); } catch { /* ok */ }
  }

  let data;
  try {
    data = await fetchOverview();
  } catch {
    return;
  }

  if (!data?.sections?.length) return;

  const sections = [
    { id: 'overview-about', title: 'About the internship programme', text: data.sections.find(s => s.type === 'lead')?.content || '' },
    { id: 'overview-badges', title: 'Four-badge journey and certificate', text: data.sections.filter(s => s.type === 'text' || s.type === 'table').slice(0, 5).map(s => s.content || s.rows?.map?.(r => r.join(' ')).join(' ') || '').join(' ') },
    { id: 'overview-expectations', title: 'What is expected of interns - attendance, participation, hours', text: data.sections.filter(s => s.type === 'text').slice(2, 5).map(s => s.content).join(' ') },
    { id: 'overview-project', title: 'Projects, technology and domains in the internship', text: data.sections.filter(s => s.type === 'text').slice(5, 7).map(s => s.content).join(' ') },
    { id: 'overview-interview', title: 'Interview process on samagama.in with Yaksha', text: data.sections.filter(s => s.type === 'text').slice(7, 9).map(s => s.content).join(' ') + (data.sections.find(s => s.type === 'note')?.content || '') },
    { id: 'overview-logistics', title: 'Logistics - NOC, offer letter, result panel, tools', text: data.sections.find(s => s.type === 'list')?.items?.join(' ') || '' },
    { id: 'overview-cost', title: 'Cost, stipend and funding of the internship', text: data.sections.filter(s => s.type === 'text').slice(9, 11).map(s => s.content).join(' ') },
  ];

  for (const sec of sections) {
    if (!sec.text) continue;
    const text = `${sec.title}. ${sec.text}`;
    const embedding = await generateEmbedding(text);
    const col2 = await ensureCollection();
    if (col2) {
      try {
        await col2.upsert({
          ids: [sec.id],
          embeddings: [embedding],
          metadatas: [{ faqId: sec.id, question: sec.title, category: 'programme-overview' }],
          documents: [text],
        });
      } catch { /* skip individual */ }
    }
  }
}

module.exports = {
  indexFaq,
  deleteFaqIndex,
  searchSimilar,
  getSuggestions,
  generateAnswer,
  indexAllFaqs,
  indexOverview,
};
