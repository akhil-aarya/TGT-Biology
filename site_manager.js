// =========================================================================
// BIOPREP TGT 2026 - PERMANENT MODULAR ENGINE + DAILY QUIZ ARCHIVE
// © Copyright 2026 Akhil Aarya (Akhilesh) | Never edit index.html again!
// =========================================================================
(function () {
  const CACHE_BUST = Date.now();

  function parseTuples(rawArr, idPrefix) {
    return (rawArr || []).map((item, idx) => {
      if (!Array.isArray(item)) return item;
      return {
        id: `${idPrefix}_${idx + 1}`,
        section: item[0],
        chapterId: item[1],
        topic: item[2],
        q_hi: item[3],
        q_en: item[4],
        options_hi: item[5],
        options_en: item[6],
        correct: item[7],
        exp_hi: item[8],
        exp_en: item[9]
      };
    });
  }

  // Global Sequential Mock Registry (Mock #1 & #2 built-in)
  window.MOCK_TESTS_REGISTRY = [
    {
      id: "full_mock_1",
      order: 1,
      title: "UPESSC TGT Biology Full Mock Test #1 (120 Qs)",
      desc: "5 Current Affairs + 25 GS + 45 Zoology + 45 Botany • Complete 120 Bilingual Questions.",
      isPaid: false,
      price: 0,
      durationMinutes: 120,
      getQuestions: () => {
        const all = getAllQuestions();
        const gs = all.filter(q => q.section === "gs").slice(0, 30);
        const zoo = all.filter(q => q.section === "zoo").slice(0, 45);
        const bot = all.filter(q => q.section === "bot").slice(0, 45);
        return [...gs, ...zoo, ...bot];
      }
    },
    {
      id: "full_mock_2",
      order: 2,
      title: "UPESSC TGT Biology Full Mock Test #2 (120 Qs)",
      desc: "Shuffled High-Yield 120 Questions Practice Set with Negative Marking (-1) & Weak Area Diagnosis.",
      isPaid: true,
      price: 121,
      durationMinutes: 120,
      getQuestions: () => {
        const all = getAllQuestions();
        const gs = all.filter(q => q.section === "gs").slice(0, 30);
        const zoo = all.filter(q => q.section === "zoo").slice(0, 45).reverse();
        const bot = all.filter(q => q.section === "bot").slice(0, 45).reverse();
        return [...gs, ...zoo, ...bot];
      }
    }
  ];

  // Global Sequential Daily Quiz Archive Registry (Day 1 -> Day 2 -> Day 3...)
  window.DAILY_QUIZZES_REGISTRY = [];
  window.CUSTOM_DAILY_QUIZ = { gs: null, bio: null, latestTitle: "" };

  // 1. REGISTER NEW MOCK TEST (Automatically sorts 1 -> 2 -> 3 -> 4...)
  window.registerMockTest = function (mockConfig) {
    const parsedQuestions = mockConfig.rawQuestions
      ? parseTuples(mockConfig.rawQuestions, mockConfig.id)
      : (mockConfig.questions || []);

    const entry = {
      id: mockConfig.id,
      order: Number(mockConfig.order) || (window.MOCK_TESTS_REGISTRY.length + 1),
      title: mockConfig.title,
      desc: mockConfig.desc || "UPESSC TGT/PGT/LT Grade PYQ Level • 30 GS (5 CA) + 90 Biology (45 Zoo + 45 Bot).",
      isPaid: mockConfig.isPaid !== undefined ? mockConfig.isPaid : true,
      price: mockConfig.price !== undefined ? mockConfig.price : 121,
      durationMinutes: mockConfig.durationMinutes || 120,
      getQuestions: () => parsedQuestions
    };

    const existingIdx = window.MOCK_TESTS_REGISTRY.findIndex(m => m.id === entry.id);
    if (existingIdx >= 0) window.MOCK_TESTS_REGISTRY[existingIdx] = entry;
    else window.MOCK_TESTS_REGISTRY.push(entry);

    window.MOCK_TESTS_REGISTRY.sort((a, b) => a.order - b.order);

    if (mockConfig.addToChapters === true) {
      window.registerChapterQuestions(parsedQuestions);
    }

    if (typeof window.renderMockAndSectionalCards === "function") {
      window.renderMockAndSectionalCards();
    }
  };

  // 2. REGISTER CHAPTER-WISE QUESTIONS
  window.registerChapterQuestions = function (rawOrObjArray) {
    const parsed = parseTuples(rawOrObjArray, "ch_ext_" + Date.now());
    const existingKeys = new Set(BASE_QUESTIONS.map(q => q.q_en));
    parsed.forEach(q => {
      if (!existingKeys.has(q.q_en)) {
        BASE_QUESTIONS.push(q);
        existingKeys.add(q.q_en);
      }
    });
    if (typeof window.renderChaptersGrid === "function") window.renderChaptersGrid();
  };

  // 3. REGISTER NEW CHAPTERS OR THEORY UPDATES
  window.registerNewChapters = function (chaptersArr) {
    (chaptersArr || []).forEach(ch => {
      const idx = CHAPTERS.findIndex(c => c.id === ch.id);
      if (idx >= 0) CHAPTERS[idx] = { ...CHAPTERS[idx], ...ch };
      else CHAPTERS.push(ch);
    });
    if (typeof window.renderChaptersGrid === "function") window.renderChaptersGrid();
    if (typeof window.populateAdminChapters === "function") window.populateAdminChapters();
  };

  // 4. REGISTER NEW PDFs IN PDF STORE
  window.registerPdfs = function (pdfsArr) {
    (pdfsArr || []).forEach(pdf => {
      if (!DEFAULT_PDFS.some(p => p.id === pdf.id)) {
        DEFAULT_PDFS.push(pdf);
      }
    });
    if (typeof window.renderPdfStore === "function") window.renderPdfStore();
  };

  // 5. REGISTER / ADD DAILY QUIZ TO ARCHIVE (Never deletes previous quizzes!)
  window.registerDailyQuiz = function (dailyObj) {
    const order = Number(dailyObj.day || dailyObj.order) || (window.DAILY_QUIZZES_REGISTRY.length + 1);
    const id = dailyObj.id || `daily_set_${order}`;
    const entry = {
      id: id,
      order: order,
      title: dailyObj.title || `Daily Quiz #${order}`,
      date: dailyObj.date || `Set #${order}`,
      gs: parseTuples(dailyObj.gs || [], `${id}_gs`),
      bio: parseTuples(dailyObj.bio || [], `${id}_bio`)
    };

    const existingIdx = window.DAILY_QUIZZES_REGISTRY.findIndex(d => d.id === entry.id);
    if (existingIdx >= 0) window.DAILY_QUIZZES_REGISTRY[existingIdx] = entry;
    else window.DAILY_QUIZZES_REGISTRY.push(entry);

    // Sort sequentially: Day 1 -> Day 2 -> Day 3...
    window.DAILY_QUIZZES_REGISTRY.sort((a, b) => a.order - b.order);

    // Set the newest (highest order) quiz as default for top Quick Start buttons
    const latest = window.DAILY_QUIZZES_REGISTRY[window.DAILY_QUIZZES_REGISTRY.length - 1];
    if (latest) {
      window.CUSTOM_DAILY_QUIZ.gs = latest.gs.length ? latest.gs : null;
      window.CUSTOM_DAILY_QUIZ.bio = latest.bio.length ? latest.bio : null;
      window.CUSTOM_DAILY_QUIZ.latestTitle = latest.title;
    }

    window.renderDailyQuizArchive();
  };

  // Alias so both addDailyQuiz() and registerDailyQuiz() work
  window.addDailyQuiz = window.registerDailyQuiz;

  // RENDER DAILY QUIZ ARCHIVE LIST INSIDE THE DAILY QUIZ SECTION
  window.renderDailyQuizArchive = function () {
    const gsBtn = document.querySelector("button[onclick=\"startTest('daily_gs')\"]");
    const dailySection = gsBtn ? gsBtn.closest("section") : null;
    if (!dailySection) return;

    let archiveBox = document.getElementById("daily-quiz-archive-box");
    if (!archiveBox) {
      archiveBox = document.createElement("div");
      archiveBox.id = "daily-quiz-archive-box";
      archiveBox.className = "mt-6 pt-5 border-t border-slate-200";
      dailySection.appendChild(archiveBox);
    }

    if (window.DAILY_QUIZZES_REGISTRY.length === 0) {
      archiveBox.innerHTML = "";
      return;
    }

    const totalSets = window.DAILY_QUIZZES_REGISTRY.length;
    const latestOrder = window.DAILY_QUIZZES_REGISTRY[totalSets - 1].order;

    archiveBox.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <h4 class="text-base font-extrabold text-slate-900">🗂️ All Daily Quizzes List (Previous & Latest — 100% Free)</h4>
          <p class="text-xs text-slate-500">Koi bhi purani ya nayi Daily Quiz yahan se kabhi bhi attempt karein:</p>
        </div>
        <span class="px-2.5 py-1 rounded-full bg-slate-900 text-white font-bold text-xs">${totalSets} Daily Sets Available</span>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        ${window.DAILY_QUIZZES_REGISTRY.map(q => {
          const isLatest = q.order === latestOrder;
          return `
            <div class="rounded-xl border ${isLatest ? "border-emerald-300 bg-emerald-50/40" : "border-slate-200 bg-slate-50/60"} p-4 flex flex-col justify-between gap-3">
              <div>
                <div class="flex items-center justify-between gap-2">
                  <span class="px-2 py-0.5 rounded-full text-[11px] font-extrabold ${isLatest ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-700"}">
                    ${isLatest ? "🔥 LATEST" : q.date}
                  </span>
                  <span class="text-[11px] font-bold text-slate-500">${q.gs.length} GS • ${q.bio.length} Bio</span>
                </div>
                <h5 class="font-extrabold text-sm text-slate-900 mt-1.5">${q.title}</h5>
              </div>
              <div class="space-y-1.5">
                <div class="grid grid-cols-2 gap-2">
                  <button onclick="startDailyArchiveQuiz('${q.id}', 'gs')" class="py-2 px-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition">
                    🔥 GS (${q.gs.length} Qs)
                  </button>
                  <button onclick="startDailyArchiveQuiz('${q.id}', 'bio')" class="py-2 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition">
                    🧬 Bio (${q.bio.length} Qs)
                  </button>
                </div>
                ${
                  isOwner
                    ? `<button onclick="openPrintableDailyQuiz('${q.id}')" class="w-full py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold text-[11px] transition">
                        🖨️ Print ${q.title} PDF (© Copyright)
                      </button>`
                    : ""
                }
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  };

  // LAUNCH ANY ARCHIVED DAILY QUIZ (GS OR BIOLOGY)
  window.startDailyArchiveQuiz = function (quizId, type) {
    const qObj = window.DAILY_QUIZZES_REGISTRY.find(d => d.id === quizId);
    if (!qObj) return;
    if (type === "gs") {
      launchQuiz(`${qObj.title} — GS Speed Quiz (${qObj.gs.length} Qs / 10 Mins)`, qObj.gs, 10 * 60, `daily_arch||${quizId}||gs`);
    } else {
      launchQuiz(`${qObj.title} — Biology Booster (${qObj.bio.length} Qs / 20 Mins)`, qObj.bio, 20 * 60, `daily_arch||${quizId}||bio`);
    }
  };

  // OWNER PRINTABLE PDF FOR ANY DAILY QUIZ SET
  window.openPrintableDailyQuiz = function (quizId) {
    const qObj = window.DAILY_QUIZZES_REGISTRY.find(d => d.id === quizId);
    if (!qObj) return;
    const qs = [...qObj.gs, ...qObj.bio];
    const letters = ["A", "B", "C", "D"];
    document.getElementById("theory-modal-badge").textContent = "© COPYRIGHT 2026 AKHIL AARYA • DAILY QUIZ SHEET";
    document.getElementById("theory-modal-title").textContent = `${qObj.title} (${qObj.gs.length} GS + ${qObj.bio.length} Biology with Answers)`;
    document.getElementById("theory-modal-body").innerHTML = qs.map((q, i) => `
      <div class="pb-3 mb-3 border-b border-slate-200 text-xs">
        <div class="font-bold text-slate-900">Q${i + 1}. [${q.topic}] ${q.q_hi}</div>
        <div class="text-slate-700 mb-1">${q.q_en}</div>
        <div class="grid grid-cols-2 gap-1 text-slate-600">
          <div>(A) ${q.options_hi[0]} (${q.options_en[0]})</div>
          <div>(B) ${q.options_hi[1]} (${q.options_en[1]})</div>
          <div>(C) ${q.options_hi[2]} (${q.options_en[2]})</div>
          <div>(D) ${q.options_hi[3]} (${q.options_en[3]})</div>
        </div>
        <div class="mt-1 font-bold text-emerald-800">Ans: (${letters[q.correct]}) | व्याख्या: ${q.exp_hi}</div>
      </div>
    `).join("");
    document.getElementById("theory-modal").classList.remove("hidden");
  };

  // HOOK INTO OWNER LOGIN/LOGOUT SO ARCHIVE PRINT BUTTONS REFRESH AUTOMATICALLY
  const origUpdateOwnerUI = window.updateOwnerUI;
  window.updateOwnerUI = function () {
    if (typeof origUpdateOwnerUI === "function") origUpdateOwnerUI();
    if (typeof window.renderDailyQuizArchive === "function") window.renderDailyQuizArchive();
  };

  // RENDER MOCK CARDS SEQUENTIALLY (1 -> 2 -> 3 -> 4...)
  window.renderMockAndSectionalCards = function () {
    const mockGrid = document.getElementById("mock-tests-grid");
    const secGrid = document.getElementById("sectional-tests-grid");
    if (!mockGrid || !secGrid) return;

    const sortedMocks = [...window.MOCK_TESTS_REGISTRY].sort((a, b) => a.order - b.order);

    mockGrid.innerHTML = sortedMocks.map(m => {
      const unlocked = !m.isPaid || isOwner;
      const qCount = m.getQuestions().length || 120;
      const tagText = !m.isPaid
        ? `100% FREE • FULL TEST #${m.order}`
        : isOwner
        ? `👑 OWNER UNLOCKED • FULL TEST #${m.order}`
        : `🔒 PAID TEST #${m.order} • ₹${m.price} PACK`;

      return `
        <div class="rounded-xl border ${m.isPaid && !isOwner ? "border-amber-300 bg-gradient-to-b from-amber-50/70 to-white" : "border-slate-200 bg-white"} p-5 shadow-sm flex flex-col justify-between">
          <div>
            <span class="px-2.5 py-0.5 rounded-full ${unlocked ? "bg-emerald-100 text-emerald-800" : "bg-amber-200 text-amber-950"} font-bold text-xs">${tagText}</span>
            <h4 class="font-extrabold text-base text-slate-900 mt-2">${m.title}</h4>
            <p class="text-xs text-slate-600 mt-1">${m.desc}</p>
            <div class="mt-3 text-xs font-semibold text-slate-600 space-y-1">
              <div>• Questions: ${qCount} (30 GS + 90 Bio) | Marks: ${qCount * 3}</div>
              <div>• Time: ${m.durationMinutes} Mins | Marking: +3 / -1</div>
            </div>
          </div>
          <div class="mt-4 space-y-2">
            ${
              unlocked
                ? `<button onclick="startTest('${m.id}')" class="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition">
                    ${isOwner && m.isPaid ? `👑 Start Mock #${m.order} (Owner) →` : `Attempt Mock #${m.order} →`}
                  </button>`
                : `<button onclick="openPayModal('${m.title}', ${m.price})" class="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-sm transition">
                    🔒 Unlock Paid Test @ ₹${m.price} →
                  </button>`
            }
            ${
              isOwner
                ? `<button onclick="openPrintableFullPaper('${m.id}')" class="w-full py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold text-xs transition">
                    🖨️ Print Mock #${m.order} PDF (© Copyright)
                  </button>`
                : ""
            }
          </div>
        </div>
      `;
    }).join("");

    const secCards = [
      { key: "sec_gs", tag: "SECTION A (FREE)", title: "GS + Current Affairs (30 Qs)", info: "30 Questions • 30 Mins • 90 Marks", isPaid: false, color: "bg-slate-900 hover:bg-slate-800" },
      { key: "sec_zoo", tag: "SECTION B1 (FREE)", title: "Zoology Complete (45 Qs)", info: "45 Questions • 45 Mins • 135 Marks", isPaid: false, color: "bg-teal-600 hover:bg-teal-700" },
      { key: "sec_bot", tag: "SECTION B2 (FREE)", title: "Botany Complete (45 Qs)", info: "45 Questions • 45 Mins • 135 Marks", isPaid: false, color: "bg-green-600 hover:bg-green-700" },
      { key: "sec_bio", tag: isOwner ? "👑 OWNER UNLOCKED" : "🔒 PAID @ ₹51", title: "Full Biology Marathon (90 Qs)", info: "90 Questions • 90 Mins • 270 Marks", isPaid: true, color: "bg-emerald-700 hover:bg-emerald-800" }
    ];

    secGrid.innerHTML = secCards.map(s => {
      const unlocked = !s.isPaid || isOwner;
      return `
        <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between">
          <div>
            <span class="text-xs font-bold ${unlocked ? "text-emerald-700" : "text-amber-700"}">${s.tag}</span>
            <h4 class="font-bold text-slate-900 mt-1">${s.title}</h4>
            <p class="text-xs text-slate-500 mt-1">${s.info}</p>
          </div>
          ${
            unlocked
              ? `<button onclick="startTest('${s.key}')" class="mt-4 w-full py-2 rounded-lg ${s.color} text-white font-bold text-xs transition">
                  Start ${s.title}
                </button>`
              : `<button onclick="openPayModal('${s.title} Access + Notes PDF', 51)" class="mt-4 w-full py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs transition">
                  🔒 Unlock @ ₹51
                </button>`
          }
        </div>
      `;
    }).join("");
  };

  // START TEST ENGINE (HANDLES MOCKS, DAILY ARCHIVE, RE-ATTEMPT & SECTIONALS)
  window.startTest = function (testKey) {
    if (typeof testKey === "string" && testKey.startsWith("daily_arch||")) {
      const parts = testKey.split("||");
      window.startDailyArchiveQuiz(parts[1], parts[2]);
      return;
    }

    const mockObj = window.MOCK_TESTS_REGISTRY.find(m => m.id === testKey);
    if (mockObj) {
      if (mockObj.isPaid && !isOwner) {
        openPayModal(mockObj.title, mockObj.price);
        return;
      }
      const qs = mockObj.getQuestions();
      launchQuiz(mockObj.title, qs, mockObj.durationMinutes * 60, mockObj.id);
      return;
    }

    const allQs = getAllQuestions();
    const gsPool = allQs.filter(q => q.section === "gs");
    const zooPool = allQs.filter(q => q.section === "zoo");
    const botPool = allQs.filter(q => q.section === "bot");

    if (testKey === "daily_gs") {
      const qs = window.CUSTOM_DAILY_QUIZ.gs || gsPool.slice(0, 15);
      const label = window.CUSTOM_DAILY_QUIZ.latestTitle ? `${window.CUSTOM_DAILY_QUIZ.latestTitle} — ` : "";
      launchQuiz(`🔥 ${label}Daily GS Speed Quiz (${qs.length} Qs / 10 Mins)`, qs, 10 * 60, "daily_gs");
    } else if (testKey === "daily_bio") {
      const qs = window.CUSTOM_DAILY_QUIZ.bio || [...zooPool.slice(0, 13), ...botPool.slice(0, 12)];
      const label = window.CUSTOM_DAILY_QUIZ.latestTitle ? `${window.CUSTOM_DAILY_QUIZ.latestTitle} — ` : "";
      launchQuiz(`🧬 ${label}Daily Biology Quiz (${qs.length} Qs / 20 Mins)`, qs, 20 * 60, "daily_bio");
    } else if (testKey === "sec_gs") {
      launchQuiz("📘 Section A: Complete GS + Current Affairs Test (30 Qs)", gsPool.slice(0, 30), 30 * 60, "sec_gs");
    } else if (testKey === "sec_zoo") {
      launchQuiz("🐾 Section B1: Complete Zoology Test (45 Qs)", zooPool.slice(0, 45), 45 * 60, "sec_zoo");
    } else if (testKey === "sec_bot") {
      launchQuiz("🌿 Section B2: Complete Botany Test (45 Qs)", botPool.slice(0, 45), 45 * 60, "sec_bot");
    } else if (testKey === "sec_bio") {
      if (!isOwner) {
        openPayModal("Full Biology Marathon (90 Qs) + Notes PDF", 51);
        return;
      }
      launchQuiz("🧬 Complete Biology Marathon Test (90 Qs: 45 Zoo + 45 Bot)", [...zooPool.slice(0, 45), ...botPool.slice(0, 45)], 90 * 60, "sec_bio");
    }
  };

  window.openPrintableFullPaper = function (mockId) {
    const targetMock = window.MOCK_TESTS_REGISTRY.find(m => m.id === mockId) || window.MOCK_TESTS_REGISTRY[0];
    const qs = targetMock ? targetMock.getQuestions() : getAllQuestions().slice(0, 120);
    const title = targetMock ? targetMock.title : "UPESSC TGT Biology Full Mock Test Paper";
    const letters = ["A", "B", "C", "D"];

    document.getElementById("theory-modal-badge").textContent = "© COPYRIGHT 2026 AKHIL AARYA • MASTER PAPER PDF";
    document.getElementById("theory-modal-title").textContent = `${title} (With Answer Key)`;
    document.getElementById("theory-modal-body").innerHTML = qs.map((q, i) => `
      <div class="pb-3 mb-3 border-b border-slate-200 text-xs">
        <div class="font-bold text-slate-900">Q${i + 1}. [${q.topic}] ${q.q_hi}</div>
        <div class="text-slate-700 mb-1">${q.q_en}</div>
        <div class="grid grid-cols-2 gap-1 text-slate-600">
          <div>(A) ${q.options_hi[0]} (${q.options_en[0]})</div>
          <div>(B) ${q.options_hi[1]} (${q.options_en[1]})</div>
          <div>(C) ${q.options_hi[2]} (${q.options_en[2]})</div>
          <div>(D) ${q.options_hi[3]} (${q.options_en[3]})</div>
        </div>
        <div class="mt-1 font-bold text-emerald-800">Ans: (${letters[q.correct]}) | व्याख्या: ${q.exp_hi}</div>
      </div>
    `).join("");
    document.getElementById("theory-modal").classList.remove("hidden");
  };

  window.loadSiteFiles = function (fileList) {
    (fileList || []).forEach(file => {
      const s = document.createElement("script");
      s.src = `${file}?v=${CACHE_BUST}`;
      s.async = false;
      document.body.appendChild(s);
    });
  };

  window.loadSiteFiles(["site_config.js"]);
  // PERMANENT PRINT FIX: ZERO OVERLAP MULTI-PAGE A4 PDF WITH COPYRIGHT WATERMARK
  const printFixStyle = document.createElement("style");
  printFixStyle.textContent = `
    @media print {
      @page {
        size: A4 portrait;
        margin: 14mm 12mm;
      }
      html, body {
        display: block !important;
        height: auto !important;
        min-height: 0 !important;
        overflow: visible !important;
        background: #ffffff !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      body > *:not(#theory-modal):not(#print-watermark) {
        display: none !important;
      }
      #theory-modal:not(.hidden) {
        position: static !important;
        inset: auto !important;
        display: block !important;
        padding: 0 !important;
        margin: 0 !important;
        background: transparent !important;
        backdrop-filter: none !important;
        height: auto !important;
        overflow: visible !important;
        visibility: visible !important;
      }
      #theory-modal > div {
        display: block !important;
        position: static !important;
        max-width: 100% !important;
        width: 100% !important;
        max-height: none !important;
        height: auto !important;
        border: none !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        overflow: visible !important;
        visibility: visible !important;
      }
      #theory-modal > div > div:first-child,
      #theory-modal > div > div:last-child {
        display: none !important;
      }
      #pdf-printable-area {
        position: static !important;
        display: block !important;
        width: 100% !important;
        height: auto !important;
        max-height: none !important;
        overflow: visible !important;
        padding: 0 !important;
        margin: 0 !important;
        visibility: visible !important;
      }
      #pdf-printable-area * {
        visibility: visible !important;
      }
      #theory-modal-body > div {
        display: block !important;
        position: static !important;
        break-inside: avoid !important;
        page-break-inside: avoid !important;
        margin-bottom: 10px !important;
        padding-bottom: 8px !important;
        line-height: 1.45 !important;
      }
      #theory-modal-body .grid {
        display: grid !important;
        grid-template-columns: 1fr 1fr !important;
        gap: 4px 12px !important;
        margin-top: 4px !important;
      }
      #print-watermark {
        display: flex !important;
        position: fixed !important;
        top: 50% !important;
        left: 50% !important;
        transform: translate(-50%, -50%) rotate(-32deg) !important;
        width: 90% !important;
        white-space: normal !important;
        font-size: 24px !important;
        color: rgba(15, 23, 42, 0.06) !important;
        z-index: 0 !important;
      }
    }
  `;
  document.head.appendChild(printFixStyle);
})();
