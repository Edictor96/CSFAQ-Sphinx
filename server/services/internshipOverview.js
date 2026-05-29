const axios = require('axios');
const cheerio = require('cheerio');

const SOURCE_URL = 'https://samagama.in/internship';

async function fetchOverview() {
  try {
    const { data } = await axios.get(SOURCE_URL, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Accept: 'text/html',
      },
    });
    return parseOverview(data);
  } catch {
    return null;
  }
}

function parseOverview(html) {
  const $ = cheerio.load(html);
  const sections = [];

  $('main > *').each((_, el) => {
    const tag = el.tagName.toLowerCase();

    if (tag === 'p' && $(el).hasClass('lead')) {
      sections.push({ type: 'lead', content: $(el).text().trim() });
      return;
    }

    if (tag === 'h2') {
      sections.push({ type: 'heading', content: $(el).text().trim() });
      return;
    }

    if (tag === 'p' && !$(el).hasClass('lead')) {
      const html = $(el).html() || '';
      sections.push({ type: 'text', content: $(el).text().trim(), html });
      return;
    }

    if (tag === 'div' && $(el).hasClass('tracks')) {
      const tracks = [];
      $(el).find('.track').each((_, t) => {
        const title = $(t).find('h3').first().text().trim();
        const content = $(t).text().replace(title, '').trim().replace(/\s+/g, ' ');
        tracks.push({ title, content });
      });
      sections.push({ type: 'tracks', tracks });
      return;
    }

    if (tag === 'table') {
      const rows = [];
      $(el).find('tbody tr').each((_, r) => {
        const cells = [];
        $(r).find('td').each((_, c) => cells.push($(c).text().trim()));
        if (cells.length) rows.push(cells);
      });
      sections.push({ type: 'table', rows });
      return;
    }

    if (tag === 'ul' || tag === 'ol') {
      const items = [];
      const listTag = tag;
      $(el).find('li').each((_, li) => items.push($(li).text().trim()));
      sections.push({ type: listTag === 'ul' ? 'list' : 'ordered-list', items });
      return;
    }

    if (tag === 'div' && $(el).hasClass('note')) {
      sections.push({ type: 'note', content: $(el).text().trim() });
      return;
    }
  });

  return sections;
}

module.exports = { fetchOverview, parseOverview };
