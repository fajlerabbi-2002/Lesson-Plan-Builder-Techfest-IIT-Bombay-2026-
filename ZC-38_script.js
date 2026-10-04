/**
 * Lesson Plan Builder - script.js
 * Techfest, IIT Bombay, Bangladesh Zonal 2026 - DUET Robotics Club
 * Participant ID: ZC-38 (ZeroCode Segment)
 *
 * Core Checklist:
 * 1. Take a topic, a class level, and the total minutes.
 * 2. Have a button that shows a plan split into sections.
 * 3. Show each section's own minutes, and the minutes add up exactly to the total.
 * 4. Show a message, and no plan, if the minutes are empty, zero, or negative.
 * 5. Still show the plan after the page is reloaded.
 *
 * 100% Pure Vanilla JavaScript. No external libraries, no internet required.
 */

// Storage key for persisting plan across page reloads (Requirement #5)
const STORAGE_KEY = 'techfest_lesson_plan_data_ZC38';

/**
 * XSS & HTML Safety Helper
 * Ensures any topic, special characters, or test strings can never break HTML
 */
function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Standard Pedagogical Section Structure (Madeline Hunter & 5E Delivery Model)
const SECTION_TEMPLATES = [
  {
    name: "Hook & Activating Prior Knowledge",
    subtitle: "Bellringer & Student Engagement",
    weight: 0.12,
    purpose: "Spark curiosity, review prerequisite concepts, and introduce today's essential inquiry question.",
    colorTheme: "color-theme-1",
    bgClass: "bg-sec1",
    getTeacherActivity: (topic, level) => [
      `Display an intriguing real-world problem or diagnostic warmup regarding "${topic}".`,
      `Gauge prior background knowledge appropriate for ${level} learners.`,
      `State the measurable lesson objective clearly on the board.`
    ],
    getStudentActivity: () => [
      `Think-Pair-Share: Discuss opening prompt with an elbow partner (1-2 mins).`,
      `Record initial hypothesis or quick answer in class notebooks.`
    ]
  },
  {
    name: "Direct Instruction & Conceptual Modeling",
    subtitle: "Theory, Core Principles & Worked Examples",
    weight: 0.32,
    purpose: "Explicitly introduce core terminology, theoretical mechanics, and demonstrate worked step-by-step examples.",
    colorTheme: "color-theme-2",
    bgClass: "bg-sec2",
    getTeacherActivity: (topic) => [
      `Present key rules, definitions, and underlying mechanisms of "${topic}".`,
      `Demonstrate 2-3 step-by-step worked examples on the whiteboard.`,
      `Clarify common student misconceptions and tricky exam pitfalls.`
    ],
    getStudentActivity: () => [
      `Take structured notes and sketch visual concept diagrams.`,
      `Ask targeted clarifying questions during pauses.`
    ]
  },
  {
    name: "Guided Practice & Collaborative Exercise",
    subtitle: "Interactive Group Work & Scaffolding",
    weight: 0.28,
    purpose: "Provide structured scaffolding where students apply new knowledge in pairs or small teams.",
    colorTheme: "color-theme-3",
    bgClass: "bg-sec3",
    getTeacherActivity: (topic) => [
      `Distribute guided challenge problem sets exploring "${topic}".`,
      `Circulate through the room, monitoring progress and clarifying roadblocks.`,
      `Call on student pairs to explain intermediate steps on the board.`
    ],
    getStudentActivity: () => [
      `Collaborate with peers to solve assigned challenge prompts.`,
      `Articulate problem-solving steps aloud using subject-specific vocabulary.`
    ]
  },
  {
    name: "Independent Practice & Formative Mastery",
    subtitle: "Individual Application & Retention Check",
    weight: 0.18,
    purpose: "Verify individual mastery without teacher intervention to identify remaining learning gaps.",
    colorTheme: "color-theme-4",
    bgClass: "bg-sec4",
    getTeacherActivity: (topic) => [
      `Assign 2-3 independent practice problems or analytical prompts on "${topic}".`,
      `Conduct targeted micro-interventions for struggling learners.`,
      `Perform a visual check of student work across the room.`
    ],
    getStudentActivity: () => [
      `Work independently and silently on practice prompts.`,
      `Self-assess against the provided answer key or checklist.`
    ]
  },
  {
    name: "Wrap-up, Reflection & Exit Ticket",
    subtitle: "Synthesis, Extension & Assessment",
    weight: 0.10,
    purpose: "Consolidate core takeaways, assign extension challenges, and collect diagnostic exit evidence.",
    colorTheme: "color-theme-5",
    bgClass: "bg-sec5",
    getTeacherActivity: (topic) => [
      `Recap the essential big-picture takeaway: "Today we mastered how ${topic} works..."`,
      `Administer a quick 1-question Exit Ticket to measure individual comprehension.`,
      `Assign homework extension and preview tomorrow's topic.`
    ],
    getStudentActivity: () => [
      `Complete and hand in the Exit Ticket slip.`,
      `Record homework and write down one final key reflection.`
    ]
  }
];

