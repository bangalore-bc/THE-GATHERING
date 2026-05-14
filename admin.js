const API_URL = '/api';
function resolvePhoto(url) { if (!url) return ''; if (url.startsWith('http')) return url; return url; }

let currentSpeakers = [];
let currentLocations = [];
let currentMeetings = [];
let currentEvents = [];

document.addEventListener('DOMContentLoaded', () => {
    fetchData();

    // Hero setup
    document.getElementById('countdown-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const dateVal = document.getElementById('countdown-input').value;
        const photoFile = document.getElementById('hero-photo').files[0];

        const formData = new FormData();
        formData.append('countdown', dateVal);
        if (photoFile) formData.append('heroPhoto', photoFile);

        try {
            const res = await fetch(`${API_URL}/hero`, {
                method: 'POST',
                body: formData
            });
            if (res.ok) {
                const status = document.getElementById('countdown-status');
                status.classList.remove('hidden');
                setTimeout(() => status.classList.add('hidden'), 3000);
            }
        } catch (err) {
            console.error('Error updating hero module', err);
            alert('Failed to update hero module.');
        }
    });

    // Speaker listeners
    document.getElementById('add-speaker-btn').addEventListener('click', () => openSpeakerModal());
    document.getElementById('speaker-form').addEventListener('submit', handleSpeakerSubmit);

    // Location listeners
    document.getElementById('add-location-btn').addEventListener('click', () => openLocationModal());
    document.getElementById('location-form').addEventListener('submit', handleLocationSubmit);

    // Meeting listeners
    document.getElementById('meeting-form').addEventListener('submit', handleMeetingSubmit);

    // Event listeners
    document.getElementById('add-event-btn').addEventListener('click', () => openEventModal());
    document.getElementById('event-form').addEventListener('submit', handleEventSubmit);

    // Settings listener
    document.getElementById('settings-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/settings`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    registerFormUrl: document.getElementById('register-form-url').value,
                    googleSheetWebhook: document.getElementById('google-sheet-webhook').value,
                    googleSheetApiKey: document.getElementById('google-sheet-api-key').value,
                    instagramUrl: document.getElementById('instagram-url').value,
                    facebookUrl: document.getElementById('facebook-url').value,
                    youtubeUrl: document.getElementById('youtube-url').value,
                    givingUrl: document.getElementById('giving-url').value,
                    contactUrl: document.getElementById('contact-url').value,
                    volunteerUrl: document.getElementById('volunteer-url').value
                })
            });
            if (res.ok) {
                const status = document.getElementById('settings-status');
                status.classList.remove('hidden');
                setTimeout(() => status.classList.add('hidden'), 3000);
            }
        } catch (err) { console.error('Settings save error', err); }
    });

    // Layout listeners
    document.getElementById('advanced-layout-btn').addEventListener('click', openLayoutModal);
    document.getElementById('save-layout-btn').addEventListener('click', saveLayout);
});

async function fetchData() {
    try {
        const res = await fetch(`${API_URL}/data`);
        if (res.ok) {
            const data = await res.json();

            if (data.countdown) {
                const d = new Date(data.countdown);
                const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                document.getElementById('countdown-input').value = local;
            }

            currentSpeakers = data.speakers || [];
            currentLocations = data.locations || [];
            currentMeetings = data.meetings || [];
            currentEvents = data.upcomingEvents || [];
            renderSpeakers();
            renderLocations();
            renderMeetings();
            renderEvents();

            // Fetch settings
            try {
                const settingsRes = await fetch(`${API_URL}/settings`);
                if (settingsRes.ok) {
                    const settings = await settingsRes.json();
                    document.getElementById('register-form-url').value = settings.registerFormUrl || '';
                    document.getElementById('google-sheet-webhook').value = settings.googleSheetWebhook || '';
                    document.getElementById('google-sheet-api-key').value = settings.googleSheetApiKey || '';
                    document.getElementById('instagram-url').value = settings.instagramUrl || '';
                    document.getElementById('facebook-url').value = settings.facebookUrl || '';
                    document.getElementById('youtube-url').value = settings.youtubeUrl || '';
                    document.getElementById('giving-url').value = settings.givingUrl || '';
                    document.getElementById('contact-url').value = settings.contactUrl || '';
                    document.getElementById('volunteer-url').value = settings.volunteerUrl || '';
                }
            } catch (e) { console.warn('Could not load settings'); }
        }
    } catch (err) {
        console.error('Error fetching data', err);
        console.warn('Failed to connect to backend. It might still be starting up.');
    }
}

