const FORMSPREE_ENDPOINT = "https://formspree.io/f/mkjwkorp";

const menuScreen = document.getElementById("menu-screen");
const cakeScreen = document.getElementById("cake-screen");
const duckScreen = document.getElementById("duck-screen");
const pickCakeBtn = document.getElementById("pick-cake-btn");
const pickFoodBtn = document.getElementById("pick-food-btn");

function showScreen(screen) {
  [menuScreen, cakeScreen, duckScreen].forEach((s) => s.classList.add("hidden"));
  screen.classList.remove("hidden");
}

async function submitAnswer(question, answer) {
  const response = await fetch(FORMSPREE_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      question,
      answer,
      _subject: `Juju wants: "${answer}"`,
    }),
  });
  if (!response.ok) {
    throw new Error("Failed to save answer");
  }
}

function wireAnswerForm({ form, input, thanks, question }) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const answer = input.value.trim();
    if (!answer) {
      input.focus();
      return;
    }

    const submitBtn = form.querySelector("button");
    submitBtn.disabled = true;

    try {
      await submitAnswer(question, answer);
      form.classList.add("hidden");
      thanks.classList.remove("hidden");
    } catch (err) {
      submitBtn.disabled = false;
      alert("Could not save your answer, please try again.");
    }
  });
}

function resetAnswerForm({ form, input, thanks }) {
  form.classList.remove("hidden");
  form.querySelector("button").disabled = false;
  thanks.classList.add("hidden");
  input.value = "";
}

document.querySelectorAll(".back-to-menu-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    showScreen(menuScreen);
  });
});

/* ---------- Cake minigame (shell game: 3 cakes, only 1 is correct) ---------- */

const cakeArea = document.getElementById("cake-area");
const cakes = Array.from(document.querySelectorAll(".cake"));
const mouth = document.getElementById("mouth");
const cakeModalOverlay = document.getElementById("cake-modal-overlay");
const cakeGameoverOverlay = document.getElementById("cake-gameover-overlay");
const cakeRetryBtn = document.getElementById("cake-retry-btn");
const cakeAnswerForm = document.getElementById("cake-answer-form");
const cakeAnswerInput = document.getElementById("cake-answer-input");
const cakeThanks = document.getElementById("cake-thanks");

let grabbedCake = null;
let cakeResolved = false;
let correctCake = null;
let cakeMoveTimer = null;
let pointerOffset = { x: 0, y: 0 };

function randomPosition(area, el) {
  const size = el.offsetWidth || 64;
  const maxX = area.clientWidth - size;
  const maxY = area.clientHeight - size;
  return {
    x: Math.max(0, Math.random() * maxX),
    y: Math.max(0, Math.random() * maxY),
  };
}

function placeAt(el, x, y) {
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
}

function cakeRunAway() {
  cakes.forEach((el) => {
    if (el === grabbedCake || cakeResolved) return;
    const { x, y } = randomPosition(cakeArea, el);
    placeAt(el, x, y);
  });
}

function startCakeRound() {
  cakeResolved = false;
  grabbedCake = null;
  correctCake = cakes[Math.floor(Math.random() * cakes.length)];

  cakes.forEach((el) => {
    el.classList.remove("grabbed");
    el.style.opacity = "1";
    const { x, y } = randomPosition(cakeArea, el);
    placeAt(el, x, y);
  });

  cakeModalOverlay.classList.add("hidden");
  cakeGameoverOverlay.classList.add("hidden");
  resetAnswerForm({ form: cakeAnswerForm, input: cakeAnswerInput, thanks: cakeThanks });

  clearInterval(cakeMoveTimer);
  cakeMoveTimer = setInterval(cakeRunAway, 400);
}

