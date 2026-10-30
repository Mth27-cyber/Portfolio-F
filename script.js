// Smooth-scroll for every button/link with a data-target attribute.
// Example: <button class="b2" data-target="about">About</button>
// scrolls to <div id="about">.

// ---- SITE CONFIG: set these once ----
const EMAIL = 'your-email@example.com';
const LINKEDIN_URL = '';
// -------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-target]').forEach((el) => {
    el.addEventListener('click', () => {
      const target = document.getElementById(el.dataset.target);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  loadLeetCodeStats();
  loadCodeforcesStats();
  setupContactForm();
  setupContactLinks();
  setupNavHighlight();
  setupReveal();
});

// =================================================================
// Competitive Programming — LeetCode
// Uses a community LeetCode API (no key needed) to pull real
// easy/medium/hard solved counts and draw them into the donut.
// Set LEETCODE_USERNAME below to your real handle to go live.
// =================================================================
const LEETCODE_USERNAME = 'your-leetcode-username';

async function loadLeetCodeStats() {
  const handleBadge = document.getElementById('lcHandleBadge');
  const profileLink = document.getElementById('lcProfileLink');
  const donut = document.getElementById('lcDonut');
  const totalEl = document.getElementById('lcTotal');
  const easyEl = document.getElementById('lcEasy');
  const mediumEl = document.getElementById('lcMedium');
  const hardEl = document.getElementById('lcHard');
  if (!donut) return;

  if (handleBadge) handleBadge.textContent = `@${LEETCODE_USERNAME}`;
  if (profileLink) profileLink.href = `https://leetcode.com/${LEETCODE_USERNAME}`;

  if (!LEETCODE_USERNAME || LEETCODE_USERNAME === 'your-leetcode-username') {
    showLeetCodeFallback();
    return;
  }

  try {
    const res = await fetch(`https://alfa-leetcode-api.onrender.com/${LEETCODE_USERNAME}/solved`, { signal: AbortSignal.timeout(8000) });
    const data = await res.json();
    if (!data || typeof data.solvedProblem !== 'number') throw new Error('No data');

    const easy = data.easySolved ?? 0;
    const medium = data.mediumSolved ?? 0;
    const hard = data.hardSolved ?? 0;
    const total = data.solvedProblem ?? (easy + medium + hard);

    const easyPct = total ? (easy / total) * 100 : 0;
    const mediumPct = total ? ((easy + medium) / total) * 100 : 0;

    donut.style.setProperty('--easy-pct', `${easyPct}%`);
    donut.style.setProperty('--medium-pct', `${mediumPct}%`);

    totalEl.textContent = total;
    easyEl.textContent = easy;
    mediumEl.textContent = medium;
    hardEl.textContent = hard;
  } catch (err) {
    showLeetCodeFallback();
  }
}

// =================================================================
// Competitive Programming — Codeforces
// Uses the official public Codeforces API (no key needed) to pull
// rank, active days, and current submission streak.
// Set CODEFORCES_HANDLE below to your real handle to go live.
// =================================================================
const CODEFORCES_HANDLE = 'your-codeforces-handle';

// Standard Codeforces rank -> color mapping.
function codeforcesRankColor(rank) {
  const r = (rank || '').toLowerCase();
  if (r.includes('legendary')) return '#000000';
  if (r.includes('international grandmaster')) return '#ff0000';
  if (r.includes('grandmaster')) return '#ff0000';
  if (r.includes('international master')) return '#ff8c00';
  if (r.includes('master')) return '#ff8c00';
  if (r.includes('candidate master')) return '#aa00aa';
  if (r.includes('expert')) return '#5b8def';
  if (r.includes('specialist')) return '#03a89e';
  if (r.includes('pupil')) return '#34d399';
  return '#9ca3af'; // newbie / unrated
}

async function loadCodeforcesStats() {
  const handleBadge = document.getElementById('cfHandleBadge');
  const profileLink = document.getElementById('cfProfileLink');
  const rankEl = document.getElementById('cfRank');
  const activeDaysEl = document.getElementById('cfActiveDays');
  const streakEl = document.getElementById('cfStreak');
  if (!rankEl) return;

  if (handleBadge) handleBadge.textContent = `@${CODEFORCES_HANDLE}`;
  if (profileLink) profileLink.href = `https://codeforces.com/profile/${CODEFORCES_HANDLE}`;

  if (!CODEFORCES_HANDLE || CODEFORCES_HANDLE === 'your-codeforces-handle') {
    hideCodeforcesCard();
    return;
  }

  try {
    const infoRes = await fetch(`https://codeforces.com/api/user.info?handles=${encodeURIComponent(CODEFORCES_HANDLE)}`);
    const infoData = await infoRes.json();
    if (infoData.status !== 'OK' || !infoData.result?.[0]) throw new Error('User not found');
    const user = infoData.result[0];

    rankEl.textContent = user.rank ? capitalize(user.rank) : 'Unrated';
    rankEl.style.color = codeforcesRankColor(user.rank);

    const statusRes = await fetch(`https://codeforces.com/api/user.status?handle=${encodeURIComponent(CODEFORCES_HANDLE)}&from=1&count=10000`);
    const statusData = await statusRes.json();
    if (statusData.status !== 'OK') throw new Error('No submissions');

    const dayKeys = new Set(
      statusData.result.map((sub) => {
        const d = new Date(sub.creationTimeSeconds * 1000);
        return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
      })
    );

    activeDaysEl.textContent = `${dayKeys.size} Days`;
    streakEl.textContent = `${currentStreak(dayKeys)} Days`;
  } catch (err) {
    hideCodeforcesCard();
  }
}

