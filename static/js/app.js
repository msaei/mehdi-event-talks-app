// State management
let releasesData = [];
let selectedRelease = null;
let currentFilter = 'All';
let searchQuery = '';

// DOM Elements
const elements = {
    btnRefresh: document.getElementById('btn-refresh'),
    btnRefreshText: document.getElementById('btn-refresh-text'),
    btnExport: document.getElementById('btn-export'),
    btnThemeToggle: document.getElementById('btn-theme-toggle'),
    iconSync: document.querySelector('.icon-sync'),
    txtLastSynced: document.getElementById('txt-last-synced'),
    releasesList: document.getElementById('releases-list'),
    inputSearch: document.getElementById('input-search'),
    btnClearSearch: document.getElementById('btn-clear-search'),
    filterPills: document.querySelectorAll('.filter-pill'),
    txtResultsCount: document.getElementById('txt-results-count'),
    
    // Stats
    valTotal: document.getElementById('val-total'),
    valFeatures: document.getElementById('val-features'),
    valIssues: document.getElementById('val-issues'),
    valDeprecations: document.getElementById('val-deprecations'),
    statCards: document.querySelectorAll('.stat-card'),
    
    // Share Composer
    shareEmptyState: document.getElementById('share-empty-state'),
    shareComposer: document.getElementById('share-composer'),
    composerBadge: document.getElementById('composer-badge'),
    composerDate: document.getElementById('composer-date'),
    composerSnippet: document.getElementById('composer-snippet'),
    tweetTextarea: document.getElementById('tweet-textarea'),
    charCount: document.getElementById('char-count'),
    charCountContainer: document.querySelector('.char-count-container'),
    hashtagSelector: document.querySelector('.hashtag-selector'),
    btnCopyTweet: document.getElementById('btn-copy-tweet'),
    btnTweet: document.getElementById('btn-tweet'),
    
    // Toast
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toast-message')
};

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    // Initialize Theme
    initTheme();

    // Fetch initial data
    fetchReleases();

    // Theme toggle event
    elements.btnThemeToggle.addEventListener('click', () => {
        toggleTheme();
    });

    // Refresh button event
    elements.btnRefresh.addEventListener('click', () => {
        fetchReleases(true);
    });

    // Export CSV button event
    elements.btnExport.addEventListener('click', () => {
        exportToCSV();
    });

    // Search events
    elements.inputSearch.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim().toLowerCase();
        toggleClearSearchButton();
        renderReleases();
    });

    elements.btnClearSearch.addEventListener('click', () => {
        elements.inputSearch.value = '';
        searchQuery = '';
        toggleClearSearchButton();
        renderReleases();
        elements.inputSearch.focus();
    });

    // Filter tab events
    elements.filterPills.forEach(pill => {
        pill.addEventListener('click', () => {
            const filterType = pill.getAttribute('data-type');
            setActiveFilter(filterType);
        });
    });

    // Stat card events (work as filters too!)
    elements.statCards.forEach(card => {
        card.addEventListener('click', () => {
            const filterType = card.getAttribute('data-filter');
            setActiveFilter(filterType);
        });
        // Accessibility support
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const filterType = card.getAttribute('data-filter');
                setActiveFilter(filterType);
            }
        });
    });

    // Composer events
    elements.tweetTextarea.addEventListener('input', updateTweetDraft);
    
    elements.hashtagSelector.addEventListener('change', () => {
        updateTweetDraft();
    });

    elements.btnCopyTweet.addEventListener('click', copyTweetToClipboard);
}

// Toggle clear button state
function toggleClearSearchButton() {
    if (searchQuery.length > 0) {
        elements.btnClearSearch.style.display = 'block';
    } else {
        elements.btnClearSearch.style.display = 'none';
    }
}

// Set active filter UI & trigger rendering
function setActiveFilter(filterType) {
    currentFilter = filterType;
    
    // Update pills UI
    elements.filterPills.forEach(pill => {
        const type = pill.getAttribute('data-type');
        if (type === filterType) {
            pill.classList.add('active');
            pill.setAttribute('aria-selected', 'true');
        } else {
            pill.classList.remove('active');
            pill.setAttribute('aria-selected', 'false');
        }
    });

    // Update stat cards UI
    elements.statCards.forEach(card => {
        const filter = card.getAttribute('data-filter');
        if (filter === filterType) {
            card.classList.add('active-filter');
        } else {
            card.classList.remove('active-filter');
        }
    });

    renderReleases();
}