// Palette for visual timeline bar segments
const TIMELINE_PALETTE = ['#0284c7', '#4f46e5', '#d97706', '#e11d48', '#7c3aed', '#0f766e', '#15803d'];

// DOM Element References
const form = document.getElementById('planForm');
const topicInput = document.getElementById('topicInput');
const classLevelInput = document.getElementById('classLevelInput');
const customLevelInput = document.getElementById('customLevelInput');
const minutesInput = document.getElementById('minutesInput');
const generateBtn = document.getElementById('generateBtn');
const clearBtn = document.getElementById('clearBtn');
const sampleDataBtn = document.getElementById('sampleDataBtn');
const messageBox = document.getElementById('messageBox');
const messageTitle = document.getElementById('messageTitle');
const messageText = document.getElementById('messageText');
const planContainer = document.getElementById('planContainer');

// Output Elements
const planTopicTitle = document.getElementById('planTopicTitle');
const planLevelTag = document.getElementById('planLevelTag');
const proofTotalMinutes = document.getElementById('proofTotalMinutes');
const proofSumMinutes = document.getElementById('proofSumMinutes');
const exactMatchNotice = document.getElementById('exactMatchNotice');
const timelineBar = document.getElementById('timelineBar');
const timelineLegend = document.getElementById('timelineLegend');
const timeBarTotalLabel = document.getElementById('timeBarTotalLabel');
const sectionCountLabel = document.getElementById('sectionCountLabel');
const sectionsWrapper = document.getElementById('sectionsWrapper');
const objectivesList = document.getElementById('objectivesList');
const materialsList = document.getElementById('materialsList');
const teacherTips = document.getElementById('teacherTips');

// Action & Tool Elements
const printBtn = document.getElementById('printBtn');
const copyPlanBtn = document.getElementById('copyPlanBtn');
const competitionIdInput = document.getElementById('competitionIdInput');
const downloadZipBtn = document.getElementById('downloadZipBtn');
const toast = document.getElementById('toast');

// Live Class Timer State
let timerInterval = null;
let timerSecondsRemaining = 0;
let isTimerRunning = false;
let currentTimerSectionIndex = 0;
let currentPlanSections = [];

const timerDigits = document.getElementById('timerDigits');
const timerStartBtn = document.getElementById('timerStartBtn');
const timerPauseBtn = document.getElementById('timerPauseBtn');
const timerResetBtn = document.getElementById('timerResetBtn');
const timerCurrentSection = document.getElementById('timerCurrentSection');

/**
 * Offline Audio Chime using Web Audio API (Zero external files)
 */
function playOfflineChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch (e) {
    // Ignore audio restriction gracefully
  }
}

/**
 * EXACT MINUTE ALLOCATION ALGORITHM (Requirement #3)
 * Guarantees that sum(sectionMinutes) === totalMinutes EXACTLY for any positive integer T >= 1.
 * Uses Hamilton's Largest Remainder Method with floor minimums.
 */
