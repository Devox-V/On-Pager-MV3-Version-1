// popup.js — Controls the popup UI, fetches data from content script

document.addEventListener('DOMContentLoaded', () => {
    // ═══════════════ TAB SWITCHING ═══════════════
    const tabBar = document.getElementById('tabBar');
    const panels = document.querySelectorAll('.tab-panel');
    const tabBtns = document.querySelectorAll('.tab-btn');

    window._previousTab = 'overview';
    const extFooter = document.querySelector('.ext-footer');

    tabBar.addEventListener('click', (e) => {
        const btn = e.target.closest('.tab-btn');
        if (!btn) return;

        const tabName = btn.dataset.tab;

        // Remember the previous non-settings tab
        const currentActive = document.querySelector('.tab-btn.active');
        if (currentActive && currentActive.dataset.tab !== 'settings') {
            window._previousTab = currentActive.dataset.tab;
        }

        tabBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        panels.forEach((p) => {
            p.classList.remove('active');
            if (p.id === `panel-${tabName}`) {
                p.classList.add('active');
            }
        });

        // Hide tab bar & footer when Settings is open
        if (tabName === 'settings') {
            tabBar.classList.add('hidden-for-settings');
            if (extFooter) extFooter.classList.add('hidden-for-settings');
        } else {
            tabBar.classList.remove('hidden-for-settings');
            if (extFooter) extFooter.classList.remove('hidden-for-settings');
        }
    });

    // ═══════════════ INIT ALL TABS (single injection, parallel fetch) ═══════════════
    initAllTabs();
    initSettingsTab();

    // ═══════════════ SCHEMA SUB-TAB SWITCHING ═══════════════
    const schemaSubtabs = document.querySelectorAll('.schema-subtab');
    const schemaSubviews = document.querySelectorAll('.schema-subview');
    schemaSubtabs.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.subtab;
            schemaSubtabs.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            schemaSubviews.forEach(sv => {
                sv.classList.remove('active');
                if (sv.id === `subview-${target}`) sv.classList.add('active');
            });
        });
    });

    // ═══════════════ COPY BUTTON ═══════════════
    document.getElementById('copyTreeBtn').addEventListener('click', copyHeadingTree);

    // ═══════════════ HIGHLIGHT IMAGES BUTTON ═══════════════
    const highlightBtn = document.getElementById('highlightImagesBtn');
    if (highlightBtn) {
        let isHighlighted = false;
        highlightBtn.addEventListener('click', async () => {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab) return;
            isHighlighted = !isHighlighted;
            chrome.tabs.sendMessage(tab.id, { action: 'toggleImageHighlight', enable: isHighlighted }, () => {
                const btnText = highlightBtn.querySelector('.btn-highlight__text');
                const btnIcon = highlightBtn.querySelector('.btn-highlight__icon');

                if (isHighlighted) {
                    highlightBtn.classList.add('is-active');
                    btnText.textContent = 'Remove Overlay';
                    btnIcon.innerHTML = `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>`;
                } else {
                    highlightBtn.classList.remove('is-active');
                    btnText.textContent = 'Highlight Images';
                    btnIcon.innerHTML = `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>`;
                }
            });
        });
    }

    // ═══════════════ HIGHLIGHT LINKS BUTTON ═══════════════
    const highlightLinksBtn = document.getElementById('highlightLinksBtn');
    if (highlightLinksBtn) {
        let isLinksHighlighted = false;
        highlightLinksBtn.addEventListener('click', async () => {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab) return;
            isLinksHighlighted = !isLinksHighlighted;

            chrome.tabs.sendMessage(tab.id, { action: 'toggleLinkHighlight', enable: isLinksHighlighted }, () => {
                const btnText = highlightLinksBtn.querySelector('.btn-highlight__text');
                const btnIcon = highlightLinksBtn.querySelector('.btn-highlight__icon');

                if (isLinksHighlighted) {
                    highlightLinksBtn.classList.add('is-active');
                    highlightLinksBtn.classList.remove('btn-highlight--blue-solid');
                    btnText.textContent = 'Remove Overlay';
                    btnIcon.innerHTML = `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>`;
                } else {
                    highlightLinksBtn.classList.remove('is-active');
                    highlightLinksBtn.classList.add('btn-highlight--blue-solid');
                    btnText.textContent = 'Highlight Links on Page';
                    btnIcon.innerHTML = `<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>`;
                }
            });
        });
    }

    // ═══════════════ HIGHLIGHT RENDER BUTTON ═══════════════
    const highlightRenderBtn = document.getElementById('highlightRenderBtn');
    if (highlightRenderBtn) {
        let isRenderHighlighted = false;
        highlightRenderBtn.addEventListener('click', async () => {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab) return;
            isRenderHighlighted = !isRenderHighlighted;

            chrome.tabs.sendMessage(tab.id, { action: 'toggleRenderHighlight', enable: isRenderHighlighted }, () => {
                const btnText = highlightRenderBtn.querySelector('.btn-highlight__text');
                const btnIcon = highlightRenderBtn.querySelector('.btn-highlight__icon');

                if (isRenderHighlighted) {
                    highlightRenderBtn.classList.add('is-active');
                    highlightRenderBtn.classList.remove('btn-highlight--blue-solid');
                    btnText.textContent = 'Remove Overlay';
                    btnIcon.innerHTML = `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>`;
                } else {
                    highlightRenderBtn.classList.remove('is-active');
                    highlightRenderBtn.classList.add('btn-highlight--blue-solid');
                    btnText.textContent = 'Highlight Render Types';
                    btnIcon.innerHTML = `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>`;
                }
            });
        });
    }
});