// Fetch releases from Flask endpoint
async function fetchReleases(forceRefresh = false) {
    try {
        setLoadingState(true);
        const url = forceRefresh ? '/api/releases?refresh=true' : '/api/releases';
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            releasesData = data.updates;
            updateLastSyncedTime(data.last_updated);
            updateStatsDashboard();
            renderReleases();
        } else {
            showErrorState("Could not retrieve updates.");
        }
    } catch (error) {
        console.error("Fetch releases error:", error);
        showErrorState("Failed to connect to the server. Make sure Python Flask is running.");
    } finally {
        setLoadingState(false);
    }
}

function setLoadingState(isLoading) {
    if (isLoading) {
        elements.btnRefresh.disabled = true;
        elements.btnRefreshText.textContent = "Syncing...";
        elements.iconSync.classList.add('rotating');
        document.getElementById('sync-status-container').querySelector('.status-indicator').classList.add('syncing');
    } else {
        elements.btnRefresh.disabled = false;
        elements.btnRefreshText.textContent = "Refresh Feed";
        elements.iconSync.classList.remove('rotating');
        document.getElementById('sync-status-container').querySelector('.status-indicator').classList.remove('syncing');
    }
}

function updateLastSyncedTime(timestamp) {
    if (!timestamp) {
        elements.txtLastSynced.textContent = "Never synced";
        return;
    }
    const date = new Date(timestamp * 1000);
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    elements.txtLastSynced.textContent = `Synced at ${timeStr}`;
}

// Calculate and render stats in dashboard
function updateStatsDashboard() {
    const counts = {
        All: releasesData.length,
        Feature: 0,
        Issue: 0,
        Deprecation: 0
    };

    releasesData.forEach(item => {
        if (item.type === 'Feature') counts.Feature++;
        else if (item.type === 'Issue') counts.Issue++;
        else if (item.type === 'Deprecation') counts.Deprecation++;
    });

    elements.valTotal.textContent = counts.All;
    elements.valFeatures.textContent = counts.Feature;
    elements.valIssues.textContent = counts.Issue;
    elements.valDeprecations.textContent = counts.Deprecation;
}

// Filter, Search, and Render cards
function renderReleases() {
    elements.releasesList.innerHTML = '';

    // Filter list
    const filteredList = releasesData.filter(item => {
        // Filter by category
        const matchesFilter = (currentFilter === 'All') ||
            (currentFilter === 'Others' && !['Feature', 'Issue', 'Deprecation'].includes(item.type)) ||
            (item.type === currentFilter);
            
        // Filter by search query
        const plainTextContent = stripHtml(item.content).toLowerCase();
        const matchesSearch = !searchQuery || 
            item.date.toLowerCase().includes(searchQuery) ||
            item.type.toLowerCase().includes(searchQuery) ||
            plainTextContent.includes(searchQuery);

        return matchesFilter && matchesSearch;
    });

    // Update Results count
    elements.txtResultsCount.textContent = `Showing ${filteredList.length} updates`;

    if (filteredList.length === 0) {
        showEmptyFeedState();
        return;
    }

    // Generate HTML and inject
    filteredList.forEach(item => {
        const isSelected = selectedRelease && selectedRelease.id === item.id;
        const card = document.createElement('div');
        card.className = `release-card ${isSelected ? 'selected' : ''}`;
        card.setAttribute('data-id', item.id);
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');
        card.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
        
        // Add badges classes
        const badgeClass = item.type.toLowerCase();
        
        card.innerHTML = `
            <div class="card-top">
                <div class="card-meta">
                    <span class="card-date">
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        ${item.date}
                    </span>
                    <span class="badge ${badgeClass}">${item.type}</span>
                </div>
                <div class="card-actions">
                    <button class="btn-card-action btn-copy-card" title="Copy update to clipboard" aria-label="Copy update to clipboard">
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                    </button>
                    <a href="${item.link}" target="_blank" class="card-link" title="Open official release note" aria-label="Open official release note link">
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            <polyline points="15 3 21 3 21 9"></polyline>
                            <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                    </a>
                </div>
            </div>
            <div class="card-content">
                ${item.content}
            </div>
            <div class="card-select-indicator">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            </div>
        `;
        
        // Copy event
        const copyBtn = card.querySelector('.btn-copy-card');
        if (copyBtn) {
            copyBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent triggering selection
                const plainText = stripHtml(item.content);
                const shareText = `BigQuery ${item.type} (${item.date}):\n${plainText}\n\nInfo: ${item.link}`;
                navigator.clipboard.writeText(shareText).then(() => {
                    showToast("Copied update to clipboard!");
                }).catch(err => {
                    console.error("Failed to copy update:", err);
                    showToast("Failed to copy update.");
                });
            });
        }

        // Select event
        card.addEventListener('click', () => {
            selectRelease(item);
        });

        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                selectRelease(item);
            }
        });

        elements.releasesList.appendChild(card);
    });
}