// Speakers
function renderSpeakers() {
    const list = document.getElementById('speakers-list');
    list.innerHTML = '';
    if (currentSpeakers.length === 0) {
        list.innerHTML = '<p class="text-stone-500 italic">No speakers found. Add one above.</p>';
        return;
    }
    currentSpeakers.forEach((speaker, i) => {
        const div = document.createElement('div');
        div.className = 'flex items-center justify-between border border-stone-200 p-4 rounded-md bg-white cursor-move hover:shadow-sm transition-shadow';
        div.draggable = true;
        div.innerHTML = `
            <div class="flex items-center gap-4 pointer-events-none">
                <img src="${speaker.photo ? resolvePhoto(speaker.photo) : 'img/placeholder.jpg'}" alt="${speaker.name}" class="w-16 h-16 object-cover rounded-full bg-stone-100">
                <div>
                    <h3 class="font-bold text-lg">${speaker.name}</h3>
                    <p class="text-sm text-stone-500">${speaker.title}</p>
                </div>
            </div>
            <div class="flex gap-4 items-center">
                <label class="flex items-center justify-center cursor-pointer text-sm font-medium text-stone-600 mr-4" title="Show on Main Page">
                    <input type="checkbox" ${speaker.isFeatured ? 'checked' : ''} onchange="toggleSpeakerFeatured(${speaker.id}, this.checked)" class="w-5 h-5 rounded border-stone-300 text-blue-600 focus:ring-blue-500">
                </label>
                <button onclick="editSpeaker(${speaker.id})" class="text-sm bg-stone-100 px-3 py-1 rounded hover:bg-stone-200">Edit</button>
                <button onclick="deleteSpeaker(${speaker.id})" class="text-sm bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200">Delete</button>
            </div>
        `;

        div.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', i);
            setTimeout(() => div.classList.add('opacity-50'), 0);
        });
        div.addEventListener('dragend', () => div.classList.remove('opacity-50'));
        div.addEventListener('dragover', (e) => {
            e.preventDefault();
            div.classList.add('border-blue-500', 'bg-blue-50');
        });
        div.addEventListener('dragleave', () => div.classList.remove('border-blue-500', 'bg-blue-50'));
        div.addEventListener('drop', async (e) => {
            e.preventDefault();
            div.classList.remove('border-blue-500', 'bg-blue-50');
            const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'));
            const targetIndex = i;
            if (draggedIndex !== targetIndex && !isNaN(draggedIndex)) {
                const movedItem = currentSpeakers.splice(draggedIndex, 1)[0];
                currentSpeakers.splice(targetIndex, 0, movedItem);
                renderSpeakers();
                await saveSpeakersOrder();
            }
        });

        list.appendChild(div);
    });
}