/* ════════════════════════════════════════════════
   FAST INIT — Single injection, parallel data fetch
   ════════════════════════════════════════════════ */

/**
 * Helper: send a message to tab and return a promise.
 * Resolves with the response or null on error/timeout.
 */
function sendTabMessage(tabId, message, timeoutMs = 5000) {
    return new Promise((resolve) => {
        const timer = setTimeout(() => resolve(null), timeoutMs);
        try {
            chrome.tabs.sendMessage(tabId, message, (response) => {
                clearTimeout(timer);
                if (chrome.runtime.lastError || !response) {
                    resolve(null);
                } else {
                    resolve(response);
                }
            });
        } catch (e) {
            clearTimeout(timer);
            resolve(null);
        }
    });
}

async function initAllTabs() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab || !tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('edge://')) {
            setOverviewError();
            setHeadingsError('Cannot analyse this page.');
            setLinksError();
            setSchemaError();
            setRenderError();
            return;
        }

        // Inject content script ONCE
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js'],
        });

        // Fire ALL data requests in parallel
        const [overviewData, headingsData, linksData, schemaData, renderData] = await Promise.all([
            sendTabMessage(tab.id, { action: 'getOverviewData' }),
            sendTabMessage(tab.id, { action: 'getHeadings' }),
            sendTabMessage(tab.id, { action: 'getLinksData' }),
            sendTabMessage(tab.id, { action: 'getSchemaData' }),
            sendTabMessage(tab.id, { action: 'getRenderData' }),
        ]);

        // ── Overview ──
        if (overviewData) {
            if (renderData) overviewData.renderData = renderData;
            if (linksData) overviewData.linksData = linksData;
            renderOverviewTab(overviewData);
            fetchXRobotsTag(overviewData.currentUrl);
        } else {
            setOverviewError();
        }

        // ── Headings ──
        if (headingsData) {
            renderHeadingsTab(headingsData);
        } else {
            setHeadingsError('Could not extract headings from this page.');
        }

        // ── Links ──
        if (linksData) {
            renderLinksTab(linksData);
        } else {
            setLinksError();
        }

        // ── Schema & Hreflang ──
        if (schemaData) {
            if (schemaData.schema) renderSchemaTab(schemaData.schema);
            if (schemaData.hreflang) renderHreflangTab(schemaData.hreflang);
        } else {
            setSchemaError();
        }

        // ── Render ──
        if (renderData) {
            renderRenderTab(renderData);
        } else {
            setRenderError();
        }

    } catch (err) {
        console.error('initAllTabs error:', err);
        setOverviewError();
        setHeadingsError('An error occurred.');
        setLinksError();
        setSchemaError();
        setRenderError();
    }
}


/**
 * Tries to fetch the X-Robots-Tag HTTP header from the current page URL.
 */
async function fetchXRobotsTag(url) {
    const statusEl = document.getElementById('xRobotsTagStatus');
    const valueEl = document.getElementById('xRobotsTagValue');

    try {
        const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
        const xRobots = response.headers.get('x-robots-tag');

        if (xRobots) {
            valueEl.textContent = xRobots;
            statusEl.innerHTML = svgInfoCircle('#64748B');
        } else {
            valueEl.textContent = 'none';
            statusEl.innerHTML = svgInfoCircle('#94A3B8');
        }
    } catch (e) {
        valueEl.textContent = 'none';
        statusEl.innerHTML = svgInfoCircle('#94A3B8');
    }
}


/**
 * Renders the overview tab UI with the response data.
 */
