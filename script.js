/* ══════════════════════════════════════════
   AURORA BACKGROUND
══════════════════════════════════════════ */
(function() {
    const auroraCanvas = document.getElementById('aurora-canvas');
    const gl = auroraCanvas.getContext('webgl') || auroraCanvas.getContext('experimental-webgl');

    if (!gl) {
        // Fallback: CSS-only aurora if WebGL not available
        auroraCanvas.style.display = 'none';
        return;
    }

    function resize() {
        auroraCanvas.width  = window.innerWidth;
        auroraCanvas.height = window.innerHeight;
        gl.viewport(0, 0, auroraCanvas.width, auroraCanvas.height);
    }
    resize();
    window.addEventListener('resize', resize);

    const vsSource = `
        attribute vec2 a_position;
        void main() {
            gl_Position = vec4(a_position, 0.0, 1.0);
        }
    `;

    const fsSource = `
        precision mediump float;
        uniform float u_time;
        uniform vec2  u_resolution;

        // Smooth noise helpers
        float hash(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }
        float noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(
                mix(hash(i + vec2(0,0)), hash(i + vec2(1,0)), u.x),
                mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x),
                u.y
            );
        }
        float fbm(vec2 p) {
            float v = 0.0; float a = 0.5;
            for (int i = 0; i < 5; i++) {
                v += a * noise(p);
                p  = p * 2.1 + vec2(1.7, 9.2);
                a *= 0.5;
            }
            return v;
        }

        void main() {
            vec2 uv = gl_FragCoord.xy / u_resolution;
            float t  = u_time * 0.12;

            // Warped UV for flowing look
            vec2 q = vec2(fbm(uv + t * 0.4), fbm(uv + vec2(1.0)));
            vec2 r = vec2(fbm(uv + 1.2 * q + vec2(1.7, 9.2) + t * 0.15),
                          fbm(uv + 1.2 * q + vec2(8.3, 2.8) + t * 0.12));
            float f = fbm(uv + 1.8 * r);

            // Aurora band — concentrated in upper 60% of screen
            float band = smoothstep(0.1, 0.9, uv.y) * smoothstep(1.0, 0.4, uv.y);
            f *= band * 2.2;

            // Colour palette: deep blue → cyan → violet → teal
            vec3 col = mix(
                vec3(0.02, 0.05, 0.18),   // dark base
                vec3(0.05, 0.42, 0.72),   // cyan-blue
                clamp(f * 1.4, 0.0, 1.0)
            );
            col = mix(col,
                vec3(0.38, 0.22, 0.82),   // violet
                clamp(f * f * 1.2, 0.0, 1.0)
            );
            col = mix(col,
                vec3(0.08, 0.85, 0.62),   // teal-mint
                clamp(pow(f, 3.0) * 1.8, 0.0, 1.0)
            );

            // Keep it translucent so the dark bg shows through
            float alpha = clamp(f * 1.5, 0.0, 0.88);

            gl_FragColor = vec4(col, alpha);
        }
    `;

    function compileShader(type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        return shader;
    }

    const program = gl.createProgram();
    gl.attachShader(program, compileShader(gl.VERTEX_SHADER,   vsSource));
    gl.attachShader(program, compileShader(gl.FRAGMENT_SHADER, fsSource));
    gl.linkProgram(program);
    gl.useProgram(program);

    // Full-screen quad
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1,-1,  1,-1,  -1,1,
         1,-1,  1, 1,  -1,1
    ]), gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const timeLoc = gl.getUniformLocation(program, 'u_time');
    const resLoc  = gl.getUniformLocation(program, 'u_resolution');

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    let startTime = performance.now();

    function renderAurora() {
        const elapsed = (performance.now() - startTime) / 1000;
        gl.uniform1f(timeLoc, elapsed);
        gl.uniform2f(resLoc, auroraCanvas.width, auroraCanvas.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        requestAnimationFrame(renderAurora);
    }
    renderAurora();
})();

/* ══════════════════════════════════════════
   LOADING SCREEN
══════════════════════════════════════════ */
const loadingScreen = document.getElementById('loading-screen');
const statusMessages = [
    'Initializing portfolio...',
    'Loading assets...',
    'Almost ready...',
    'Welcome.'
];
let msgIdx = 0;
const statusEl = document.querySelector('.loader-status');