function openSpeakerModal(speaker = null) {
    const modal = document.getElementById('speaker-modal');
    const title = document.getElementById('modal-title');
    const form = document.getElementById('speaker-form');
    form.reset();

    if (speaker) {
        title.innerText = 'Edit Speaker';
        document.getElementById('speaker-id').value = speaker.id;
        document.getElementById('speaker-name').value = speaker.name;
        document.getElementById('speaker-title').value = speaker.title;
        document.getElementById('speaker-about').value = speaker.about;
        if (speaker.socials) {
            document.getElementById('speaker-yt').value = speaker.socials.yt || '';
            document.getElementById('speaker-fb').value = speaker.socials.fb || '';
            document.getElementById('speaker-ig').value = speaker.socials.ig || '';
        }
        document.getElementById('speaker-photo').removeAttribute('required');
    } else {
        title.innerText = 'Add New Speaker';
        document.getElementById('speaker-id').value = '';
        document.getElementById('speaker-photo').setAttribute('required', 'true');
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

window.editSpeaker = function (id) {
    const speaker = currentSpeakers.find(s => s.id === id);
    if (speaker) openSpeakerModal(speaker);
}

window.deleteSpeaker = async function (id) {
    if (!confirm('Are you sure you want to delete this speaker? Photo will be automatically deleted.')) return;
    try {
        const res = await fetch(`${API_URL}/speakers/${id}`, { method: 'DELETE' });
        if (res.ok) {
            const data = await res.json();
            currentSpeakers = data.speakers;
            renderSpeakers();
        }
    } catch (err) { alert('Failed to delete speaker'); }
}

window.toggleSpeakerFeatured = async function (id, isFeatured) {
    const speaker = currentSpeakers.find(s => s.id === id);
    if (!speaker) return;

    speaker.isFeatured = isFeatured;

    const formData = new FormData();
    formData.append('data', JSON.stringify(speaker));

    try {
        const res = await fetch(`${API_URL}/speakers/${id}`, { method: 'PUT', body: formData });
        if (!res.ok) throw new Error();
    } catch (err) {
        alert('Failed to update featured status');
        speaker.isFeatured = !isFeatured;
        renderSpeakers();
    }
}

async function saveSpeakersOrder() {
    const order = currentSpeakers.map(s => s.id);
    try {
        const res = await fetch(`${API_URL}/speakers-order`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order })
        });
        if (!res.ok) throw new Error();
    } catch (err) {
        alert('Failed to reorder speakers on server');
    }
}

async function handleSpeakerSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('speaker-id').value;
    const formData = new FormData();

    const payload = {
        name: document.getElementById('speaker-name').value,
        title: document.getElementById('speaker-title').value,
        about: document.getElementById('speaker-about').value,
        socials: {
            yt: document.getElementById('speaker-yt').value,
            fb: document.getElementById('speaker-fb').value,
            ig: document.getElementById('speaker-ig').value
        }
    };

    formData.append('data', JSON.stringify(payload));
    const photoFile = document.getElementById('speaker-photo').files[0];
    if (photoFile) formData.append('photoFile', photoFile);

    try {
        let res;
        if (id) {
            res = await fetch(`${API_URL}/speakers/${id}`, { method: 'PUT', body: formData });
        } else {
            res = await fetch(`${API_URL}/speakers`, { method: 'POST', body: formData });
        }
        if (res.ok) {
            const data = await res.json();
            currentSpeakers = data.speakers;
            renderSpeakers();
            closeModal('speaker-modal');
        }
    } catch (err) { alert('Failed to save speaker'); }
}

// Locations
function renderLocations() {
    const list = document.getElementById('locations-list');
    list.innerHTML = '';
    currentLocations.forEach((loc, i) => {
        const div = document.createElement('div');
        div.className = 'flex items-center justify-between border border-stone-200 p-4 rounded-md bg-stone-50';
        div.innerHTML = `
            <div class="flex items-center gap-4">
                <div class="w-16 h-16 bg-stone-200 rounded overflow-hidden flex-shrink-0">
                    ${loc.photo ? `<img src="${resolvePhoto(loc.photo)}" class="w-full h-full object-cover">` : ''}
                </div>
                <div>
                    <span class="text-xs uppercase font-bold text-stone-500">${loc.tag}</span>
                    <h3 class="font-bold text-lg leading-tight">${loc.name}</h3>
                </div>
            </div>
            <div class="flex gap-2">
                <button onclick="editLocation(${loc.id})" class="text-sm bg-white border border-stone-200 px-3 py-1 rounded hover:bg-stone-100">Edit Details</button>
                <button onclick="deleteLocation(${loc.id})" class="text-sm bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200">Delete</button>
            </div>
        `;
        list.appendChild(div);
    });
}