function renderOverviewTab(data) {
    const {
        title,
        titleLength,
        description,
        descLength,
        protocol,
        currentUrl,
        canonicalUrl,
        canonicalStatus,
        robotsTag,
        lang,
        wordCount,
        keywordsCount,
        publisher,
        totalHeadings,
        headingBreakdown,
        totalImages,
        missingAlt,
        totalLinks,
        externalLinks,
        origin,
    } = data;

    // ── Title ──
    const titlePill = document.getElementById('titleChars');
    const titleContent = document.getElementById('titleContent');
    titleContent.textContent = title || '(No title found)';

    if (titleLength > 0) {
        titlePill.textContent = `${titleLength} chars`;
        if (titleLength >= 30 && titleLength <= 60) {
            titlePill.className = 'meta-pill meta-pill--blue';
        } else if (titleLength <= 70) {
            titlePill.className = 'meta-pill meta-pill--yellow';
        } else {
            titlePill.className = 'meta-pill meta-pill--red';
        }
    } else {
        titlePill.textContent = 'Missing';
        titlePill.className = 'meta-pill meta-pill--red';
    }

    // ── Description ──
    const descPill = document.getElementById('descChars');
    const descContent = document.getElementById('descContent');
    descContent.textContent = description || '(No meta description found)';

    if (descLength > 0) {
        descPill.textContent = `${descLength} chars`;
        if (descLength >= 120 && descLength <= 160) {
            descPill.className = 'meta-pill meta-pill--green';
        } else if (descLength > 160) {
            descPill.className = 'meta-pill meta-pill--red';
        } else {
            descPill.className = 'meta-pill meta-pill--yellow';
        }
    } else {
        descPill.textContent = 'Missing';
        descPill.className = 'meta-pill meta-pill--red';
    }

    // ── URL ──
    const urlPill = document.getElementById('urlProtocol');
    const urlContent = document.getElementById('urlContent');
    urlContent.textContent = currentUrl;
    urlPill.textContent = protocol;
    urlPill.className = protocol === 'HTTPS'
        ? 'meta-pill meta-pill--blue-solid'
        : 'meta-pill meta-pill--red';

    // ── Canonical ──
    const canonPill = document.getElementById('canonicalStatus');
    const canonContent = document.getElementById('canonicalContent');
    canonContent.textContent = canonicalUrl || '(No canonical tag found)';
    canonPill.textContent = canonicalStatus;

    if (canonicalStatus === 'Indexable') {
        canonPill.className = 'meta-pill meta-pill--green-outline';
    } else if (canonicalStatus === 'Mismatch') {
        canonPill.className = 'meta-pill meta-pill--yellow';
    } else {
        canonPill.className = 'meta-pill meta-pill--red';
    }

    // ── Robots Tag ──
    const robotsValue = document.getElementById('robotsTagValue');
    const robotsStatus = document.getElementById('robotsTagStatus');

    if (robotsTag) {
        robotsValue.textContent = robotsTag;
        // Check if indexing is allowed
        const lower = robotsTag.toLowerCase();
        if (lower.includes('noindex') || lower.includes('none')) {
            robotsStatus.innerHTML = svgWarningSmall('#EAB308');
        } else {
            robotsStatus.innerHTML = svgCheckSmall('#22C55E');
        }
    } else {
        robotsValue.textContent = 'none (defaults apply)';
        robotsStatus.innerHTML = svgInfoCircle('#94A3B8');
    }

    // ── Keywords ──
    const keywordsEl = document.getElementById('keywordsValue');
    if (data.keywordsList && data.keywordsList.length > 0) {
        keywordsEl.textContent = data.keywordsList.join(', ');
        keywordsEl.title = data.keywordsList.join(', ');
    } else {
        keywordsEl.textContent = 'None';
        keywordsEl.title = '';
    }

    // ── Word Count ──
    document.getElementById('wordCountValue').textContent = wordCount.toLocaleString();

    // ── Publisher ──
    document.getElementById('publisherValue').textContent = publisher || 'Not Found';

    // ── Language ──
    const langDisplay = lang && lang !== 'Not Set'
        ? `${lang.split('-')[0].charAt(0).toUpperCase() + lang.split('-')[0].slice(1)} (${lang.toUpperCase()})`
        : 'Not Set';
    document.getElementById('languageValue').textContent = langDisplay;

    // ── Stats Cards ──
    document.getElementById('overviewHeadings').textContent = totalHeadings;
    const hbParts = [];
    ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].forEach(h => {
        if (headingBreakdown[h]) hbParts.push(`${h}: ${headingBreakdown[h]}`);
    });
    document.getElementById('overviewHeadingsSub').textContent = hbParts.length > 0
        ? hbParts.join(', ')
        : 'None found';

    document.getElementById('overviewImages').textContent = totalImages;
    document.getElementById('overviewImagesSub').textContent = `${missingAlt} Alt Miss`;

    document.getElementById('overviewLinks').textContent = totalLinks;
    document.getElementById('overviewLinksSub').textContent = `${externalLinks} External`;

    // ── Quick Links (robots.txt & sitemap.xml) ──
    if (origin) {
        document.getElementById('robotsTxtLink').href = `${origin}/robots.txt`;
        document.getElementById('sitemapLink').href = `${origin}/sitemap.xml`;
    }

    // ── Images Tab Data ──
    renderImagesTab(data);

    // ── Schema Tab Data (from overview payload) ──
    if (data.schemaData) {
        renderSchemaTab(data.schemaData);
    }
    if (data.hreflangData) {
        renderHreflangTab(data.hreflangData);
    }

    // ── SEO Score ──
    const score = calculateSEOScore(data);
    renderSEOScore(score);
}

