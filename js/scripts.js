let currentImages = [];
let currentIndex = 0;

/* --- 1. Полет самолетика --- */
function initPlane() {
    const plane = document.getElementById("plane");
    if (plane) {
        setTimeout(() => {
            plane.style.transform = "translateX(" + (window.innerWidth + 300) + "px)";
        }, 1500);
    }
}

/* --- 2. Фон Canvas --- */
function initCanvasBackground() {
    const canvas = document.getElementById('bg');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let cards = [];
    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();
    for (let i = 0; i < 15; i++) {
        cards.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            w: 30, h: 20,
            speed: 0.3 + Math.random() * 0.5,
            rot: Math.random() * 360
        });
    }
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        cards.forEach(c => {
            ctx.save();
            ctx.translate(c.x, c.y);
            ctx.rotate(c.rot * Math.PI / 180);
            ctx.fillStyle = "#fff8e8";
            ctx.strokeStyle = "#d8c8a8";
            ctx.lineWidth = 2;
            ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
            ctx.strokeRect(-c.w / 2, -c.h / 2, c.w, c.h);
            ctx.restore();
            c.y -= c.speed;
            if (c.y < -50) {
                c.y = canvas.height + 50;
                c.x = Math.random() * canvas.width;
            }
        });
        requestAnimationFrame(draw);
    }
    draw();
}

/* --- Вспомогательная функция загрузки с прогрессом --- */
function downloadWithProgress(url, onProgress, onLoad) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'blob';
    
    let lastPercent = 0; // Запоминаем последнее число

    xhr.onprogress = (event) => {
        if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            
            // ОБНОВЛЯЕМ ТОЛЬКО ЕСЛИ ПРОЦЕНТ ВЫРОС
            if (percent > lastPercent) {
                lastPercent = percent;
                onProgress(percent);
            }
        }
    };

    xhr.onload = () => {
        if (xhr.status === 200) {
            onLoad(URL.createObjectURL(xhr.response));
        } else {
            onLoad(url);
        }
    };
    
    xhr.onerror = () => onLoad(url);
    xhr.send();
}

/* --- 3. Галерея (Миниатюры + Клик) --- */
function initGallery() {
    const cards = document.querySelectorAll(".postcardCard");
    cards.forEach((card, index) => {
        const img = card.querySelector("img");
        if (!img) return;
        const originalSrc = img.src;

        const counter = document.createElement("span");
        counter.className = "load-percentage";
        counter.innerText = "0%";
        card.appendChild(counter);

        downloadWithProgress(originalSrc, 
            (percent) => {
                counter.innerText = percent + "%";
                card.style.setProperty('--progress', percent + '%');
                // Двигаем золотую полоску в CSS через ширину псевдоэлемента
                card.style.width = "calc(100% * " + (percent/100) + ")"; 
            }, 
            (blobUrl) => {
                img.src = blobUrl;
                card.classList.add('loaded');
            }
        );

        // Клик теперь железно привязан
        img.onclick = (e) => {
            e.stopPropagation();
            openModal(index);
        };
    });
    currentImages = Array.from(document.querySelectorAll(".postcardCard img"));
}

/* --- 4. Модальное окно (Проценты + Лоадер) --- */
const modal = document.getElementById("modal");
const modalImg = document.getElementById("modalImg");

function openModal(index) {
    currentIndex = index;
    updateModalImage();
    if (modal) {
        modal.style.display = "flex";
        document.body.style.overflow = "hidden";
    }
}

function updateModalImage() {
    const lang = getCurrentLang();
    const targetImg = currentImages[currentIndex];
    const fullSrc = targetImg.getAttribute(`data-full-${lang}`) || targetImg.getAttribute('data-full') || targetImg.src;

    modal.classList.add("loading");
    modalImg.classList.remove("loaded");

    let modalCounter = modal.querySelector(".modal-percentage");
    if (!modalCounter) {
        modalCounter = document.createElement("div");
        modalCounter.className = "modal-percentage";
        modal.querySelector(".modal-loader").appendChild(modalCounter);
    }
    modalCounter.innerText = "0%";

    downloadWithProgress(fullSrc, 
        (percent) => { modalCounter.innerText = percent + "%"; },
        (blobUrl) => {
            modalImg.src = blobUrl;
            modal.classList.remove("loading");
            modalImg.classList.add("loaded");
        }
    );
}

/* --- Навигация и Языки --- */
function showNext() { currentIndex = (currentIndex + 1) % currentImages.length; updateModalImage(); }
function showPrev() { currentIndex = (currentIndex - 1 + currentImages.length) % currentImages.length; updateModalImage(); }

function getCurrentLang() { return localStorage.getItem('selectedLanguage') || 'ru'; }
function setLanguage(lang) {
    localStorage.setItem('selectedLanguage', lang);
    applyLanguage(lang);
    if (modal && modal.style.display === "flex") updateModalImage();
}

function applyLanguage(lang) {
    document.querySelectorAll('.lang').forEach(el => {
        const tr = el.getAttribute(`data-${lang}`);
        if (tr) el.innerText = tr;
    });
}

/* --- ЗАПУСК --- */
document.addEventListener('DOMContentLoaded', () => {
    applyLanguage(getCurrentLang());
    initPlane();
    initCanvasBackground();
    
    // Создаем лоадер для модалки, если его нет
    if (modal && !document.querySelector('.modal-loader')) {
        const loader = document.createElement('div');
        loader.className = 'modal-loader';
        loader.innerHTML = '<div class="loader-stamp">✉️</div><div class="loader-plane">✈️</div>';
        modal.appendChild(loader);
    }

    initGallery();

    const envelope = document.getElementById("envelope");
    if (envelope) {
        envelope.onclick = () => envelope.classList.toggle("open");
    }

    const stamp = document.getElementById("scrollStamp");
    if (stamp) {
        window.addEventListener("scroll", () => {
            window.scrollY > 300 ? stamp.classList.add("show") : stamp.classList.remove("show");
        });
    }
});

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
if (prevBtn) prevBtn.onclick = (e) => { e.stopPropagation(); showPrev(); };
if (nextBtn) nextBtn.onclick = (e) => { e.stopPropagation(); showNext(); };
if (modal) modal.onclick = () => { modal.style.display = "none"; document.body.style.overflow = "auto"; };