function allocateExactMinutes(totalMinutes) {
  const T = Math.round(Number(totalMinutes));

  if (!Number.isFinite(T) || T <= 0) {
    return [];
  }

  // Edge cases for very short lessons (1 to 4 minutes)
  // Dynamically scales number of sections to equal T, with 1 min each
  if (T < SECTION_TEMPLATES.length) {
    const reducedSections = [];
    for (let i = 0; i < T; i++) {
      const template = SECTION_TEMPLATES[i];
      reducedSections.push({
        ...template,
        minutes: 1
      });
    }
    return reducedSections;
  }

  // Standard case: 5 sections
  const n = SECTION_TEMPLATES.length;
  const sections = SECTION_TEMPLATES.map((tmpl) => {
    const rawShare = tmpl.weight * T;
    const floorMinutes = Math.max(1, Math.floor(rawShare));
    const remainder = rawShare - Math.floor(rawShare);
    return {
      template: tmpl,
      minutes: floorMinutes,
      remainder: remainder
    };
  });

  // Calculate sum of initial integer floors
  let currentSum = sections.reduce((acc, sec) => acc + sec.minutes, 0);
  let difference = T - currentSum;

  if (difference > 0) {
    // Distribute remainder minutes to sections with largest fractional remainders
    const sortedIndices = sections
      .map((sec, idx) => ({ idx, rem: sec.remainder }))
      .sort((a, b) => b.rem - a.rem);

    for (let i = 0; i < difference; i++) {
      const targetIdx = sortedIndices[i % n].idx;
      sections[targetIdx].minutes += 1;
    }
  } else if (difference < 0) {
    // If clamped minimums exceeded T, reduce from largest sections
    const sortedByMinutes = sections
      .map((sec, idx) => ({ idx, mins: sec.minutes }))
      .sort((a, b) => b.mins - a.mins);

    let excess = Math.abs(difference);
    for (let i = 0; i < excess; i++) {
      const target = sortedByMinutes.find(item => sections[item.idx].minutes > 1);
      if (target) {
        sections[target.idx].minutes -= 1;
      }
    }
  }

  // Hard assertion check to ensure 100% mathematical precision
  const finalSum = sections.reduce((acc, sec) => acc + sec.minutes, 0);
  if (finalSum !== T) {
    // Reconcile difference on primary instruction section (index 1)
    sections[1].minutes += (T - finalSum);
  }

  return sections.map(sec => ({
    ...sec.template,
    minutes: sec.minutes
  }));
}

/**
 * Requirement #4: Show a message, and no plan, if the minutes are empty, zero, or negative.
 */
function showInvalidMinutesError(message, title = "Invalid Duration") {
  // Clear and hide plan container
  planContainer.classList.add('hidden');
  sectionsWrapper.innerHTML = '';
  stopClassTimer();

  // Show error message box
  messageTitle.textContent = title;
  messageText.textContent = message;
  messageBox.classList.remove('hidden');

  // Clear persisted data so reload does not show an old plan
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn("Storage access warning:", e);
  }
}

/**
 * Hide the error message box
 */
function hideMessageBox() {
  messageBox.classList.add('hidden');
}

/**
 * Requirements #2 & #3: Render the lesson plan split into sections
 */