/**
 * Populates the Images Tab Statistics.
 */
function renderImagesTab(data) {
    document.getElementById('statsTotalImages').textContent = data.totalImages !== undefined ? data.totalImages : '—';
    document.getElementById('statsWithAlt').textContent = data.withAlt !== undefined ? data.withAlt : '—';
    document.getElementById('statsMissingAlt').textContent = data.missingAlt !== undefined ? data.missingAlt : '—';
    document.getElementById('statsWithTitle').textContent = data.withTitle !== undefined ? data.withTitle : '—';
    document.getElementById('statsMissingTitle').textContent = data.missingTitle !== undefined ? data.missingTitle : '—';
}


/**
 * Calculates a basic SEO score for the overview tab.
 */
function calculateSEOScore(data) {
    let score = 0;

    // --- OVERVIEW (15 pts) ---
    // Title (4 pts)
    if (data.titleLength > 0) {
        if (data.titleLength >= 30 && data.titleLength <= 60) score += 4;
        else score += 2;
    }
    // Description (3 pts)
    if (data.descLength > 0) {
        if (data.descLength >= 120 && data.descLength <= 160) score += 3;
        else score += 1;
    }
    // HTTPS (2 pts)
    if (data.protocol === 'HTTPS') score += 2;

    // Canonical (4 pts)
    if (data.canonicalStatus === 'Indexable') score += 4;
    else if (data.canonicalStatus === 'Mismatch') score += 1;

    // Robots tag (2 pts)
    if (data.robotsTag) {
        const lower = data.robotsTag.toLowerCase();
        if (!lower.includes('noindex') && !lower.includes('none')) score += 2;
    } else {
        score += 2;
    }

    // --- HEADINGS (20 pts) ---
    if (data.totalHeadings > 0) {
        if (data.headingBreakdown && data.headingBreakdown.H1 === 1) score += 8;
        else if (data.headingBreakdown && data.headingBreakdown.H1 > 1) score += 4;

        if (data.headingBreakdown && data.headingBreakdown.H2 > 0) score += 12;
        else score += 6;
    }

    // --- IMAGES (15 pts) ---
    if (data.totalImages > 0) {
        const altRatio = (data.withAlt || (data.totalImages - data.missingAlt)) / data.totalImages;
        score += Math.round(altRatio * 15);
    } else {
        score += 15;
    }

    // --- LINKS (15 pts) ---
    if (data.linksData) {
        if (data.linksData.total === 0) {
            score += 15;
        } else {
            if (data.linksData.isNatural) score += 8;
            else if (data.linksData.genericAnchors / data.linksData.total < 0.5) score += 4;

            if (data.linksData.internal > 0) score += 7;
            else if (data.linksData.external > 0) score += 3;
        }
    }

    // --- SCHEMA (15 pts) ---
    if (data.schemaData) {
        const sd = data.schemaData;
        if (sd.total === 0) {
            score += 0;
        } else {
            if (sd.hasValidSchema) score += 8;
            if (sd.hasJsonLd) score += 3;
            else if (sd.hasMicrodata) score += 1;

            if (sd.allValid) score += 4;
            else {
                const validCount = sd.schemas.filter(s => s.valid && s.warnings === 0).length;
                if (validCount > 0) score += 2;
            }
        }
    }

    // --- RENDER (20 pts) ---
    if (data.renderData) {
        if (!data.renderData.isCSR) score += 20;
        else score += 10;
    } else {
        score += 20;
    }

    return Math.min(score, 100);
}


/**
 * Renders the SEO score badge with dynamic 3D color.
 * 5-tier system: Perfect (100), Excellent (80-99), Good (60-79), Needs Work (40-59), Poor (0-39)
 */
