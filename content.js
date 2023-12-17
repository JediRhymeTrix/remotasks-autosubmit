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
let isDelayActive = false;

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
        // Set the flag to true to indicate the delay is active
        isDelayActive = true;

        // Convert maxDelay from minutes to seconds and apply a random delay
        let maxDelaySeconds = maxDelayMinutes * 60;
        let delayInSeconds = Math.floor(Math.random() * (maxDelaySeconds + 1));
        // Log the delay before executing the setTimeout
        console.log(
            `Delay set for ${delayInSeconds} seconds before clicking the target button.`
        );
        setTimeout(() => {
            targetButton.click();
            chrome.runtime.sendMessage({ message: "timerEnded" });
            // Clear the flag after the delay completes and the button is clicked
            isDelayActive = false;
            stopWatching(button); // This will clear the interval
        }, delayInSeconds * 1000); // Convert seconds to milliseconds
    }
}

// Function to update initial minutes and send a message
function updateInitialMinutes(totalMinutes) {
    initialMinutes = totalMinutes;
    chrome.runtime.sendMessage({
        message: "initialMinutes",
        initialMinutes: initialMinutes,
    });
}

// Function to get option minutes and max delay, then handle them
function getAndHandleOptions(totalMinutes, button, targetButton) {
    if (initialMinutes === undefined) {
        updateInitialMinutes(totalMinutes);
    }

    chrome.storage.sync.get(["hours", "minutes", "maxDelay"], function (data) {
        let optionMinutes = data.hours * 60 + data.minutes;
        let maxDelayMinutes = data.maxDelay;
        handleOptionMinutes(
            totalMinutes,
            optionMinutes,
            maxDelayMinutes,
            button,
            targetButton
        );
    });
}

function performWatchCycle(button, targetButton) {
    if (isDelayActive || !findTimer()) return;

    let totalMinutes = parseTime(findTimer());
    getAndHandleOptions(totalMinutes, button, targetButton);
}

// Function to start watching
function startWatching(button, targetButton) {
    if (intervalId !== null) {
        return; // Prevent multiple intervals
    }

    intervalId = setInterval(
        performWatchCycle.bind(null, button, targetButton),
        1000
    );

    updateButtonToWatchingState(button);
}

// Function to update button to watching state
function updateButtonToWatchingState(button) {
    button.innerHTML = "Stop Auto-submit";
    button.style.backgroundColor = "#F44336"; // Material Design red
}

// Function to stop watching
function stopWatching(button) {
    if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
        button.innerHTML = "Start Auto-submit Watcher";
        button.style.backgroundColor = "#4CAF50"; // Material Design green
        chrome.runtime.sendMessage({ message: "stopWatching" });
    }
}

// Function to find the timer in span elements
function findTimerInSpans() {
    let allSpans = Array.from(document.querySelectorAll("span"));
    return allSpans.find(span => span.textContent.includes("hour") && span.textContent.includes("minute"));
}

// Function to create a mock timer element
function createMockTimer(hours, minutes) {
    return {
        textContent: `${hours} hours, ${minutes} minutes`,
    };
}

function extractTime(matches) {
    return {
        hours: matches[1] || "0",
        minutes: matches[2] || "0",
    };
}


// Function to find the timer in the header
function findTimerInHeader() {
    const divs = Array.from(document.querySelectorAll("div.shrink-0"));
    const timerRegex = /Expires in (?:(\d+) hour[s]?, )?(?:(\d+) minute[s]?)?/;

    for (const div of divs) {
        const matches = div.textContent.match(timerRegex);
        if (matches) {
            const { hours, minutes } = extractTime(matches);
            return createMockTimer(hours, minutes);
        }
    }

    return null;
}

// Main function to find the timer
function findTimer() {
    let timerSpan = findTimerInSpans();
    if (timerSpan) {
        return timerSpan;
    }

    return findTimerInHeader();
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