function openLocationModal(loc = null) {
    const modal = document.getElementById('location-modal');
    const form = document.getElementById('location-form');
    form.reset();

    if (loc) {
        document.getElementById('loc-id').value = loc.id;
        document.getElementById('loc-tag').value = loc.tag;
        document.getElementById('loc-name').value = loc.name;
        document.getElementById('loc-desc').value = loc.description;
        document.getElementById('loc-map').value = loc.mapLink || '';
        document.getElementById('loc-photo').removeAttribute('required');
    } else {
        document.getElementById('loc-id').value = '';
        document.getElementById('loc-photo').setAttribute('required', 'true');
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

window.editLocation = function (id) {
    const loc = currentLocations.find(l => l.id === id);
    if (loc) openLocationModal(loc);
}

window.deleteLocation = async function (id) {
    if (!confirm('Are you sure you want to delete this location? Photo will be automatically deleted.')) return;
    try {
        const res = await fetch(`${API_URL}/locations/${id}`, { method: 'DELETE' });
        if (res.ok) {
            const data = await res.json();
            currentLocations = data.locations;
            renderLocations();
        }
    } catch (err) { alert('Failed to delete location'); }
}

async function handleLocationSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('loc-id').value;
    const formData = new FormData();

    const payload = {
        tag: document.getElementById('loc-tag').value,
        name: document.getElementById('loc-name').value,
        description: document.getElementById('loc-desc').value,
        mapLink: document.getElementById('loc-map').value,
    };

    formData.append('data', JSON.stringify(payload));
    const photoFile = document.getElementById('loc-photo').files[0];
    if (photoFile) formData.append('photoFile', photoFile);

    try {
        let res;
        if (id) {
            res = await fetch(`${API_URL}/locations/${id}`, { method: 'PUT', body: formData });
        } else {
            res = await fetch(`${API_URL}/locations`, { method: 'POST', body: formData });
        }
        if (res.ok) {
            const data = await res.json();
            currentLocations = data.locations;
            renderLocations();
            closeModal('location-modal');
        }
    } catch (err) { alert('Failed to update location'); }
}

// Meetings
function renderMeetings() {
    const list = document.getElementById('meetings-list');
    list.innerHTML = '';

    // Ensure exactly 2 meeting slots
    if (currentMeetings.length === 0) {
        currentMeetings = [
            { id: 'slot_1', title: 'Meeting 01', description: 'Description...', photo: '' },
            { id: 'slot_2', title: 'Meeting 02', description: 'Description...', photo: '' }
        ];
    } else if (currentMeetings.length === 1) {
        currentMeetings.push({ id: 'slot_2', title: 'Meeting 02', description: 'Description...', photo: '' });
    } else if (currentMeetings.length > 2) {
        currentMeetings = currentMeetings.slice(0, 2);
    }

    currentMeetings.forEach((meeting, i) => {
        const div = document.createElement('div');
        div.className = 'flex items-center justify-between border border-stone-200 p-4 rounded-md bg-stone-50';
        div.innerHTML = `
            <div class="flex items-center gap-4">
                <div class="w-16 h-16 bg-stone-200 rounded overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-stone-400">
                    ${meeting.photo ? `<img src="${resolvePhoto(meeting.photo)}" class="w-full h-full object-cover">` : `0${i + 1}`}
                </div>
                <div>
                    <h3 class="font-bold text-lg leading-tight">Slot 0${i + 1}: ${meeting.title}</h3>
                </div>
            </div>
            <div class="flex gap-2">
                <button onclick="editMeeting('${meeting.id}')" class="text-sm bg-white border border-stone-200 px-4 py-2 rounded hover:bg-stone-100 font-medium">Edit Details</button>
            </div>
        `;
        list.appendChild(div);
    });
}

function openMeetingModal(meeting = null) {
    const modal = document.getElementById('meeting-modal');
    const form = document.getElementById('meeting-form');
    form.reset();

    if (meeting) {
        document.getElementById('meeting-id').value = meeting.id;
        document.getElementById('meeting-title').value = meeting.title;
        document.getElementById('meeting-desc').value = meeting.description || '';
        document.getElementById('meeting-long-desc').value = meeting.longDescription || '';
        document.getElementById('meeting-pullquote').value = meeting.pullQuote || '';
        document.getElementById('meeting-location').value = meeting.location || '';
        if (meeting.socials) {
            document.getElementById('meeting-yt').value = meeting.socials.yt || '';
            document.getElementById('meeting-fb').value = meeting.socials.fb || '';
            document.getElementById('meeting-ig').value = meeting.socials.ig || '';
        } else {
            document.getElementById('meeting-yt').value = '';
            document.getElementById('meeting-fb').value = '';
            document.getElementById('meeting-ig').value = '';
        }
        document.getElementById('meeting-photo').removeAttribute('required');

        // Populate testimonials
        const testimonials = meeting.testimonials || [];
        for (let i = 0; i < 3; i++) {
            const t = testimonials[i] || {};
            document.getElementById(`t${i}-text`).value = t.text || '';
            document.getElementById(`t${i}-name`).value = t.name || '';
            document.getElementById(`t${i}-title`).value = t.title || '';
        }
    } else {
        document.getElementById('meeting-id').value = '';
        document.getElementById('meeting-yt').value = '';
        document.getElementById('meeting-fb').value = '';
        document.getElementById('meeting-ig').value = '';
        document.getElementById('meeting-photo').setAttribute('required', 'true');
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

window.editMeeting = function (id) {
    const meeting = currentMeetings.find(m => m.id.toString() === id.toString());
    if (meeting) openMeetingModal(meeting);
}

// Delete meeting logic removed as slots are fixed to 2

async function handleMeetingSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('meeting-id').value;
    const formData = new FormData();

    // Gather testimonials
    const testimonials = [];
    for (let i = 0; i < 3; i++) {
        const text = document.getElementById(`t${i}-text`).value.trim();
        const name = document.getElementById(`t${i}-name`).value.trim();
        const title = document.getElementById(`t${i}-title`).value.trim();
        if (text || name) {
            testimonials.push({ text, name, title });
        }
    }

    const payload = {
        title: document.getElementById('meeting-title').value,
        description: document.getElementById('meeting-desc').value,
        longDescription: document.getElementById('meeting-long-desc').value,
        pullQuote: document.getElementById('meeting-pullquote').value,
        location: document.getElementById('meeting-location').value,
        socials: {
            yt: document.getElementById('meeting-yt').value,
            fb: document.getElementById('meeting-fb').value,
            ig: document.getElementById('meeting-ig').value
        },
        testimonials
    };

    formData.append('data', JSON.stringify(payload));
    const photoFile = document.getElementById('meeting-photo').files[0];
    if (photoFile) formData.append('photoFile', photoFile);

    const slideshowFiles = document.getElementById('meeting-slideshow').files;
    for (let i = 0; i < slideshowFiles.length; i++) {
        formData.append('slideshowFiles', slideshowFiles[i]);
    }

    // Testimonial photos
    for (let i = 0; i < 3; i++) {
        const tPhoto = document.getElementById(`t${i}-photo`).files[0];
        if (tPhoto) formData.append(`testimonialPhoto${i}`, tPhoto);
    }

    try {
        let res;
        if (id && !id.toString().startsWith('slot_')) {
            res = await fetch(`${API_URL}/meetings/${id}`, { method: 'PUT', body: formData });
        } else {
            res = await fetch(`${API_URL}/meetings`, { method: 'POST', body: formData });
        }
        if (res.ok) {
            const data = await res.json();
            currentMeetings = data.meetings;
            renderMeetings();
            closeModal('meeting-modal');
        }
    } catch (err) { alert('Failed to update meeting'); }
}

// Layout Settings
let tempLayouts = [];
let draggingBox = null;
let resizingBox = null;
let resizeHandle = null;
let dragStartX, dragStartY, initialBoxX, initialBoxY, initialWidth, initialHeight;

function resizeLivePreview() {
    const wrapper = document.getElementById('layout-preview-wrapper');
    const preview = document.getElementById('layout-preview');
    if (wrapper && preview) {
        const scale = wrapper.clientWidth / 1344;
        preview.style.transform = `scale(${scale})`;
    }
}

window.addEventListener('resize', resizeLivePreview);

function openLayoutModal() {
    tempLayouts = JSON.parse(JSON.stringify(currentLocations)); // deep copy
    // Give defaults if none exist
    tempLayouts.forEach(l => {
        if (l.x === undefined) l.x = 0;
        if (l.y === undefined) l.y = 0;
        if (l.width === undefined) l.width = 400;
        if (l.height === undefined) l.height = 300;
    });
    renderLayoutControls();
    updateLivePreview();
    const modal = document.getElementById('layout-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    // Call resize after modal is visible to get correct clientWidth
    setTimeout(resizeLivePreview, 50);
}

function renderLayoutControls() {
    const container = document.getElementById('layout-controls');
    container.innerHTML = '';
    tempLayouts.forEach((loc, idx) => {
        const div = document.createElement('div');
        div.className = "bg-stone-50 p-4 border rounded";
        div.innerHTML = `
            <h5 class="font-bold text-sm mb-2">Box ${idx + 1}: ${loc.name}</h5>
            <div class="grid grid-cols-2 gap-2">
                <div>
                    <label class="text-xs text-stone-600 block mb-1">X (px)</label>
                    <input type="number" id="inp-x-${loc.id}" value="${loc.x}" onchange="updateTempLayout(${loc.id}, 'x', this.value)" class="w-full border p-1 rounded text-sm">
                </div>
                <div>
                    <label class="text-xs text-stone-600 block mb-1">Y (px)</label>
                    <input type="number" id="inp-y-${loc.id}" value="${loc.y}" onchange="updateTempLayout(${loc.id}, 'y', this.value)" class="w-full border p-1 rounded text-sm">
                </div>
                <div>
                    <label class="text-xs text-stone-600 block mb-1">Width (px)</label>
                    <input type="number" id="inp-w-${loc.id}" value="${loc.width}" onchange="updateTempLayout(${loc.id}, 'width', this.value)" class="w-full border p-1 rounded text-sm">
                </div>
                <div>
                    <label class="text-xs text-stone-600 block mb-1">Height (px)</label>
                    <input type="number" id="inp-h-${loc.id}" value="${loc.height}" onchange="updateTempLayout(${loc.id}, 'height', this.value)" class="w-full border p-1 rounded text-sm">
                </div>
            </div>
        `;
        container.appendChild(div);
    });
}

window.updateTempLayout = function (id, field, val) {
    const loc = tempLayouts.find(l => l.id === id);
    if (loc) {
        loc[field] = parseInt(val) || 0;
        updateLivePreview();
    }
}

function updateLivePreview() {
    const preview = document.getElementById('layout-preview');
    preview.innerHTML = '';
    tempLayouts.forEach(loc => {
        const div = document.createElement('div');
        div.className = `absolute border-2 border-dashed border-blue-400 bg-blue-50 flex items-center justify-center p-6 transition-none select-none hover:border-blue-600 cursor-move`;
        div.style.left = loc.x + 'px';
        div.style.top = loc.y + 'px';
        div.style.width = loc.width + 'px';
        div.style.height = loc.height + 'px';
        div.dataset.id = loc.id;

        // Add handles
        div.innerHTML = `
            <div class="resize-handle resize-nw" data-handle="nw"></div>
            <div class="resize-handle resize-ne" data-handle="ne"></div>
            <div class="resize-handle resize-sw" data-handle="sw"></div>
            <div class="resize-handle resize-se" data-handle="se"></div>
            ${loc.photo ? `<img src="${resolvePhoto(loc.photo)}" class="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none">` : ''}
            <div class="relative z-10 text-center pointer-events-none">
                <span class="block text-xs uppercase font-bold text-blue-800">${loc.tag}</span>
                <h4 class="text-xl font-black">${loc.name}</h4>
                <p class="text-[10px] text-blue-600 mt-2">(${loc.width}x${loc.height} @ ${loc.x},${loc.y})</p>
            </div>
        `;

        // Event listeners for dragging
        div.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('resize-handle')) {
                resizingBox = loc;
                resizeHandle = e.target.dataset.handle;
            } else {
                draggingBox = loc;
            }
            dragStartX = e.clientX;
            dragStartY = e.clientY;
            initialBoxX = loc.x;
            initialBoxY = loc.y;
            initialWidth = loc.width;
            initialHeight = loc.height;
            e.stopPropagation();
            e.preventDefault();
        });

        preview.appendChild(div);
    });
}