// Walks backward day-by-day from today counting a consecutive streak
// of days that appear in the given set of "YYYY-M-D" keys.
function currentStreak(dayKeysSet) {
  let streak = 0;
  const cursor = new Date();
  // If nothing submitted today yet, still allow yesterday to start the streak.
  const todayKey = `${cursor.getUTCFullYear()}-${cursor.getUTCMonth()}-${cursor.getUTCDate()}`;
  if (!dayKeysSet.has(todayKey)) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  while (true) {
    const key = `${cursor.getUTCFullYear()}-${cursor.getUTCMonth()}-${cursor.getUTCDate()}`;
    if (!dayKeysSet.has(key)) break;
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ---------------------------------------------------------------
// Contact form: submits via FormSubmit's AJAX endpoint so the
// visitor never leaves the page. Set your real email in the
// form's "action" attribute in index.html for this to send mail.
// ---------------------------------------------------------------
function setupContactForm() {
  const form = document.getElementById('contactForm');
  const note = document.getElementById('formNote');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalLabel = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    note.textContent = '';
    note.style.color = '#34d399';

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form),
      });

      if (response.ok) {
        note.textContent = "Thanks! Your message has been sent — I'll get back to you soon.";
        form.reset();
      } else {
        throw new Error('Request failed');
      }
    } catch (err) {
      note.style.color = '#f87171';
      note.textContent = 'Something went wrong. Please email me directly, or try again in a moment.';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalLabel;
    }
  });
}

// ---------------------------------------------------------------
// Graceful fallbacks, so recruiters never see "--" placeholders.
// ---------------------------------------------------------------
function showLeetCodeFallback() {
  const card = document.querySelector('.lc-card');
  if (!card || card.classList.contains('is-static')) return;
  card.classList.add('is-static');
  if (LEETCODE_USERNAME === 'your-leetcode-username') {
    ['lcHandleBadge', 'lcProfileLink'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.hidden = true;
    });
  }
  document.getElementById('lcTotal').textContent = '350+';
  const note = document.createElement('p');
  note.className = 'static-note';
  note.textContent = 'DSA problems solved in Java · 50-day and 100-day streak badges';
  card.querySelector('.lc-body').appendChild(note);
}

function hideCodeforcesCard() {
  const card = document.querySelector('.cf-card');
  if (card) card.hidden = true;
}

function setupContactLinks() {
  const hasEmail = EMAIL && !EMAIL.includes('example.com');
  const emailBtn = document.getElementById('emailLink');
  const direct = document.getElementById('directEmail');
  const emailText = document.getElementById('emailText');
  const form = document.getElementById('contactForm');
  if (hasEmail) {
    emailBtn.href = `mailto:${EMAIL}`;
    emailText.href = `mailto:${EMAIL}`;
    emailText.textContent = EMAIL;
    if (form) form.action = `https://formsubmit.co/ajax/${EMAIL}`;
  } else {
    if (emailBtn) emailBtn.hidden = true;
    if (direct) direct.hidden = true;
  }
  const li = document.getElementById('linkedinLink');
  if (LINKEDIN_URL) li.href = LINKEDIN_URL; else if (li) li.hidden = true;
}

// Highlights the nav button for the section currently on screen.
function setupNavHighlight() {
  const buttons = [...document.querySelectorAll('.Navbar [data-target]')];
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      buttons.forEach((b) => b.classList.toggle('is-active', b.dataset.target === en.target.id));
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  buttons.forEach((b) => { const t = document.getElementById(b.dataset.target); if (t) io.observe(t); });
}

// Fade-up on scroll (class is added by JS, so no-JS visitors still see everything).
function setupReveal() {
  const els = document.querySelectorAll('.project-card, .cp-card, .cert-card, .timeline-content, .about-card, .skill-group');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { threshold: 0.12 });
  els.forEach((el) => { el.classList.add('reveal'); io.observe(el); });
}
