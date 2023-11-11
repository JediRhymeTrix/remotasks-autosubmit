// Default values
const DEFAULT_OPTIONS = {
    playSound: true,
    hours: 0,
    minutes: 0,
};

// When the options page is loaded, get the current options and update the UI
chrome.storage.sync.get(["playSound", "hours", "minutes"], function (data) {
    document.getElementById("playSound").checked = data.playSound;
    document.getElementById("hours").value = data.hours.toString();
    document.getElementById("minutes").value = data.minutes.toString();
});

// When the checkboxes are clicked, save the new options
document.getElementById("playSound").addEventListener("change", function (e) {
    chrome.storage.sync.set({ playSound: e.target.checked });
});

document.getElementById("hours").addEventListener("change", function (e) {
    chrome.storage.sync.set({ hours: parseInt(e.target.value, 10) });
});

document.getElementById("minutes").addEventListener("change", function (e) {
    chrome.storage.sync.set({ minutes: parseInt(e.target.value, 10) });
});

// When the reset button is clicked, reset the options to default
document.getElementById("reset").addEventListener("click", function () {
    chrome.storage.sync.set(DEFAULT_OPTIONS, function () {
        // Update the UI to reflect the default options
        document.getElementById("playSound").checked =
            DEFAULT_OPTIONS.playSound;
        document.getElementById("hours").value =
            DEFAULT_OPTIONS.hours.toString();
        document.getElementById("minutes").value =
            DEFAULT_OPTIONS.minutes.toString();
    });
});