function getPointer(e) {
  if (e.touches && e.touches.length) {
    return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  return { x: e.clientX, y: e.clientY };
}

function onCakeGrabStart(e) {
  if (cakeResolved) return;
  const cake = e.currentTarget;
  grabbedCake = cake;
  cake.classList.add("grabbed");
  const rect = cake.getBoundingClientRect();
  const p = getPointer(e);
  pointerOffset = { x: p.x - rect.left, y: p.y - rect.top };
  e.preventDefault();
}

function onCakeMove(e) {
  if (!grabbedCake) return;
  const p = getPointer(e);
  const x = p.x - pointerOffset.x;
  const y = p.y - pointerOffset.y;
  placeAt(grabbedCake, x, y);

  if (isOverMouth(grabbedCake)) {
    resolveCakeGuess(grabbedCake);
  }
}

function isOverMouth(el) {
  const cakeRect = el.getBoundingClientRect();
  const mouthRect = mouth.getBoundingClientRect();
  const cakeCenter = {
    x: cakeRect.left + cakeRect.width / 2,
    y: cakeRect.top + cakeRect.height / 2,
  };
  return (
    cakeCenter.x >= mouthRect.left &&
    cakeCenter.x <= mouthRect.right &&
    cakeCenter.y >= mouthRect.top &&
    cakeCenter.y <= mouthRect.bottom
  );
}

function onCakeRelease() {
  if (!grabbedCake || cakeResolved) return;
  grabbedCake.classList.remove("grabbed");
  grabbedCake = null;
}

function resolveCakeGuess(cake) {
  cakeResolved = true;
  const wasCorrect = cake === correctCake;
  clearInterval(cakeMoveTimer);
  cake.classList.remove("grabbed");
  grabbedCake = null;

  cakes.forEach((el) => {
    if (el !== cake) el.style.opacity = "0";
  });

  const mouthRect = mouth.getBoundingClientRect();
  const areaRect = cakeArea.getBoundingClientRect();
  placeAt(
    cake,
    mouthRect.left - areaRect.left - cake.offsetWidth / 2 + mouthRect.width / 2,
    mouthRect.top - areaRect.top - cake.offsetHeight / 2 + mouthRect.height / 2
  );
  cake.style.opacity = "0";

  setTimeout(() => {
    if (wasCorrect) {
      cakeModalOverlay.classList.remove("hidden");
      cakeAnswerInput.focus();
    } else {
      cakeGameoverOverlay.classList.remove("hidden");
    }
  }, 300);
}

function cheatWinCake() {
  if (cakeScreen.classList.contains("hidden") || cakeResolved) return;
  resolveCakeGuess(correctCake);
}

wireAnswerForm({
  form: cakeAnswerForm,
  input: cakeAnswerInput,
  thanks: cakeThanks,
  question: "What cake should we try next?",
});

cakeRetryBtn.addEventListener("click", () => {
  cakeGameoverOverlay.classList.add("hidden");
  startCakeRound();
});

cakes.forEach((cake) => {
  cake.addEventListener("mousedown", onCakeGrabStart);
  cake.addEventListener("touchstart", onCakeGrabStart, { passive: false });
});
window.addEventListener("mousemove", onCakeMove);
window.addEventListener("touchmove", onCakeMove, { passive: false });
window.addEventListener("mouseup", onCakeRelease);
window.addEventListener("touchend", onCakeRelease);

/* ---------- Duck minigame (catch the single fast-moving duck) ---------- */

const duckArea = document.getElementById("duck-area");
const duck = document.querySelector(".duck");
const duckModalOverlay = document.getElementById("duck-modal-overlay");
const duckAnswerForm = document.getElementById("duck-answer-form");
const duckAnswerInput = document.getElementById("duck-answer-input");
const duckThanks = document.getElementById("duck-thanks");

let duckCaught = false;
let duckMoveTimer = null;

function duckRunAway() {
  if (duckCaught) return;
  const { x, y } = randomPosition(duckArea, duck);
  placeAt(duck, x, y);
}

function startDuckRound() {
  duckCaught = false;
  duck.style.opacity = "1";
  const { x, y } = randomPosition(duckArea, duck);
  placeAt(duck, x, y);

  duckModalOverlay.classList.add("hidden");
  resetAnswerForm({ form: duckAnswerForm, input: duckAnswerInput, thanks: duckThanks });

  clearInterval(duckMoveTimer);
  duckMoveTimer = setInterval(duckRunAway, 350);
}

function catchDuck() {
  if (duckCaught) return;
  duckCaught = true;
  clearInterval(duckMoveTimer);
  duck.style.opacity = "0";

  setTimeout(() => {
    duckModalOverlay.classList.remove("hidden");
    duckAnswerInput.focus();
  }, 200);
}

function cheatWinDuck() {
  if (duckScreen.classList.contains("hidden") || duckCaught) return;
  catchDuck();
}

duck.addEventListener("click", catchDuck);

wireAnswerForm({
  form: duckAnswerForm,
  input: duckAnswerInput,
  thanks: duckThanks,
  question: "What restaurant should we try next?",
});

/* ---------- Menu navigation ---------- */

pickCakeBtn.addEventListener("click", () => {
  showScreen(cakeScreen);
  startCakeRound();
});

pickFoodBtn.addEventListener("click", () => {
  showScreen(duckScreen);
  startDuckRound();
});

/* ---------- Cheat words (hidden inside each game's instructions) ---------- */

document.querySelectorAll(".cheat-word").forEach((el) => {
  el.addEventListener("click", (e) => {
    e.stopPropagation();
    if (el.dataset.cheat === "cake") cheatWinCake();
    if (el.dataset.cheat === "duck") cheatWinDuck();
  });
});
