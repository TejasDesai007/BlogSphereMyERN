// server/routes/blogScraper.js
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const router = express.Router();

router.get('/scrape-techcrunch', async (req, res) => {
    try {
        const { data } = await axios.get('https://techcrunch.com/', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        
        const $ = cheerio.load(data);
        const articles = [];

        // Debug: Check if we're getting any content
        console.log('Page title:', $('title').text());
        console.log('Page length:', data.length);

        // Try multiple selectors as TechCrunch structure might have changed
        const selectors = [
            '.post-block',
            'article',
            '.wp-block-tc23-post-picker',
            '.post-list-item',
            '[data-module="PostBlock"]',
            '.post'
        ];

        let foundArticles = false;

        for (const selector of selectors) {
            console.log(`Trying selector: ${selector}`);
            const elements = $(selector);
            console.log(`Found ${elements.length} elements with ${selector}`);

            if (elements.length > 0) {
                foundArticles = true;
                
                elements.each((i, el) => {
                    // Try multiple title selectors
                    const titleSelectors = [
                        '.post-block__title a',
                        'h2 a',
                        'h3 a',
                        '.post-title a',
                        'a[data-module="PostTitle"]',
                        '.entry-title a',
                        'header h2 a',
                        'header h3 a'
                    ];

                    let title = '';
                    let url = '';
                    
                    for (const titleSel of titleSelectors) {
                        const titleEl = $(el).find(titleSel);
                        if (titleEl.length > 0) {
                            title = titleEl.text().trim();
                            url = titleEl.attr('href');
                            break;
                        }
                    }

                    // Try multiple image selectors
                    const imageSelectors = [
                        'img',
                        '.post-block__media img',
                        '.featured-image img',
                        'figure img',
                        '.wp-post-image'
                    ];

                    let image = '';
                    for (const imgSel of imageSelectors) {
                        const imgEl = $(el).find(imgSel);
                        if (imgEl.length > 0) {
                            image = imgEl.attr('src') || imgEl.attr('data-src') || imgEl.attr('data-lazy-src');
                            if (image) break;
                        }
                    }

                    // Make sure URL is absolute
                    if (url && !url.startsWith('http')) {
                        url = url.startsWith('/') ? `https://techcrunch.com${url}` : `https://techcrunch.com/${url}`;
                    }

                    if (title && url) {
                        articles.push({ 
                            title, 
                            url, 
                            image: image || 'https://via.placeholder.com/400x200?text=No+Image' 
                        });
                    }
                });
                
                if (articles.length > 0) {
                    break; // Found articles, stop trying other selectors
                }
            }
        }

        if (!foundArticles) {
            console.log('No articles found with any selector. Dumping first 1000 characters of HTML:');
            console.log(data.substring(0, 1000));
        }

        console.log(`Total articles found: ${articles.length}`);
        articles.forEach((article, index) => {
            console.log(`Article ${index + 1}:`, article.title);
        });

        res.json({ articles: articles.slice(0, 12) }); // Limit to 12 articles
    } catch (err) {
        console.error('Scraping failed:', err.message);
        res.status(500).json({ error: 'Scraping failed', details: err.message });
    }
});

// Alternative endpoint for debugging
router.get('/debug-techcrunch', async (req, res) => {
    try {
        const { data } = await axios.get('https://techcrunch.com/', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        
        const $ = cheerio.load(data);
        
        // Return debugging info
        const debugInfo = {
            pageTitle: $('title').text(),
            pageLength: data.length,
            availableSelectors: []
        };

        // Check for common article selectors
        const selectorsToCheck = [
            'article',
            '.post-block',
            '.post',
            '.entry',
            '[data-module="PostBlock"]',
            '.wp-block-tc23-post-picker',
            '.post-list-item'
        ];

        selectorsToCheck.forEach(selector => {
            const count = $(selector).length;
            if (count > 0) {
                debugInfo.availableSelectors.push({
                    selector,
                    count,
                    sampleHTML: $(selector).first().html()?.substring(0, 200) + '...'
                });
            }
        });

        res.json(debugInfo);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;