const msgInterval = setInterval(() => {
    msgIdx++;
    if (msgIdx < statusMessages.length && statusEl) {
        statusEl.style.opacity = '0';
        setTimeout(() => {
            statusEl.textContent = statusMessages[msgIdx];
            statusEl.style.opacity = '0.7';
        }, 200);
    } else {
        clearInterval(msgInterval);
    }
}, 650);

window.addEventListener('load', () => {
    // Give the bar time to finish, then hide
    setTimeout(() => {
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
            // Trigger typing after load
            setTimeout(typeWriter, 400);
        }
    }, 2600);
});

/* ══════════════════════════════════════════
   CUSTOM CURSOR
══════════════════════════════════════════ */
const cursorDot  = document.querySelector('.cursor-dot');
const cursorRing = document.querySelector('.cursor-ring');

let mouseX = 0, mouseY = 0;
let ringX  = 0, ringY  = 0;
const ringSpeed = 0.1;

document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursorDot.style.left = mouseX + 'px';
    cursorDot.style.top  = mouseY + 'px';
});

function animateRing() {
    ringX += (mouseX - ringX) * ringSpeed;
    ringY += (mouseY - ringY) * ringSpeed;
    cursorRing.style.left = ringX + 'px';
    cursorRing.style.top  = ringY + 'px';
    requestAnimationFrame(animateRing);
}
animateRing();

document.querySelectorAll('a, button, .glass-card, .cert-preview, .profile-frame-large, .skill-tags span').forEach(el => {
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

const PARTICLE_COUNT = 70;
const particles = [];

class Particle {
    constructor() { this.reset(true); }

    reset(initial = false) {
        this.x     = Math.random() * canvas.width;
        this.y     = initial ? Math.random() * canvas.height : canvas.height + 10;
        this.r     = Math.random() * 1.2 + 0.3;
        this.vx    = (Math.random() - 0.5) * 0.3;
        this.vy    = -(Math.random() * 0.45 + 0.15);
        this.alpha = Math.random() * 0.45 + 0.08;
        this.pulse = Math.random() * Math.PI * 2;
        this.pulseSpeed = 0.015 + Math.random() * 0.02;
        const roll = Math.random();
        const hue  = roll > 0.65 ? 195 : roll > 0.35 ? 260 : 165;
        this.color = `hsla(${hue}, 85%, 72%, `;
    }

    update() {
        this.x    += this.vx;
        this.y    += this.vy;
        this.pulse += this.pulseSpeed;
        if (this.y < -10) this.reset();
    }

    draw() {
        const a = this.alpha * (0.65 + 0.35 * Math.sin(this.pulse));
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = this.color + a + ')';
        ctx.fill();
    }
}

for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(new Particle());

function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx   = particles[i].x - particles[j].x;
            const dy   = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 90) {
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.strokeStyle = `rgba(61, 184, 255, ${0.06 * (1 - dist / 90)})`;
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
let typingStarted = false;

function typeWriter() {
    if (typingStarted) return;
    typingStarted = true;
    _type();
}

function _type() {
    const header = document.getElementById("typing-header");
    if (header && charIndex < nameText.length) {
        header.innerHTML += nameText.charAt(charIndex);
        charIndex++;
        setTimeout(_type, 80);
    } else {
        // Start cycling subtitle after name finishes
        setTimeout(startCyclingSubtitle, 300);
    }
}

/* ══════════════════════════════════════════
   CYCLING SUBTITLE
══════════════════════════════════════════ */
const subtitles = [
    'BSIT Student',
    'Graphic Designer',
    'UI/UX Designer',
    'IT Intern',
    'Video Editor',
];
let subIndex = 0;
let subCharIndex = 0;
let isDeleting = false;
const subtitleEl = document.getElementById('cycling-subtitle');

function startCyclingSubtitle() {
    if (!subtitleEl) return;
    cycleSubtitle();
}

function cycleSubtitle() {
    if (!subtitleEl) return;
    const current = subtitles[subIndex];

    if (!isDeleting) {
        subtitleEl.textContent = current.substring(0, subCharIndex + 1);
        subCharIndex++;
        if (subCharIndex === current.length) {
            isDeleting = true;
            setTimeout(cycleSubtitle, 1800); // pause before deleting
            return;
        }
    } else {
        subtitleEl.textContent = current.substring(0, subCharIndex - 1);
        subCharIndex--;
        if (subCharIndex === 0) {
            isDeleting = false;
            subIndex = (subIndex + 1) % subtitles.length;
        }
    }
    setTimeout(cycleSubtitle, isDeleting ? 45 : 80);
}

/* ══════════════════════════════════════════
   SCROLL REVEAL + ACTIVE NAV
══════════════════════════════════════════ */
const scrollContainer = document.querySelector('.main-content');

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add("active");
    });
}, { root: scrollContainer, threshold: 0.07 });