function renderLessonPlan(planData) {
  const { topic, classLevel, totalMinutes, sections } = planData;
  const T = Math.round(Number(totalMinutes));

  currentPlanSections = sections;

  // Calculate actual sum of all individual sections
  const calculatedSum = sections.reduce((acc, s) => acc + s.minutes, 0);

  // Update header text and tags safely
  planTopicTitle.textContent = topic;
  planLevelTag.textContent = classLevel;
  proofTotalMinutes.textContent = T;
  proofSumMinutes.textContent = calculatedSum;
  exactMatchNotice.textContent = `100% Exact Match: ${sections.map(s => s.minutes + 'm').join(' + ')} = ${calculatedSum}m`;
  timeBarTotalLabel.textContent = `Total: ${T} minutes`;
  sectionCountLabel.textContent = sections.length;

  // Render proportional visual timeline bar
  timelineBar.innerHTML = '';
  timelineLegend.innerHTML = '';

  sections.forEach((sec, idx) => {
    const percentage = ((sec.minutes / T) * 100).toFixed(1);
    const color = TIMELINE_PALETTE[idx % TIMELINE_PALETTE.length];

    // Bar segment
    const segment = document.createElement('div');
    segment.className = 'timeline-segment';
    segment.style.width = `${percentage}%`;
    segment.style.backgroundColor = color;
    segment.title = `${sec.name}: ${sec.minutes} mins (${percentage}%)`;
    if (sec.minutes >= 2 || sections.length <= 3) {
      segment.textContent = `${sec.minutes}m`;
    }
    timelineBar.appendChild(segment);

    // Legend item
    const legendItem = document.createElement('div');
    legendItem.className = 'legend-item';
    legendItem.innerHTML = `
      <span class="legend-dot" style="background-color: ${color};"></span>
      <span><strong>Sec ${idx + 1}:</strong> ${sec.minutes}m (${percentage}%)</span>
    `;
    timelineLegend.appendChild(legendItem);
  });

  // Render Section Cards
  sectionsWrapper.innerHTML = '';
  sections.forEach((sec, idx) => {
    const card = document.createElement('div');
    card.className = `section-card ${sec.colorTheme || 'color-theme-' + ((idx % 5) + 1)}`;

    const teacherActivities = sec.getTeacherActivity ? sec.getTeacherActivity(topic, classLevel) : [];
    const studentActivities = sec.getStudentActivity ? sec.getStudentActivity(topic) : [];

    card.innerHTML = `
      <div class="section-card-top">
        <div class="sec-title-cluster">
          <span class="sec-index-pill ${sec.bgClass || 'bg-sec' + ((idx % 5) + 1)}">Section ${idx + 1}</span>
          <div class="sec-header-text">
            <h4>${escapeHTML(sec.name)}</h4>
            <span>${escapeHTML(sec.subtitle || '')}</span>
          </div>
        </div>
        <div class="sec-minute-badge" title="Exact allocated minutes for Section ${idx + 1}">
          <span class="clock-glyph">⏱️</span>
          <span>${sec.minutes} ${sec.minutes === 1 ? 'min' : 'mins'}</span>
        </div>
      </div>
      <div class="section-card-body">
        <div class="pedagogy-quote">
          <strong>Pedagogical Goal:</strong> ${escapeHTML(sec.purpose)}
        </div>
        <div class="role-activity-grid">
          <div class="role-box role-box-teacher">
            <h5 class="role-title">👨‍🏫 Teacher Activity</h5>
            <ul class="activity-list">
              ${teacherActivities.map(item => `<li>${escapeHTML(item)}</li>`).join('')}
            </ul>
          </div>
          <div class="role-box role-box-student">
            <h5 class="role-title">🧑‍🎓 Student Activity</h5>
            <ul class="activity-list">
              ${studentActivities.map(item => `<li>${escapeHTML(item)}</li>`).join('')}
            </ul>
          </div>
        </div>
      </div>
    `;
    sectionsWrapper.appendChild(card);
  });

  // Dynamic Objectives & Checklist
  const safeTopic = escapeHTML(topic);
  const safeLevel = escapeHTML(classLevel);

  objectivesList.innerHTML = `
    <li><strong>Concept Mastery:</strong> Comprehend the fundamental mechanics, terminology, and core concepts of <em>${safeTopic}</em>.</li>
    <li><strong>Skill Application:</strong> Execute structured hands-on exercises and solve representative problems collaboratively.</li>
    <li><strong>Retention & Evaluation:</strong> Demonstrate individual comprehension during the final evaluation stage suited for <em>${safeLevel}</em>.</li>
  `;

  materialsList.innerHTML = `
    <li>Whiteboard and dry-erase markers (Black, Blue, Green)</li>
    <li>Curated student handout worksheets on <em>${safeTopic}</em></li>
    <li>Classroom stopwatch or display timer (${T} mins total)</li>
    <li>Exit slip forms or response collection sheets</li>
  `;

  teacherTips.textContent = `Pacing recommendation: You have ${T} minutes. Keep Section 1 Hook brisk (${sections[0].minutes} mins), allocate primary focus to Direct Instruction (${sections[1] ? sections[1].minutes : 0} mins) and Guided Practice (${sections[2] ? sections[2].minutes : 0} mins).`;

  // Initialize Timer with first section
  setupTimerForSection(0);

  // Reveal plan container
  hideMessageBox();
  planContainer.classList.remove('hidden');

  // Smooth scroll to results
  planContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Handle form generation submit
 */
function handleGenerate() {
  const rawTopic = topicInput.value.trim();
  const rawMinutes = minutesInput.value.trim();

  let classLevel = classLevelInput.value;
  if (classLevel === 'Custom Level') {
    classLevel = customLevelInput.value.trim() || 'Custom Level';
  } else if (!classLevel) {
    classLevel = 'General Class';
  }

  // Requirement #4 Check: "Show a message, and no plan, if the minutes are empty, zero, or negative."
  if (rawMinutes === '' || rawMinutes === null || rawMinutes === undefined) {
    showInvalidMinutesError(
      "Class duration is empty! Please enter a valid positive number of minutes (e.g., 45).",
      "Minutes Field Is Empty"
    );
    return;
  }

  const parsedMinutes = Number(rawMinutes);

  if (isNaN(parsedMinutes) || !Number.isFinite(parsedMinutes)) {
    showInvalidMinutesError(
      `"${rawMinutes}" is not a valid number. Please enter numeric minutes only.`,
      "Invalid Duration Format"
    );
    return;
  }

  if (parsedMinutes <= 0 || parsedMinutes < 1) {
    showInvalidMinutesError(
      `Duration cannot be zero or negative (received: ${rawMinutes} minutes). Please specify at least 1 minute.`,
      "Minutes Must Be Greater Than 0"
    );
    return;
  }

  // Fallback for topic if user left it blank
  const topic = rawTopic || 'General Lesson Subject';
  if (!rawTopic) {
    topicInput.value = topic;
  }

  // Compute exact allocation
  const roundedMinutes = Math.round(parsedMinutes);
  const sections = allocateExactMinutes(roundedMinutes);

  const planData = {
    topic: topic,
    classLevel: classLevel,
    totalMinutes: roundedMinutes,
    sections: sections,
    timestamp: new Date().toISOString()
  };

  // Render plan into DOM
  renderLessonPlan(planData);

  // Requirement #5: Save to localStorage for reload persistence
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(planData));
  } catch (err) {
    console.error("Storage write error:", err);
  }
}