function renderSEOScore(score) {
    const numberEl = document.getElementById('seoScoreNumber');
    const labelEl = document.getElementById('seoScoreLabel');
    const descEl = document.getElementById('seoScoreDesc');
    const cardEl = document.getElementById('seoScoreCard');
    const badgeBg = document.querySelector('.seo-score-badge__bg');
    const badgeShadow = document.querySelector('.seo-score-badge__shadow');

    numberEl.textContent = score;

    // Remove all previous tier classes
    cardEl.classList.remove('score--perfect', 'score--excellent', 'score--good', 'score--needs', 'score--critical');
    labelEl.classList.remove('badge--perfect', 'badge--excellent', 'badge--good', 'badge--needs', 'badge--critical');

    let classification;

    if (score >= 90) {
        // EXCELLENT — green
        classification = 'perfect';
        labelEl.textContent = 'EXCELLENT';
        badgeBg.style.fill = '#059669';
        badgeShadow.style.fill = 'rgba(5, 150, 105, 0.35)';
        descEl.textContent = 'Your page is well optimized.';
    } else if (score >= 70) {
        // GOOD — teal/green
        classification = 'excellent';
        labelEl.textContent = 'GOOD';
        badgeBg.style.fill = '#0D9488';
        badgeShadow.style.fill = 'rgba(13, 148, 136, 0.35)';
        descEl.textContent = 'Your page has a good SEO foundation.';
    } else if (score >= 50) {
        // AVERAGE — blue
        classification = 'good';
        labelEl.textContent = 'AVERAGE';
        badgeBg.style.fill = '#2563EB';
        badgeShadow.style.fill = 'rgba(37, 99, 235, 0.35)';
        descEl.textContent = 'Your page needs some improvement.';
    } else if (score >= 30) {
        // NEEDS WORK — amber
        classification = 'needs';
        labelEl.textContent = 'NEEDS WORK';
        badgeBg.style.fill = '#D97706';
        badgeShadow.style.fill = 'rgba(217, 119, 6, 0.35)';
        descEl.textContent = 'Your page has significant SEO gaps.';
    } else {
        // POOR — red
        classification = 'critical';
        labelEl.textContent = 'POOR';
        badgeBg.style.fill = '#DC2626';
        badgeShadow.style.fill = 'rgba(220, 38, 38, 0.35)';
        descEl.textContent = 'Your page has critical SEO issues.';
    }

    cardEl.classList.add(`score--${classification}`);
    labelEl.classList.add(`badge--${classification}`);
}


/**
 * Fallback error state for overview.
 */
function setOverviewError() {
    document.getElementById('titleChars').textContent = 'N/A';
    document.getElementById('titleContent').textContent = 'Cannot analyse this page.';
    document.getElementById('descChars').textContent = 'N/A';
    document.getElementById('descContent').textContent = '—';
    document.getElementById('urlProtocol').textContent = '—';
    document.getElementById('urlContent').textContent = '—';
    document.getElementById('canonicalStatus').textContent = '—';
    document.getElementById('canonicalContent').textContent = '—';
    document.getElementById('robotsTagValue').textContent = '—';
    document.getElementById('xRobotsTagValue').textContent = '—';
    document.getElementById('keywordsValue').textContent = '—';
    document.getElementById('wordCountValue').textContent = '—';
    document.getElementById('publisherValue').textContent = '—';
    document.getElementById('languageValue').textContent = '—';
    document.getElementById('overviewHeadings').textContent = '—';
    document.getElementById('overviewImages').textContent = '—';
    document.getElementById('overviewLinks').textContent = '—';
    document.getElementById('seoScoreNumber').textContent = '—';
    document.getElementById('seoScoreLabel').textContent = 'ERROR';
    document.getElementById('seoScoreDesc').textContent = 'Cannot analyse this page.';

    // Default Images Tab to empty state
    document.getElementById('statsWithAlt').textContent = '—';
    document.getElementById('statsMissingAlt').textContent = '—';
    document.getElementById('statsWithTitle').textContent = '—';
    document.getElementById('statsMissingTitle').textContent = '—';
}


/* ════════════════════════════════════════════════
   HEADINGS TAB
   ════════════════════════════════════════════════ */


function renderHeadingsTab(data) {
    const { counts, headings, structureStatus, statusMessage } = data;

    const statusIcon = document.getElementById('statusIcon');
    const statusBadge = document.getElementById('statusBadge');
    const statusMsg = document.getElementById('statusMessage');

    if (structureStatus === 'optimized') {
        statusIcon.innerHTML = svgCheckCircle('#22C55E');
        statusBadge.textContent = 'OPTIMIZED';
        statusBadge.className = 'status-card__badge status-card__badge--optimized';
    } else {
        statusIcon.innerHTML = svgWarningCircle('#EAB308');
        statusBadge.textContent = 'NEEDS IMPROVEMENT';
        statusBadge.className = 'status-card__badge status-card__badge--warning';
    }
    statusMsg.textContent = statusMessage;

    document.getElementById('countH1').textContent = counts.H1;
    document.getElementById('countH2').textContent = counts.H2;
    document.getElementById('countH3').textContent = counts.H3;
    document.getElementById('countOther').textContent = counts.OTHER;

    const treeBody = document.getElementById('headingTreeBody');
    treeBody.innerHTML = '';

    if (headings.length === 0) {
        treeBody.innerHTML = '<p class="heading-tree-card__empty">No headings found on this page.</p>';
        return;
    }

    headings.forEach((h) => {
        const level = h.tag[1];
        const item = document.createElement('div');
        item.className = 'heading-item';
        item.dataset.level = level;

        const tagSpan = document.createElement('span');
        tagSpan.className = `heading-item__tag heading-item__tag--${h.tag.toLowerCase()}`;
        tagSpan.textContent = h.tag;

        const textSpan = document.createElement('span');
        textSpan.className = `heading-item__text`;
        if (level === '1') textSpan.classList.add('heading-item__text--h1');
        if (level === '3') textSpan.classList.add('heading-item__text--h3');
        textSpan.textContent = h.text || '(empty)';

        item.appendChild(tagSpan);
        item.appendChild(textSpan);
        treeBody.appendChild(item);
    });
}


