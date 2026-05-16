// script.js

// Tailwind Config
window.tailwind = {
    darkMode: "class",
    theme: {
        extend: {
            "colors": {
                "surface-container-low": "#f3f3f4",
                "surface-container-high": "#e8e8e8",
                "inverse-primary": "#c8c6c5",
                "background": "#f9f9f9",
                "surface-variant": "#e2e2e2",
                "on-surface": "#1a1c1c",
                "on-secondary-fixed": "#1a1c1b",
                "secondary-fixed": "#e2e3e1",
                "outline": "#747878",
                "secondary-fixed-dim": "#c6c7c5",
                "secondary-container": "#e2e3e1",
                "on-background": "#1a1c1c",
                "on-secondary-fixed-variant": "#454746",
                "secondary": "#5d5f5d",
                "error": "#ba1a1a",
                "error-container": "#ffdad6",
                "on-primary-fixed-variant": "#474746",
                "primary-fixed-dim": "#c8c6c5",
                "on-tertiary-fixed-variant": "#504535",
                "surface-container": "#eeeeee",
                "primary": "#000000",
                "outline-variant": "#c4c7c7",
                "on-error-container": "#93000a",
                "surface-bright": "#f9f9f9",
                "primary-container": "#1c1b1b",
                "surface-tint": "#5f5e5e",
                "on-tertiary": "#ffffff",
                "on-tertiary-fixed": "#231a0d",
                "tertiary-fixed-dim": "#d5c4b0",
                "inverse-on-surface": "#f0f1f1",
                "tertiary-fixed": "#f2e0cb",
                "surface-dim": "#dadada",
                "surface-container-lowest": "#ffffff",
                "on-secondary-container": "#636563",
                "surface-container-highest": "#e2e2e2",
                "on-secondary": "#ffffff",
                "on-primary": "#ffffff",
                "tertiary": "#000000",
                "inverse-surface": "#2f3131",
                "on-tertiary-container": "#908270",
                "primary-fixed": "#e5e2e1",
                "on-error": "#ffffff",
                "on-primary-fixed": "#1c1b1b",
                "surface": "#f9f9f9",
                "tertiary-container": "#231a0d",
                "on-surface-variant": "#444748",
                "on-primary-container": "#858383"
            },
            "spacing": {
                "gutter": "32px",
                "margin-edge": "64px",
                "container-max": "1280px",
                "unit": "8px",
                "section-gap": "128px"
            },
            "fontFamily": {
                "headline-sm": ["Epilogue"],
                "headline-md": ["Epilogue"],
                "body-md": ["Inter"],
                "headline-lg": ["Epilogue"],
                "body-lg": ["Inter"],
                "label-bold": ["Inter"],
                "display": ["Epilogue"],
                "label-sm": ["Inter"]
            },
            "fontSize": {
                "headline-sm": ["24px", { "lineHeight": "32px", "letterSpacing": "0", "fontWeight": "600" }],
                "headline-md": ["32px", { "lineHeight": "40px", "letterSpacing": "-0.01em", "fontWeight": "700" }],
                "body-md": ["16px", { "lineHeight": "26px", "letterSpacing": "0", "fontWeight": "400" }],
                "headline-lg": ["48px", { "lineHeight": "56px", "letterSpacing": "-0.02em", "fontWeight": "700" }],
                "body-lg": ["20px", { "lineHeight": "32px", "letterSpacing": "-0.01em", "fontWeight": "400" }],
                "label-bold": ["12px", { "lineHeight": "16px", "letterSpacing": "0.1em", "fontWeight": "700" }],
                "display": ["84px", { "lineHeight": "92px", "letterSpacing": "-0.04em", "fontWeight": "800" }],
                "label-sm": ["12px", { "lineHeight": "16px", "letterSpacing": "0", "fontWeight": "500" }]
            }
        }
    }
};

const API_URL = '/api';

// Resolves image URLs: full https URLs pass through, relative /uploads/ paths get prefixed
function resolvePhoto(photoUrl) {
    if (!photoUrl) return '';
    if (photoUrl.startsWith('http')) return photoUrl;
    return photoUrl; // relative paths served by the same origin
}





