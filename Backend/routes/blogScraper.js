// server/routes/blogScraper.js
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const router = express.Router();

router.get('/scrape-techcrunch', async (req, res) => {
    try {
        const { data } = await axios.get('https://techcrunch.com/');
        const $ = cheerio.load(data);
        const articles = [];

        $('.post-block').each((i, el) => {
            const title = $(el).find('.post-block__title a').text().trim();
            const url = $(el).find('.post-block__title a').attr('href');
            const image = $(el).find('img').attr('src');

            if (title && url && image) {
                articles.push({ title, url, image });
            }
        });
        console.log(articles);
        res.json({ articles });
    } catch (err) {
        console.error('Scraping failed:', err.message);
        res.status(500).json({ error: 'Scraping failed' });
    }
});

module.exports = router;