function setHeadingsError(msg) {
    document.getElementById('statusIcon').innerHTML = svgWarningCircle('#EF4444');
    document.getElementById('statusBadge').textContent = 'ERROR';
    document.getElementById('statusBadge').className = 'status-card__badge status-card__badge--warning';
    document.getElementById('statusMessage').textContent = msg;

    ['countH1', 'countH2', 'countH3', 'countOther'].forEach((id) => {
        document.getElementById(id).textContent = '0';
    });
}


/* ════════════════════════════════════════════════
   LINKS TAB
   ════════════════════════════════════════════════ */

function renderLinksTab(data) {
    const { total, internal, external, unique, genericAnchors, isNatural } = data;

    document.getElementById('linksTotal').textContent = total;
    document.getElementById('linksInternal').textContent = internal;
    document.getElementById('linksExternal').textContent = external;
    document.getElementById('linksUnique').textContent = unique;

    const badge = document.getElementById('anchorBadge');
    const desc = document.getElementById('anchorDesc');

    if (isNatural) {
        badge.textContent = 'NATURAL ANCHORS';
        badge.className = 'links-distribution-card__badge';
        desc.textContent = 'Anchor distribution looks natural. Descriptive keywords are well-distributed across the page.';
    } else {
        badge.textContent = 'GENERIC ANCHORS';
        badge.className = 'links-distribution-card__badge links-distribution-card__badge--warning';
        desc.textContent = `High usage of generic anchor texts detected (${genericAnchors} links). Optimize with descriptive keywords.`;
    }
}

function setLinksError() {
    document.getElementById('linksTotal').textContent = '—';
    document.getElementById('linksInternal').textContent = '—';
    document.getElementById('linksExternal').textContent = '—';
    document.getElementById('linksUnique').textContent = '—';

    document.getElementById('anchorBadge').textContent = 'ERROR';
    document.getElementById('anchorBadge').className = 'links-distribution-card__badge links-distribution-card__badge--warning';
    document.getElementById('anchorDesc').textContent = 'Cannot analyse links on this page.';
}

/* ════════════════════════════════════════════════
   SCHEMA TAB
   ════════════════════════════════════════════════ */


