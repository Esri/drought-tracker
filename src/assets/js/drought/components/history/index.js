export function updateDroughtPercentage(percentage) {
    let nodes = document.getElementsByClassName("drought-percentage");
    for (let node of nodes) {
        node.innerHTML = percentage.toFixed(0);
    }
}
