/**
 * Taigo Sakai Portfolio - Visual Effects & Advanced Interactions
 */

// === 3D Tilt & Parallax ===
function init3DEffects() {
    // 3D Tilt for App Cards
    const cards = document.querySelectorAll('.app-card');
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left, y = e.clientY - rect.top;
            const centerX = rect.width / 2, centerY = rect.height / 2;
            const rotateX = (y - centerY) / 20, rotateY = (centerX - x) / 20;
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px)`;
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)`;
        });
    });

    // Parallax Header
    window.addEventListener('scroll', () => {
        const scrolled = window.scrollY;
        const header = document.querySelector('.header-bar');
        if (header) header.style.backgroundPositionY = `${scrolled * 0.5}px`;
    }, { passive: true });
}

// === Neural Background Particles ===
function initBackgroundParticles() {
    if (document.getElementById('neural-bg')) return;
    const canvas = document.createElement('canvas');
    canvas.id = 'neural-bg';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.zIndex = '-1';
    canvas.style.pointerEvents = 'none';
    canvas.style.opacity = '0.3';
    document.body.prepend(canvas);

    const ctx = canvas.getContext('2d');
    let particles = [];

    function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    window.addEventListener('resize', resize);
    resize();

    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;
            this.radius = Math.random() * 2;
        }
        update() {
            this.x += this.vx; this.y += this.vy;
            if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
            if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#2f81f7';
            ctx.fill();
        }
    }

    for (let i = 0; i < 60; i++) particles.push(new Particle());

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach((p, i) => {
            p.update(); p.draw();
            for (let j = i + 1; j < particles.length; j++) {
                const p2 = particles[j], dx = p.x - p2.x, dy = p.y - p2.y, dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 150) {
                    ctx.beginPath();
                    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#2f81f7';
                    ctx.globalAlpha = 1 - (dist / 150);
                    ctx.lineWidth = 0.5;
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                    ctx.globalAlpha = 1;
                }
            }
        });
        requestAnimationFrame(animate);
    }
    animate();
}

// === Typing Effect ===
function initTypingEffect() {
    const textEl = document.getElementById('typing-text');
    if (!textEl) return;
    const phrases = ["Deep Learning Researcher", "iOS & Web Developer", "Ph.D. Student at Meijo University", "Building Intelligent Systems"];
    let phraseIndex = 0, charIndex = 0, isDeleting = false, typeSpeed = 100;

    const type = () => {
        const current = phrases[phraseIndex];
        charIndex += isDeleting ? -1 : 1;
        textEl.textContent = current.substring(0, charIndex);
        typeSpeed = isDeleting ? 50 : 100;

        if (!isDeleting && charIndex === current.length) {
            isDeleting = true;
            typeSpeed = 2000;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            phraseIndex = (phraseIndex + 1) % phrases.length;
            typeSpeed = 500;
        }
        setTimeout(type, typeSpeed);
    };
    type();
}

// === Drag & Drop Interactions ===
function initDraggableInteractions() {
    // Draggable Profile Card
    const card = document.querySelector('.profile-card');
    if (card) {
        let isDragging = false, startX, startY, currentRotateX = 0, currentRotateY = 0;
        const onStart = (e) => {
            isDragging = true; card.style.cursor = 'grabbing'; card.style.transition = 'none';
            startX = e.pageX || e.touches[0].pageX; startY = e.pageY || e.touches[0].pageY;
        };
        const onMove = (e) => {
            if (!isDragging) return;
            const pageX = e.pageX || e.touches[0].pageX, pageY = e.pageY || e.touches[0].pageY;
            currentRotateY += (pageX - startX) * 0.5; currentRotateX -= (pageY - startY) * 0.5;
            startX = pageX; startY = pageY;
            card.style.transform = `perspective(1000px) rotateX(${currentRotateX}deg) rotateY(${currentRotateY}deg)`;
        };
        const onEnd = () => {
            isDragging = false; card.style.cursor = 'grab';
            currentRotateX = 0; currentRotateY = 0;
            card.style.transition = 'transform 1s cubic-bezier(0.2, 0.8, 0.2, 1)';
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
        };
        card.addEventListener('mousedown', onStart);
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onEnd);
    }

    // Draggable Avatar Tooltip
    const avatar = document.querySelector('.header-profile img');
    if (avatar) {
        avatar.style.cursor = 'grab';
        let isDragging = false, startX, startY, tooltip = null;

        const updateTooltip = (x, y) => {
            if (!tooltip) { tooltip = document.createElement('div'); tooltip.className = 'drag-tooltip'; document.body.appendChild(tooltip); }
            avatar.style.display = 'none';
            const elBelow = document.elementFromPoint(x, y);
            avatar.style.display = 'block';

            const lang = document.documentElement.getAttribute('data-lang') || 'ja';
            let text = lang === 'ja' ? '未知の領域' : 'Unknown Area';

            if (elBelow) {
                const app = elBelow.closest('.app-card');
                const section = elBelow.closest('.section-card');
                const header = elBelow.closest('.header-bar');
                const sidebar = elBelow.closest('.profile-sidebar');

                if (app) {
                    const title = app.querySelector('.app-title')?.textContent || '';
                    text = (lang === 'ja' ? '開発：' : 'Dev: ') + title;
                } else if (section) {
                    const titleEl = section.querySelector('.section-title');
                    const titleText = (titleEl?.querySelector(`[lang="${lang}"]`) || titleEl)?.textContent.trim() || '';
                    text = (lang === 'ja' ? '研究：' : 'Res: ') + titleText;
                } else if (header) {
                    text = lang === 'ja' ? 'ナビゲーション' : 'Navigation';
                } else if (sidebar) {
                    text = lang === 'ja' ? '自己紹介' : 'Biography';
                } else {
                    text = lang === 'ja' ? '背景' : 'Background';
                }
            }
            tooltip.textContent = text;
            tooltip.style.left = `${x}px`;
            tooltip.style.top = `${y - 40}px`;
            tooltip.classList.add('visible');
        };

        const onStart = (e) => {
            e.preventDefault(); isDragging = true;
            avatar.style.cursor = 'grabbing';
            startX = e.pageX || e.touches[0].pageX;
            startY = e.pageY || e.touches[0].pageY;
        };

        const onMove = (e) => {
            if (!isDragging) return;
            const pageX = e.pageX || e.touches[0].pageX, pageY = e.pageY || e.touches[0].pageY;
            avatar.style.transform = `translate(${pageX - startX}px, ${pageY - startY}px) scale(1.1)`;
            updateTooltip(e.clientX || e.touches[0].clientX, e.clientY || e.touches[0].clientY);
        };

        const onEnd = () => {
            isDragging = false; avatar.style.cursor = 'grab';
            avatar.style.transition = 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            avatar.style.transform = 'translate(0, 0) scale(1)';
            if (tooltip) tooltip.classList.remove('visible');
        };

        avatar.addEventListener('mousedown', onStart);
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onEnd);
    }
}

// 互換性のためにwindowに公開
window.init3DEffects = init3DEffects;
window.initBackgroundParticles = initBackgroundParticles;
window.initTypingEffect = initTypingEffect;
window.initDraggableInteractions = initDraggableInteractions;