const sections  = document.querySelectorAll('[id]');
const navLinks  = document.querySelectorAll('.sidebar nav a');

const navObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            navLinks.forEach(link => link.classList.remove('active'));
            const active = document.querySelector(`.sidebar nav a[href="#${entry.target.id}"]`);
            if (active) active.classList.add('active');
        }
    });
}, { root: scrollContainer, threshold: 0.35 });

/* ══════════════════════════════════════════
   SMOOTH SCROLL for sidebar nav
══════════════════════════════════════════ */
navLinks.forEach(link => {
    link.addEventListener('click', e => {
        e.preventDefault();
        const target = document.querySelector(link.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

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
            if (isHidden) {
                cert.classList.remove('active');
                revealObserver.observe(cert);
            }
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
    modal.classList.add('open');
    modalImg.src = img.src;
    captionText.innerHTML = img.closest('.cert-card').querySelector('h3').innerText;
});

document.querySelector(".close-modal").onclick = () => modal.classList.remove('open');
window.onclick = (e) => { if (e.target === modal) modal.classList.remove('open'); };

/* Keyboard close */
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') modal.classList.remove('open');
});

/* ══════════════════════════════════════════
   PROJECT FILTER TABS
══════════════════════════════════════════ */
const tabs = document.querySelectorAll('.project-tab');
const projectCards = document.querySelectorAll('.project-card');

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const filter = tab.dataset.filter;
        projectCards.forEach(card => {
            if (filter === 'all' || card.dataset.category === filter) {
                card.classList.remove('hidden');
            } else {
                card.classList.add('hidden');
            }
        });
    });
});

/* ══════════════════════════════════════════
   BACK TO TOP
══════════════════════════════════════════ */
const backToTopBtn = document.getElementById('back-to-top');

scrollContainer.addEventListener('scroll', () => {
    if (scrollContainer.scrollTop > 300) {
        backToTopBtn.classList.add('visible');
    } else {
        backToTopBtn.classList.remove('visible');
    }
});

backToTopBtn.addEventListener('click', () => {
    scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ══════════════════════════════════════════
   TILT EFFECT ON PROJECT CARDS
══════════════════════════════════════════ */
document.querySelectorAll('.tilt-card').forEach(card => {
    // inject shine layer
    const shine = document.createElement('div');
    shine.classList.add('tilt-shine');
    card.appendChild(shine);

    card.addEventListener('mousemove', e => {
        const rect   = card.getBoundingClientRect();
        const x      = e.clientX - rect.left;
        const y      = e.clientY - rect.top;
        const cx     = rect.width  / 2;
        const cy     = rect.height / 2;
        const rotateX = ((y - cy) / cy) * -10;
        const rotateY = ((x - cx) / cx) *  10;

        card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.03)`;
        card.style.borderColor = 'rgba(61,184,255,0.45)';
        card.style.boxShadow   = `0 24px 56px rgba(0,0,0,0.4), 0 0 30px rgba(61,184,255,0.12)`;

        // move shine to follow cursor
        shine.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.1), transparent 65%)`;
    });

    card.addEventListener('mouseleave', () => {
        card.style.transform   = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)';
        card.style.borderColor = '';
        card.style.boxShadow   = '';
    });
});

/* ══════════════════════════════════════════
   INIT
══════════════════════════════════════════ */
// Init observers without triggering typing (loading screen handles it)
document.querySelectorAll(".reveal").forEach(el => {
    revealObserver.observe(el);
    navObserver.observe(el);
});
sections.forEach(sec => navObserver.observe(sec));