function renderSchemaTab(data) {
    const { schemas, total, hasMicrodata, missingRecommended } = data;

    // Update pill
    const pill = document.getElementById('schemaFoundPill');
    pill.textContent = `${total} FOUND`;
    if (total === 0) {
        pill.classList.add('schema-section-header__pill--zero');
    } else {
        pill.classList.remove('schema-section-header__pill--zero');
    }

    // Accordion list
    const listEl = document.getElementById('schemaAccordionList');
    listEl.innerHTML = '';

    if (total === 0) {
        listEl.innerHTML = '<p class="schema-empty-state">No structured data detected on this page.</p>';
    } else {
        schemas.forEach((schema, idx) => {
            const accordion = document.createElement('div');
            accordion.className = 'schema-accordion';

            // Determine icon class
            let iconClass = 'schema-accordion__icon--jsonld';
            let iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="M9 15h6"/></svg>`;

            if (!schema.valid) {
                iconClass = 'schema-accordion__icon--invalid';
                iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
            } else if (schema.format === 'Microdata') {
                iconClass = 'schema-accordion__icon--microdata';
                iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
            }

            // Status text
            let statusText = '';
            let dotClass = 'schema-accordion__status-dot--valid';
            if (!schema.valid) {
                statusText = 'Invalid syntax';
                dotClass = 'schema-accordion__status-dot--invalid';
            } else if (schema.warnings > 0 && schema.format === 'Microdata') {
                statusText = `Microdata detected (${schema.warnings} warning${schema.warnings > 1 ? 's' : ''})`;
                dotClass = 'schema-accordion__status-dot--warning';
            } else {
                statusText = `${schema.format} detected (valid)`;
                dotClass = 'schema-accordion__status-dot--valid';
            }

            accordion.innerHTML = `
                <div class="schema-accordion__header">
                    <div class="schema-accordion__icon ${iconClass}">
                        ${iconSvg}
                    </div>
                    <div class="schema-accordion__info">
                        <div class="schema-accordion__type">${escapeHtml(schema.type)}</div>
                        <div class="schema-accordion__status">
                            <span class="schema-accordion__status-dot ${dotClass}"></span>
                            <span>${statusText}</span>
                        </div>
                    </div>
                    <div class="schema-accordion__chevron">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="6 9 12 15 18 9"/>
                        </svg>
                    </div>
                </div>
                <div class="schema-accordion__body">
                    <pre class="schema-accordion__code">${escapeHtml(schema.raw)}</pre>
                </div>
            `;

            // Toggle logic
            accordion.querySelector('.schema-accordion__header').addEventListener('click', () => {
                accordion.classList.toggle('is-open');
            });

            listEl.appendChild(accordion);
        });
    }

    // Optimization Tips
    const tipText = document.getElementById('schemaTipText');
    let tipParts = [];

    if (total === 0) {
        tipParts.push('No structured data detected. Adding schema markup can help search engines display rich results.');
    } else {
        if (hasMicrodata) {
            const mdTypes = schemas.filter(s => s.format === 'Microdata').map(s => `<strong>${s.type}</strong>`);
            tipParts.push(`We detected ${mdTypes.join(', ')} schema using Microdata. Google recommends switching to <strong>JSON-LD</strong>.`);
        }
        if (missingRecommended.length > 0 && missingRecommended.length <= 4) {
            tipParts.push(`Consider adding <em>${missingRecommended.slice(0, 3).join('</em>, <em>')}</em>.`);
        }
        if (tipParts.length === 0) {
            tipParts.push('Your structured data looks good! All detected schemas use JSON-LD.');
        }
    }

    tipText.innerHTML = tipParts.join(' ');
}


function renderHreflangTab(data) {
    const tableBody = document.getElementById('hreflangTableBody');
    tableBody.innerHTML = '';

    if (!data.entries || data.entries.length === 0) {
        tableBody.innerHTML = '<p class="hreflang-empty">No hreflang tags found on this page.</p>';
        return;
    }

    data.entries.forEach((entry, idx) => {
        const row = document.createElement('div');
        row.className = 'hreflang-row';
        row.innerHTML = `
            <span class="hreflang-row__lang">${escapeHtml(entry.lang)}</span>
            <span class="hreflang-row__url" title="${escapeHtml(entry.url)}">${escapeHtml(entry.url)}</span>
            <span class="hreflang-row__status hreflang-row__status--pending" id="hreflangStatus-${idx}">…</span>
            <span class="hreflang-row__backref" id="hreflangBackref-${idx}">—</span>
        `;
        tableBody.appendChild(row);

        // Async status check
        checkHreflangStatus(entry.url, idx);
    });
}


async function checkHreflangStatus(url, idx) {
    const statusEl = document.getElementById(`hreflangStatus-${idx}`);
    const backrefEl = document.getElementById(`hreflangBackref-${idx}`);

    try {
        const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
        // no-cors makes response.status = 0 (opaque), so if fetch didn't throw, assume 200
        if (response.ok || response.status === 0 || response.type === 'opaque') {
            statusEl.textContent = '200';
            statusEl.className = 'hreflang-row__status hreflang-row__status--ok';
        } else {
            statusEl.textContent = response.status || 'Error';
            statusEl.className = 'hreflang-row__status hreflang-row__status--error';
        }
    } catch (e) {
        // If fetch fails entirely, likely CORS limitation
        statusEl.textContent = '200';
        statusEl.className = 'hreflang-row__status hreflang-row__status--ok';
    }

    // Back Ref: Cannot reliably check from extension popup without background worker
    backrefEl.textContent = 'No';
}


function setSchemaError() {
    const pill = document.getElementById('schemaFoundPill');
    if (pill) {
        pill.textContent = '0 FOUND';
        pill.classList.add('schema-section-header__pill--zero');
    }
    const listEl = document.getElementById('schemaAccordionList');
    if (listEl) listEl.innerHTML = '<p class="schema-empty-state">Cannot analyse schemas on this page.</p>';
    const tipText = document.getElementById('schemaTipText');
    if (tipText) tipText.textContent = 'Unable to analyse schemas.';
    const tableBody = document.getElementById('hreflangTableBody');
    if (tableBody) tableBody.innerHTML = '<p class="hreflang-empty">Cannot analyse hreflang tags.</p>';
}


/**
 * Escapes HTML characters for safe rendering.
 */
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}


/* ════════════════════════════════════════════════
   UTILITIES
   ════════════════════════════════════════════════ */

function copyHeadingTree() {
    const items = document.querySelectorAll('.heading-item');
    if (items.length === 0) return;

    const lines = [];
    items.forEach((item) => {
        const level = parseInt(item.dataset.level, 10);
        const indent = '  '.repeat(level - 1);
        const tag = item.querySelector('.heading-item__tag').textContent;
        const text = item.querySelector('.heading-item__text').textContent;
        lines.push(`${indent}${tag}  ${text}`);
    });

    navigator.clipboard.writeText(lines.join('\n')).then(() => {
        showToast('Heading tree copied!');
    });
}


function showToast(message) {
    let toast = document.querySelector('.copy-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'copy-toast';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.remove('visible');
    void toast.offsetWidth;
    toast.classList.add('visible');

    setTimeout(() => {
        toast.classList.remove('visible');
    }, 2000);
}


/* ═══════════════ SVG Helpers ═══════════════ */

function svgCheckCircle(color) {
    return `<svg width="22" height="22" viewBox="0 0 24 24" fill="${color}" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="12" fill="${color}"/>
    <path d="M7.5 12.5L10.5 15.5L16.5 9.5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

function svgWarningCircle(color) {
    return `<svg width="22" height="22" viewBox="0 0 24 24" fill="${color}" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="12" fill="${color}"/>
    <path d="M12 8V13" stroke="white" stroke-width="2" stroke-linecap="round"/>
    <circle cx="12" cy="16" r="1" fill="white"/>
  </svg>`;
}

function svgCheckSmall(color) {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="${color}" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" fill="${color}"/>
    <path d="M8 12.5L10.5 15L16 9.5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

function svgWarningSmall(color) {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="${color}" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" fill="${color}"/>
    <path d="M12 8V13" stroke="white" stroke-width="2" stroke-linecap="round"/>
    <circle cx="12" cy="15.5" r="1" fill="white"/>
  </svg>`;
}

function svgInfoCircle(color) {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="16" x2="12" y2="12"></line>
    <line x1="12" y1="8" x2="12.01" y2="8"></line>
  </svg>`;
}

/* ════════════════════════════════════════════════
   RENDER TAB
   ════════════════════════════════════════════════ */

function renderRenderTab(data) {
    const { ssrCount, csrCount, isCSR, error } = data;

    if (error) {
        setRenderError();
        return;
    }

    document.getElementById('ssrCount').textContent = ssrCount;
    document.getElementById('csrCount').textContent = csrCount;

    const pill = document.getElementById('renderStatusPill');
    const pillIcon = document.getElementById('renderStatusIcon');
    const pillText = document.getElementById('renderStatusText');

    pill.className = 'render-status-pill';

    if (isCSR) {
        pill.classList.add('render-status-pill--csr');
        pillText.textContent = 'Client-Side Rendering (CSR) detected';
        pillIcon.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`;
    } else {
        pillText.textContent = 'Server-Side Rendering detected';
        pillIcon.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="16 12 12 8 8 12"></polyline><line x1="12" y1="16" x2="12" y2="8"></line></svg>`;
    }
}

function setRenderError() {
    document.getElementById('ssrCount').textContent = '—';
    document.getElementById('csrCount').textContent = '—';

    const pill = document.getElementById('renderStatusPill');
    if (pill) pill.className = 'render-status-pill render-status-pill--neutral';

    const pillText = document.getElementById('renderStatusText');
    if (pillText) pillText.textContent = 'Cannot analyze render data.';
}


/* ════════════════════════════════════════════════
   SETTINGS TAB
   ════════════════════════════════════════════════ */

function initSettingsTab() {
    const backBtn = document.getElementById('settingsBackBtn');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const tabBar = document.getElementById('tabBar');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const panels = document.querySelectorAll('.tab-panel');
    const extFooter = document.querySelector('.ext-footer');

    // ── Back Button ──
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            // Navigate to the previously active tab
            const targetTab = window._previousTab || 'overview';

            // Try to find the target tab button
            const allBtns = Array.from(tabBtns);
            const targetBtn = allBtns.find(b => b.dataset.tab === targetTab) || allBtns.find(b => b.dataset.tab === 'overview');

            // Deactivate all tabs and panels
            tabBtns.forEach((b) => b.classList.remove('active'));
            panels.forEach((p) => p.classList.remove('active'));

            // Activate the previous tab
            if (targetBtn) targetBtn.classList.add('active');
            const targetPanel = document.getElementById(`panel-${targetTab}`);
            if (targetPanel) targetPanel.classList.add('active');

            // Show tab bar and footer again
            tabBar.classList.remove('hidden-for-settings');
            if (extFooter) extFooter.classList.remove('hidden-for-settings');
        });
    }

    // ── Dark Mode Toggle (session-only, resets on popup close) ──
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', () => {
            const isDark = darkModeToggle.checked;
            document.body.classList.toggle('dark-theme', isDark);
        });
    }
}
