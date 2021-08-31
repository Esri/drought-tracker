export function hydrateErrorAlert(error) {
    console.debug("ERROR", error);
    document.getElementsByClassName("alert-title")[0].innerHTML = error.message;
    document.getElementsByClassName("alert-link")[0].innerHTML = "contact support";
    document.getElementsByClassName("custom-alert")[0].setAttribute("icon", "exclamation-mark-circle");
    document.getElementsByClassName("custom-alert")[0].setAttribute("color", "red");
    document.getElementsByClassName("custom-alert")[0].setAttribute("auto-dismiss-duration", "slow");
    document.getElementsByClassName("custom-alert")[0].setAttribute("active", "true");
    document.getElementsByClassName("custom-alert")[0].setAttribute("aria-hidden", "true");
}

export function hydrateWebMapErrorAlert(error) {
    document.getElementsByClassName("alert-title")[0].innerHTML = error.message;
    document.getElementsByClassName("alert-message")[0].innerHTML = `${error.details.error.message}<br />${error.details.error.details.url}</br />`;
    document.getElementsByClassName("alert-link")[0].innerHTML = "contact support";
    document.getElementsByClassName("custom-alert")[0].setAttribute("icon", "exclamation-mark-circle");
    document.getElementsByClassName("custom-alert")[0].setAttribute("color", "red");
    document.getElementsByClassName("custom-alert")[0].setAttribute("auto-dismiss-duration", "slow");
    document.getElementsByClassName("custom-alert")[0].setAttribute("active", "true");
    document.getElementsByClassName("custom-alert")[0].setAttribute("aria-hidden", "true");
}

export function noResponseHandler() {
    document.getElementsByClassName("alert-title")[0].innerHTML = "";
    document.getElementsByClassName("alert-message")[0].innerHTML = "Please select a location within the continental United States, Alaska, Hawaii, or Puerto Rico.";
    document.getElementsByClassName("alert-link")[0].innerHTML = "";
    document.getElementsByClassName("custom-alert")[0].setAttribute("icon", "exclamation-mark-triangle");
    document.getElementsByClassName("custom-alert")[0].setAttribute("color", "yellow");
    document.getElementsByClassName("custom-alert")[0].setAttribute("auto-dismiss-duration", "fast");
    document.getElementsByClassName("custom-alert")[0].setAttribute("active", "true");
    document.getElementsByClassName("custom-alert")[0].setAttribute("aria-hidden", "true");
}

export function hydrateMapViewErrorAlert(error) {
    console.log("MAPVIEW", error);
}
