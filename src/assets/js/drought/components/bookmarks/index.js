import "./index.scss";

/**
 * Initialize the Bookmarks Widget.
 * @param params
 */
export function init(params) {
    addBookmarksWidget(params.view);
}


function addBookmarksWidget(response) {
    const bookmarks = response.map.bookmarks.items;
    const bookmarksNavEle = document.getElementsByClassName("bookmarks-container")[0];
    const bookmarkElements = bookmarks.map(createBookmarkElement);
    bookmarksNavEle.append(...bookmarkElements);
    bookmarksNavEle.addEventListener("click", event => {
        bookmarks.forEach(bookmark => {
            if (bookmark.uid === event.target.id) {
                response.goTo(bookmark.extent)
                    .catch(function (error) {
                        if (error.name !== "AbortError") {
                            console.error(error);
                        }
                    });
            }
        });
    });
}

function createBookmarkElement(bookmark) {
    let bookmarkEle = document.createElement("div");
    bookmarkEle.setAttribute("class", "btn btn-grouped btn-small btn-white bookmark-btn");
    bookmarkEle.setAttribute("id", bookmark.uid);
    bookmarkEle.innerHTML = bookmark.name;
    return bookmarkEle;
}
