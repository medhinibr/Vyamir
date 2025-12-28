function initGauges() {
    const { uv, windDeg } = window.weatherData;

    // UV Animation
    const safeUv = Math.min(uv, 12);
    const uvDeg = (safeUv / 12) * 180;
    const uvEl = document.getElementById('uv-fill');
    if (uvEl) {
        setTimeout(() => {
            uvEl.style.transform = `rotate(${uvDeg}deg)`;
        }, 300);
    }

    // Wind Compass
    if (windDeg !== undefined) {
        const windEl = document.getElementById('wind-compass');
        if (windEl) {
            windEl.style.transform = `rotate(${windDeg}deg)`;
        }
    }

    document.querySelectorAll('.dynamic-color').forEach(el => {
        el.style.color = el.getAttribute('data-color');
    });
    document.querySelectorAll('.dynamic-bar').forEach(el => {
        el.style.width = el.getAttribute('data-width') + '%';
        el.style.background = el.getAttribute('data-bg');
    });
    document.querySelectorAll('.dynamic-height').forEach(el => {
        el.style.height = el.getAttribute('data-height') + '%';
    });
}
window.initGauges = initGauges;
