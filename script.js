// ===== НАСТРОЙКИ =====
// Дата и время праздника (год, месяц 1–12, день, часы, минуты)
const EVENT_DATE = new Date(2026, 12 - 1, 19, 18, 0);

const MONTHS = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль",
                "Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];


// ===== БЛОК 1: конверт + музыка =====

const startScreen = document.getElementById("startScreen");
const envelope    = document.getElementById("envelope");
const openSiteBtn = document.getElementById("openSiteBtn");
const siteContent = document.getElementById("siteContent");
const bgMusic     = document.getElementById("bgMusic");
const musicBtn    = document.getElementById("musicBtn");

if (openSiteBtn) {
  openSiteBtn.addEventListener("click", () => {
    envelope.classList.add("open");

    // музыка стартует сразу по нажатию (иначе телефон не разрешит)
    if (bgMusic) {
      bgMusic.play()
        .then(() => musicBtn.classList.add("show"))
        .catch(() => {}); // нет файла music.mp3 — просто без музыки
    }

    setTimeout(() => {
      siteContent.classList.add("show");
      window.scrollTo(0, 0);
      startScreen.classList.add("hide");
      startReveal();
      confettiBurst(140);
    }, 1500);
  });
}

if (musicBtn && bgMusic) {
  musicBtn.addEventListener("click", () => {
    if (bgMusic.paused) { bgMusic.play(); musicBtn.classList.remove("muted"); }
    else                { bgMusic.pause(); musicBtn.classList.add("muted"); }
  });
}


// ===== Появление элементов при прокрутке =====

function startReveal() {
  const items = document.querySelectorAll(".reveal");

  if (!("IntersectionObserver" in window)) {
    items.forEach(el => el.classList.add("show"));
    return;
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("show");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  items.forEach(el => observer.observe(el));

  // конфетти, когда долистали до финала
  const finale = document.querySelector(".finale");
  if (finale) {
    const fo = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) { confettiBurst(90); fo.disconnect(); }
    }, { threshold: 0.5 });
    fo.observe(finale);
  }
}


// ===== БЛОК 4: календарь =====

(function buildCalendar() {
  const cal = document.getElementById("calendar");
  const title = document.getElementById("calTitle");
  if (!cal) return;

  const y = EVENT_DATE.getFullYear();
  const m = EVENT_DATE.getMonth();
  title.textContent = `${MONTHS[m]} ${y}`;

  ["пн","вт","ср","чт","пт","сб","вс"].forEach(d => {
    cal.insertAdjacentHTML("beforeend", `<div class="dow">${d}</div>`);
  });

  const firstDow = (new Date(y, m, 1).getDay() + 6) % 7; // пн = 0
  const daysInMonth = new Date(y, m + 1, 0).getDate();

  for (let i = 0; i < firstDow; i++) cal.insertAdjacentHTML("beforeend", "<div></div>");

  for (let d = 1; d <= daysInMonth; d++) {
    const dow = (firstDow + d - 1) % 7;
    const cls = ["day"];
    if (dow >= 5) cls.push("weekend");
    if (d === EVENT_DATE.getDate()) cls.push("target");
    cal.insertAdjacentHTML("beforeend", `<div class="${cls.join(" ")}">${d}</div>`);
  }
})();


// ===== БЛОК 4: таймер =====

(function countdown() {
  const els = ["days", "hours", "minutes", "seconds"].map(id => document.getElementById(id));
  if (els.some(e => !e)) return;
  const pad = n => String(n).padStart(2, "0");

  function tick() {
    let diff = Math.max(0, EVENT_DATE - new Date());
    const s = Math.floor(diff / 1000);
    const vals = [Math.floor(s / 86400), Math.floor(s / 3600) % 24, Math.floor(s / 60) % 60, s % 60];
    vals.forEach((v, i) => { els[i].textContent = pad(v); });
  }

  tick();
  setInterval(tick, 1000);
})();


// ===== БЛОК 9: анкета (Web3Forms) =====

const rsvpForm = document.getElementById("rsvpForm");
const rsvpStatus = document.getElementById("rsvpStatus");

if (rsvpForm) {
  rsvpForm.addEventListener("submit", async e => {
    e.preventDefault();
    const btn = rsvpForm.querySelector("button[type=submit]");

    // несколько напитков → одной строкой
    const fd = new FormData(rsvpForm);
    const drinks = fd.getAll("drinks");
    fd.delete("drinks");
    fd.append("drinks", drinks.length ? drinks.join(", ") : "—");

    btn.disabled = true;
    rsvpStatus.className = "rsvp-status";
    rsvpStatus.textContent = "Отправляем…";

    try {
      const res = await fetch(rsvpForm.action, {
        method: "POST",
        body: fd,
        headers: { "Accept": "application/json" }
      });

      if (res.ok) {
        const coming = fd.get("attendance") !== "Не смогу";
        rsvpForm.reset();
        rsvpStatus.className = "rsvp-status ok";
        rsvpStatus.textContent = coming ? "Ура! Жду тебя ♥" : "Спасибо, что ответил(а)! Буду скучать ♥";
        if (coming) confettiBurst(120);
      } else {
        throw new Error("bad status");
      }
    } catch (err) {
      rsvpStatus.className = "rsvp-status err";
      rsvpStatus.textContent = "Не получилось отправить. Попробуй ещё раз.";
    } finally {
      btn.disabled = false;
    }
  });
}


// ===== Конфетти =====

const canvas = document.getElementById("confetti");
const ctx = canvas ? canvas.getContext("2d") : null;
const COLORS = ["#c9a45c", "#e8cf8f", "#6d2e46", "#b36b82", "#f3e7da"];
let pieces = [];
let running = false;

function resizeCanvas() {
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
addEventListener("resize", resizeCanvas);
resizeCanvas();

function confettiBurst(count) {
  if (!ctx || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  for (let i = 0; i < count; i++) {
    pieces.push({
      x: innerWidth / 2 + (Math.random() - .5) * 80,
      y: innerHeight * .35,
      vx: (Math.random() - .5) * 12,
      vy: -Math.random() * 12 - 4,
      w: 6 + Math.random() * 6,
      h: 8 + Math.random() * 8,
      r: Math.random() * Math.PI,
      vr: (Math.random() - .5) * .3,
      c: COLORS[Math.floor(Math.random() * COLORS.length)],
      life: 0
    });
  }
  if (!running) { running = true; requestAnimationFrame(draw); }
}

function draw() {
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  pieces.forEach(p => {
    p.vy += .25;
    p.vx *= .99;
    p.x += p.vx;
    p.y += p.vy;
    p.r += p.vr;
    p.life++;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.r);
    ctx.scale(1, Math.cos(p.life * .1));
    ctx.fillStyle = p.c;
    ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    ctx.restore();
  });
  pieces = pieces.filter(p => p.y < innerHeight + 40);
  if (pieces.length) requestAnimationFrame(draw);
  else { running = false; ctx.clearRect(0, 0, innerWidth, innerHeight); }
}
