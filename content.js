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
        let withAlt = 0;
        let withTitle = 0;
        let missingTitle = 0;

        allImages.forEach(img => {
            if (!img.getAttribute('alt') || img.getAttribute('alt').trim() === '') {
                missingAlt++;
            } else {
                withAlt++;
            }
            if (!img.getAttribute('title') || img.getAttribute('title').trim() === '') {
                missingTitle++;
            } else {
                withTitle++;
            }
        });

        // Links (Detailed)
        const linksData = extractLinksData();
        // Derive simple counts from the detailed data for the overview stats cards
        const totalLinks = linksData.total;
        const externalLinks = linksData.external;

        // Schema & Hreflang
        const schemaData = extractSchemaData();
        const hreflangData = extractHreflangData();

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
            withAlt,
            missingTitle,
            withTitle,
            totalLinks,
            externalLinks,
            linksData,
            schemaData,
            hreflangData,
            origin,
        };
    }

    /**
     * Toggles CSS border overlays for images on the page.
     */
    function toggleImageHighlight(enable) {
        const styleId = 'onpager-img-highlight-style';
        let styleEl = document.getElementById(styleId);

        if (!enable) {
            if (styleEl) styleEl.remove();
            document.querySelectorAll('.onpager-img-valid, .onpager-img-invalid').forEach(img => {
                img.classList.remove('onpager-img-valid', 'onpager-img-invalid');
            });
            document.querySelectorAll('.onpager-img-label').forEach(lbl => lbl.remove());
            return;
        }

        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = styleId;
            styleEl.textContent = `
                .onpager-img-valid { outline: 3px solid #22C55E !important; outline-offset: -3px; }
                .onpager-img-invalid { outline: 3px solid #EF4444 !important; outline-offset: -3px; }
                .onpager-img-label {
                    position: absolute !important;
                    background: #EF4444 !important;
                    color: white !important;
                    font-size: 11px !important;
                    font-family: sans-serif !important;
                    font-weight: bold !important;
                    padding: 2px 6px !important;
                    border-radius: 4px !important;
                    z-index: 2147483647 !important;
                    pointer-events: none !important;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2) !important;
                }
            `;
            document.head.appendChild(styleEl);
        }

        document.querySelectorAll('img').forEach(img => {
            const hasAlt = img.getAttribute('alt') && img.getAttribute('alt').trim() !== '';

            // Skip hidden images to avoid weird labels
            const rect = img.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return;

            if (hasAlt) {
                img.classList.add('onpager-img-valid');
            } else {
                img.classList.add('onpager-img-invalid');

                // Add "Missing Alt" label overlay
                const label = document.createElement('div');
                label.className = 'onpager-img-label';
                label.textContent = 'Missing Alt';
                label.style.top = (window.scrollY + rect.top + 4) + 'px';
                label.style.left = (window.scrollX + rect.left + 4) + 'px';
                document.body.appendChild(label);
            }
        });
    }

    /**
     * Extracts deep links data for the Links tab
     */
    function extractLinksData() {
        const allLinks = document.querySelectorAll('a[href]');
        const total = allLinks.length;

        let internal = 0;
        let external = 0;
        let genericAnchors = 0;
        const uniqueUrls = new Set();

        const currentHost = window.location.hostname;

        // List of common generic anchor texts
        const genericTerms = new Set([
            'click here', 'read more', 'learn more', 'more', 'here',
            'link', 'this', 'website', 'page', 'continue', 'details'
        ]);

        allLinks.forEach(a => {
            try {
                const urlObj = new URL(a.href, window.location.origin);

                // Track unique URLs (excluding simple hash links to same page if desired, but let's track pure URLs)
                // Normalize url slightly by removing trailing slash for uniqueness count
                uniqueUrls.add(urlObj.href.replace(/\/$/, ''));

                // Internal vs External
                if (urlObj.hostname === currentHost) {
                    internal++;
                } else {
                    external++;
                }

                // Check anchor text
                const text = a.textContent.trim().toLowerCase();
                if (genericTerms.has(text) || text.length < 3) {
                    genericAnchors++;
                }

            } catch (e) {
                // Ignore malformed URLs
            }
        });

        return {
            total,
            internal,
            external,
            unique: uniqueUrls.size,
            genericAnchors,
            // Calculate if the distribution feels "natural" (less than 20% generic)
            isNatural: total === 0 ? true : (genericAnchors / total) < 0.2
        };
    }

    /**
     * Extracts JSON-LD and Microdata schema data from the page.
     */
    function extractSchemaData() {
        const schemas = [];

        // --- JSON-LD ---
        const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
        jsonLdScripts.forEach(script => {
            const raw = script.textContent.trim();
            try {
                const parsed = JSON.parse(raw);
                // Handle @graph arrays
                const items = parsed['@graph'] ? parsed['@graph'] : [parsed];
                items.forEach(item => {
                    schemas.push({
                        type: item['@type'] || 'Unknown',
                        format: 'JSON-LD',
                        valid: true,
                        warnings: 0,
                        raw: JSON.stringify(item, null, 2)
                    });
                });
            } catch (e) {
                // Invalid JSON-LD
                schemas.push({
                    type: 'Invalid JSON-LD',
                    format: 'JSON-LD',
                    valid: false,
                    warnings: 1,
                    raw: raw
                });
            }
        });

        // --- Microdata ---
        const microdataEls = document.querySelectorAll('[itemscope][itemtype]');
        microdataEls.forEach(el => {
            const itemType = el.getAttribute('itemtype') || '';
            // Extract type name from URL like "https://schema.org/Product"
            const typeName = itemType.split('/').pop() || 'Unknown';

            // Gather microdata properties
            const props = {};
            const propEls = el.querySelectorAll('[itemprop]');
            let warningCount = 0;
            propEls.forEach(p => {
                const name = p.getAttribute('itemprop');
                const value = p.getAttribute('content') || p.textContent.trim().substring(0, 100);
                if (!value) warningCount++;
                props[name] = value || '(empty)';
            });

            // Microdata is valid but Google recommends JSON-LD, so always flag warnings
            warningCount = Math.max(warningCount, 1); // At least 1 warning for using Microdata

            schemas.push({
                type: typeName,
                format: 'Microdata',
                valid: true,
                warnings: warningCount,
                raw: JSON.stringify(props, null, 2)
            });
        });

        // --- Check for recommended schemas ---
        const detectedTypes = schemas.map(s => s.type.toLowerCase());
        const missingRecommended = [];
        const recommended = ['Organization', 'Breadcrumb', 'BreadcrumbList', 'WebSite', 'WebPage'];
        recommended.forEach(r => {
            if (!detectedTypes.includes(r.toLowerCase())) {
                missingRecommended.push(r);
            }
        });

        // Identify if any Microdata schemas exist (for optimization tip)
        const hasMicrodata = schemas.some(s => s.format === 'Microdata');
        const hasJsonLd = schemas.some(s => s.format === 'JSON-LD');
        const hasValidSchema = schemas.some(s => s.valid);
        const allValid = schemas.length > 0 && schemas.every(s => s.valid && s.warnings === 0);

        return {
            schemas,
            total: schemas.length,
            hasJsonLd,
            hasMicrodata,
            hasValidSchema,
            allValid,
            missingRecommended
        };
    }

    /**
     * Extracts hreflang alternate link data from the page.
     */
    function extractHreflangData() {
        const hreflangLinks = document.querySelectorAll('link[rel="alternate"][hreflang]');
        const entries = [];

        hreflangLinks.forEach(link => {
            const lang = link.getAttribute('hreflang') || '';
            const href = link.getAttribute('href') || '';
            entries.push({
                lang,
                url: href
            });
        });

        return {
            entries,
            total: entries.length
        };
    }

    /**
     * Toggles CSS border overlays for links on the page.
     */
    function toggleLinkHighlight(enable) {
        const styleId = 'onpager-link-highlight-style';
        let styleEl = document.getElementById(styleId);

        if (!enable) {
            if (styleEl) styleEl.remove();
            document.querySelectorAll('.onpager-link-internal, .onpager-link-external, .onpager-link-nofollow').forEach(a => {
                a.classList.remove('onpager-link-internal', 'onpager-link-external', 'onpager-link-nofollow');
            });
            return;
        }

        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = styleId;
            styleEl.textContent = `
                .onpager-link-internal { outline: 2px solid #22C55E !important; outline-offset: 1px; background: rgba(34, 197, 94, 0.1) !important; color: #000 !important; }
                .onpager-link-external { outline: 2px solid #EF4444 !important; outline-offset: 1px; background: rgba(239, 68, 68, 0.1) !important; color: #000 !important; }
                .onpager-link-nofollow { outline: 2px solid #94A3B8 !important; outline-offset: 1px; background: rgba(148, 163, 184, 0.1) !important; color: #000 !important; }
            `;
            document.head.appendChild(styleEl);
        }

        const currentHost = window.location.hostname;
        document.querySelectorAll('a[href]').forEach(a => {
            const rel = (a.getAttribute('rel') || '').toLowerCase();
            if (rel.includes('nofollow')) {
                a.classList.add('onpager-link-nofollow');
                return;
            }

            try {
                const urlObj = new URL(a.href, window.location.origin);
                if (urlObj.hostname === currentHost) {
                    a.classList.add('onpager-link-internal');
                } else {
                    a.classList.add('onpager-link-external');
                }
            } catch (e) { }
        });
    }

    // Listen for messages from the popup
    chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
        if (request.action === 'getHeadings') {
            sendResponse(extractHeadings());
        } else if (request.action === 'getOverviewData') {
            sendResponse(extractOverviewData());
        } else if (request.action === 'getLinksData') {
            sendResponse(extractLinksData());
        } else if (request.action === 'toggleImageHighlight') {
            toggleImageHighlight(request.enable);
            sendResponse({ success: true });
        } else if (request.action === 'toggleLinkHighlight') {
            toggleLinkHighlight(request.enable);
            sendResponse({ success: true });
        } else if (request.action === 'getSchemaData') {
            sendResponse({
                schema: extractSchemaData(),
                hreflang: extractHreflangData()
            });
        }
    });
})();
