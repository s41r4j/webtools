document.addEventListener("DOMContentLoaded", function () {
    const urlInput = document.getElementById("urlInput");
    const addUrlButton = document.getElementById("addUrlButton");
    const addedUrlsContainer = document.querySelector(".added-urls");
    const customLinkContent = document.getElementById("customLinkContent");
    const openAllButton = document.getElementById("openAllButton");
    const copyButton = document.getElementById("copyButton");
    const clearAllButton = document.getElementById("clearAllButton");
    const blastButton = document.getElementById("blastButton");
    const popUpMessage = document.getElementById("popUpMessage");

    let urls = [];

    const urlParams = new URLSearchParams(window.location.search);
    const urlParamValue = urlParams.get('urls');
    const blastParamValue = urlParams.get('blast');

    if (urlParamValue) {
        const urlList = urlParamValue.split(' ').map(url => {
            const parts = url.split(':');
            return {
                url: parts[0].replace(/"/g, ''),
                blacklisted: parts[1].replace(/"/g, '') === 'true'
            };
        });
        urls = urlList;
        updateAddedUrls();
        updateCustomLink();

        if (blastParamValue === 'true') {
            urls.forEach(function (url) {
                if (!url.blacklisted) {
                    if (!url.url.match(/^[a-zA-Z]+:\/\//))
                        url.url = 'http://' + url.url;
                    window.open(url.url, "_blank");
                }
            });
            blastButton.classList.toggle("active");
            updateCustomLink();
        }
    }

    addUrlButton.addEventListener("click", function () {
        const url = urlInput.value.trim();

        if (url !== "") {
            urls.push({ url, blacklisted: false });
            updateCustomLink();
            updateAddedUrls();
            urlInput.value = "";
        }
    });

    addedUrlsContainer.addEventListener("click", function (event) {
        if (event.target.classList.contains("remove-button")) {
            const index = parseInt(event.target.getAttribute("data-index"));
            if (!isNaN(index)) {
                urls.splice(index, 1);
                updateCustomLink();
                updateAddedUrls();
            }
        }
        if (event.target.classList.contains("blacklist-button")) {
            const index = parseInt(event.target.getAttribute("data-index"));
            if (!isNaN(index)) {
                urls[index].blacklisted = !urls[index].blacklisted;
                updateCustomLink();
                updateAddedUrls();
            }
        }
    });

    openAllButton.addEventListener("click", function () {
        urls.forEach(function (url) {
            if (!url.blacklisted) {
                console.log(url.url)
                if (!url.url.match(/^[a-zA-Z]+:\/\//))
                        url.url = 'http://' + url.url;
                console.log(url.url)
                window.open(url.url, "_blank");
            }
        });
    });

    copyButton.addEventListener("click", function () {
        const tempTextArea = document.createElement("textarea");
        const customLink = getCustomLink();
        tempTextArea.value = customLink;
        document.body.appendChild(tempTextArea);
        tempTextArea.select();
        document.execCommand("copy");
        document.body.removeChild(tempTextArea);
        showPopUpMessage("Copied!");
    });

    clearAllButton.addEventListener("click", function () {
        urls = [];
        updateCustomLink();
        updateAddedUrls();
    });

    blastButton.addEventListener("click", function () {
        blastButton.classList.toggle("active");
        updateCustomLink();
    });

    function updateCustomLink() {
        const customLink = getCustomLink();
        customLinkContent.innerHTML = customLink;
    }

    function getCustomLink() {
        const urlList = urls.map(url => `${url.url}:${url.blacklisted}`).join('+');
        const blastValue = blastButton.classList.contains("active") ? 'true' : 'false';
        const blastPart = blastValue === 'true' ? '&blast=true' : '';
        return `https://s41r4j.github.io/webtools/tools/openallurls.html?urls="${urlList}"${blastPart}`;
    }

    function updateAddedUrls() {
        addedUrlsContainer.innerHTML = "";
        urls.forEach(function (url, index) {
            const listItem = document.createElement("div");
            listItem.classList.add("url-item");
            listItem.innerHTML = `
                <div class="url-container">
                    <span class="wrap-text ${url.blacklisted ? 'blacklisted' : ''}">${url.url}</span>
                    <div class="button-container">
                        <button class="remove-button" data-index="${index}">Remove</button>
                        <button class="blacklist-button" data-index="${index}"
                            onmouseover="this.style.color='${url.blacklisted ? '#00ac42' : '#cc0000'}';"
                            onmouseout="this.style.color='black';">
                            ${url.blacklisted ? 'Whitelist' : 'Blacklist'}
                        </button>
                    </div>
                </div>
            `;
            addedUrlsContainer.appendChild(listItem);
        });
    }

    function showPopUpMessage(message, color) {
        popUpMessage.textContent = message;
        popUpMessage.style.backgroundColor = color || "#4CAF50";
        popUpMessage.classList.add("show");
        setTimeout(function () {
            popUpMessage.classList.remove("show");
        }, 2000);
    }

    urlInput.focus();
});
