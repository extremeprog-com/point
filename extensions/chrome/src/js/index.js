(function () {

  var body = document.querySelector("body");
  var vis = false;
  var popup = document.createElement("iframe");


  popup.className = "_Point_";
  popup.src = "https://point.trean.extremeprog.com";
  popup.setAttribute("style",
    "width: 500px; " +
    "height: 500px;" +
    "position: fixed;" +
    "top: 0.5vh;" +
    "right: 1vw;" +
    "padding-top: 10px;" +
    "border: 0;" +
    "z-index: 9999;" +
    "background: #ffffff;" +
    "box-shadow: 0 4px 5px #757575;" +
    "display: none;");

  body.insertBefore(popup, body.children[0]);

  function show(popup) {
    vis = true;
    popup.style.display = "block";
  };

  function hide(popup) {
    vis = false;
    popup.style.display = "none";
  };

  function toggleVis() {
    if (vis) {
      hide(popup)
    } else {
      show(popup);
    }
  };

  chrome.extension.onMessage.addListener(function (msg, sender, sendResponse) {
    if (msg.action == 'point') {
      toggleVis();
    }
  });

  document.body.onclick = function (e) {
    if (e.target !== document.querySelector("._Point_")) {
      hide(popup);
    }
  };
})();
