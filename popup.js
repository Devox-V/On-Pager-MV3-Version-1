// popup.js — Controls the popup UI, fetches data from content script

document.addEventListener('DOMContentLoaded', () => {
    // ═══════════════ TAB SWITCHING ═══════════════
    const tabBar = document.getElementById('tabBar');
    const panels = document.querySelectorAll('.tab-panel');
    const tabBtns = document.querySelectorAll('.tab-btn');

    tabBar.addEventListener('click', (e) => {
        const btn = e.target.closest('.tab-btn');
        if (!btn) return;

        const tabName = btn.dataset.tab;

        tabBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        panels.forEach((p) => {
            p.classList.remove('active');
            if (p.id === `panel-${tabName}`) {
                p.classList.add('active');
            }
        });
    });

    // ═══════════════ INIT TABS ═══════════════
    initOverviewTab();
    initHeadingsTab();

    // ═══════════════ COPY BUTTON ═══════════════
    document.getElementById('copyTreeBtn').addEventListener('click', copyHeadingTree);
});


/* ════════════════════════════════════════════════
   OVERVIEW TAB
   ════════════════════════════════════════════════ */

async function initOverviewTab() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab || !tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('edge://')) {
            setOverviewError();
            return;
        }

        // Inject content script
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js'],
        });

        // Request overview data
        chrome.tabs.sendMessage(tab.id, { action: 'getOverviewData' }, (response) => {
            if (chrome.runtime.lastError || !response) {
                setOverviewError();
                return;
            }
            renderOverviewTab(response);
            fetchXRobotsTag(response.currentUrl);
        });
    } catch (err) {
        console.error('initOverviewTab error:', err);
        setOverviewError();
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

    // ── SEO Score ──
    const score = calculateSEOScore(data);
    renderSEOScore(score);
}


/**
 * Calculates a basic SEO score for the overview tab.
 */
function calculateSEOScore(data) {
    let score = 0;

    // Title (20 pts)
    if (data.titleLength > 0) {
        score += 10;
        if (data.titleLength >= 30 && data.titleLength <= 60) {
            score += 10;
        } else if (data.titleLength <= 70) {
            score += 5;
        }
    }

    // Description (20 pts)
    if (data.descLength > 0) {
        score += 10;
        if (data.descLength >= 120 && data.descLength <= 160) {
            score += 10;
        } else if (data.descLength >= 50) {
            score += 5;
        }
    }

    // HTTPS (10 pts)
    if (data.protocol === 'HTTPS') {
        score += 10;
    }

    // Canonical (10 pts)
    if (data.canonicalStatus === 'Indexable') {
        score += 10;
    } else if (data.canonicalStatus === 'Mismatch') {
        score += 3;
    }

    // Robots tag (5 pts)
    if (data.robotsTag) {
        const lower = data.robotsTag.toLowerCase();
        if (!lower.includes('noindex') && !lower.includes('none')) {
            score += 5;
        }
    } else {
        score += 5; // No robots tag means defaults (index,follow)
    }

    // Language (5 pts)
    if (data.lang && data.lang !== 'Not Set') {
        score += 5;
    }

    // Headings (15 pts)
    if (data.totalHeadings > 0) {
        score += 5;
        if (data.headingBreakdown && data.headingBreakdown.H1 === 1) {
            score += 10;
        } else if (data.headingBreakdown && data.headingBreakdown.H1 > 0) {
            score += 5;
        }
    }

    // Images with alt (10 pts)
    if (data.totalImages > 0) {
        const altRatio = (data.totalImages - data.missingAlt) / data.totalImages;
        score += Math.round(altRatio * 10);
    } else {
        score += 5;
    }

    // Links (5 pts)
    if (data.totalLinks > 0) {
        score += 5;
    }

    return Math.min(score, 100);
}


/**
 * Renders the SEO score badge with dynamic 3D color.
 * 5-tier system: Perfect (100), Excellent (70-99), Good (40-69), Needs Work (20-39), Critical (0-19)
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

    let classification, issueCount;

    if (score === 100) {
        // PERFECT — emerald green
        classification = 'perfect';
        labelEl.textContent = 'PERFECT';
        badgeBg.style.fill = '#059669';
        badgeShadow.style.fill = 'rgba(5, 150, 105, 0.35)';
        descEl.textContent = 'Your page is perfectly optimized!';
    } else if (score >= 70) {
        // EXCELLENT — amber/gold
        classification = 'excellent';
        issueCount = Math.ceil((100 - score) / 5);
        labelEl.textContent = 'EXCELLENT';
        badgeBg.style.fill = '#D97706';
        badgeShadow.style.fill = 'rgba(217, 119, 6, 0.35)';
        descEl.textContent = `Your page is highly optimized. ${issueCount} minor issues detected.`;
    } else if (score >= 40) {
        // GOOD — blue
        classification = 'good';
        issueCount = Math.ceil((100 - score) / 5);
        labelEl.textContent = 'GOOD';
        badgeBg.style.fill = '#2563EB';
        badgeShadow.style.fill = 'rgba(37, 99, 235, 0.35)';
        descEl.textContent = `Good foundation. ${issueCount} improvements recommended.`;
    } else if (score >= 20) {
        // NEEDS WORK — dark yellow
        classification = 'needs';
        issueCount = Math.ceil((100 - score) / 5);
        labelEl.textContent = 'NEEDS WORK';
        badgeBg.style.fill = '#CA8A04';
        badgeShadow.style.fill = 'rgba(202, 138, 4, 0.35)';
        descEl.textContent = `Several issues found. ${issueCount} items need attention.`;
    } else {
        // CRITICAL — red
        classification = 'critical';
        issueCount = Math.ceil((100 - score) / 5);
        labelEl.textContent = 'CRITICAL';
        badgeBg.style.fill = '#DC2626';
        badgeShadow.style.fill = 'rgba(220, 38, 38, 0.35)';
        descEl.textContent = `Major SEO issues detected. ${issueCount} critical items to fix.`;
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
}


/* ════════════════════════════════════════════════
   HEADINGS TAB
   ════════════════════════════════════════════════ */

async function initHeadingsTab() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab || !tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('edge://')) {
            setHeadingsError('Cannot analyse this page.');
            return;
        }

        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js'],
        });

        chrome.tabs.sendMessage(tab.id, { action: 'getHeadings' }, (response) => {
            if (chrome.runtime.lastError || !response) {
                setHeadingsError('Could not extract headings from this page.');
                return;
            }
            renderHeadingsTab(response);
        });
    } catch (err) {
        console.error('initHeadingsTab error:', err);
        setHeadingsError('An error occurred while analysing headings.');
    }
}


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
    return '';
}