// Global mouse events for drag & resize
document.addEventListener('mousemove', (e) => {
    if (draggingBox || resizingBox) {
        const wrapper = document.getElementById('layout-preview-wrapper');
        const scale = wrapper ? (wrapper.clientWidth / 1344) : 1;

        const dx = (e.clientX - dragStartX) / scale;
        const dy = (e.clientY - dragStartY) / scale;

        if (draggingBox) {
            draggingBox.x = initialBoxX + dx;
            draggingBox.y = initialBoxY + dy;
            syncInputsAndPreview(draggingBox);
        } else if (resizingBox && resizeHandle) {
            if (resizeHandle === 'se') {
                resizingBox.width = Math.max(50, initialWidth + dx);
                resizingBox.height = Math.max(50, initialHeight + dy);
            } else if (resizeHandle === 'sw') {
                resizingBox.width = Math.max(50, initialWidth - dx);
                resizingBox.x = initialBoxX + dx;
                resizingBox.height = Math.max(50, initialHeight + dy);
            } else if (resizeHandle === 'ne') {
                resizingBox.width = Math.max(50, initialWidth + dx);
                resizingBox.height = Math.max(50, initialHeight - dy);
                resizingBox.y = initialBoxY + dy;
            } else if (resizeHandle === 'nw') {
                resizingBox.width = Math.max(50, initialWidth - dx);
                resizingBox.x = initialBoxX + dx;
                resizingBox.height = Math.max(50, initialHeight - dy);
                resizingBox.y = initialBoxY + dy;
            }
            syncInputsAndPreview(resizingBox);
        }
    }
});

