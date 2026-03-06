// content.js — Injected into the active tab to extract SEO data

(function () {
    /**
     * Extracts all headings (H1–H6) from the DOM in document order.
     */
    function extractHeadings() {
        const headingElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        const headings = [];
        const counts = { H1: 0, H2: 0, H3: 0, H4: 0, H5: 0, H6: 0 };

        headingElements.forEach((el) => {
            const tag = el.tagName;
            const text = el.textContent.trim().replace(/\s+/g, ' ');
            counts[tag]++;
            headings.push({ tag, text });
        });

        const otherCount = counts.H4 + counts.H5 + counts.H6;
        const structureStatus = validateHierarchy(headings);

        return {
            counts: {
                H1: counts.H1,
                H2: counts.H2,
                H3: counts.H3,
                OTHER: otherCount,
            },
            headings,
            structureStatus,
            statusMessage: structureStatus === 'optimized'
                ? 'Heading hierarchy follows SEO best practices.'
                : 'Heading hierarchy has skipped levels. Consider fixing the structure.',
        };
    }

    /**
     * Validates heading hierarchy.
     */
    function validateHierarchy(headings) {
        if (headings.length === 0) return 'needs_improvement';

        for (let i = 1; i < headings.length; i++) {
            const prevLevel = parseInt(headings[i - 1].tag[1], 10);
            const currLevel = parseInt(headings[i].tag[1], 10);

            if (currLevel > prevLevel + 1) {
                return 'needs_improvement';
            }
        }
        return 'optimized';
    }

    /**
     * Accurately counts words in the visible body text.
     * Excludes script, style, noscript, and hidden elements.
     * Handles Unicode and special characters properly.
     */
    function countWords() {
        // Elements to exclude from word count
        const excludedTags = new Set([
            'SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'CODE', 'PRE',
            'TEXTAREA', 'INPUT', 'SELECT', 'OPTION'
        ]);

        function getVisibleText(node) {
            if (node.nodeType === Node.TEXT_NODE) {
                return node.textContent;
            }

            if (node.nodeType !== Node.ELEMENT_NODE) {
                return '';
            }

            // Skip excluded tags
            if (excludedTags.has(node.tagName)) {
                return '';
            }

            // Skip hidden elements
            const style = window.getComputedStyle(node);
            if (style.display === 'none' || style.visibility === 'hidden') {
                return '';
            }

            let text = '';
            for (const child of node.childNodes) {
                text += getVisibleText(child) + ' ';
            }
            return text;
        }

        const bodyText = document.body ? getVisibleText(document.body) : '';

        // Clean and count words
        const cleaned = bodyText
            .replace(/[\r\n\t]+/g, ' ')      // replace newlines/tabs with spaces
            .replace(/\s+/g, ' ')             // collapse multiple spaces
            .trim();

        if (!cleaned) return 0;

        // Split on whitespace and filter out non-word tokens
        const words = cleaned.split(/\s+/).filter(word => {
            // Must contain at least one letter or number character
            return /[\p{L}\p{N}]/u.test(word);
        });

        return words.length;
    }

    /**
     * Extracts overview/SEO data from the current page.
     */
    function extractOverviewData() {
        // Meta Title
        const title = document.title || '';
        const titleLength = title.length;

        // Meta Description
        const descEl = document.querySelector('meta[name="description"]');
        const description = descEl ? descEl.getAttribute('content') || '' : '';
        const descLength = description.length;

        // URL & Protocol
        const currentUrl = window.location.href;
        const protocol = window.location.protocol.replace(':', '').toUpperCase();

        // Canonical
        const canonicalEl = document.querySelector('link[rel="canonical"]');
        const canonicalUrl = canonicalEl ? canonicalEl.getAttribute('href') || '' : '';
        let canonicalStatus = 'Missing';
        if (canonicalUrl) {
            const normalizedCurrent = currentUrl.replace(/\/$/, '').toLowerCase();
            const normalizedCanonical = canonicalUrl.replace(/\/$/, '').toLowerCase();
            canonicalStatus = normalizedCurrent === normalizedCanonical ? 'Indexable' : 'Mismatch';
        }

        // Robots Tag (meta name="robots")
        const robotsEl = document.querySelector('meta[name="robots"]');
        const robotsTag = robotsEl ? robotsEl.getAttribute('content') || '' : '';

        // X-Robots-Tag (can't be read from DOM — it's an HTTP header)
        // We'll pass 'none' to indicate it needs to be checked via headers
        // The popup will attempt to read it from the page response headers if possible.
        const xRobotsTag = ''; // Will be fetched separately via fetch in popup.js

        // Language
        const lang = document.documentElement.lang || 'Not Set';

        // Word count (accurate visible text only)
        const wordCount = countWords();

        // Keywords (from meta keywords tag)
        const keywordsEl = document.querySelector('meta[name="keywords"]');
        const keywordsContent = keywordsEl ? keywordsEl.getAttribute('content') || '' : '';
        const keywordsList = keywordsContent ? keywordsContent.split(',').map(k => k.trim()).filter(k => k) : [];
        const keywordsCount = keywordsList.length;

        // Publisher (from meta or schema)
        let publisher = '';
        const publisherMeta = document.querySelector('meta[name="publisher"]') ||
            document.querySelector('meta[property="article:publisher"]') ||
            document.querySelector('meta[property="og:site_name"]');
        if (publisherMeta) {
            publisher = publisherMeta.getAttribute('content') || '';
        }

        // Headings counts (for overview stats)
        const allHeadings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        const totalHeadings = allHeadings.length;
        const headingBreakdown = {};
        allHeadings.forEach(el => {
            const tag = el.tagName;
            headingBreakdown[tag] = (headingBreakdown[tag] || 0) + 1;
        });

        // Images
        const allImages = document.querySelectorAll('img');
        const totalImages = allImages.length;
        let missingAlt = 0;
        allImages.forEach(img => {
            if (!img.getAttribute('alt') || img.getAttribute('alt').trim() === '') {
                missingAlt++;
            }
        });

        // Links
        const allLinks = document.querySelectorAll('a[href]');
        const totalLinks = allLinks.length;
        let externalLinks = 0;
        const currentHost = window.location.hostname;
        allLinks.forEach(a => {
            try {
                const linkUrl = new URL(a.href, window.location.origin);
                if (linkUrl.hostname !== currentHost) {
                    externalLinks++;
                }
            } catch (e) {
                // ignore malformed URLs
            }
        });

        // Base URL for robots.txt and sitemap.xml
        const origin = window.location.origin;

        return {
            title,
            titleLength,
            description,
            descLength,
            protocol,
            currentUrl,
            canonicalUrl,
            canonicalStatus,
            robotsTag,
            xRobotsTag,
            lang,
            wordCount,
            keywordsCount,
            keywordsList,
            publisher,
            totalHeadings,
            headingBreakdown,
            totalImages,
            missingAlt,
            totalLinks,
            externalLinks,
            origin,
        };
    }

    // Listen for messages from the popup
    chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
        if (request.action === 'getHeadings') {
            sendResponse(extractHeadings());
        } else if (request.action === 'getOverviewData') {
            sendResponse(extractOverviewData());
        }
    });
})();
