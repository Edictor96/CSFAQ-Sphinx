const Faq = require('../models/Faq');
const { AppError } = require('../middleware/errorHandler');
const { indexFaq, deleteFaqIndex } = require('../services/searchService');

exports.getFAQs = async (req, res, next) => {
  try {
    const { category, page = 1, limit = 50 } = req.query;
    const filter = { isPublished: true };
    if (category) filter.category = category.toLowerCase();
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const faqs = await Faq.find(filter)
      .sort({ category: 1, views: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    const total = await Faq.countDocuments(filter);
    res.json({ success: true, count: faqs.length, total, results: faqs });
  } catch (err) {
    next(err);
  }
};

exports.getCategories = async (_req, res, next) => {
  try {
    const categories = await Faq.distinct('category', { isPublished: true });
    res.json({ success: true, categories });
  } catch (err) {
    next(err);
  }
};

exports.getFaqById = async (req, res, next) => {
  try {
    const faq = await Faq.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );
    if (!faq) return next(new AppError('FAQ not found', 404));
    res.json({ success: true, faq });
  } catch (err) {
    next(err);
  }
};

exports.searchFAQs = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) return next(new AppError('Search query is required', 400));
    const query = q.trim();
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const results = await Faq.find({
      isPublished: true,
      $or: [
        { question: { $regex: escaped, $options: 'i' } },
        { tags: { $regex: escaped, $options: 'i' } },
        { category: { $regex: escaped, $options: 'i' } },
      ],
    }).limit(10);
    res.json({ success: true, count: results.length, results });
  } catch (err) {
    next(err);
  }
};

exports.getTrending = async (_req, res, next) => {
  try {
    const results = await Faq.find({ isPublished: true })
      .sort({ views: -1 })
      .limit(10);
    res.json({ success: true, count: results.length, results });
  } catch (err) {
    next(err);
  }
};

exports.createFaq = async (req, res, next) => {
  try {
    const { question, answer, category, tags } = req.body;
    if (!question || !answer || !category) {
      return next(new AppError('Question, answer, and category are required', 400));
    }
    const faq = await Faq.create({
      question,
      answer,
      category: category.toLowerCase(),
      tags: tags || [],
      createdBy: req.user?._id,
    });
    try {
      await indexFaq(faq);
      console.log(`Indexed new FAQ: "${faq.question}"`);
    } catch (e) {
      console.warn('FAQ index warning:', e.message);
    }
    res.status(201).json({ success: true, faq });
  } catch (err) {
    next(err);
  }
};

exports.updateFaq = async (req, res, next) => {
  try {
    const faq = await Faq.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!faq) return next(new AppError('FAQ not found', 404));
    try {
      await indexFaq(faq);
      console.log(`Re-indexed updated FAQ: "${faq.question}"`);
    } catch (e) {
      console.warn('FAQ re-index warning:', e.message);
    }
    res.json({ success: true, faq });
  } catch (err) {
    next(err);
  }
};

exports.deleteFaq = async (req, res, next) => {
  try {
    const faq = await Faq.findByIdAndDelete(req.params.id);
    if (!faq) return next(new AppError('FAQ not found', 404));
    try {
      await deleteFaqIndex(req.params.id);
      console.log(`Removed FAQ from index: "${faq.question}"`);
    } catch (e) {
      console.warn('FAQ delete index warning:', e.message);
    }
    res.json({ success: true, message: 'FAQ deleted' });
  } catch (err) {
    next(err);
  }
};