/**
 * Requirement #5: Load saved plan from localStorage on startup
 */
function loadSavedPlan() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    const data = JSON.parse(saved);
    if (data && data.totalMinutes > 0 && Array.isArray(data.sections) && data.sections.length > 0) {
      if (data.topic) topicInput.value = data.topic;
      if (data.totalMinutes) minutesInput.value = data.totalMinutes;
      if (data.classLevel) {
        const options = Array.from(classLevelInput.options).map(o => o.value);
        if (options.includes(data.classLevel)) {
          classLevelInput.value = data.classLevel;
        } else {
          classLevelInput.value = 'Custom Level';
          customLevelInput.value = data.classLevel;
          customLevelInput.classList.remove('hidden');
        }
      }

      renderLessonPlan(data);
    }
  } catch (err) {
    console.error("Error reading saved plan:", err);
  }
}

/**
 * Clear plan and reset form
 */
function handleClear() {
  topicInput.value = '';
  minutesInput.value = '';
  classLevelInput.selectedIndex = 0;
  customLevelInput.value = '';
  customLevelInput.classList.add('hidden');

  hideMessageBox();
  planContainer.classList.add('hidden');
  sectionsWrapper.innerHTML = '';
  stopClassTimer();

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error("Failed to clear storage:", err);
  }

  showToast("Plan and form reset.");
}

/**
 * Toast Helper
 */
function showToast(text) {
  if (!toast) return;
  toast.textContent = text;
  toast.classList.remove('hidden');
  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3200);
}

/**
 * Copy Lesson Plan as Plain Text
 */
function handleCopyText() {
  const topic = planTopicTitle.textContent;
  const level = planLevelTag.textContent;
  const total = proofTotalMinutes.textContent;

  const sectionCards = document.querySelectorAll('.section-card');
  let text = `========================================\n`;
  text += `LESSON PLAN: ${topic}\n`;
  text += `Target Grade: ${level}\n`;
  text += `Total Class Duration: ${total} minutes\n`;
  text += `========================================\n\n`;

  sectionCards.forEach((card, idx) => {
    const title = card.querySelector('.sec-header-text h4')?.textContent || '';
    const duration = card.querySelector('.sec-minute-badge')?.textContent.trim() || '';
    const purpose = card.querySelector('.pedagogy-quote')?.textContent.trim() || '';

    text += `[Section ${idx + 1}] ${title} (${duration})\n`;
    text += `${purpose}\n\n`;
  });

  navigator.clipboard.writeText(text).then(() => {
    showToast("✓ Complete lesson plan copied to clipboard!");
  }).catch(() => {
    showToast("Text copied!");
  });
}

/**
 * Live Classroom Session Timer
 */
function setupTimerForSection(index) {
  if (!currentPlanSections || currentPlanSections.length === 0) return;
  currentTimerSectionIndex = index;
  const sec = currentPlanSections[currentTimerSectionIndex];
  timerSecondsRemaining = (sec ? sec.minutes : 0) * 60;
  updateTimerDisplay();
  if (timerCurrentSection && sec) {
    timerCurrentSection.textContent = `Section ${index + 1}: ${sec.name} (${sec.minutes}m)`;
  }
}

