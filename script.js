let allDrugs = [];
let visibleDrugs = [];
let currentIndexMode = "system";
let flashcardDeck = [];
let flashcardIndex = 0;
let flashcardShowingAnswer = false;

const sampleDrugs = [
  {
    drug_name: "Diazepam",
    drug_class: "Benzodiazepine",
    system: "CNS",
    mechanism: "Enhances GABA-A receptor activity.",
    exam_use: "Anxiety, seizure, muscle spasm, sedation concept.",
    side_effects: "Drowsiness, dizziness, impaired coordination, dependence risk.",
    exam_hint: "High-yield CNS depressant. Dangerous with alcohol or opioids.",
    related_drugs: "Lorazepam, Clonazepam, Temazepam"
  },
  {
    drug_name: "Ibuprofen",
    drug_class: "NSAID",
    system: "Pain & Inflammation",
    mechanism: "Inhibits COX enzymes and reduces prostaglandin formation.",
    exam_use: "Pain, fever, inflammation.",
    side_effects: "Gastric irritation, bleeding risk, kidney caution.",
    exam_hint: "NSAIDs reduce prostaglandins. Remember GI and renal side effects.",
    related_drugs: "Naproxen, Aspirin, Diclofenac"
  },
  {
    drug_name: "Metformin",
    drug_class: "Biguanide",
    system: "Endocrine",
    mechanism: "Reduces hepatic glucose production and improves insulin sensitivity.",
    exam_use: "Type 2 diabetes concept.",
    side_effects: "GI upset, rare lactic acidosis risk.",
    exam_hint: "First-line diabetes drug in many exam contexts.",
    related_drugs: "Insulin, Glipizide, Sitagliptin"
  }
];

const drugGrid = document.getElementById("drugGrid");
const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
const systemFilter = document.getElementById("systemFilter");

const totalDrugs = document.getElementById("totalDrugs");
const totalClasses = document.getElementById("totalClasses");
const totalSystems = document.getElementById("totalSystems");

const detailSection = document.getElementById("drugDetail");
const detailName = document.getElementById("detailName");
const detailClass = document.getElementById("detailClass");
const detailSystem = document.getElementById("detailSystem");
const detailMechanism = document.getElementById("detailMechanism");
const detailUse = document.getElementById("detailUse");
const detailSideEffects = document.getElementById("detailSideEffects");
const detailHint = document.getElementById("detailHint");
const detailRelated = document.getElementById("detailRelated");

const indexTree = document.getElementById("indexTree");
const indexTabButtons = document.querySelectorAll(".index-tab");

const flashcardCounter = document.getElementById("flashcardCounter");
const flashcardFront = document.getElementById("flashcardFront");
const flashcardClass = document.getElementById("flashcardClass");
const flashcardAnswer = document.getElementById("flashcardAnswer");
const flashcardMechanism = document.getElementById("flashcardMechanism");
const flashcardUse = document.getElementById("flashcardUse");
const flashcardSideEffects = document.getElementById("flashcardSideEffects");
const flashcardHint = document.getElementById("flashcardHint");
const flashcardPrevBtn = document.getElementById("flashcardPrevBtn");
const flashcardFlipBtn = document.getElementById("flashcardFlipBtn");
const flashcardNextBtn = document.getElementById("flashcardNextBtn");
const flashcardShuffleBtn = document.getElementById("flashcardShuffleBtn");

const indexModes = ["system", "class", "az"];

indexTabButtons.forEach((button, index) => {
  button.dataset.indexMode = indexModes[index] || "system";
});

function safeText(value) {
  return value ? String(value).trim() : "";
}

