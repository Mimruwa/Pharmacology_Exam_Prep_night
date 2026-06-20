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
  },
  {
    drug_name: "Amlodipine",
    drug_class: "Calcium Channel Blocker",
    system: "Cardiovascular",
    mechanism: "Blocks L-type calcium channels and relaxes vascular smooth muscle.",
    exam_use: "Hypertension and angina concept.",
    side_effects: "Ankle swelling, flushing, headache.",
    exam_hint: "Dihydropyridine CCB — more vascular action.",
    related_drugs: "Nifedipine, Verapamil, Diltiazem"
  },
  {
    drug_name: "Salbutamol",
    drug_class: "Beta-2 Agonist",
    system: "Respiratory",
    mechanism: "Stimulates beta-2 receptors and causes bronchodilation.",
    exam_use: "Asthma/bronchospasm concept.",
    side_effects: "Tremor, fast heartbeat, nervousness.",
    exam_hint: "Short-acting bronchodilator. Think asthma rescue concept.",
    related_drugs: "Formoterol, Salmeterol, Terbutaline"
  }
];

const drugGrid = document.getElementById("drugGrid");
const searchInput = document.getElementById("searchInput");
const systemFilter = document.getElementById("systemFilter");
const csvFile = document.getElementById("csvFile");

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

function cleanDrug(row) {
  return {
    drug_name: row.drug_name || row["Drug Name"] || "",
    drug_class: row.drug_class || row["Drug Class"] || "",
    system: row.system || row["System"] || "",
    mechanism: row.mechanism || row["Mechanism"] || "",
    exam_use: row.exam_use || row["Exam Use"] || row["Use"] || "",
    side_effects: row.side_effects || row["Side Effects"] || "",
    exam_hint: row.exam_hint || row["Exam Hint"] || "",
    related_drugs: row.related_drugs || row["Related Drugs"] || ""
  };
}

function startApp(data) {
  allDrugs = data
    .map(cleanDrug)
    .filter(drug => drug.drug_name.trim() !== "");

  updateSystemFilter();
  applyFilters();
}

function updateStats() {
  const classes = new Set(allDrugs.map(d => d.drug_class).filter(Boolean));
  const systems = new Set(allDrugs.map(d => d.system).filter(Boolean));

  totalDrugs.textContent = allDrugs.length;
  totalClasses.textContent = classes.size;
  totalSystems.textContent = systems.size;
}

function updateSystemFilter() {
  const systems = [...new Set(allDrugs.map(d => d.system).filter(Boolean))];

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
    drugGrid.innerHTML = `<p>No drug found. Try another search.</p>`;
    return;
  }

  visibleDrugs.forEach((drug, index) => {
    const card = document.createElement("div");
    card.className = "drug-card";

    card.innerHTML = `
      <h3>${drug.drug_name}</h3>
      <span class="tag">${drug.drug_class}</span>
      <span class="tag">${drug.system}</span>
      <p><strong>Mechanism:</strong> ${drug.mechanism}</p>
      <p><strong>Exam Hint:</strong> ${drug.exam_hint}</p>
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

if (csvFile) {
  csvFile.addEventListener("change", function(event) {
    const file = event.target.files[0];

    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: function(results) {
        startApp(results.data);
      }
    });
  });
}
  const file = event.target.files[0];

  if (!file) return;

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: function(results) {
      startApp(results.data);
    }
  });
});

searchInput.addEventListener("input", applyFilters);
systemFilter.addEventListener("change", applyFilters);

// Try to auto-load drugs.csv after publishing
fetch("drugs.csv")
  .then(response => {
    if (!response.ok) {
      throw new Error("No CSV found");
    }
    return response.text();
  })
  .then(csvText => {
    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true
    });
    startApp(parsed.data);
  })
  .catch(() => {
    startApp(sampleDrugs);
  });