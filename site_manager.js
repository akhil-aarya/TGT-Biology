// =========================================================================
// BIOPREP TGT 2026 - PERMANENT MODULAR ENGINE (© AKHIL AARYA)
// Upload ONCE. Never need to edit index.html again!
// =========================================================================
(function () {
  const CACHE_BUST = Date.now();

  // Convert compact tuple [section, chapterId, topic, q_hi, q_en, opt_hi, opt_en, correct, exp_hi, exp_en] to full Object
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

  // Global Sequential Mock Registry (Starts with Built-in Mock #1 & Mock #2)
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

  window.CUSTOM_DAILY_QUIZ = { gs: null, bio: null };

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

    // Strictly sort in sequential order: 1, 2, 3, 4...
    window.MOCK_TESTS_REGISTRY.sort((a, b) => a.order - b.order);

    // Optional: If mockConfig.addToChapters === true, also merge into Chapter-wise bank
    if (mockConfig.addToChapters === true) {
      window.registerChapterQuestions(parsedQuestions);
    }

    if (typeof window.renderMockAndSectionalCards === "function") {
      window.renderMockAndSectionalCards();
    }
  };

  // 2. REGISTER CHAPTER-WISE QUESTIONS (Auto-routes to exact chapterId!)
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

  // 5. REGISTER LIVE DAILY QUIZ QUESTIONS (GS 15 Qs / Bio 25 Qs)
  window.registerDailyQuiz = function (dailyObj) {
    if (dailyObj.gs && dailyObj.gs.length) {
      window.CUSTOM_DAILY_QUIZ.gs = parseTuples(dailyObj.gs, "daily_gs");
    }
    if (dailyObj.bio && dailyObj.bio.length) {
      window.CUSTOM_DAILY_QUIZ.bio = parseTuples(dailyObj.bio, "daily_bio");
    }
  };

  // OVERRIDE: RENDER MOCK CARDS SEQUENTIALLY (1 -> 2 -> 3 -> 4...)
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

  // OVERRIDE: START TEST ENGINE WITH PAID/OWNER SECURITY
  window.startTest = function (testKey) {
    // 1. Check Registered Full Mock Tests (Mock 1, 2, 3, 4...)
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

    // 2. Daily Quizzes & Sectional Tests
    const allQs = getAllQuestions();
    const gsPool = allQs.filter(q => q.section === "gs");
    const zooPool = allQs.filter(q => q.section === "zoo");
    const botPool = allQs.filter(q => q.section === "bot");

    if (testKey === "daily_gs") {
      const qs = window.CUSTOM_DAILY_QUIZ.gs || gsPool.slice(0, 15);
      launchQuiz("🔥 Daily GS & Current Affairs Speed Quiz (15 Qs / 10 Mins)", qs, 10 * 60, "daily_gs");
    } else if (testKey === "daily_bio") {
      const qs = window.CUSTOM_DAILY_QUIZ.bio || [...zooPool.slice(0, 13), ...botPool.slice(0, 12)];
      launchQuiz("🧬 Daily TGT Biology Booster Quiz (25 Qs / 20 Mins)", qs, 20 * 60, "daily_bio");
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

  // OVERRIDE: PRINT ANY MOCK TEST PAPER WITH COPYRIGHT WATERMARK
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

  // DYNAMIC SCRIPT LOADER FOR site_config.js AND ALL DATA FILES
  window.loadSiteFiles = function (fileList) {
    (fileList || []).forEach(file => {
      const s = document.createElement("script");
      s.src = `${file}?v=${CACHE_BUST}`;
      s.async = false;
      document.body.appendChild(s);
    });
  };

  // Auto-load site_config.js
  window.loadSiteFiles(["site_config.js"]);
})();
