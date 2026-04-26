const nameText = "ALLEN PAUL P. MEJOS";
let charIndex = 0;

function typeWriter() {
    const header = document.getElementById("typing-header");
    if (header && charIndex < nameText.length) {
        header.innerHTML += nameText.charAt(charIndex);
        charIndex++;
        setTimeout(typeWriter, 100);
    }
}

// THE FIX: Target the actual scrolling container
const scrollContainer = document.querySelector('.main-content');

const revealOptions = {
    root: scrollContainer, // This tells the script to watch the inner scrollbar
    threshold: 0.1
};

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add("active");
        }
    });
}, revealOptions);

// Certificate Toggle
const toggleBtn = document.getElementById('cert-toggle-btn');
const extraCerts = document.querySelectorAll('.extra-cert');

if (toggleBtn) {
    toggleBtn.addEventListener('click', function() {
        const isHidden = extraCerts[0].style.display === 'none';
        extraCerts.forEach(cert => { 
            cert.style.display = isHidden ? 'block' : 'none';
            if (isHidden) revealObserver.observe(cert);
        });
        this.innerHTML = isHidden ? 'Show Less <i class="fas fa-chevron-up"></i>' : 'Show More <i class="fas fa-chevron-down"></i>';
    });
}

// Modal Logic
const modal = document.getElementById("cert-modal");
const modalImg = document.getElementById("full-cert-img");
const captionText = document.getElementById("caption");

document.querySelectorAll(".cert-preview").forEach(img => {
    img.onclick = function() {
        modal.style.display = "block";
        modalImg.src = this.src;
        const title = this.closest('.cert-card').querySelector('h3').innerText;
        captionText.innerHTML = title;
    }
});

document.querySelector(".close-modal").onclick = () => modal.style.display = "none";
window.onclick = (event) => { if (event.target == modal) modal.style.display = "none"; }

// Initialize
window.onload = () => {
    typeWriter();
    // Observe all sections
    document.querySelectorAll(".reveal").forEach(el => revealObserver.observe(el));
};