function escapeHTML(text) {
  return safeText(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function parseCSV(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let insideQuotes = false;

  text = text.replace(/^\uFEFF/, "");

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"' && insideQuotes && nextChar === '"') {
      cell += '"';
      i++;
    } else if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === "," && !insideQuotes) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (char === "\r" && nextChar === "\n") {
        i++;
      }

      row.push(cell);
      cell = "";

      if (row.some(item => item.trim() !== "")) {
        rows.push(row);
      }

      row = [];
    } else {
      cell += char;
    }
  }

  if (cell || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  if (rows.length === 0) {
    return [];
  }

  const headers = rows[0].map(header => header.trim().replace(/^\uFEFF/, ""));

  return rows.slice(1).map(values => {
    const obj = {};

    headers.forEach((header, index) => {
      obj[header] = values[index] || "";
    });

    return obj;
  });
}

function cleanDrug(row) {
  return {
    drug_name: safeText(row.drug_name || row["Drug Name"]),
    drug_class: safeText(row.drug_class || row["Drug Class"]),
    system: safeText(row.system || row["System"]),
    mechanism: safeText(row.mechanism || row["Mechanism"]),
    exam_use: safeText(row.exam_use || row["Exam Use"] || row["Use"]),
    side_effects: safeText(row.side_effects || row["Side Effects"]),
    exam_hint: safeText(row.exam_hint || row["Exam Hint"]),
    related_drugs: safeText(row.related_drugs || row["Related Drugs"])
  };
}

function startApp(data) {
  allDrugs = data
    .map(cleanDrug)
    .filter(drug => drug.drug_name !== "")
    .map((drug, index) => ({ ...drug, _id: index }));

  updateSystemFilter();
  updateStats();
  renderIndexTree();
  applyFilters(false);
  setupFlashcards(allDrugs);
}

function updateStats() {
  const classes = new Set(allDrugs.map(drug => drug.drug_class).filter(Boolean));
  const systems = new Set(allDrugs.map(drug => drug.system).filter(Boolean));

  totalDrugs.textContent = allDrugs.length;
  totalClasses.textContent = classes.size;
  totalSystems.textContent = systems.size;
}

function updateSystemFilter() {
  const systems = [...new Set(allDrugs.map(drug => drug.system).filter(Boolean))].sort();

  systemFilter.innerHTML = `<option value="All">All Systems</option>`;

  systems.forEach(system => {
    const option = document.createElement("option");
    option.value = system;
    option.textContent = system;
    systemFilter.appendChild(option);
  });
}

