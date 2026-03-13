(function initOpenAllUrls() {
    const urlInput = document.getElementById('urlInput');
    const addUrlButton = document.getElementById('addUrlButton');
    const addedUrlsContainer = document.querySelector('.added-urls');
    const customLinkContent = document.getElementById('customLinkContent');
    const openAllButton = document.getElementById('openAllButton');
    const copyButton = document.getElementById('copyButton');
    const clearAllButton = document.getElementById('clearAllButton');
    const blastButton = document.getElementById('blastButton');
    const popUpMessage = document.getElementById('popUpMessage');
    const urlStatus = document.getElementById('urlStatus');

    if (!urlInput || !addUrlButton || !addedUrlsContainer || !customLinkContent) return;

    let urls = [];
    let blastEnabled = false;
    let messageTimer = null;

    function showPopUpMessage(message) {
        if (!popUpMessage) return;

        popUpMessage.textContent = message;
        popUpMessage.classList.add('show');

        if (messageTimer) {
            clearTimeout(messageTimer);
        }

        messageTimer = setTimeout(function () {
            popUpMessage.classList.remove('show');
        }, 1800);
    }

    function normalizeOpenUrl(url) {
        return /^[a-zA-Z]+:\/\//.test(url) ? url : `http://${url}`;
    }

    function parseSharedUrls(value) {
        if (!value) return [];

        return value
            .split('|')
            .map(function (entry) {
                const [encodedUrl, blacklistFlag] = entry.split('::');
                if (!encodedUrl) return null;

                return {
                    url: decodeURIComponent(encodedUrl),
                    blacklisted: blacklistFlag === '1'
                };
            })
            .filter(Boolean);
    }

    function serializeSharedUrls() {
        return urls
            .map(function (entry) {
                return `${encodeURIComponent(entry.url)}::${entry.blacklisted ? '1' : '0'}`;
            })
            .join('|');
    }

    function getCustomLink() {
        const params = new URLSearchParams();
        const serialized = serializeSharedUrls();

        if (serialized) {
            params.set('urls', serialized);
        }

        if (blastEnabled) {
            params.set('blast', 'true');
        }

        const queryString = params.toString();
        return `${window.location.origin}${window.location.pathname}${queryString ? `?${queryString}` : ''}`;
    }

    function updateBlastButton() {
        if (!blastButton) return;

        blastButton.textContent = blastEnabled ? 'Blast On' : 'Blast';
        blastButton.classList.toggle('tool-button--accent', blastEnabled);
        blastButton.classList.toggle('tool-button--ghost', !blastEnabled);
        blastButton.setAttribute('aria-pressed', String(blastEnabled));
    }

    function updateStatus() {
        if (!urlStatus) return;

        if (!urls.length) {
            urlStatus.textContent = 'No links collected yet.';
            return;
        }

        const blacklistedCount = urls.filter(function (entry) {
            return entry.blacklisted;
        }).length;

        const launchCount = urls.length - blacklistedCount;
        urlStatus.innerHTML = `<strong>${launchCount}</strong> ready to launch, <strong>${blacklistedCount}</strong> currently skipped.`;
    }

    function updateCustomLink() {
        customLinkContent.textContent = getCustomLink();
    }

    function updateAddedUrls() {
        addedUrlsContainer.innerHTML = '';

        urls.forEach(function (entry, index) {
            const listItem = document.createElement('div');
            listItem.className = 'url-item';
            listItem.innerHTML = `
                <div class="url-row">
                    <div>
                        <div class="url-meta">
                            <span>Entry ${String(index + 1).padStart(2, '0')}</span>
                            <span>${entry.blacklisted ? 'Skipped' : 'Launchable'}</span>
                        </div>
                        <div class="url-address ${entry.blacklisted ? 'blacklisted' : ''}">${entry.url}</div>
                    </div>
                    <div class="url-actions">
                        <button class="blacklist-button" data-action="toggle" data-index="${index}" type="button">
                            ${entry.blacklisted ? 'Restore' : 'Skip'}
                        </button>
                        <button class="remove-button" data-action="remove" data-index="${index}" type="button">Remove</button>
                    </div>
                </div>
            `;

            addedUrlsContainer.appendChild(listItem);
        });
    }

    function addCurrentUrl() {
        const value = urlInput.value.trim();
        if (!value) return;

        urls.push({ url: value, blacklisted: false });
        urlInput.value = '';
        updateAddedUrls();
        updateCustomLink();
        updateStatus();
        urlInput.focus();
    }

    function clearAll() {
        urls = [];
        updateAddedUrls();
        updateCustomLink();
        updateStatus();
    }

    function openUrls() {
        urls.forEach(function (entry) {
            if (!entry.blacklisted) {
                window.open(normalizeOpenUrl(entry.url), '_blank', 'noopener');
            }
        });
    }

    async function copyCustomLink() {
        const customLink = getCustomLink();

        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(customLink);
            } else {
                const tempTextArea = document.createElement('textarea');
                tempTextArea.value = customLink;
                document.body.appendChild(tempTextArea);
                tempTextArea.select();
                document.execCommand('copy');
                document.body.removeChild(tempTextArea);
            }

            showPopUpMessage('Copied to clipboard.');
        } catch (error) {
            console.error('Copy failed:', error);
            showPopUpMessage('Unable to copy.');
        }
    }

    const urlParams = new URLSearchParams(window.location.search);
    urls = parseSharedUrls(urlParams.get('urls'));
    blastEnabled = urlParams.get('blast') === 'true';

    addUrlButton.addEventListener('click', addCurrentUrl);
    openAllButton?.addEventListener('click', openUrls);
    copyButton?.addEventListener('click', copyCustomLink);
    clearAllButton?.addEventListener('click', clearAll);
    blastButton?.addEventListener('click', function () {
        blastEnabled = !blastEnabled;
        updateBlastButton();
        updateCustomLink();
    });

    urlInput.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            addCurrentUrl();
        }
    });

    addedUrlsContainer.addEventListener('click', function (event) {
        const button = event.target.closest('button[data-action]');
        if (!button) return;

        const index = Number(button.getAttribute('data-index'));
        if (Number.isNaN(index) || !urls[index]) return;

        if (button.dataset.action === 'remove') {
            urls.splice(index, 1);
        }

        if (button.dataset.action === 'toggle') {
            urls[index].blacklisted = !urls[index].blacklisted;
        }

        updateAddedUrls();
        updateCustomLink();
        updateStatus();
    });

    updateBlastButton();
    updateAddedUrls();
    updateCustomLink();
    updateStatus();

    if (blastEnabled && urls.length) {
        setTimeout(openUrls, 80);
    }

    urlInput.focus();
})();
