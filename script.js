const title = document.querySelector("title");
const fileInput = document.querySelector("#file");
const status = document.querySelector("#status");
const content = document.querySelector("#content");

let textArray = [["text", "file.txt"]];
let page = 1;
let fileName = "";

function saveBookmark() {
  if (fileName) {
    if (page >= textArray.length - 1) localStorage.removeItem(`bookmark_${fileName}`);
    else localStorage.setItem(`bookmark_${fileName}`, page);
  }
}

function loadBookmark() {
  if (fileName) return parseInt(localStorage.getItem(`bookmark_${fileName}`) || "1", 10);
  return 1;
}

function updatePage() {
  if (fileInput.files.length === 0) {
    title.innerText = "viewer";
    status.innerText = "저장된 책갈피 목록";
    let bookmarks = [];
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith("bookmark_")) {
        let fName = key.replace("bookmark_", "");
        let pNum = localStorage.getItem(key);
        bookmarks.push({ fileName: fName, page: pNum });
      }
    }
    bookmarks.sort((a, b) => a.fileName.localeCompare(b.fileName));
    let text = "";
    bookmarks.forEach((b, idx) => {
      text += `${b.fileName} - ${b.page}화\n`;
    });
    content.innerText = text;
  } else {
    title.innerText = `viewer - ${fileName}`;
    status.innerText = `${page} / ${textArray.length - 1}`;
    content.innerText = textArray[page][0];
  }
}

function flipPage(newPage = page) {
  if (newPage < 1 || !textArray[newPage]) return;
  page = newPage;
  updatePage();
  window.scrollTo(0, 0);
  saveBookmark();
}

fileInput.addEventListener("change", async () => {
  textArray = [["text", "file.txt"]];
  page = 1;
  const file = fileInput.files[0];
  fileName = file.name.replace(/\.[^/.]+$/, "");
  const fileExt = file.name.match(/\.([^.]+)$/)?.[1] ?? "";
  switch (fileExt) {
    case "zip":
      const zip = new JSZip();
      const zipContent = await zip.loadAsync(file);
      for (const [filename, zipEntry] of Object.entries(zipContent.files)) {
        if (zipEntry.dir) continue;
        const content = await zipEntry.async("text");
        textArray.push([content, filename]);
      }
      break;
    case "epub":
      const book = ePub(await file.arrayBuffer());
      await book.ready;
      for (const item of book.spine.spineItems) {
        const doc = await item.load(book.load.bind(book));
        const raw = doc.innerHTML.replaceAll(/<[^>]*>/g, "\n");
        const text = raw.replaceAll(/\n\s*/g, "\n\n");
        textArray.push([text, item.href.split("/").pop()]);
        item.unload();
      }
      break;
  }
  page = loadBookmark();
  flipPage();
});

window.addEventListener("pageshow", () => {
  if (fileInput.files.length) fileInput.dispatchEvent(new Event("change"));
});

document.addEventListener("keydown", (e) => {
  if (fileInput.files.length === 0 && e.key.length === 1) fileInput.click();
  else if (e.code === "ArrowLeft" || e.code === "KeyJ") flipPage(page - 1);
  else if (e.code === "ArrowRight" || e.code === "KeyL") flipPage(page + 1);
});

document.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  if (fileInput.files.length === 0) return;
  let newPage = parseInt(prompt("goto", page), 10);
  flipPage(newPage);
});

if (/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
  document.addEventListener("click", (e) => {
    if (fileInput.files.length === 0) fileInput.click();
  });
  
  let startX = 0, startY = 0;

  document.addEventListener("touchstart", (e) => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  });

  document.addEventListener("touchend", (e) => {
    if (fileInput.files.length === 0) return;
    const diffX = e.changedTouches[0].clientX - startX,
          diffY = e.changedTouches[0].clientY - startY;
    if (Math.abs(diffX) > 180 && Math.abs(diffY) < 100) {
      if (diffX > 0) flipPage(page - 1);
      else flipPage(page + 1);
    }
  });
}

updatePage();