async function fetchSiteData() {
    try {
        const response = await fetch(`${API_URL}/data`);
        if (!response.ok) throw new Error("Failed to fetch data");
        return await response.json();
    } catch (e) {
        console.error("Error fetching data, using defaults", e);
        return {
            countdown: new Date().toISOString(),
            speakers: []
        };
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const data = await fetchSiteData();

    // Setup Hero Background
    if (data.heroPhoto) {
        const heroImg = document.getElementById('hero-bg-img');
        if (heroImg) {
            heroImg.src = resolvePhoto(data.heroPhoto);
        }
    }

    // Setup Countdown
    const daysEl = document.getElementById('cd-days');
    const hoursEl = document.getElementById('cd-hours');
    const minsEl = document.getElementById('cd-mins');
    const secsEl = document.getElementById('cd-secs');

    if (daysEl && data.countdown) {
        const targetDate = new Date(data.countdown);

        // Setup Google Calendar Link
        const remindBtn = document.getElementById('remind-me-btn');
        if (remindBtn) {
            const pad = (n) => n.toString().padStart(2, '0');
            const yyyy = targetDate.getUTCFullYear();
            const mm = pad(targetDate.getUTCMonth() + 1);
            const dd = pad(targetDate.getUTCDate());
            const hh = pad(targetDate.getUTCHours());
            const min = pad(targetDate.getUTCMinutes());
            const ss = pad(targetDate.getUTCSeconds());
            const startStr = `${yyyy}${mm}${dd}T${hh}${min}${ss}Z`;

            // Assuming 2 hour duration
            const endDate = new Date(targetDate.getTime() + 2 * 60 * 60 * 1000);
            const endY = endDate.getUTCFullYear();
            const endM = pad(endDate.getUTCMonth() + 1);
            const endD = pad(endDate.getUTCDate());
            const endH = pad(endDate.getUTCHours());
            const endMin = pad(endDate.getUTCMinutes());
            const endS = pad(endDate.getUTCSeconds());
            const endStr = `${endY}${endM}${endD}T${endH}${endMin}${endS}Z`;

            const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=The+Gathering&dates=${startStr}/${endStr}&details=Join+us+for+The+Gathering`;

            remindBtn.onclick = () => window.open(calendarUrl, '_blank');
        }

        setInterval(() => {
            const now = new Date();
            const diff = targetDate - now;

            if (diff <= 0) {
                daysEl.innerText = "00";
                hoursEl.innerText = "00";
                minsEl.innerText = "00";
                secsEl.innerText = "00";
                return;
            }

            const d = Math.floor(diff / (1000 * 60 * 60 * 24));
            const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const m = Math.floor((diff / 1000 / 60) % 60);
            const s = Math.floor((diff / 1000) % 60);

            daysEl.innerText = d.toString().padStart(2, '0');
            hoursEl.innerText = h.toString().padStart(2, '0');
            minsEl.innerText = m.toString().padStart(2, '0');
            secsEl.innerText = s.toString().padStart(2, '0');
        }, 1000);
    }

    // Render Featured Speakers
    const speakersContainer = document.getElementById('speakers-container');
    if (speakersContainer && data.speakers) {
        speakersContainer.innerHTML = '';
        // Render featured speakers
        const featured = data.speakers.filter(s => s.isFeatured);
        featured.forEach((speaker, idx) => {
            const el = document.createElement('a');
            el.href = `speakers.html#speaker-${speaker.id}`;
            el.className = `group cursor-pointer block reveal stagger-${idx + 1}`;
            const photoUrl = speaker.photo ? resolvePhoto(speaker.photo) : 'img/placeholder.jpg';

            el.innerHTML = `
                <div class="relative aspect-square bg-stone-200 mb-6 overflow-hidden rounded-2xl card-lift shadow-xl">
                    <img alt="${speaker.name}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.2s] ease-out" src="${photoUrl}">
                    
                    <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
                    <div class="absolute bottom-0 left-0 p-6 z-10 opacity-0 group-hover:opacity-100 translate-y-6 group-hover:translate-y-0 transition-all duration-700 ease-out flex flex-col justify-end w-full pointer-events-none">
                        <span class="font-label-bold text-[10px] uppercase text-stone-300 tracking-widest">${speaker.title}</span>
                        <h3 class="font-display text-xl lg:text-2xl font-bold uppercase mt-2 text-white">${speaker.name}</h3>
                    </div>
                </div>
            `;
            speakersContainer.appendChild(el);

            // Register for scroll reveal
            if (typeof revealObserver !== 'undefined') revealObserver.observe(el);
        });

        // Center speakers if fewer than 3
        if (featured.length < 3 && featured.length > 0) {
            speakersContainer.classList.add('centered');
        }
    }

    // Render Locations
    const locContainer = document.getElementById('locations-container');
    if (locContainer && data.locations) {
        locContainer.innerHTML = '';

        const isMobile = window.innerWidth < 768;

        // Calculate the bounding box to center the layout (for desktop)
        let maxLayoutWidth = 0;
        let maxLayoutHeight = 0;
        data.locations.forEach(loc => {
            if (((loc.x || 0) + (loc.width || 400)) > maxLayoutWidth) maxLayoutWidth = (loc.x || 0) + (loc.width || 400);
            if (((loc.y || 0) + (loc.height || 300)) > maxLayoutHeight) maxLayoutHeight = (loc.y || 0) + (loc.height || 300);
        });

        const wrapper = document.createElement('div');

        if (isMobile) {
            // Mobile: stacked vertical cards
            wrapper.className = 'locations-mobile-stack';
        } else {
            // Desktop/Tablet: absolute positioned layout
            wrapper.className = 'relative w-full transition-all duration-300';
            wrapper.style.aspectRatio = `${maxLayoutWidth > 0 ? maxLayoutWidth : 1232} / ${maxLayoutHeight > 0 ? maxLayoutHeight : 600}`;
        }

        data.locations.forEach((loc, index) => {
            const el = document.createElement('div');

            if (isMobile) {
                el.className = `relative group overflow-hidden p-5 flex flex-col justify-end border border-stone-200/80 cursor-pointer rounded-2xl card-lift`;
                el.style.minHeight = '220px';
            } else {
                el.className = `absolute group overflow-hidden p-8 flex flex-col justify-end border border-stone-200/80 cursor-pointer rounded-2xl card-lift`;
                // Use percentages to perfectly scale within the wrapper
                el.style.left = ((loc.x || 0) / (maxLayoutWidth || 1) * 100) + '%';
                el.style.top = ((loc.y || 0) / (maxLayoutHeight || 1) * 100) + '%';
                el.style.width = ((loc.width || 400) / (maxLayoutWidth || 1) * 100) + '%';
                el.style.height = ((loc.height || 300) / (maxLayoutHeight || 1) * 100) + '%';
            }

            // Background image handling
            const bgImg = loc.photo ? `<img src="${resolvePhoto(loc.photo)}" class="absolute inset-0 w-full h-full object-cover scale-100 group-hover:scale-110 transition-transform duration-[1.5s] ease-out z-0">` : '<div class="absolute inset-0 bg-stone-100 z-0"></div>';
            const overlay = loc.photo ? `<div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent group-hover:from-black/90 group-hover:via-black/40 transition-all duration-700 z-0"></div>` : '';
            const textColor = loc.photo ? 'text-white' : 'text-stone-900';
            const tagColor = loc.photo ? 'text-stone-300' : 'text-stone-500';

            el.onclick = () => window.location.href = `location.html?id=${loc.id}`;

            el.innerHTML = `
                ${bgImg}
                ${overlay}
                <div class="relative z-10">
                    <span class="font-label-bold text-[10px] uppercase ${tagColor} tracking-widest mb-2 block">${loc.tag}</span>
                    <h3 class="font-display ${index === 0 ? 'text-3xl sm:text-5xl lg:text-6xl font-extrabold' : 'text-xl sm:text-2xl lg:text-3xl font-bold'} uppercase tracking-tighter mb-3 sm:mb-4 ${textColor}">${loc.name}</h3>
                    <div class="flex items-center gap-4 mt-auto justify-end">
                        <button class="btn-primary ${loc.photo ? 'bg-white text-black' : 'bg-primary text-on-primary'} px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-label-bold text-[10px] uppercase tracking-widest flex items-center gap-2">
                            Explore <span class="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform duration-300">arrow_forward</span>
                        </button>
                    </div>
                </div>
            `;
            wrapper.appendChild(el);
        });
        locContainer.appendChild(wrapper);
    }

    // Render Meetings
    const meetingsContainer = document.getElementById('meetings-container');
    if (meetingsContainer && data.meetings) {
        meetingsContainer.innerHTML = '';
        data.meetings.forEach((meeting, index) => {
            const num = (index + 1).toString().padStart(2, '0');
            const el = document.createElement('a');
            el.href = `meeting.html?id=${meeting.id}`;
            el.className = `group relative flex flex-col overflow-hidden cursor-pointer rounded-2xl bg-stone-900 min-h-[280px] sm:min-h-[400px] block reveal stagger-${index + 1} card-lift`;

            const bgImg = meeting.photo ? `<img src="${resolvePhoto(meeting.photo)}" class="absolute inset-0 w-full h-full object-cover scale-100 group-hover:scale-110 transition-transform duration-[2s] ease-out z-0">` : '';
            const overlay = `<div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20 group-hover:from-black/80 group-hover:via-black/40 group-hover:to-black/10 transition-all duration-700 z-[1]"></div>`;
            const locTag = meeting.location ? `<span class="font-label-bold text-[10px] uppercase tracking-widest text-white/50">${meeting.location}</span>` : '';

            el.innerHTML = `
                ${bgImg}
                ${overlay}
                <div class="relative z-10 flex flex-col justify-between h-full p-5 sm:p-8">
                    <div class="flex justify-between items-start">
                        <span class="font-display text-5xl sm:text-7xl font-bold text-white/15 group-hover:text-white/40 transition-all duration-700 leading-none">${num}</span>
                        ${locTag}
                    </div>
                    <div class="flex flex-col gap-2 sm:gap-3 mt-auto">
                        <h3 class="font-display text-xl sm:text-2xl lg:text-3xl font-bold uppercase text-white border-t border-white/10 pt-4 sm:pt-6 group-hover:border-white/40 transition-all duration-700">${meeting.title}</h3>
                        <p class="font-body-md text-sm sm:text-base text-white/50 group-hover:text-white/80 transition-colors duration-700 line-clamp-2 sm:line-clamp-3">${meeting.description}</p>
                    </div>
                </div>
            `;
            meetingsContainer.appendChild(el);
            // Register for scroll reveal
            if (typeof revealObserver !== 'undefined') revealObserver.observe(el);
        });
    }

    // Render Upcoming Events on homepage (sorted ascending, max 3)
    const homeEventsList = document.getElementById('home-events-list');
    if (homeEventsList && data.upcomingEvents) {
        const sorted = [...data.upcomingEvents].sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 3);
        if (sorted.length === 0) {
            homeEventsList.innerHTML = '<p class="text-stone-400 text-sm italic">No upcoming events scheduled.</p>';
        } else {
            homeEventsList.innerHTML = '';
            sorted.forEach(ev => {
                const d = new Date(ev.date + 'T00:00:00');
                const month = d.toLocaleString('en-US', { month: 'short' });
                const day = d.getDate().toString().padStart(2, '0');
                const row = document.createElement('div');
                row.className = 'flex items-start gap-4 py-5 border-l-2 border-stone-300 pl-6';
                row.innerHTML = `
                    <div>
                        <div class="font-display text-xl font-bold leading-tight">${month} ${day}</div>
                        <div class="font-body-md text-on-surface-variant mt-1 font-semibold">${ev.title}</div>
                        ${ev.subtitle ? `<div class="font-body-md text-sm text-stone-500 mt-0.5">${ev.subtitle}</div>` : ''}
                    </div>
                `;
                homeEventsList.appendChild(row);
            });
        }
    }

    // Register button — set dynamic URL
    const registerBtn = document.getElementById('register-btn');
    if (registerBtn && data.registerFormUrl) {
        registerBtn.dataset.url = data.registerFormUrl;
    }

    // Dynamic Footer Links
    if (data.instagramUrl) {
        const el = document.getElementById('footer-instagram-link');
        if (el) el.href = data.instagramUrl;
    }
    if (data.facebookUrl) {
        const el = document.getElementById('footer-facebook-link');
        if (el) el.href = data.facebookUrl;
    }
    if (data.youtubeUrl) {
        const el = document.getElementById('footer-youtube-link');
        if (el) el.href = data.youtubeUrl;
    }
    if (data.givingUrl) {
        const el = document.getElementById('footer-giving-link');
        if (el) el.href = data.givingUrl;
    }
    if (data.contactUrl) {
        const el = document.getElementById('footer-contact-link');
        if (el) el.href = data.contactUrl;
    }
    if (data.volunteerUrl) {
        const el = document.getElementById('footer-volunteer-link');
        if (el) el.href = data.volunteerUrl;
    }

    // Subscribe form
    const subForm = document.getElementById('subscribe-form');
    if (subForm) {
        subForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const statusEl = document.getElementById('subscribe-status');
            const name = document.getElementById('sub-name').value;
            const email = document.getElementById('sub-email').value;
            const phone = document.getElementById('sub-phone').value;
            statusEl.classList.remove('hidden');
            statusEl.textContent = 'Sending...';
            statusEl.className = 'text-sm text-center text-stone-500';
            try {
                const res = await fetch(`${API_URL}/subscribe`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, phone })
                });
                if (res.ok) {
                    statusEl.textContent = '\u2713 Subscribed successfully!';
                    statusEl.className = 'text-sm text-center text-green-600';
                    subForm.reset();
                } else {
                    const err = await res.json();
                    statusEl.textContent = err.error || 'Something went wrong.';
                    statusEl.className = 'text-sm text-center text-red-500';
                }
            } catch (err) {
                statusEl.textContent = 'Could not connect to server.';
                statusEl.className = 'text-sm text-center text-red-500';
            }
        });
    }

    // --- HIDDEN AUTHENTICATION HANDSHAKE ---
    const secretTrigger = document.getElementById('secret-trigger-text');
    if (secretTrigger) {
        let pressTimer;
        const startPress = () => {
            pressTimer = setTimeout(() => {
                sessionStorage.setItem('secretActivated', 'true');
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setTimeout(() => location.reload(), 800);
            }, 2000); // 2 second hold
        };
        const cancelPress = () => clearTimeout(pressTimer);

        secretTrigger.addEventListener('mousedown', startPress);
        secretTrigger.addEventListener('touchstart', startPress, {passive: true});
        secretTrigger.addEventListener('mouseup', cancelPress);
        secretTrigger.addEventListener('mouseleave', cancelPress);
        secretTrigger.addEventListener('touchend', cancelPress);
        secretTrigger.addEventListener('touchcancel', cancelPress);
    }

    // If activated, arm the secret sequence
    if (sessionStorage.getItem('secretActivated') === 'true') {
        const words = ['secret-word-gathered', 'secret-word-grace', 'secret-word-community'];
        let currentIdx = 0;
        
        words.forEach((id, expectedIdx) => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('click', () => {
                    if (currentIdx === expectedIdx) {
                        currentIdx++;
                        if (currentIdx === words.length) {
                            // Sequence complete
                            sessionStorage.removeItem('secretActivated');
                            window.location.href = '/login';
                        }
                    } else {
                        currentIdx = 0; // Reset silently on wrong sequence
                    }
                });
            }
        });
    }

});
