/* ══════════════════════════════════════════
   CUSTOM CURSOR
══════════════════════════════════════════ */
const cursorDot  = document.querySelector('.cursor-dot');
const cursorRing = document.querySelector('.cursor-ring');

let mouseX = 0, mouseY = 0;
let ringX = 0, ringY = 0;
const ringSpeed = 0.12;

document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursorDot.style.left = mouseX + 'px';
    cursorDot.style.top  = mouseY + 'px';
});

// Smooth ring lerp
function animateRing() {
    ringX += (mouseX - ringX) * ringSpeed;
    ringY += (mouseY - ringY) * ringSpeed;
    cursorRing.style.left = ringX + 'px';
    cursorRing.style.top  = ringY + 'px';
    requestAnimationFrame(animateRing);
}
animateRing();

// Hover effect on interactive elements
document.querySelectorAll('a, button, .glass-card, .cert-preview, .profile-frame, .skill-tags span').forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
});

/* ══════════════════════════════════════════
   PARTICLE BACKGROUND
══════════════════════════════════════════ */
const canvas = document.getElementById('particle-canvas');
const ctx    = canvas.getContext('2d');

canvas.width  = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
});

const PARTICLE_COUNT = 80;
const particles = [];

class Particle {
    constructor() { this.reset(true); }

    reset(initial = false) {
        this.x    = Math.random() * canvas.width;
        this.y    = initial ? Math.random() * canvas.height : canvas.height + 10;
        this.r    = Math.random() * 1.5 + 0.4;
        this.vx   = (Math.random() - 0.5) * 0.35;
        this.vy   = -(Math.random() * 0.5 + 0.2);
        this.alpha = Math.random() * 0.5 + 0.1;
        this.pulse = Math.random() * Math.PI * 2;
        this.pulseSpeed = 0.02 + Math.random() * 0.02;
        // colour: mostly blue-white, occasional purple
        const hue  = Math.random() > 0.25 ? 215 : 270;
        this.color = `hsla(${hue}, 80%, 75%, `;
    }

    update() {
        this.x    += this.vx;
        this.y    += this.vy;
        this.pulse += this.pulseSpeed;
        if (this.y < -10) this.reset();
    }

    draw() {
        const a = this.alpha * (0.7 + 0.3 * Math.sin(this.pulse));
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = this.color + a + ')';
        ctx.fill();
    }
}

for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(new Particle());

// Connect nearby particles with thin lines
function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx   = particles[i].x - particles[j].x;
            const dy   = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 100) {
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.strokeStyle = `rgba(79, 142, 247, ${0.07 * (1 - dist / 100)})`;
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }
        }
    }
}

function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { p.update(); p.draw(); });
    drawConnections();
    requestAnimationFrame(animateParticles);
}
animateParticles();

/* ══════════════════════════════════════════
   TYPING EFFECT
══════════════════════════════════════════ */
const nameText = "ALLEN PAUL P. MEJOS";
let charIndex  = 0;

function typeWriter() {
    const header = document.getElementById("typing-header");
    if (header && charIndex < nameText.length) {
        header.innerHTML += nameText.charAt(charIndex);
        charIndex++;
        setTimeout(typeWriter, 95);
    }
}

/* ══════════════════════════════════════════
   SCROLL REVEAL + ACTIVE NAV
══════════════════════════════════════════ */
const scrollContainer = document.querySelector('.main-content');

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add("active");
        }
    });
}, { root: scrollContainer, threshold: 0.08 });

// Active nav link highlighting
const sections = document.querySelectorAll('[id]');
const navLinks = document.querySelectorAll('.sidebar nav a');

const navObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            navLinks.forEach(link => link.classList.remove('active'));
            const active = document.querySelector(`.sidebar nav a[href="#${entry.target.id}"]`);
            if (active) active.classList.add('active');
        }
    });
}, { root: scrollContainer, threshold: 0.4 });

/* ══════════════════════════════════════════
   CERTIFICATE TOGGLE
══════════════════════════════════════════ */
const toggleBtn  = document.getElementById('cert-toggle-btn');
const extraCerts = document.querySelectorAll('.extra-cert');

if (toggleBtn) {
    toggleBtn.addEventListener('click', function () {
        const isHidden = extraCerts[0].style.display === 'none';
        extraCerts.forEach(cert => {
            cert.style.display = isHidden ? 'block' : 'none';
            if (isHidden) revealObserver.observe(cert);
        });
        this.innerHTML = isHidden
            ? 'Show Less <i class="fas fa-chevron-up"></i>'
            : 'Show More <i class="fas fa-chevron-down"></i>';
    });
}

/* ══════════════════════════════════════════
   CERTIFICATE MODAL
══════════════════════════════════════════ */
const modal       = document.getElementById("cert-modal");
const modalImg    = document.getElementById("full-cert-img");
const captionText = document.getElementById("caption");

document.addEventListener('click', function(e) {
    const img = e.target.closest('.cert-preview');
    if (!img) return;
    modal.style.display = "block";
    modalImg.src = img.src;
    captionText.innerHTML = img.closest('.cert-card').querySelector('h3').innerText;
});

document.querySelector(".close-modal").onclick = () => modal.style.display = "none";
window.onclick = (e) => { if (e.target === modal) modal.style.display = "none"; };

/* ══════════════════════════════════════════
   INIT
══════════════════════════════════════════ */
window.onload = () => {
    typeWriter();
    document.querySelectorAll(".reveal").forEach(el => {
        revealObserver.observe(el);
        navObserver.observe(el);
    });
    sections.forEach(sec => navObserver.observe(sec));
};