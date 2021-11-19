(function(securityToken, extensionId) {
    var navigationEventRegistered = false;
    var pagePreparing = false;
    var preparingInterval = null;

    function registerNavigationEvent() {
        if (navigationEventRegistered) return;
        navigationEventRegistered = true;
        document.addEventListener("yt-navigate-finish", (event) => {
            onNavigateFinish();
        });
    }

    function processPage(videoId, likeButton, dislikeButton) {
        function getActiveState(button) {
            return button.classList.contains("style-default-active");
        }

        function setTextValue(button, value) {
            button.querySelector("#text").innerText = value;
        }

        function shouldUpdate(button) {
            if (button.getAttribute('state-attached') !== null) return false;
            button.setAttribute('state-attached', 'true');
            return true;
        }

        function numberFormat(numberState) {
            const userLocales = navigator.language;
            const formatter = Intl.NumberFormat(userLocales, {
                notation: "compact"
            });
            return formatter.format(numberState);
        }

        function getState() {
            if (getActiveState(likeButton)) return "liked";
            return getActiveState(dislikeButton) ? "disliked" : "neutral";
        }

        function setState() {
            chrome.runtime.sendMessage(extensionId, {
                securityToken: securityToken,
                message: "set_state",
                videoId: videoId,
                state: getState()
            }, function(response) {
                if (response !== undefined) {
                    const formattedDislike = numberFormat(response.dislikes);
                    // setTextValue(likeButton, response.likes);
                    setTextValue(dislikeButton, formattedDislike);
                } else {}
            });
        }

        setState();
        if (shouldUpdate(likeButton)) likeButton.addEventListener("click", setState);
        if (shouldUpdate(dislikeButton)) dislikeButton.addEventListener("click", setState);
        registerNavigationEvent();
    }

    function preparePage(videoId) {
        var buttons = document.getElementById('top-level-buttons-computed');
        if (buttons === null || !pagePreparing) return;

        pagePreparing = false;
        clearInterval(preparingInterval);
        processPage(videoId, buttons.children[0], buttons.children[1]);
    }

    function onNavigateFinish() {
        var videoId = new URLSearchParams(window.location.search).get("v");
        if (videoId === null || window.location.pathname !== "/watch")
            registerNavigationEvent();
        else {
            if (pagePreparing)
                clearInterval(preparingInterval);
            pagePreparing = true;
            preparingInterval = setInterval(preparePage, 111, videoId);
        }
    }

    onNavigateFinish();

})(document.currentScript.getAttribute("security-token"), document.currentScript.getAttribute("extension-id"));