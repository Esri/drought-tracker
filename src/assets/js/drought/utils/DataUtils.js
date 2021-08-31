export function highestValueAndKey(obj) {
    let [highestItems] = Object.entries(obj).sort(([ ,v1], [ ,v2]) => v2 - v1);
    return {
        "key": highestItems[0],
        "value": highestItems[1]
    }
}
