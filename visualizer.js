const canvas = document.getElementById('visualizer');
const ctx = canvas.getContext('2d');
let audioCtx, analyser, dataArray, animationId, source;
let mode = 'waveform';
let isListening = false;

// Visualization mode buttons
const vizBtns = [
    document.getElementById('btn-waveform'),
    document.getElementById('btn-frequency'),
    document.getElementById('btn-circular')
];

// Set up visualization mode switching
vizBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        vizBtns.forEach(b => {
            b.classList.remove('active');
            b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
        mode = btn.id.replace('btn-', '');
    });
});

// Microphone toggle
const micBtn = document.getElementById('mic-toggle');
micBtn.addEventListener('click', async () => {
    if (!isListening) {
        await startMic();
    } else {
        stopMic();
    }
});

async function startMic() {
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        source = audioCtx.createMediaStreamSource(stream);
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 1024;
        source.connect(analyser);
        dataArray = new Uint8Array(analyser.frequencyBinCount);
        isListening = true;
        micBtn.textContent = '🛑 Stop Listening';
        micBtn.classList.add('listening');
        draw();
    } catch (err) {
        alert('Microphone access denied or not available.');
    }
}

function stopMic() {
    if (audioCtx) {
        audioCtx.close();
        audioCtx = null;
    }
    cancelAnimationFrame(animationId);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    isListening = false;
    micBtn.textContent = '🎤 Start Listening';
    micBtn.classList.remove('listening');
}

function draw() {
    animationId = requestAnimationFrame(draw);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!analyser) return;

    if (mode === 'waveform') {
        analyser.getByteTimeDomainData(dataArray);
        ctx.save();
        ctx.beginPath();
        for (let i = 0; i < dataArray.length; i++) {
            const x = (i / dataArray.length) * canvas.width;
            const y = (dataArray[i] / 255) * canvas.height;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        // Colorful gradient stroke
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        gradient.addColorStop(0, '#6a11cb');
        gradient.addColorStop(0.5, '#2575fc');
        gradient.addColorStop(1, '#ff512f');
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 4;
        ctx.shadowColor = '#2575fc';
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.restore();
    } else if (mode === 'frequency') {
        analyser.getByteFrequencyData(dataArray);
        const barWidth = canvas.width / dataArray.length;
        for (let i = 0; i < dataArray.length; i++) {
            const barHeight = dataArray[i];
            const hue = (i / dataArray.length) * 360;
            ctx.fillStyle = `hsl(${hue}, 90%, 55%)`;
            ctx.fillRect(i * barWidth, canvas.height - barHeight, barWidth, barHeight);
        }
    } else if (mode === 'circular') {
        analyser.getByteFrequencyData(dataArray);
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = 80;
        ctx.save();
        ctx.translate(centerX, centerY);
        for (let i = 0; i < dataArray.length; i++) {
            const angle = (i / dataArray.length) * 2 * Math.PI;
            const length = radius + dataArray[i] / 2;
            ctx.beginPath();
            ctx.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
            ctx.lineTo(Math.cos(angle) * length, Math.sin(angle) * length);
            const hue = (i / dataArray.length) * 360;
            ctx.strokeStyle = `hsl(${hue}, 100%, 55%)`;
            ctx.lineWidth = 2.5;
            ctx.shadowColor = `hsl(${hue}, 100%, 60%)`;
            ctx.shadowBlur = 8;
            ctx.stroke();
        }
        ctx.restore();
    }
}

// Theme and accessibility toggles
const body = document.body;
document.getElementById('theme-toggle').addEventListener('click', () => {
    if (body.classList.contains('dark')) {
        body.classList.remove('dark');
    } else {
        body.classList.add('dark');
        body.classList.remove('high-contrast');
    }
});
document.getElementById('contrast-toggle').addEventListener('click', () => {
    if (body.classList.contains('high-contrast')) {
        body.classList.remove('high-contrast');
    } else {
        body.classList.add('high-contrast');
        body.classList.remove('dark');
    }
});
document.getElementById('increase-text').addEventListener('click', () => {
    let size = parseFloat(getComputedStyle(body).fontSize);
    body.style.fontSize = (size + 2) + 'px';
});
document.getElementById('decrease-text').addEventListener('click', () => {
    let size = parseFloat(getComputedStyle(body).fontSize);
    body.style.fontSize = Math.max(12, size - 2) + 'px';
});

// Keyboard accessibility for visualization mode buttons
vizBtns.forEach((btn, idx) => {
    btn.addEventListener('keydown', e => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            const next = (idx + 1) % vizBtns.length;
            vizBtns[next].focus();
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            const prev = (idx - 1 + vizBtns.length) % vizBtns.length;
            vizBtns[prev].focus();
        }
    });
});