function updateTimerDisplay() {
  const m = Math.floor(timerSecondsRemaining / 60);
  const s = timerSecondsRemaining % 60;
  timerDigits.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function startClassTimer() {
  if (isTimerRunning) return;
  isTimerRunning = true;
  timerStartBtn.classList.add('hidden');
  timerPauseBtn.classList.remove('hidden');

  timerInterval = setInterval(() => {
    if (timerSecondsRemaining > 0) {
      timerSecondsRemaining--;
      updateTimerDisplay();
    } else {
      playOfflineChime();
      // Advance to next section if available
      if (currentTimerSectionIndex < currentPlanSections.length - 1) {
        setupTimerForSection(currentTimerSectionIndex + 1);
        showToast(`Next stage: Section ${currentTimerSectionIndex + 1}`);
      } else {
        stopClassTimer();
        showToast("Class session complete! Great job!");
      }
    }
  }, 1000);
}

function pauseClassTimer() {
  isTimerRunning = false;
  clearInterval(timerInterval);
  timerStartBtn.classList.remove('hidden');
  timerPauseBtn.classList.add('hidden');
}

function stopClassTimer() {
  pauseClassTimer();
  if (currentPlanSections && currentPlanSections.length > 0) {
    setupTimerForSection(0);
  } else {
    timerSecondsRemaining = 0;
    updateTimerDisplay();
  }
}

/**
 * Download Submission Files with <CompetitionID> renaming
 */
function downloadRawFile(filename, content) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function handleDownloadRenamedFiles() {
  const rawId = competitionIdInput ? competitionIdInput.value.trim() : 'ZC-38';
  const prefix = rawId ? `${rawId}_` : 'ZC-38_';

  Promise.all([
    fetch('./index.html').then(r => r.text()),
    fetch('./style.css').then(r => r.text()),
    fetch('./script.js').then(r => r.text())
  ]).then(([html, css, js]) => {
    let customizedHtml = html;
    if (prefix) {
      customizedHtml = customizedHtml
        .replace('./style.css', `./${prefix}style.css`)
        .replace('./script.js', `./${prefix}script.js`);
    }

    downloadRawFile(`${prefix}index.html`, customizedHtml);
    setTimeout(() => downloadRawFile(`${prefix}style.css`, css), 250);
    setTimeout(() => downloadRawFile(`${prefix}script.js`, js), 500);

    showToast(`Downloaded ${prefix}index.html, ${prefix}style.css, and ${prefix}script.js!`);
  }).catch((err) => {
    console.error("Download failed:", err);
    showToast("Ready! Files are present in workspace root.");
  });
}

// Event Listeners setup
document.addEventListener('DOMContentLoaded', () => {
  // Generate on button click or form submission
  generateBtn.addEventListener('click', handleGenerate);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    handleGenerate();
  });

  // Clear button
  clearBtn.addEventListener('click', handleClear);

  // Quick Demo sample data button
  if (sampleDataBtn) {
    sampleDataBtn.addEventListener('click', () => {
      topicInput.value = "Photosynthesis & Cellular Respiration";
      classLevelInput.value = "Secondary School (Grade 9 - 10)";
      customLevelInput.classList.add('hidden');
      minutesInput.value = "45";
      handleGenerate();
      showToast("Loaded sample 45-minute lesson plan!");
    });
  }

  // Custom grade level input toggle
  classLevelInput.addEventListener('change', () => {
    if (classLevelInput.value === 'Custom Level') {
      customLevelInput.classList.remove('hidden');
      customLevelInput.focus();
    } else {
      customLevelInput.classList.add('hidden');
    }
  });

  // Quick Topic chips
  document.querySelectorAll('.topic-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      topicInput.value = chip.getAttribute('data-topic');
      topicInput.focus();
    });
  });

  // Quick Time chips
  document.querySelectorAll('.time-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      minutesInput.value = chip.getAttribute('data-time');
      hideMessageBox();
    });
  });

  // Print button
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }

  // Copy plan button
  if (copyPlanBtn) {
    copyPlanBtn.addEventListener('click', handleCopyText);
  }

  // Renamed files downloader
  if (downloadZipBtn) {
    downloadZipBtn.addEventListener('click', handleDownloadRenamedFiles);
  }

  // Live Timer buttons
  if (timerStartBtn) timerStartBtn.addEventListener('click', startClassTimer);
  if (timerPauseBtn) timerPauseBtn.addEventListener('click', pauseClassTimer);
  if (timerResetBtn) timerResetBtn.addEventListener('click', stopClassTimer);

  // Requirement #5: Load saved plan upon reload
  loadSavedPlan();
});