// Select a release card to populate Tweet composer
function selectRelease(release) {
    selectedRelease = release;
    
    // Highlight selected card
    document.querySelectorAll('.release-card').forEach(card => {
        const cardId = card.getAttribute('data-id');
        if (cardId === release.id) {
            card.classList.add('selected');
            card.setAttribute('aria-pressed', 'true');
        } else {
            card.classList.remove('selected');
            card.setAttribute('aria-pressed', 'false');
        }
    });

    // Open composer UI
    elements.shareEmptyState.classList.add('hidden');
    elements.shareComposer.classList.remove('hidden');

    // Update Composer meta details
    elements.composerBadge.className = `badge ${release.type.toLowerCase()}`;
    elements.composerBadge.textContent = release.type;
    elements.composerDate.textContent = release.date;
    
    const plainText = stripHtml(release.content);
    elements.composerSnippet.textContent = plainText;

    // Generate smart tweet draft
    generateTweetDraft(release, plainText);
}

// Auto draft tweet based on release update
function generateTweetDraft(release, plainText) {
    // Truncate plain text to fit twitter character limit nicely
    // Leave room for: GCP prefix, Date prefix, Twitter short URL (23 chars), hashtags, and newlines
    // Template: "BigQuery [Type] Update ([Date]): [Snippet] Info: [Link] #Hashtags"
    const prefix = `BigQuery ${release.type} (${release.date}): `;
    const linkPlaceholder = `\n\nInfo: ${release.link}`;
    
    // Find active hashtags
    const hashtags = getSelectedHashtags();
    const hashString = hashtags.length > 0 ? `\n\n${hashtags.join(' ')}` : '';
    
    // Calculate space for snippet
    // Note: Twitter counts any link as exactly 23 characters
    const reservedChars = prefix.length + 23 + 6 + hashString.length; // 23 for short link, 6 for newlines/labels
    const maxSnippetLen = 280 - reservedChars;
    
    let snippet = plainText;
    if (plainText.length > maxSnippetLen) {
        snippet = plainText.substring(0, maxSnippetLen - 3).trim() + "...";
    }
    
    elements.tweetTextarea.value = `${prefix}${snippet}`;
    updateTweetDraft();
}

// Live update of tweet preview & URL
function updateTweetDraft() {
    if (!selectedRelease) return;

    const baseText = elements.tweetTextarea.value;
    const hashtags = getSelectedHashtags();
    
    // Build full tweet content (we automatically add link & hashtags if not already present)
    const linkText = `\n\nInfo: ${selectedRelease.link}`;
    const hashText = hashtags.length > 0 ? `\n\n${hashtags.join(' ')}` : '';
    
    const fullTweetText = `${baseText}${linkText}${hashText}`;

    // Count characters based on Twitter short-links logic (links count as 23 characters)
    const tweetLen = calculateTwitterLength(fullTweetText);
    elements.charCount.textContent = tweetLen;

    // Update character limit style indicators
    if (tweetLen > 280) {
        elements.charCountContainer.className = 'char-count-container error';
        elements.btnTweet.style.pointerEvents = 'none';
        elements.btnTweet.style.opacity = '0.5';
    } else if (tweetLen > 250) {
        elements.charCountContainer.className = 'char-count-container warning';
        elements.btnTweet.style.pointerEvents = 'auto';
        elements.btnTweet.style.opacity = '1';
    } else {
        elements.charCountContainer.className = 'char-count-container';
        elements.btnTweet.style.pointerEvents = 'auto';
        elements.btnTweet.style.opacity = '1';
    }

    // Set Tweet share Intent URL
    const encodedText = encodeURIComponent(fullTweetText);
    elements.btnTweet.setAttribute('href', `https://twitter.com/intent/tweet?text=${encodedText}`);
}

// Get array of checked hashtags
function getSelectedHashtags() {
    const checkedBoxes = elements.hashtagSelector.querySelectorAll('input:checked');
    const tags = [];
    checkedBoxes.forEach(cb => {
        tags.push(cb.value);
    });
    return tags;
}