document.addEventListener('mouseup', () => {
    draggingBox = null;
    resizingBox = null;
    resizeHandle = null;
});

function syncInputsAndPreview(loc) {
    // fast update DOM element without full re-render for smooth dragging
    const el = document.querySelector(`[data-id="${loc.id}"]`);
    if (el) {
        el.style.left = loc.x + 'px';
        el.style.top = loc.y + 'px';
        el.style.width = loc.width + 'px';
        el.style.height = loc.height + 'px';
        const info = el.querySelector('p');
        if (info) info.innerText = `(${loc.width}x${loc.height} @ ${loc.x},${loc.y})`;
    }
    // sync inputs
    const inpX = document.getElementById(`inp-x-${loc.id}`);
    const inpY = document.getElementById(`inp-y-${loc.id}`);
    const inpW = document.getElementById(`inp-w-${loc.id}`);
    const inpH = document.getElementById(`inp-h-${loc.id}`);
    if (inpX) inpX.value = loc.x;
    if (inpY) inpY.value = loc.y;
    if (inpW) inpW.value = loc.width;
    if (inpH) inpH.value = loc.height;
}

async function saveLayout() {
    const payloads = tempLayouts.map(l => ({ id: l.id, x: l.x, y: l.y, width: l.width, height: l.height }));
    try {
        const res = await fetch(`${API_URL}/locations-layout`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ layouts: payloads })
        });
        if (res.ok) {
            const data = await res.json();
            currentLocations = data.locations;
            closeModal('layout-modal');
            alert('Layout saved successfully! Refresh live site to see changes.');
        }
    } catch (e) {
        alert("Error saving layout");
    }
}

