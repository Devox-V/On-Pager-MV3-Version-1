# 1. Product Overview

## 1.1 Vision
On-Pager is a visual and actionable on-page SEO analysis Chrome extension that:
- Extracts live SEO data from the current webpage
- Provides structured evaluation across technical and content signals
- Visualizes issues directly on the page using overlays
- Produces an overall SEO health score out of 100

The product focuses on clarity, visual feedback, and actionable guidance rather than raw data dumping.

---

# 2. Problem Statement

Most SEO extensions:
- Dump raw data without actionable suggestions
- Do not visually map issues to DOM
- Do not analyze render behavior (SSR vs CSR)
- Provide shallow scoring logic

On-Pager differentiates through:
- Visual DOM overlays
- Structural validation logic
- Render detection
- Tone analysis
- Weighted scoring engine

---

## 3. Feature Specifications

### 3.1 Overview Tab
* **Metadata:** Fetch Meta Title, Meta Description, URL, and Lang.
* **Canonical Check:** Compare `window.location.href` with `<link rel="canonical">`. 
* **Indicator:** Green if exact match, Yellow if mismatch.
* **Technical Tags:** Display `robots` and `x-robots-tag` status.
* **Counts:** Total Word Count of the `<body>`.
* **SEO Score:** Display numeric SEO score from all other tabs.
* **SEO Score UI:** A 2d badge which dynamically change color and visual style based on score classification & the score must shown in the center of the badge.

## Scoring Logic
### Weight Distribution
* **Overview:** 20%
* **Headings:** 25%
* **Links:** 20%
* **Images:** 15%
* **Schema:** 20%


### Scoring Rules
* **Perfect:** 100 points (All checks pass).
* **Good:** 70-99 points (Minor issues).
* **Needs Improvement:** 40-69 points (Several issues).
* **Critical:** 0-39 points (Major issues blocking SEO).
* **Quick Links:** Side-by-side buttons for `robots.txt` and `sitemap.xml`.


---

### 3.2 Headings Tab
* **Hierarchy Logic:** Check for skipped levels (e.g., H1 followed by H3).
    * **Excellent (Green):** Perfect sequential nesting.
    * **Needs Improvement (Yellow):** Gaps in structure.
* **UX:** "i" icon with tooltip: *"Semantic hierarchy helps search engines index your content effectively."*
* **Data List:** Display all H1-H6 tags in order found on page + summary count table.

---

### 3.3 Links Tab
* **Anchor Logic:** Detect "generic" anchor text (e.g., "click here", "read more").
    * **Indicator:** Green for descriptive text, Yellow for generic.
* **Counters:** Total, Internal, External, and Unique links.
* **Link Overlay:** Button to highlight links on-page.
    * **Green Overlay:** Active/Standard links.
    * **Red Overlay:** Broken or malformed links.
    * **Link Overlay Remove Button:** A button to remove the overlay were the same highlight button changes to remove overlay button.
* **Broken Links:**
    * Fetch status code for all links.
    * Flag 4xx/5xx errors.
* **Missing Attributes:** Flag `<a>` tags missing `title` or `aria-label`.


---

### 3.4 Images Tab
* **Stats Row:** Total Images | With Alt | Without Alt | With Title | Without Title.
* **Highlighter Feature:** * **Action:** Toggle CSS border overlay on live page.
    * **Green Border:** Applied to images with `alt` text.
    * **Red Border:** Applied to images missing `alt` text (labeled "Missing").
    * **Image Overlay Remove Button:** A button to remove the overlay were the same highlight button changes to remove overlay button.
* **Lazy Loading:** Detect if images use `loading="lazy"`.



---

### 3.5 Schema Tab
* **JSON-LD:** Extract and validate JSON-LD scripts.
* **Microdata:** Extract and validate Microdata attributes.
* **Schema.org Validation:** Validate against the official schema.org vocabulary.
* **Errors:** Flag invalid or incomplete schema.
* **Structure:** Two sub-tab views.
* **Schema:** Detect JSON-LD and Microdata. Display in an expandable tree view.
* **Hreflang:** Fetch all language/region alternates.
* **Optimization Tip:** Alert user if common schemas (Organization, Breadcrumb) are missing.
* **Dropdown Accordion UI:** * **Header:** Displays Schema Type (e.g., Article, Product), an icon, and a status pill (e.g., "3 FOUND").
    * **Validation States:** * Blue Icon + "JSON-LD detected (valid)".
        * Orange Warning Icon + "Microdata detected (X warnings)".
    * **Expanded View:** Clicking a schema opens a collapsible card showing formatted JSON code in a light-grey code block.


---

### 3.6 Render Tab (SSR vs. CSR)
* **Detection Logic:** Compare initial server-delivered HTML against the current client-side DOM.
* **Counter Logic:** * **SSR Count:** Total number of elements present in the initial page source.
    * **CSR Count:** Total number of elements injected/modified by JavaScript after load.
* **Visualizer Button:** * **SSR Elements:** Highlight with **Cyan Neon** glow.
    * **CSR Elements:** Highlight with **Purple Neon** glow.
    * **Render Overlay Remove Button:** A button to remove the overlay were the same visualizer button changes to remove the visualizer button.
* **Dominance Card:** A high-impact UI card showing which rendering method is primary (e.g., "This page is 75% Client-Side Rendered").


---
### 3.7 Settings Page 
* **Access:** Accessible via a settings gear/icon in the header.
* **UI Preferences:** * **Dark Mode Toggle:** Switch between a light theme and the dark theme.
* **About Section:** * Displays "On-Pager SEO Assistant" name and logo.
    * Version Number (1.2.0). 
* **Footer Links:** Documentation, Support, and Privacy Policy.


## 6. UI/UX Guidelines

### 6.1 Design System
* **Colors:**
    * Green: Success
    * Yellow: Warning
    * Red: Error
    * Blue: Info
* **Typography:** Inter font family
* **Layout:** Tabbed interface with sidebar navigation


Preference must persist using chrome.storage.

### 6.2 Overlay Design
* **Visual Style:** Subtle dashed borders with tooltips on hover.
* **Interaction:** Click overlay to jump to the element in the DOM.
* **Toggle:** Master toggle to show/hide all overlays.

