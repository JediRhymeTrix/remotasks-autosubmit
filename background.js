let tabId;
let progressTabId; // tab ID for the progress notification
let notificationId = "timerProgressNotification"; // ID for the progress notification
let taskSubmittedNotificationId; // ID for the task submitted notification

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

    chrome.notifications.create(notificationId, {
        type: "progress",
        iconUrl: "icon.png", // Replace with actual icon URL
        title: "Remotasks Tracking in Progress",
        message: totalMinutes + " minutes remaining",
        progress: Math.round((totalMinutes / 60) * 100), // Convert minutes to progress out of 100
    });
}

function handleStopWatching() {
    // Clear the progress notification
    chrome.notifications.clear(notificationId);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === "timerEnded") {
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

// Default options
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({ playSound: true });
});