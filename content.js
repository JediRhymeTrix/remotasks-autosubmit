const SUBMIT_BUTTON_TEXT = "Submit"; // Text of the target button

// Define the button styles
const BUTTON_STYLES = {
    backgroundColor: "#4CAF50",
    position: "fixed",
    top: "5px",
    right: "10px",
    border: "none",
    borderRadius: "5px",
    padding: "5px 20px",
    zIndex: "1000",
    cursor: "pointer",
};

let intervalId = null;

let initialMinutes;
let lastRemainingMinutes;
let lastRemainingMinutesTime;

window.addEventListener("load", event => {
    let button = document.createElement("button");
    button.innerHTML = "Start Auto-submit Watcher";

    // Apply the styles to the button
    for (let property in BUTTON_STYLES) {
        button.style[property] = BUTTON_STYLES[property];
    }

    button.onclick = toggleWatching;
    document.body.appendChild(button);
});

// Function to handle remaining minutes
function handleRemainingMinutes(remainingMinutes) {
    if (
        remainingMinutes === lastRemainingMinutes &&
        Date.now() - lastRemainingMinutesTime > 60000
    ) {
        let syncIcon = document.querySelector('svg[data-icon="sync-alt"]');
        if (syncIcon && syncIcon.parentElement) {
            syncIcon.parentElement.click();
        }
    } else {
        lastRemainingMinutes = remainingMinutes;
        lastRemainingMinutesTime = Date.now();
    }
}

// Function to handle option minutes and max delay
function handleOptionMinutes(
    totalMinutes,
    optionMinutes,
    maxDelayMinutes,
    button,
    targetButton
) {
    let remainingMinutes = Math.max(0, totalMinutes - optionMinutes);

    handleRemainingMinutes(remainingMinutes);

    chrome.runtime.sendMessage({
        message: "updateTimer",
        totalMinutes: totalMinutes,
    });

    if (totalMinutes <= optionMinutes) {
        // Convert maxDelay from minutes to seconds and apply a random delay
        let maxDelaySeconds = maxDelayMinutes * 60;
        let delayInSeconds = Math.floor(Math.random() * (maxDelaySeconds + 1));
        setTimeout(() => {
            targetButton.click();
            chrome.runtime.sendMessage({ message: "timerEnded" });
            stopWatching(button);
        }, delayInSeconds * 1000); // Convert seconds to milliseconds
    }
}

// Function to start watching
function startWatching(button, targetButton) {
    intervalId = setInterval(() => {
        let timer = findTimer();

        if (timer) {
            let totalMinutes = parseTime(timer);

            if (initialMinutes === undefined) {
                initialMinutes = totalMinutes;
                chrome.runtime.sendMessage({
                    message: "initialMinutes",
                    initialMinutes: initialMinutes,
                });
            }

            chrome.storage.sync.get(
                ["hours", "minutes", "maxDelay"],
                function (data) {
                    let optionMinutes = data.hours * 60 + data.minutes;
                    let maxDelayMinutes = data.maxDelay;
                    handleOptionMinutes(
                        totalMinutes,
                        optionMinutes,
                        maxDelayMinutes,
                        button,
                        targetButton
                    );
                }
            );
        }
    }, 1000);
    button.innerHTML = "Stop Auto-submit";
    button.style.backgroundColor = "#F44336"; // Material Design red
}

// Function to stop watching
function stopWatching(button) {
    clearInterval(intervalId);
    intervalId = null;
    button.innerHTML = "Start Auto-submit Watcher";
    button.style.backgroundColor = "#4CAF50"; // Material Design green
    chrome.runtime.sendMessage({ message: "stopWatching" });
}

// Function to find the timer on the page
function findTimer() {
    let allSpans = Array.from(document.querySelectorAll("span"));
    return allSpans.find(
        span =>
            span.textContent.includes("hours") &&
            span.textContent.includes("minute")
    );
}

// Function to parse the time from the timer text
function parseTime(timer) {
    let timeParts = timer.textContent.trim().split(", ");
    let hours = parseInt(timeParts[0]);
    let minutes = parseInt(timeParts[1]);
    return hours * 60 + minutes;
}

function toggleWatching() {
    let button = this;
    let allButtons = Array.from(document.querySelectorAll("button"));
    let targetButton = allButtons.find(
        btn => btn.textContent.trim() === SUBMIT_BUTTON_TEXT
    );

    if (intervalId) {
        stopWatching(button);
    } else {
        startWatching(button, targetButton);
    }
}