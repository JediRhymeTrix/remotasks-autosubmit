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

            // Get the options
            chrome.storage.sync.get(["hours", "minutes"], function (data) {
                let optionMinutes = data.hours * 60 + data.minutes;

                // Send a message to background.js to update the notification
                chrome.runtime.sendMessage({
                    message: "updateTimer",
                    totalMinutes: totalMinutes,
                });

                if (totalMinutes <= optionMinutes) {
                    targetButton.click();
                    chrome.runtime.sendMessage({ message: "timerEnded" });
                    stopWatching(button);
                }
            });
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

    // Send a message to background.js to clear the progress notification
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

    // Select the Submit button
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