let allDrugs = [];
let visibleDrugs = [];

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

  const headers = rows[0].map(header => header.trim().replace(/^\uFEFF/, ""));
  const data = rows.slice(1).map(values => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = values[index] || "";
    });
    return obj;
  });

  return data;
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
    .filter(drug => drug.drug_name !== "");

  updateSystemFilter();
  applyFilters();
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

function applyFilters() {
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
      <span class="tag">${escapeHTML(drug.drug_class)}</span>
      <span class="tag">${escapeHTML(drug.system)}</span>
      <p><strong>Mechanism:</strong> ${escapeHTML(drug.mechanism || "Revise class mechanism.")}</p>
      <p><strong>Exam Hint:</strong> ${escapeHTML(drug.exam_hint || "High-yield exam revision card.")}</p>
      <button onclick="showDrugDetail(${index})">View Details</button>
    `;

    drugGrid.appendChild(card);
  });
}

function showDrugDetail(index) {
  const drug = visibleDrugs[index];

  detailName.textContent = drug.drug_name;
  detailClass.textContent = drug.drug_class;
  detailSystem.textContent = drug.system;
  detailMechanism.textContent = drug.mechanism;
  detailUse.textContent = drug.exam_use;
  detailSideEffects.textContent = drug.side_effects;
  detailHint.textContent = drug.exam_hint;
  detailRelated.textContent = drug.related_drugs;

  detailSection.classList.remove("hidden");
  detailSection.scrollIntoView({ behavior: "smooth" });
}

searchInput.addEventListener("input", applyFilters);
systemFilter.addEventListener("change", applyFilters);

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