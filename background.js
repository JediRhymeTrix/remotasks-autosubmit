const DEFAULT_OPTIONS = { playSound: true, hours: 0, minutes: 0 };

let tabId;
let progressTabId; // tab ID for the progress notification
let notificationId = "timerProgressNotification"; // ID for the progress notification
let taskSubmittedNotificationId; // ID for the task submitted notification
let initialMinutes;

// Create an Audio object
let audio = new Audio("assets/audio/notification.mp3");

function handleTimerEnded(sender) {
    // Save the tab ID
    tabId = sender.tab.id;

    // Clear the progress notification
    chrome.notifications.clear(notificationId);

    // Generate a unique ID for the task submitted notification
    taskSubmittedNotificationId = "taskSubmittedNotification" + Date.now();

    chrome.notifications.create(taskSubmittedNotificationId, {
        type: "basic",
        iconUrl: "icon.png", // Replace with actual icon URL
        title: "Remotasks Task Submitted",
        message: "The timer has ended. A new task may be available.",
    });

    // Check the user's preference before playing the sound
    chrome.storage.sync.get("playSound", function (data) {
        if (data.playSound) {
            audio.play();
        }
    });
}

function handleUpdateTimer(sender, totalMinutes) {
    // Save the tab ID for the progress notification
    progressTabId = sender.tab.id;

    // Get the options
    chrome.storage.sync.get(["hours", "minutes"], function (data) {
        let optionMinutes = data.hours * 60 + data.minutes;

        // Calculate remaining time
        let remainingMinutes = Math.max(0, totalMinutes - optionMinutes);

        // Calculate progress
        let totalTime = initialMinutes - optionMinutes;
        let elapsedTime = initialMinutes - totalMinutes;

        let progress = 0;
        if (totalTime > 0) {
            progress = Math.floor((elapsedTime / totalTime) * 100);
        }

        // Ensure progress is between 0 and 100
        progress = Math.max(0, Math.min(progress, 100));

        chrome.notifications.create(notificationId, {
            type: "progress",
            iconUrl: "icon.png", // Replace with actual icon URL
            title: "Remotasks Tracking in Progress",
            message: remainingMinutes + " minutes remaining",
            progress: progress,
        });
    });
}

function handleStopWatching() {
    // Clear the progress notification
    chrome.notifications.clear(notificationId);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === "initialMinutes") {
        initialMinutes = request.initialMinutes;
    } else if (request.message === "timerEnded") {
        handleTimerEnded(sender);
    } else if (request.message === "updateTimer") {
        handleUpdateTimer(sender, request.totalMinutes);
    } else if (request.message === "stopWatching") {
        handleStopWatching();
    }
});

chrome.notifications.onClicked.addListener(clickedNotificationId => {
    // Dismiss the notification
    chrome.notifications.clear(clickedNotificationId);

    // Determine which tab ID to use
    let focusTabId =
        clickedNotificationId === notificationId ? progressTabId : tabId;

    // Focus on the tab and window
    if (focusTabId) {
        chrome.tabs.get(focusTabId, function (tab) {
            chrome.windows.update(tab.windowId, { focused: true });
            chrome.tabs.update(focusTabId, { active: true });
        });
    }
});

// Set default options
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set(DEFAULT_OPTIONS);
});