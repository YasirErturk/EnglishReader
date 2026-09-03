const settings = new Settings();
const popup = new Popup();
const reader = new Reader(popup, settings);

const settingsButton = document.getElementById("settingsButton");
const settingsPanel = document.getElementById("settingsPanel");

const speedSlider = document.getElementById("speedSlider");
const fontSlider = document.getElementById("fontSlider");
const lineSlider = document.getElementById("lineSlider");

const textContainer = document.getElementById("textContainer");

init();

function init(){

    loadDictionary();

    loadLibrary();

    loadSettings();

    reader.load();

}

document.addEventListener("popupClosed", () => {

    reader.start();

});

settingsButton.addEventListener("click", (e) => {

    e.stopPropagation();

    popup.close();

    reader.stop();
    
    libraryPanel.classList.remove("show");
    
    settingsPanel.classList.toggle("show");

});

document.addEventListener("click",(e)=>{

    if(settingsPanel.contains(e.target)) return;

    if(libraryPanel.contains(e.target)) return;

    if(settingsButton.contains(e.target)) return;

    if(libraryButton.contains(e.target)) return;

    closePanels();

});

fontSlider.addEventListener("input", () => {

    textContainer.style.fontSize = fontSlider.value + "px";

    saveSettings();

});

lineSlider.addEventListener("input", () => {

    textContainer.style.lineHeight = lineSlider.value;

    saveSettings();

});

speedSlider.addEventListener("input", () => {

    settings.speed = parseFloat(speedSlider.value);

    saveSettings();

});

function saveSettings() {

    const data = {

        speed: parseFloat(speedSlider.value),
        font: parseInt(fontSlider.value),
        line: parseFloat(lineSlider.value)

    };

    localStorage.setItem(
        "readerSettings",
        JSON.stringify(data)
    );

}

function loadSettings() {

    const saved = localStorage.getItem("readerSettings");

    if (!saved) return;

    const data = JSON.parse(saved);

    speedSlider.value = data.speed;
    fontSlider.value = data.font;
    lineSlider.value = data.line;

    settings.speed = data.speed;

    textContainer.style.fontSize = data.font + "px";
    textContainer.style.lineHeight = data.line;

}



const libraryButton = document.getElementById("libraryButton");
const libraryPanel = document.getElementById("libraryPanel");

libraryButton.addEventListener("click",(e)=>{

    e.stopPropagation();

    popup.close();

    reader.stop();

    settingsPanel.classList.remove("show");

    libraryPanel.classList.toggle("show");

});




function closePanels(){

    let closed = false;

    if(settingsPanel.classList.contains("show")){

        settingsPanel.classList.remove("show");

        closed = true;

    }

    if(libraryPanel.classList.contains("show")){

        libraryPanel.classList.remove("show");

        closed = true;

    }

    if(closed){

        reader.start();

    }

}


function loadLibrary(){

    const panel = document.getElementById("libraryPanel");

    panel.innerHTML = "<h2>📚 Kitaplık</h2>";

    LIBRARY.forEach(book=>{

        const div=document.createElement("div");

        div.className="book";

        div.innerText=book.title;

        div.onclick=()=>{

            localStorage.setItem("currentBook",book.file);

            location.reload();

        };

        panel.appendChild(div);

    });

}