function applyFilters(shouldScroll = true) {
  const searchText = searchInput.value.toLowerCase();
  const selectedSystem = systemFilter.value;

  visibleDrugs = allDrugs.filter(drug => {
    const combinedText = `
      ${drug.drug_name}
      ${drug.drug_class}
      ${drug.system}
      ${drug.mechanism}
      ${drug.exam_use}
      ${drug.exam_hint}
      ${drug.related_drugs}
    `.toLowerCase();

    const matchesSearch = combinedText.includes(searchText);
    const matchesSystem = selectedSystem === "All" || drug.system === selectedSystem;

    return matchesSearch && matchesSystem;
  });

  renderDrugs();
  updateStats();
  setupFlashcards(visibleDrugs.length > 0 ? visibleDrugs : allDrugs);

  if (shouldScroll) {
    document.getElementById("drugCards").scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function renderDrugs() {
  drugGrid.innerHTML = "";

  if (visibleDrugs.length === 0) {
    drugGrid.innerHTML = `<p class="no-results">No drug found. Try another search.</p>`;
    return;
  }

  visibleDrugs.forEach((drug, index) => {
    const card = document.createElement("div");
    card.className = "drug-card";

    card.innerHTML = `
      <h3>${escapeHTML(drug.drug_name)}</h3>
      <span class="tag">${escapeHTML(drug.drug_class || "Drug Class")}</span>
      <span class="tag">${escapeHTML(drug.system || "System")}</span>
      <p><strong>Mechanism:</strong> ${escapeHTML(drug.mechanism || "Revise class mechanism.")}</p>
      <p><strong>Exam Hint:</strong> ${escapeHTML(drug.exam_hint || "High-yield exam revision card.")}</p>
      <button onclick="showDrugDetail(${index})">View Details</button>
    `;

    drugGrid.appendChild(card);
  });
}

function showDrugDetail(index) {
  const drug = visibleDrugs[index];

  if (!drug) {
    return;
  }

  fillDrugDetail(drug);
}

function showDrugById(drugId) {
  const drug = allDrugs.find(item => String(item._id) === String(drugId));

  if (!drug) {
    return;
  }

  fillDrugDetail(drug);
}

function fillDrugDetail(drug) {
  detailName.textContent = drug.drug_name || "Drug Name";
  detailClass.textContent = drug.drug_class || "Drug Class";
  detailSystem.textContent = drug.system || "System";
  detailMechanism.textContent = drug.mechanism || "Revise class mechanism.";
  detailUse.textContent = drug.exam_use || "Review exam use concept.";
  detailSideEffects.textContent = drug.side_effects || "Review key adverse effects.";
  detailHint.textContent = drug.exam_hint || "Focus on high-yield exam clues.";
  detailRelated.textContent = drug.related_drugs || "No related drugs listed.";

  detailSection.classList.remove("hidden");
  detailSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderIndexTree() {
  if (!indexTree) {
    return;
  }

  if (allDrugs.length === 0) {
    indexTree.innerHTML = `<p class="index-placeholder">Index will appear after CSV loads.</p>`;
    return;
  }

  if (currentIndexMode === "system") {
    renderSystemIndex();
  } else if (currentIndexMode === "class") {
    renderClassIndex();
  } else {
    renderAZIndex();
  }
}

function renderSystemIndex() {
  const systemMap = new Map();

  allDrugs.forEach(drug => {
    const system = drug.system || "Other";
    const drugClass = drug.drug_class || "General";

    if (!systemMap.has(system)) {
      systemMap.set(system, new Map());
    }

    const classMap = systemMap.get(system);

    if (!classMap.has(drugClass)) {
      classMap.set(drugClass, []);
    }

    classMap.get(drugClass).push(drug);
  });

  const systems = [...systemMap.keys()].sort();

  indexTree.innerHTML = systems.map((system, systemIndex) => {
    const classMap = systemMap.get(system);
    const classes = [...classMap.keys()].sort();

    const drugCount = classes.reduce((sum, className) => {
      return sum + classMap.get(className).length;
    }, 0);

    const classesHTML = classes.map(className => {
      const drugs = classMap
        .get(className)
        .sort((a, b) => a.drug_name.localeCompare(b.drug_name));

      const drugsHTML = drugs.map(drug => {
        return `
          <button class="tree-drug" data-action="drug" data-id="${drug._id}">
            ${escapeHTML(drug.drug_name)}
          </button>
        `;
      }).join("");

      return `
        <details class="tree-class">
          <summary>
            <span>${escapeHTML(className)}</span>
            <small>${drugs.length} drugs</small>
          </summary>

          <button class="tree-filter" data-action="class" data-value="${escapeHTML(className)}">Show all</button>

          <div class="tree-drug-list">${drugsHTML}</div>
        </details>
      `;
    }).join("");

    return `
      <details class="tree-system" ${systemIndex < 4 ? "open" : ""}>
        <summary>
          <span>${escapeHTML(system)}</span>
          <small>${classes.length} classes · ${drugCount} drugs</small>
        </summary>

        <button class="tree-filter system-filter" data-action="system" data-value="${escapeHTML(system)}">
          Show all ${escapeHTML(system)}
        </button>

        <div class="tree-children">${classesHTML}</div>
      </details>
    `;
  }).join("");
}

function renderClassIndex() {
  const classMap = new Map();

  allDrugs.forEach(drug => {
    const drugClass = drug.drug_class || "General";

    if (!classMap.has(drugClass)) {
      classMap.set(drugClass, []);
    }

    classMap.get(drugClass).push(drug);
  });

  const classes = [...classMap.keys()].sort();

  indexTree.innerHTML = classes.map((className, classIndex) => {
    const drugs = classMap.get(className).sort((a, b) => a.drug_name.localeCompare(b.drug_name));

    const drugsHTML = drugs.map(drug => {
      return `
        <button class="tree-drug" data-action="drug" data-id="${drug._id}">
          ${escapeHTML(drug.drug_name)}
        </button>
      `;
    }).join("");

    return `
      <details class="tree-system" ${classIndex < 5 ? "open" : ""}>
        <summary>
          <span>${escapeHTML(className)}</span>
          <small>${drugs.length} drugs</small>
        </summary>

        <button class="tree-filter" data-action="class" data-value="${escapeHTML(className)}">Show all</button>

        <div class="tree-drug-list">${drugsHTML}</div>
      </details>
    `;
  }).join("");
}

function renderAZIndex() {
  const letterMap = new Map();

  allDrugs.forEach(drug => {
    const firstLetter = drug.drug_name.charAt(0).toUpperCase() || "#";
    const letter = /[A-Z]/.test(firstLetter) ? firstLetter : "#";

    if (!letterMap.has(letter)) {
      letterMap.set(letter, []);
    }

    letterMap.get(letter).push(drug);
  });

  const letters = [...letterMap.keys()].sort();

  indexTree.innerHTML = letters.map((letter, letterIndex) => {
    const drugs = letterMap.get(letter).sort((a, b) => a.drug_name.localeCompare(b.drug_name));

    const drugsHTML = drugs.map(drug => {
      return `
        <button class="tree-drug" data-action="drug" data-id="${drug._id}">
          ${escapeHTML(drug.drug_name)}
        </button>
      `;
    }).join("");

    return `
      <details class="tree-system" ${letterIndex < 5 ? "open" : ""}>
        <summary>
          <span>${escapeHTML(letter)}</span>
          <small>${drugs.length} drugs</small>
        </summary>

        <div class="tree-drug-list">${drugsHTML}</div>
      </details>
    `;
  }).join("");
}

function filterBySystem(system) {
  searchInput.value = "";

  const hasOption = [...systemFilter.options].some(option => option.value === system);

  if (hasOption) {
    systemFilter.value = system;
  } else {
    systemFilter.value = "All";
    searchInput.value = system;
  }

  applyFilters();
}

function filterByClass(className) {
  systemFilter.value = "All";
  searchInput.value = className;
  applyFilters();
}

function setupFlashcards(deck) {
  flashcardDeck = deck.filter(drug => drug.drug_name !== "");
  flashcardIndex = 0;
  flashcardShowingAnswer = false;
  renderFlashcard();
}

function renderFlashcard() {
  if (!flashcardFront) {
    return;
  }

  if (flashcardDeck.length === 0) {
    flashcardCounter.textContent = "0 / 0";
    flashcardFront.textContent = "No flashcards found";
    flashcardClass.textContent = "Try another search";
    flashcardAnswer.classList.add("hidden");
    return;
  }

  const drug = flashcardDeck[flashcardIndex];

  flashcardCounter.textContent = `${flashcardIndex + 1} / ${flashcardDeck.length}`;
  flashcardFront.textContent = drug.drug_name || "Drug Name";
  flashcardClass.textContent = `${drug.drug_class || "Drug Class"} · ${drug.system || "System"}`;
  flashcardMechanism.textContent = drug.mechanism || "Revise class mechanism.";
  flashcardUse.textContent = drug.exam_use || "Review exam use concept.";
  flashcardSideEffects.textContent = drug.side_effects || "Review key adverse effects.";
  flashcardHint.textContent = drug.exam_hint || "Focus on high-yield exam clues.";

  if (flashcardShowingAnswer) {
    flashcardAnswer.classList.remove("hidden");
    flashcardFlipBtn.textContent = "Hide Answer";
  } else {
    flashcardAnswer.classList.add("hidden");
    flashcardFlipBtn.textContent = "Show Answer";
  }
}

function nextFlashcard() {
  if (flashcardDeck.length === 0) {
    return;
  }

  flashcardIndex = (flashcardIndex + 1) % flashcardDeck.length;
  flashcardShowingAnswer = false;
  renderFlashcard();
}

function previousFlashcard() {
  if (flashcardDeck.length === 0) {
    return;
  }

  flashcardIndex = (flashcardIndex - 1 + flashcardDeck.length) % flashcardDeck.length;
  flashcardShowingAnswer = false;
  renderFlashcard();
}

function flipFlashcard() {
  flashcardShowingAnswer = !flashcardShowingAnswer;
  renderFlashcard();
}

function shuffleFlashcards() {
  for (let i = flashcardDeck.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [flashcardDeck[i], flashcardDeck[randomIndex]] = [flashcardDeck[randomIndex], flashcardDeck[i]];
  }

  flashcardIndex = 0;
  flashcardShowingAnswer = false;
  renderFlashcard();
}

searchInput.addEventListener("input", () => applyFilters(false));

searchInput.addEventListener("keydown", event => {
  if (event.key === "Enter") {
    event.preventDefault();
    applyFilters(true);
  }
});

if (searchButton) {
  searchButton.addEventListener("click", () => applyFilters(true));
}

systemFilter.addEventListener("change", () => applyFilters());

indexTabButtons.forEach(button => {
  button.addEventListener("click", () => {
    indexTabButtons.forEach(tab => tab.classList.remove("active"));
    button.classList.add("active");
    currentIndexMode = button.dataset.indexMode;
    renderIndexTree();
  });
});

if (indexTree) {
  indexTree.addEventListener("click", event => {
    const target = event.target.closest("[data-action]");

    if (!target) {
      return;
    }

    if (target.dataset.action === "system") {
      filterBySystem(target.dataset.value);
    }

    if (target.dataset.action === "class") {
      filterByClass(target.dataset.value);
    }

    if (target.dataset.action === "drug") {
      showDrugById(target.dataset.id);
    }
  });
}

if (flashcardPrevBtn) {
  flashcardPrevBtn.addEventListener("click", previousFlashcard);
}

if (flashcardFlipBtn) {
  flashcardFlipBtn.addEventListener("click", flipFlashcard);
}

if (flashcardNextBtn) {
  flashcardNextBtn.addEventListener("click", nextFlashcard);
}

if (flashcardShuffleBtn) {
  flashcardShuffleBtn.addEventListener("click", shuffleFlashcards);
}

fetch("./drugs.csv?v=" + Date.now())
  .then(response => {
    if (!response.ok) {
      throw new Error("drugs.csv not found");
    }
    return response.text();
  })
  .then(csvText => {
    const data = parseCSV(csvText);
    startApp(data);
  })
  .catch(error => {
    console.warn("CSV loading failed. Showing sample drugs.", error);
    startApp(sampleDrugs);
  });


  /* QUIZ MODE LOGIC */

let quizDeck = [];
let quizIndex = 0;
let quizScore = 0;
let quizAnswered = false;

const quizCounter = document.getElementById("quizCounter");
const quizScoreText = document.getElementById("quizScore");
const quizQuestionType = document.getElementById("quizQuestionType");
const quizQuestion = document.getElementById("quizQuestion");
const quizOptions = document.getElementById("quizOptions");
const quizFeedback = document.getElementById("quizFeedback");
const quizNextBtn = document.getElementById("quizNextBtn");
const quizRestartBtn = document.getElementById("quizRestartBtn");

function setupQuiz(deck) {
  if (!quizQuestion || !quizOptions) {
    return;
  }

  quizDeck = deck.filter(drug => drug.drug_name !== "");
  quizIndex = 0;
  quizScore = 0;
  quizAnswered = false;

  renderQuizQuestion();
}

function shuffleArray(array) {
  const copied = [...array];

  for (let i = copied.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [copied[i], copied[randomIndex]] = [copied[randomIndex], copied[i]];
  }

  return copied;
}

function getQuizOptions(correctDrug) {
  const wrongOptions = allDrugs
    .filter(drug => drug.drug_name !== correctDrug.drug_name)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);

  return shuffleArray([correctDrug, ...wrongOptions]);
}

function renderQuizQuestion() {
  if (!quizQuestion || !quizOptions) {
    return;
  }

  quizOptions.innerHTML = "";
  quizFeedback.textContent = "";
  quizFeedback.className = "quiz-feedback";
  quizAnswered = false;

  if (quizDeck.length === 0) {
    quizCounter.textContent = "Question 0 / 0";
    quizScoreText.textContent = "Score: 0";
    quizQuestionType.textContent = "No quiz found";
    quizQuestion.textContent = "Try another search or clear filters.";
    return;
  }

  const currentDrug = quizDeck[quizIndex];

  const clue =
    currentDrug.mechanism ||
    currentDrug.exam_hint ||
    currentDrug.exam_use ||
    `Drug class: ${currentDrug.drug_class}`;

  quizCounter.textContent = `Question ${quizIndex + 1} / ${quizDeck.length}`;
  quizScoreText.textContent = `Score: ${quizScore}`;
  quizQuestionType.textContent = "Mechanism Question";
  quizQuestion.textContent = `Which drug matches this clue? ${clue}`;

  const options = getQuizOptions(currentDrug);

  options.forEach(optionDrug => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = optionDrug.drug_name;
    button.dataset.answer = optionDrug.drug_name;
    button.dataset.correct = optionDrug.drug_name === currentDrug.drug_name ? "true" : "false";

    button.addEventListener("click", () => checkQuizAnswer(button, currentDrug.drug_name));

    quizOptions.appendChild(button);
  });
}

function checkQuizAnswer(selectedButton, correctAnswer) {
  if (quizAnswered) {
    return;
  }

  quizAnswered = true;

  const allOptionButtons = quizOptions.querySelectorAll("button");

  allOptionButtons.forEach(button => {
    button.classList.add("disabled");

    if (button.dataset.correct === "true") {
      button.classList.add("correct");
    }
  });

  if (selectedButton.dataset.correct === "true") {
    quizScore++;
    quizFeedback.textContent = "Correct ✅";
    quizFeedback.classList.add("correct-text");
  } else {
    selectedButton.classList.add("wrong");
    quizFeedback.textContent = `Wrong ❌ Correct answer: ${correctAnswer}`;
    quizFeedback.classList.add("wrong-text");
  }

  quizScoreText.textContent = `Score: ${quizScore}`;
}

function nextQuizQuestion() {
  if (quizDeck.length === 0) {
    return;
  }

  quizIndex = (quizIndex + 1) % quizDeck.length;
  renderQuizQuestion();
}

function restartQuiz() {
  quizDeck = shuffleArray(quizDeck);
  quizIndex = 0;
  quizScore = 0;
  quizAnswered = false;
  renderQuizQuestion();
}

if (quizNextBtn) {
  quizNextBtn.addEventListener("click", nextQuizQuestion);
}

if (quizRestartBtn) {
  quizRestartBtn.addEventListener("click", restartQuiz);
}

/* Connect quiz with existing app loading */

const originalStartAppForQuiz = startApp;

startApp = function(data) {
  originalStartAppForQuiz(data);
  setupQuiz(allDrugs);
};

const originalApplyFiltersForQuiz = applyFilters;

applyFilters = function(shouldScroll = true) {
  originalApplyFiltersForQuiz(shouldScroll);

  if (visibleDrugs.length > 0) {
    setupQuiz(visibleDrugs);
  } else {
    setupQuiz(allDrugs);
  }
};