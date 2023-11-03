// When the options page is loaded, get the current options and update the UI
chrome.storage.sync.get(["playSound", "hours", "minutes"], function (data) {
    document.getElementById("playSound").checked = data.playSound;
    document.getElementById("hours").value = data.hours;
    document.getElementById("minutes").value = data.minutes;
});

// When the checkboxes are clicked, save the new options
document.getElementById("playSound").addEventListener("change", function (e) {
    chrome.storage.sync.set({ playSound: e.target.checked });
});

document.getElementById("hours").addEventListener("change", function (e) {
    chrome.storage.sync.set({ hours: e.target.value });
});

document.getElementById("minutes").addEventListener("change", function (e) {
    chrome.storage.sync.set({ minutes: e.target.value });
});