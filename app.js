import { retouchDiagram } from "./retouch.js";

const input = document.getElementById("input");
const output = document.getElementById("output");
const retouchButton = document.getElementById("retouch");
const copyButton = document.getElementById("copy");
const status = document.getElementById("status");

let debounceId = null;
let statusTimeout = null;

function setStatus(message, duration = 2000) {
  clearTimeout(statusTimeout);
  status.textContent = message;
  if (message && duration) {
    statusTimeout = setTimeout(() => { status.textContent = ""; }, duration);
  }
}

async function copyOutput(text) {
  if (!navigator.clipboard) {
    setStatus("Clipboard unavailable in this browser.");
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    setStatus("Copied to clipboard.");
  } catch (error) {
    setStatus("Could not copy. Check browser permissions.");
  }
}

function retouch(showCopy) {
  const result = retouchDiagram(input.value);
  output.value = result;

  if (showCopy && result) {
    void copyOutput(result);
  }
}

input.addEventListener("input", () => {
  clearTimeout(debounceId);
  debounceId = setTimeout(() => retouch(false), 250);
});

retouchButton.addEventListener("click", () => retouch(true));

copyButton.addEventListener("click", () => {
  if (!output.value) {
    setStatus("Nothing to copy yet.");
    return;
  }
  void copyOutput(output.value);
});

retouch(false);
