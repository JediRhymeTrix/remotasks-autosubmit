// When the options page is loaded, get the current options and update the UI
chrome.storage.sync.get("playSound", function (data) {
    document.getElementById("playSound").checked = data.playSound;
});

// When the checkbox is clicked, save the new option
document.getElementById("playSound").addEventListener("change", function (e) {
    chrome.storage.sync.set({ playSound: e.target.checked });
});
