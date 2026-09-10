/**
 * Deal Desk — brand deal pipeline for independent creators
 * Static MVP: paste intake, pipeline, deliverables, payments, rights reminders
 */

(function () {
  "use strict";

  const STORAGE_KEY = "deal-desk-v1";
  const SEED_FLAG = "deal-desk-seeded";

  const STATUS_LABELS = {
    inquiry: "Inquiry",
    agreed: "Agreed",
    in_progress: "In progress",
    delivered: "Delivered",
    paid: "Paid",
  };

  const PAY_LABELS = {
    unpaid: "Unpaid",
    partial: "Partial",
    paid: "Paid",
  };

  // ——— State ———
  let deals = [];
  let filterStatus = "all";
  let searchQuery = "";
  let editingId = null;

  // ——— DOM refs ———
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => [...document.querySelectorAll(sel)];

  const dealList = $("#deal-list");
  const emptyPipeline = $("#empty-pipeline");
  const remindersList = $("#reminders-list");
  const emptyReminders = $("#empty-reminders");
  const reminderBadge = $("#reminder-badge");
  const drawer = $("#deal-drawer");
  const backdrop = $("#drawer-backdrop");
  const toastEl = $("#toast");
  const form = $("#deal-form");
  const deliverablesEditor = $("#deliverables-editor");

  // ——— Utils ———
  function uid() {
    return "d_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  }

  function todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

  function addDays(iso, days) {
    const d = new Date(iso + "T12:00:00");
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }

  function formatMoney(n) {
    if (n == null || n === "" || isNaN(Number(n))) return "—";
    return "$" + Number(n).toLocaleString("en-US", { maximumFractionDigits: 0 });
  }

  function formatDate(iso) {
    if (!iso) return "—";
    const d = new Date(iso + "T12:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  function daysUntil(iso) {
    if (!iso) return null;
    const end = new Date(iso + "T12:00:00");
    const now = new Date();
    now.setHours(12, 0, 0, 0);
    return Math.round((end - now) / 86400000);
  }

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => {
      toastEl.hidden = true;
    }, 2800);
  }

  // ——— Persistence ———
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      deals = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(deals)) deals = [];
    } catch {
      deals = [];
    }
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(deals));
  }

  function seedIfNeeded() {
    if (localStorage.getItem(SEED_FLAG)) return;
    if (deals.length > 0) {
      localStorage.setItem(SEED_FLAG, "1");
      return;
    }

    const t = todayISO();
    deals = [
      {
        id: uid(),
        brand: "Acme Snacks",
        status: "in_progress",
        fee: 2500,
        paymentStatus: "unpaid",
        paymentDue: addDays(t, 20),
        rightsText: "6 months from publish",
        rightsStart: t,
        rightsEnd: addDays(t, 180),
        notes: "Contact: jordan@acmesnacks.com — YouTube + 2 IG stories",
        deliverables: [
          { id: uid(), title: "YouTube sponsored video", due: addDays(t, 10), done: false },
          { id: uid(), title: "Instagram story #1", due: addDays(t, 12), done: false },
          { id: uid(), title: "Instagram story #2", due: addDays(t, 14), done: false },
        ],
        createdAt: t,
        updatedAt: t,
      },
      {
        id: uid(),
        brand: "Nova Softwear",
        status: "delivered",
        fee: 1800,
        paymentStatus: "partial",
        paymentDue: addDays(t, -5),
        rightsText: "90 days organic use",
        rightsStart: addDays(t, -30),
        rightsEnd: addDays(t, 60),
        notes: "TikTok series — 50% deposit received",
        deliverables: [
          { id: uid(), title: "TikTok video 1", due: addDays(t, -20), done: true },
          { id: uid(), title: "TikTok video 2", due: addDays(t, -10), done: true },
          { id: uid(), title: "Usage link report", due: addDays(t, -5), done: true },
        ],
        createdAt: addDays(t, -45),
        updatedAt: t,
      },
      {
        id: uid(),
        brand: "GreenLeaf Tea",
        status: "agreed",
        fee: 900,
        paymentStatus: "unpaid",
        paymentDue: addDays(t, 45),
        rightsText: "Perpetual for organic; paid ads 30 days",
        rightsStart: addDays(t, 14),
        rightsEnd: addDays(t, 44),
        notes: "Newsletter sponsorship + Instagram reel",
        deliverables: [
          { id: uid(), title: "Newsletter mention", due: addDays(t, 14), done: false },
          { id: uid(), title: "Instagram reel", due: addDays(t, 18), done: false },
        ],
        createdAt: addDays(t, -7),
        updatedAt: t,
      },
      {
        id: uid(),
        brand: "Pulse Fitness",
        status: "paid",
        fee: 3200,
        paymentStatus: "paid",
        paymentDue: addDays(t, -40),
        rightsText: "12 months from publish",
        rightsStart: addDays(t, -90),
        rightsEnd: addDays(t, -5),
        notes: "Rights window expired — follow up on renewal",
        deliverables: [
          { id: uid(), title: "YouTube integration", due: addDays(t, -80), done: true },
          { id: uid(), title: "3 Shorts", due: addDays(t, -70), done: true },
        ],
        createdAt: addDays(t, -100),
        updatedAt: addDays(t, -30),
      },
      {
        id: uid(),
        brand: "ByteBooks",
        status: "inquiry",
        fee: 1200,
        paymentStatus: "unpaid",
        paymentDue: "",
        rightsText: "",
        rightsStart: "",
        rightsEnd: "",
        notes: "Initial outreach via Instagram DM — waiting on brief",
        deliverables: [],
        createdAt: t,
        updatedAt: t,
      },
    ];
    save();
    localStorage.setItem(SEED_FLAG, "1");
  }

  // ——— Paste parser ———
  function parseIntake(text) {
    const raw = (text || "").trim();
    const lower = raw.toLowerCase();
    const result = {
      brand: "",
      fee: null,
      paymentStatus: "unpaid",
      paymentDue: "",
      rightsText: "",
      rightsStart: "",
      rightsEnd: "",
      notes: raw.slice(0, 500),
      status: "inquiry",
      deliverables: [],
    };

    // Brand: "from X", "X wants", "partner with X", "X is interested", company-like Title Case near start
    const brandPatterns = [
      /(?:from|re:|regarding)\s+([A-Z][A-Za-z0-9&'.\-\s]{1,40}?)(?:\s+(?:wants|would|is|team|here|looking)|[,\n.!])/m,
      /([A-Z][A-Za-z0-9&'.\-]{1,30}(?:\s+[A-Z][A-Za-z0-9&'.\-]{1,20}){0,3})\s+(?:wants|would like|is interested|looking to|hoping to|reached out)/i,
      /(?:partner(?:ship)?(?:\s+with)?|collab(?:oration)?(?:\s+with)?|deal with)\s+([A-Z][A-Za-z0-9&'.\-\s]{1,40}?)(?:[,\n.!|]|$)/m,
      /brand[:\s]+([A-Za-z0-9&'.\-\s]{2,40})/i,
      /company[:\s]+([A-Za-z0-9&'.\-\s]{2,40})/i,
    ];
    for (const p of brandPatterns) {
      const m = raw.match(p);
      if (m && m[1]) {
        result.brand = m[1].trim().replace(/[.,;:]+$/, "");
        break;
      }
    }
    if (!result.brand) {
      // First Title-Case phrase that isn't a greeting
      const lines = raw.split(/\n/).map((l) => l.trim()).filter(Boolean);
      for (const line of lines.slice(0, 5)) {
        if (/^(hi|hey|hello|dear|thanks|thank)/i.test(line)) continue;
        const tm = line.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})\b/);
        if (tm) {
          result.brand = tm[1];
          break;
        }
      }
    }

    // Fee / budget
    const feePatterns = [
      /(?:fee|budget|rate|pay(?:ment)?|offer(?:ing)?|compensation|price)[:\s]*\$?\s*([\d,]+(?:\.\d{1,2})?)\s*k?\b/i,
      /\$\s*([\d,]+(?:\.\d{1,2})?)\s*k?\b/,
      /([\d,]+(?:\.\d{1,2})?)\s*(?:usd|dollars)\b/i,
    ];
    for (const p of feePatterns) {
      const m = raw.match(p);
      if (m) {
        let n = parseFloat(m[1].replace(/,/g, ""));
        if (/k\b/i.test(m[0]) || (lower.includes(m[1] + "k") && n < 100)) n *= 1000;
        // Heuristic: if matched bare $X and "k" nearby
        if (/\bk\b/i.test(m[0])) n = parseFloat(m[1].replace(/,/g, "")) * 1000;
        result.fee = n;
        break;
      }
    }
    // Explicit "2.5k" style
    const kMatch = raw.match(/\$?\s*([\d.]+)\s*k\b/i);
    if (kMatch && (result.fee == null || result.fee < 100)) {
      result.fee = parseFloat(kMatch[1]) * 1000;
    }

    // Payment terms → due date
    const netM = lower.match(/net\s*(\d+)/);
    if (netM) {
      result.paymentDue = addDays(todayISO(), parseInt(netM[1], 10));
    }
    const payDueM = raw.match(/(?:payment\s+due|due\s+(?:by|on)|invoice\s+by)[:\s]*([A-Za-z]+\s+\d{1,2},?\s*\d{4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}-\d{2}-\d{2})/i);
    if (payDueM) {
      const parsed = parseFlexibleDate(payDueM[1]);
      if (parsed) result.paymentDue = parsed;
    }

    // Usage rights text + duration
    const rightsM = raw.match(/(?:usage\s+rights?|rights?\s+window|licensing|license)[:\s]+([^\n.]+)/i);
    if (rightsM) {
      result.rightsText = rightsM[1].trim().slice(0, 120);
    } else if (/perpetual/i.test(raw)) {
      result.rightsText = "Perpetual";
    }

    const monthsM = raw.match(/(\d+)\s*months?(?:\s+(?:from|of|after))?\s*(?:publish|posting|delivery|go[\s-]?live)?/i);
    const daysM = raw.match(/(\d+)\s*days?(?:\s+(?:from|of|after))?\s*(?:publish|posting|delivery)?/i);
    if (monthsM) {
      const months = parseInt(monthsM[1], 10);
      if (!result.rightsText) result.rightsText = months + " months from publish";
      result.rightsStart = todayISO();
      result.rightsEnd = addDays(todayISO(), months * 30);
    } else if (daysM && /rights|usage|license/i.test(raw)) {
      const days = parseInt(daysM[1], 10);
      if (!result.rightsText) result.rightsText = days + " days from publish";
      result.rightsStart = todayISO();
      result.rightsEnd = addDays(todayISO(), days);
    }

    // Deliverables
    const deliverableHints = [];
    const delPatterns = [
      /(\d+)\s*[x×]?\s*(youtube\s+videos?|yt\s+videos?|sponsored\s+videos?|videos?)/gi,
      /(\d+)\s*[x×]?\s*(instagram\s+stories|ig\s+stories|stories)/gi,
      /(\d+)\s*[x×]?\s*(instagram\s+reels?|ig\s+reels?|reels?)/gi,
      /(\d+)\s*[x×]?\s*(tiktoks?|tt\s+videos?)/gi,
      /(\d+)\s*[x×]?\s*(shorts?)/gi,
      /(\d+)\s*[x×]?\s*(newsletter\s+(?:mentions?|sponsorships?|features?))/gi,
      /(\d+)\s*[x×]?\s*(tweets?|x\s+posts?)/gi,
    ];
    for (const p of delPatterns) {
      let m;
      while ((m = p.exec(raw)) !== null) {
        const count = parseInt(m[1], 10);
        const kind = normalizeDeliverableKind(m[2]);
        for (let i = 0; i < Math.min(count, 8); i++) {
          deliverableHints.push(count > 1 ? `${kind} #${i + 1}` : kind);
        }
      }
    }
    // "YouTube video + 2 Instagram stories" without leading counts on first item
    if (!deliverableHints.length) {
      if (/youtube/i.test(raw)) deliverableHints.push("YouTube sponsored video");
      if (/instagram\s+stor/i.test(raw) || /\big\s+stor/i.test(raw)) {
        const n = (raw.match(/(\d+)\s*(?:instagram|ig)\s+stor/i) || [])[1];
        const c = n ? parseInt(n, 10) : 1;
        for (let i = 0; i < c; i++) deliverableHints.push(c > 1 ? `Instagram story #${i + 1}` : "Instagram story");
      }
      if (/instagram\s+reel|\breels?\b/i.test(raw) && !/stories/i.test(raw.split(/reel/i)[0].slice(-20))) {
        if (!deliverableHints.some((d) => /reel/i.test(d))) deliverableHints.push("Instagram reel");
      }
      if (/tiktok/i.test(raw)) deliverableHints.push("TikTok video");
      if (/newsletter/i.test(raw)) deliverableHints.push("Newsletter mention");
    }

    // Due date for deliverables
    let delDue = "";
    const dueM = raw.match(/(?:deliverables?\s+due|due\s+by|deadline|by)[:\s]*([A-Za-z]+\s+\d{1,2},?\s*\d{4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}-\d{2}-\d{2})/i);
    if (dueM) delDue = parseFlexibleDate(dueM[1]) || "";
    if (!delDue) {
      const byM = raw.match(/by\s+([A-Za-z]+\s+\d{1,2}(?:,?\s*\d{4})?)/i);
      if (byM) delDue = parseFlexibleDate(byM[1]) || "";
    }

    result.deliverables = deliverableHints.map((title, i) => ({
      id: uid(),
      title,
      due: delDue ? addDays(delDue, i) : "",
      done: false,
    }));

    if (/agreed|confirmed|we're\s+in|locked\s+in|contract\s+signed/i.test(raw)) {
      result.status = "agreed";
    } else if (/deliver|in\s+progress|filming|draft/i.test(raw)) {
      result.status = "in_progress";
    }

    return result;
  }

  function normalizeDeliverableKind(s) {
    const t = s.toLowerCase();
    if (/youtube|yt|sponsored\s+video|^videos?$/.test(t)) return "YouTube sponsored video";
    if (/stor/.test(t)) return "Instagram story";
    if (/reel/.test(t)) return "Instagram reel";
    if (/tiktok|tt\s/.test(t)) return "TikTok video";
    if (/short/.test(t)) return "YouTube Short";
    if (/newsletter/.test(t)) return "Newsletter mention";
    if (/tweet|x\s+post/.test(t)) return "X post";
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function parseFlexibleDate(str) {
    if (!str) return null;
    const cleaned = str.trim().replace(/,/g, "");
    // ISO
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) return cleaned;
    // M/D/YYYY
    const slash = cleaned.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
    if (slash) {
      let y = parseInt(slash[3], 10);
      if (y < 100) y += 2000;
      const m = String(parseInt(slash[1], 10)).padStart(2, "0");
      const d = String(parseInt(slash[2], 10)).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
    // Month name
    const d = new Date(cleaned);
    if (!isNaN(d.getTime())) {
      // If year missing, assume current or next
      let year = d.getFullYear();
      if (!/\d{4}/.test(cleaned)) {
        const now = new Date();
        year = now.getFullYear();
        d.setFullYear(year);
        if (d < now) d.setFullYear(year + 1);
      }
      return d.toISOString().slice(0, 10);
    }
    return null;
  }

  // ——— Rights helpers ———
  function rightsStatus(deal) {
    if (!deal.rightsEnd) return { kind: "none", label: "No expiry set" };
    const days = daysUntil(deal.rightsEnd);
    if (days < 0) return { kind: "expired", label: `Expired ${Math.abs(days)}d ago`, days };
    if (days <= 30) return { kind: "soon", label: `Expires in ${days}d`, days };
    return { kind: "ok", label: `Rights until ${formatDate(deal.rightsEnd)}`, days };
  }

  function deliverableProgress(deal) {
    const list = deal.deliverables || [];
    if (!list.length) return { done: 0, total: 0, pct: 0 };
    const done = list.filter((d) => d.done).length;
    return { done, total: list.length, pct: Math.round((done / list.length) * 100) };
  }

  // ——— Reminders ———
  function collectReminders() {
    const items = [];
    for (const deal of deals) {
      const rs = rightsStatus(deal);
      if (rs.kind === "expired" || rs.kind === "soon") {
        items.push({
          type: rs.kind === "expired" ? "expired" : "rights",
          sort: rs.days,
          deal,
          title: deal.brand,
          body:
            rs.kind === "expired"
              ? `Usage rights expired on ${formatDate(deal.rightsEnd)}. ${deal.rightsText || ""}`
              : `Usage rights expire on ${formatDate(deal.rightsEnd)} (${rs.days} days). ${deal.rightsText || ""}`,
        });
      }

      for (const del of deal.deliverables || []) {
        if (del.done || !del.due) continue;
        const days = daysUntil(del.due);
        if (days <= 7) {
          items.push({
            type: days < 0 ? "overdue" : "rights",
            sort: days,
            deal,
            title: `${deal.brand} — ${del.title}`,
            body:
              days < 0
                ? `Deliverable overdue by ${Math.abs(days)} day(s) (due ${formatDate(del.due)}).`
                : `Due in ${days} day(s) on ${formatDate(del.due)}.`,
          });
        }
      }

      if (deal.paymentStatus !== "paid" && deal.paymentDue) {
        const days = daysUntil(deal.paymentDue);
        if (days <= 14) {
          items.push({
            type: "payment",
            sort: days,
            deal,
            title: `${deal.brand} — payment`,
            body:
              days < 0
                ? `${formatMoney(deal.fee)} overdue since ${formatDate(deal.paymentDue)} (${PAY_LABELS[deal.paymentStatus]}).`
                : `${formatMoney(deal.fee)} due ${formatDate(deal.paymentDue)} (${days}d) — ${PAY_LABELS[deal.paymentStatus]}.`,
          });
        }
      }
    }
    items.sort((a, b) => a.sort - b.sort);
    return items;
  }

  function reminderEmail(item) {
    const deal = item.deal;
    let subject, body;
    if (item.type === "expired" || (item.type === "rights" && item.body.includes("Usage rights"))) {
      subject = `Usage rights follow-up — ${deal.brand}`;
      body = `Hi,\n\nChecking in on our partnership with ${deal.brand}.\n\nUsage rights window: ${deal.rightsText || "see agreement"}\nExpiry: ${formatDate(deal.rightsEnd)}\n\nI'd like to discuss renewal or takedown of branded assets.\n\nThanks!`;
    } else if (item.type === "payment") {
      subject = `Payment reminder — ${deal.brand} (${formatMoney(deal.fee)})`;
      body = `Hi,\n\nFriendly reminder that payment for our ${deal.brand} collaboration (${formatMoney(deal.fee)}) was due ${formatDate(deal.paymentDue)}.\n\nCurrent status: ${PAY_LABELS[deal.paymentStatus]}.\n\nPlease let me know the expected payment date or invoice status.\n\nThanks!`;
    } else {
      subject = `Deliverable update — ${deal.brand}`;
      body = `Hi,\n\nQuick update on deliverables for ${deal.brand}:\n\n${item.body}\n\nHappy to align on timing if needed.\n\nThanks!`;
    }
    return { subject, body };
  }

  // ——— Render pipeline ———
  function filteredDeals() {
    let list = [...deals];
    if (filterStatus !== "all") {
      list = list.filter((d) => d.status === filterStatus);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (d) =>
          (d.brand || "").toLowerCase().includes(q) ||
          (d.notes || "").toLowerCase().includes(q) ||
          (d.rightsText || "").toLowerCase().includes(q)
      );
    }
    const order = { inquiry: 0, agreed: 1, in_progress: 2, delivered: 3, paid: 4 };
    list.sort((a, b) => {
      const sa = order[a.status] ?? 9;
      const sb = order[b.status] ?? 9;
      if (sa !== sb) return sa - sb;
      return (b.updatedAt || "").localeCompare(a.updatedAt || "");
    });
    return list;
  }

  function renderPipeline() {
    const list = filteredDeals();
    dealList.innerHTML = "";
    emptyPipeline.hidden = list.length > 0;

    for (const deal of list) {
      const prog = deliverableProgress(deal);
      const rs = rightsStatus(deal);
      const card = document.createElement("article");
      card.className = "deal-card";
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      card.dataset.id = deal.id;

      card.innerHTML = `
        <div class="deal-card-top">
          <h3 class="deal-brand">${escapeHtml(deal.brand || "Untitled")}</h3>
          <span class="deal-fee">${formatMoney(deal.fee)}</span>
        </div>
        <div class="deal-meta">
          <span class="chip chip-${deal.status}">${STATUS_LABELS[deal.status] || deal.status}</span>
          <span class="chip chip-pay-${deal.paymentStatus}">${PAY_LABELS[deal.paymentStatus] || deal.paymentStatus}</span>
          <span class="chip chip-rights-${rs.kind}">${escapeHtml(rs.label)}</span>
        </div>
        ${
          prog.total
            ? `<div class="deal-progress">
                <div class="progress-label"><span>Deliverables</span><span>${prog.done}/${prog.total}</span></div>
                <div class="progress-bar"><div class="progress-fill" style="width:${prog.pct}%"></div></div>
              </div>`
            : `<div class="deal-dates">No deliverables yet</div>`
        }
        ${
          deal.paymentDue
            ? `<div class="deal-dates">Payment due ${formatDate(deal.paymentDue)}</div>`
            : ""
        }
      `;

      card.addEventListener("click", () => openDrawer(deal.id));
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openDrawer(deal.id);
        }
      });
      dealList.appendChild(card);
    }
  }

  function renderReminders() {
    const items = collectReminders();
    remindersList.innerHTML = "";
    emptyReminders.hidden = items.length > 0;

    if (items.length) {
      reminderBadge.hidden = false;
      reminderBadge.textContent = String(items.length);
    } else {
      reminderBadge.hidden = true;
    }

    for (const item of items) {
      const card = document.createElement("div");
      card.className = `reminder-card ${item.type}`;
      const typeLabel =
        item.type === "expired"
          ? "Rights expired"
          : item.type === "overdue"
            ? "Overdue deliverable"
            : item.type === "payment"
              ? "Payment"
              : "Upcoming";

      card.innerHTML = `
        <div class="reminder-type">${typeLabel}</div>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.body)}</p>
        <div class="reminder-actions">
          <button type="button" class="btn btn-sm btn-primary" data-act="copy">Copy email</button>
          <a class="btn btn-sm btn-ghost" data-act="mailto">Open mailto</a>
          <button type="button" class="btn btn-sm btn-ghost" data-act="open">Open deal</button>
        </div>
      `;

      const email = reminderEmail(item);
      const mailto = card.querySelector('[data-act="mailto"]');
      mailto.href = `mailto:?subject=${encodeURIComponent(email.subject)}&body=${encodeURIComponent(email.body)}`;

      card.querySelector('[data-act="copy"]').addEventListener("click", async () => {
        const text = `Subject: ${email.subject}\n\n${email.body}`;
        try {
          await navigator.clipboard.writeText(text);
          toast("Reminder email copied");
        } catch {
          // Fallback
          const ta = document.createElement("textarea");
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          ta.remove();
          toast("Reminder email copied");
        }
      });

      card.querySelector('[data-act="open"]').addEventListener("click", () => {
        openDrawer(item.deal.id);
      });

      remindersList.appendChild(card);
    }
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderAll() {
    renderPipeline();
    renderReminders();
  }

  // ——— Drawer / form ———
  function openDrawer(id) {
    editingId = id || null;
    const deal = id ? deals.find((d) => d.id === id) : null;
    $("#drawer-title").textContent = deal ? deal.brand || "Edit deal" : "New deal";
    $("#btn-delete-deal").hidden = !deal;

    $("#deal-id").value = deal ? deal.id : "";
    $("#f-brand").value = deal ? deal.brand || "" : "";
    $("#f-status").value = deal ? deal.status || "inquiry" : "inquiry";
    $("#f-fee").value = deal && deal.fee != null ? deal.fee : "";
    $("#f-payment-status").value = deal ? deal.paymentStatus || "unpaid" : "unpaid";
    $("#f-payment-due").value = deal ? deal.paymentDue || "" : "";
    $("#f-rights-text").value = deal ? deal.rightsText || "" : "";
    $("#f-rights-start").value = deal ? deal.rightsStart || "" : "";
    $("#f-rights-end").value = deal ? deal.rightsEnd || "" : "";
    $("#f-notes").value = deal ? deal.notes || "" : "";

    renderDeliverablesEditor(deal ? deal.deliverables || [] : []);

    drawer.hidden = false;
    backdrop.hidden = false;
    document.body.style.overflow = "hidden";
    $("#f-brand").focus();
  }

  function closeDrawer() {
    drawer.hidden = true;
    backdrop.hidden = true;
    document.body.style.overflow = "";
    editingId = null;
  }

  function renderDeliverablesEditor(list) {
    deliverablesEditor.innerHTML = "";
    if (!list.length) {
      addDeliverableRow({ id: uid(), title: "", due: "", done: false });
      return;
    }
    for (const d of list) addDeliverableRow(d);
  }

  function addDeliverableRow(d) {
    const row = document.createElement("div");
    row.className = "deliverable-row";
    row.dataset.id = d.id || uid();
    row.innerHTML = `
      <input type="checkbox" ${d.done ? "checked" : ""} title="Done" aria-label="Done" />
      <input type="text" placeholder="Deliverable" value="${escapeHtml(d.title || "")}" />
      <input type="date" value="${d.due || ""}" title="Due date" />
      <button type="button" class="del-btn" aria-label="Remove">×</button>
    `;
    row.querySelector(".del-btn").addEventListener("click", () => {
      row.remove();
      if (!deliverablesEditor.children.length) {
        addDeliverableRow({ id: uid(), title: "", due: "", done: false });
      }
    });
    deliverablesEditor.appendChild(row);
  }

  function readDeliverablesFromEditor() {
    return [...deliverablesEditor.querySelectorAll(".deliverable-row")]
      .map((row) => {
        const title = row.querySelector('input[type="text"]').value.trim();
        return {
          id: row.dataset.id || uid(),
          title,
          due: row.querySelector('input[type="date"]').value || "",
          done: row.querySelector('input[type="checkbox"]').checked,
        };
      })
      .filter((d) => d.title);
  }

  function readFormDeal() {
    const id = $("#deal-id").value || uid();
    const existing = deals.find((d) => d.id === id);
    return {
      id,
      brand: $("#f-brand").value.trim(),
      status: $("#f-status").value,
      fee: $("#f-fee").value === "" ? null : parseFloat($("#f-fee").value),
      paymentStatus: $("#f-payment-status").value,
      paymentDue: $("#f-payment-due").value,
      rightsText: $("#f-rights-text").value.trim(),
      rightsStart: $("#f-rights-start").value,
      rightsEnd: $("#f-rights-end").value,
      notes: $("#f-notes").value.trim(),
      deliverables: readDeliverablesFromEditor(),
      createdAt: existing ? existing.createdAt : todayISO(),
      updatedAt: todayISO(),
    };
  }

  function upsertDeal(deal) {
    const idx = deals.findIndex((d) => d.id === deal.id);
    if (idx >= 0) deals[idx] = deal;
    else deals.unshift(deal);
    save();
    renderAll();
  }

  function deleteDeal(id) {
    deals = deals.filter((d) => d.id !== id);
    save();
    renderAll();
  }

  // ——— Views / tabs ———
  function showView(name) {
    $$(".tab").forEach((t) => {
      const on = t.dataset.view === name;
      t.classList.toggle("active", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
    });
    $$(".view").forEach((v) => {
      const on = v.id === "view-" + name;
      v.classList.toggle("active", on);
      v.hidden = !on;
    });
  }

  // ——— Export ———
  function exportDeals() {
    const blob = new Blob([JSON.stringify(deals, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `deal-desk-export-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast("Exported JSON");
  }

  // ——— Events ———
  function bindEvents() {
    $$(".tab").forEach((t) => {
      t.addEventListener("click", () => showView(t.dataset.view));
    });

    $$("#status-pills .pill").forEach((p) => {
      p.addEventListener("click", () => {
        $$("#status-pills .pill").forEach((x) => x.classList.remove("active"));
        p.classList.add("active");
        filterStatus = p.dataset.status;
        renderPipeline();
      });
    });

    $("#search-deals").addEventListener("input", (e) => {
      searchQuery = e.target.value.trim();
      renderPipeline();
    });

    $("#btn-new-deal").addEventListener("click", () => openDrawer(null));
    $("#btn-close-drawer").addEventListener("click", closeDrawer);
    $("#btn-cancel-deal").addEventListener("click", closeDrawer);
    backdrop.addEventListener("click", closeDrawer);

    $("#btn-add-deliverable").addEventListener("click", () => {
      addDeliverableRow({ id: uid(), title: "", due: "", done: false });
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const deal = readFormDeal();
      if (!deal.brand) {
        toast("Brand name is required");
        return;
      }
      upsertDeal(deal);
      closeDrawer();
      toast(editingId ? "Deal updated" : "Deal saved");
      showView("pipeline");
    });

    $("#btn-delete-deal").addEventListener("click", () => {
      const id = $("#deal-id").value;
      if (!id) return;
      if (confirm("Delete this deal? This cannot be undone.")) {
        deleteDeal(id);
        closeDrawer();
        toast("Deal deleted");
      }
    });

    $("#btn-parse").addEventListener("click", () => {
      const text = $("#intake-text").value;
      if (!text.trim()) {
        toast("Paste an email or DM first");
        return;
      }
      const parsed = parseIntake(text);
      // Open as new deal prefilled
      editingId = null;
      $("#drawer-title").textContent = "Review parsed deal";
      $("#btn-delete-deal").hidden = true;
      $("#deal-id").value = "";
      $("#f-brand").value = parsed.brand || "";
      $("#f-status").value = parsed.status || "inquiry";
      $("#f-fee").value = parsed.fee != null ? parsed.fee : "";
      $("#f-payment-status").value = parsed.paymentStatus || "unpaid";
      $("#f-payment-due").value = parsed.paymentDue || "";
      $("#f-rights-text").value = parsed.rightsText || "";
      $("#f-rights-start").value = parsed.rightsStart || "";
      $("#f-rights-end").value = parsed.rightsEnd || "";
      $("#f-notes").value = parsed.notes || "";
      renderDeliverablesEditor(parsed.deliverables || []);
      drawer.hidden = false;
      backdrop.hidden = false;
      document.body.style.overflow = "hidden";
      toast(parsed.brand ? `Parsed: ${parsed.brand}` : "Parsed — fill in brand name");
      $("#f-brand").focus();
    });

    $("#btn-clear-intake").addEventListener("click", () => {
      $("#intake-text").value = "";
    });

    $("#btn-export").addEventListener("click", exportDeals);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !drawer.hidden) closeDrawer();
    });
  }

  // ——— Init ———
  function init() {
    load();
    seedIfNeeded();
    bindEvents();
    renderAll();
  }

  init();
})();
