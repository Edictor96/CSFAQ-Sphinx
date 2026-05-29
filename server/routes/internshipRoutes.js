const { Router } = require('express');
const { fetchOverview } = require('../services/internshipOverview');

const router = Router();

router.get('/overview', async (_req, res, next) => {
  try {
    const sections = await fetchOverview();
    if (!sections) {
      return res.status(503).json({ success: false, message: 'Failed to fetch overview' });
    }
    res.json({ success: true, sections });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
