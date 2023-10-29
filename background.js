let tabId;
let notificationId = "timerProgressNotification"; // ID for the progress notification

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === "timerEnded") {
        // Save the tab ID
        tabId = sender.tab.id;

        // Clear the progress notification
        chrome.notifications.clear(notificationId);

        chrome.notifications.create({
            type: "basic",
            iconUrl: "icon.png", // Replace with actual icon URL
            title: "Remotasks Task Submitted",
            message: "The timer has ended. A new task may be available.",
        });
    } else if (request.message === "updateTimer") {
        let totalMinutes = request.totalMinutes;

        chrome.notifications.create(notificationId, {
            type: "progress",
            iconUrl: "icon.png", // Replace with actual icon URL
            title: "Remotasks Tracking in Progress",
            message: totalMinutes + " minutes remaining",
            progress: Math.round((totalMinutes / 60) * 100), // Convert minutes to progress out of 100
        });
    } else if (request.message === "stopWatching") {
        // Clear the progress notification
        chrome.notifications.clear(notificationId);
    }
});

chrome.notifications.onClicked.addListener(clickedNotificationId => {
    if (clickedNotificationId === notificationId) {
        // Dismiss the notification
        chrome.notifications.clear(notificationId);

        // Focus on the tab and window
        if (tabId) {
            chrome.tabs.get(tabId, function (tab) {
                chrome.windows.update(tab.windowId, { focused: true });
                chrome.tabs.update(tabId, { active: true });
            });
        }
    }
});