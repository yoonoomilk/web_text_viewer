const filesInput = document.getElementById("files");

let textArray = [["text", "file.txt"]];
let page = 1;
let currentHash = ""

function hashing(str) {
  let hash = 2166136261;
  for (let i = 0;i < str.length;i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

function saveBookmark() {
  if (currentHash) localStorage.setItem(`bookmark_${currentHash}`, page);
}

function loadBookmark() {
  if (currentHash) return parseInt(localStorage.getItem(`bookmark_${currentHash}`), 10) || 1;
  return 1;
}

function flipPage(newPage = page) {
  if (newPage < 1 || !textArray[newPage]) return;
  page = newPage;
  document.querySelector("#container").style.display = "block";
  document.querySelector("#status").innerText = `${page} / ${textArray.length - 1}화`;
  document.querySelector("#content").innerText = textArray[page][0];
  document.querySelector("title").innerText = `viewer - ${textArray[page][1]}`;
  window.scrollTo(0, 0);
  saveBookmark();
}

filesInput.addEventListener("change", async () => {
  textArray = [["text", "file.txt"]];
  page = 1;
  const files = filesInput.files;
  for (const file of files) {
    if (file.name.endsWith(".zip")) {
      const zip = new JSZip();
      const zipContent = await zip.loadAsync(file);
      for (const [filename, zipEntry] of Object.entries(zipContent.files)) {
        if (zipEntry.dir) continue;
        const content = await zipEntry.async("text");
        textArray.push([content, filename]);
      }
    } else {
      const content = await file.text();
      textArray.push([content, file.name]);
    }
  }
  currentHash = hashing(textArray.map(([text]) => text).join(""));
  page = loadBookmark();
  flipPage();
});

window.addEventListener("pageshow", () => {
  if (filesInput.files.length) filesInput.dispatchEvent(new Event("change"));
});

document.addEventListener("keydown", (e) => {
  if (filesInput.files.length === 0) filesInput.click();
  else if (e.code === "ArrowLeft" || e.code === "KeyJ") flipPage(page - 1);
  else if (e.code === "ArrowRight" || e.code === "KeyL") flipPage(page + 1);
});

document.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  if (filesInput.files.length === 0) return;
  let newPage = parseInt(prompt("goto", page), 10);
  flipPage(newPage);
});

if (/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
  document.addEventListener("click", (e) => {
    if (filesInput.files.length === 0) filesInput.click();
  });
  
  let startX = 0;

  document.addEventListener("touchstart", (e) => {
    startX = e.touches[0].clientX;
  });

  document.addEventListener("touchend", (e) => {
    if (filesInput.files.length === 0) return;
    const diffX = e.changedTouches[0].clientX - startX;
    if (Math.abs(diffX) > 180) {
      if (diffX > 0) flipPage(page - 1);
      else flipPage(page + 1);
    }
  });
}