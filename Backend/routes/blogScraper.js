const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const router = express.Router();
const { rateLimit } = require('express-rate-limit');

// Rate limiting to prevent abuse
const scraperLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many scraping requests, please try again later'
});

// Configuration for different sites
const SCRAPER_CONFIG = {
    techcrunch: {
        baseUrl: 'https://techcrunch.com/',
        selectors: {
            container: ['.post-block', 'article', '.wp-block-tc23-post-picker'],
            title: ['.post-block__title a', 'h2 a', 'h3 a'],
            image: ['img', '.post-block__media img', 'figure img']
        },
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5'
        }
    },
    theverge: {
        baseUrl: 'https://www.theverge.com/',
        selectors: {
            container: ['article', '.c-entry-box--compact', '.c-compact-river__entry'],
            title: ['h2 a', 'h3 a', '.c-entry-box--compact__title a'],
            image: ['img', 'picture img', 'figure img', '.c-dynamic-image img']
        },
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5'
        }
    }
};

// Helper function to scrape articles
async function scrapeArticles(config) {
    try {
        const { data } = await axios.get(config.baseUrl, {
            headers: config.headers,
            timeout: 10000
        });

        const $ = cheerio.load(data);
        const articles = [];

        // Find article containers
        for (const containerSel of config.selectors.container) {
            const containers = $(containerSel);
            
            if (containers.length > 0) {
                containers.each((i, el) => {
                    if (articles.length >= 12) return false; // Limit to 12 articles

                    // Find title and URL
                    let title = '';
                    let url = '';
                    
                    for (const titleSel of config.selectors.title) {
                        const titleEl = $(el).find(titleSel);
                        if (titleEl.length > 0) {
                            title = titleEl.text().trim();
                            url = titleEl.attr('href');
                            if (title && url) break;
                        }
                    }

                    // Find image
                    let image = '';
                    for (const imgSel of config.selectors.image) {
                        const imgEl = $(el).find(imgSel);
                        if (imgEl.length > 0) {
                            image = imgEl.attr('src') || 
                                    imgEl.attr('data-src') || 
                                    imgEl.attr('data-lazy-src');
                            if (image) break;
                        }
                    }

                    // Ensure URL is absolute
                    if (url && !url.startsWith('http')) {
                        url = url.startsWith('/') 
                            ? `${config.baseUrl}${url.substring(1)}` 
                            : `${config.baseUrl}${url}`;
                    }

                    if (title && url) {
                        articles.push({
                            title,
                            url,
                            image: image || `https://via.placeholder.com/400x200?text=${encodeURIComponent(config.siteName)}`
                        });
                    }
                });

                if (articles.length > 0) break;
            }
        }

        return articles.slice(0, 12);
    } catch (error) {
        console.error(`Scraping error for ${config.baseUrl}:`, error);
        throw error;
    }
}

// TechCrunch route
router.get('/scrape-techcrunch', scraperLimiter, async (req, res) => {
    try {
        const articles = await scrapeArticles({
            ...SCRAPER_CONFIG.techcrunch,
            siteName: 'TechCrunch'
        });
        res.json({ articles });
    } catch (error) {
        res.status(500).json({ 
            error: 'Failed to scrape TechCrunch',
            details: error.message 
        });
    }
});

// The Verge route
router.get('/scrape-theverge', scraperLimiter, async (req, res) => {
    try {
        const articles = await scrapeArticles({
            ...SCRAPER_CONFIG.theverge,
            siteName: 'The Verge'
        });
        res.json({ articles });
    } catch (error) {
        res.status(500).json({ 
            error: 'Failed to scrape The Verge',
            details: error.message 
        });
    }
});

module.exports = router;