window.closeModal = function (id) {
    const modal = document.getElementById(id);
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

// ─── Upcoming Events ───
function renderEvents() {
    const list = document.getElementById('events-list');
    if (!list) return;
    if (currentEvents.length === 0) {
        list.innerHTML = '<p class="text-stone-400 text-sm italic">No upcoming events. Click "Add Event" to create one.</p>';
        return;
    }
    list.innerHTML = '';
    currentEvents.forEach(ev => {
        const d = new Date(ev.date + 'T00:00:00');
        const month = d.toLocaleString('en-US', { month: 'short' });
        const day = d.getDate().toString().padStart(2, '0');
        const row = document.createElement('div');
        row.className = 'flex items-center justify-between p-4 bg-stone-50 rounded-md border';
        row.innerHTML = `
            <div class="flex items-center gap-4">
                <div class="text-center w-16">
                    <div class="font-display text-xl font-bold leading-tight">${month}</div>
                    <div class="font-display text-2xl font-bold leading-tight">${day}</div>
                </div>
                <span class="text-sm font-medium text-stone-700">${ev.title}</span>
            </div>
            <div class="flex gap-2">
                <button onclick="editEvent(${ev.id})" class="text-stone-500 hover:text-stone-900 text-sm">Edit</button>
                <button onclick="deleteEvent(${ev.id})" class="text-red-400 hover:text-red-600 text-sm">Delete</button>
            </div>
        `;
        list.appendChild(row);
    });
}

function openEventModal(ev = null) {
    const modal = document.getElementById('event-modal');
    document.getElementById('event-form').reset();
    if (ev) {
        document.getElementById('event-id').value = ev.id;
        document.getElementById('event-id').value = ev.id;
        document.getElementById('event-date').value = ev.date;
        document.getElementById('event-title').value = ev.title;
        document.getElementById('event-subtitle').value = ev.subtitle || '';
    } else {
        document.getElementById('event-id').value = '';
        document.getElementById('event-date').value = '';
        document.getElementById('event-title').value = '';
        document.getElementById('event-subtitle').value = '';
    }
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

window.editEvent = function (id) {
    const ev = currentEvents.find(e => e.id === id);
    if (ev) openEventModal(ev);
}

window.deleteEvent = async function (id) {
    if (!confirm('Delete this event?')) return;
    try {
        const res = await fetch(`${API_URL}/events/${id}`, { method: 'DELETE' });
        if (res.ok) {
            const data = await res.json();
            currentEvents = data.upcomingEvents;
            renderEvents();
        }
    } catch (e) { alert('Failed to delete event'); }
}

async function handleEventSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('event-id').value;
    const payload = {
        date: document.getElementById('event-date').value,
        title: document.getElementById('event-title').value,
        subtitle: document.getElementById('event-subtitle').value
    };
    try {
        let res;
        if (id) {
            res = await fetch(`${API_URL}/events/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        } else {
            res = await fetch(`${API_URL}/events`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        }
        if (res.ok) {
            const data = await res.json();
            currentEvents = data.upcomingEvents;
            renderEvents();
            closeModal('event-modal');
        }
    } catch (e) { alert('Failed to save event'); }
}
