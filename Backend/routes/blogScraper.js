// server/routes/blogScraper.js
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const router = express.Router();

router.get('/scrape-techcrunch', async (req, res) => {
  try {
    const response = await axios.get('https://techcrunch.com/');
    const $ = cheerio.load(response.data);
    const articles = [];

    $('article.post-block').each((i, el) => {
      const title = $(el).find('h2.post-block__title a').text().trim();
      const url = $(el).find('h2.post-block__title a').attr('href');
      const image = $(el).find('img').attr('src');

      if (title && url && image) {
        articles.push({ title, url, image });
      }
    });

    res.json({ articles });
  } catch (err) {
    console.error('Scrape failed:', err.message);
    res.status(500).json({ error: 'Scraping failed' });
  }
});

module.exports = router;