// Copy full draft text to clipboard
async function copyTweetToClipboard() {
    if (!selectedRelease) return;
    
    const baseText = elements.tweetTextarea.value;
    const hashtags = getSelectedHashtags();
    const fullTweetText = `${baseText}\n\nInfo: ${selectedRelease.link}${hashtags.length > 0 ? `\n\n${hashtags.join(' ')}` : ''}`;

    try {
        await navigator.clipboard.writeText(fullTweetText);
        showToast("Copied draft to clipboard!");
    } catch (err) {
        console.error('Failed to copy text: ', err);
        showToast("Failed to copy. Please select and copy manually.");
    }
}

// Toast notification helper
function showToast(message) {
    elements.toastMessage.textContent = message;
    elements.toast.classList.remove('hidden');
    
    setTimeout(() => {
        elements.toast.classList.add('hidden');
    }, 3000);
}

// Utility: Strip HTML tags to get plain text
function stripHtml(html) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Replace custom lists and spacing for nicer plain text
    tempDiv.querySelectorAll('li').forEach(li => {
        li.prepend('• ');
        li.append('\n');
    });
    
    return tempDiv.textContent || tempDiv.innerText || "";
}

// Utility: Calculate Twitter length taking t.co URL wrapping into account
function calculateTwitterLength(text) {
    // Regex for URLs
    const urlRegex = /https?:\/\/[^\s]+/g;
    const urls = text.match(urlRegex) || [];
    let length = text.length;
    
    urls.forEach(url => {
        // Each URL is converted to a 23-char t.co link
        length = length - url.length + 23;
    });
    
    return length;
}

// Error state UI
function showErrorState(message) {
    elements.releasesList.innerHTML = `
        <div class="error-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <h3>Unable to fetch feed</h3>
            <p>${message}</p>
            <button class="btn-primary" onclick="fetchReleases(true)">
                <svg class="icon icon-sync" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                </svg>
                Retry Fetching
            </button>
        </div>
    `;
}

// Empty state UI
function showEmptyFeedState() {
    elements.releasesList.innerHTML = `
        <div class="empty-feed-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <h3>No results found</h3>
            <p>We couldn't find any updates matching your search filters.</p>
            <button class="btn-secondary" onclick="resetFilters()">Reset Search Filters</button>
        </div>
    `;
}

// Reset filters to default state
window.resetFilters = function() {
    elements.inputSearch.value = '';
    searchQuery = '';
    toggleClearSearchButton();
    setActiveFilter('All');
};

// Export visible release notes to CSV
function exportToCSV() {
    // Get currently filtered list
    const filteredList = releasesData.filter(item => {
        const matchesFilter = (currentFilter === 'All') ||
            (currentFilter === 'Others' && !['Feature', 'Issue', 'Deprecation'].includes(item.type)) ||
            (item.type === currentFilter);
            
        const plainTextContent = stripHtml(item.content).toLowerCase();
        const matchesSearch = !searchQuery || 
            item.date.toLowerCase().includes(searchQuery) ||
            item.type.toLowerCase().includes(searchQuery) ||
            plainTextContent.includes(searchQuery);

        return matchesFilter && matchesSearch;
    });

    if (filteredList.length === 0) {
        showToast("No updates to export!");
        return;
    }

    const headers = ["ID", "Date", "Type", "Link", "Content"];
    const csvRows = [
        headers.map(h => `"${h.replace(/"/g, '""')}"`).join(",")
    ];

    filteredList.forEach(item => {
        const plainText = stripHtml(item.content).replace(/\n/g, " ").replace(/\s+/g, " ").trim();
        const row = [
            item.id,
            item.date,
            item.type,
            item.link,
            plainText
        ];
        csvRows.push(row.map(field => `"${field.replace(/"/g, '""')}"`).join(","));
    });

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    const filterSuffix = currentFilter !== 'All' ? `_${currentFilter.toLowerCase()}` : '';
    const dateStr = new Date().toISOString().split('T')[0];
    
    link.setAttribute("href", url);
    link.setAttribute("download", `bigquery_releases_${dateStr}${filterSuffix}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast("CSV Exported successfully!");
}

// Initialize theme from localStorage or system preference
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
    } else if (savedTheme === 'dark') {
        document.body.classList.remove('light-theme');
    } else {
        const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
        if (prefersLight) {
            document.body.classList.add('light-theme');
        }
    }
}

// Toggle light/dark theme class on body and save in localStorage
function toggleTheme() {
    const isLightTheme = document.body.classList.toggle('light-theme');
    localStorage.setItem('theme', isLightTheme ? 'light' : 'dark');
    showToast(`Switched to ${isLightTheme ? 'Light' : 'Dark'} mode!`);
}
