let weatherChart = null;

window.initChart = function (data) {
    const ctx = document.getElementById('mainChart');
    if (!ctx) return;

    const hours = data.hourly.time.slice(0, 24).map(t => {
        const d = new Date(t);
        return d.getHours() + ':00';
    });
    const temps = data.hourly.temperature_2m.slice(0, 24);

    if (weatherChart) weatherChart.destroy();

    const context = ctx.getContext('2d');
    const gradient = context.createLinearGradient(0, 0, 0, 300);
    // Gold Fade
    gradient.addColorStop(0, 'rgba(255, 215, 0, 0.4)');
    gradient.addColorStop(1, 'rgba(255, 215, 0, 0.0)');

    weatherChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: hours,
            datasets: [{
                label: 'Temperature',
                data: temps,
                borderColor: '#FFD700',
                backgroundColor: gradient,
                fill: true,
                tension: 0.5,
                pointRadius: 0,
                pointHoverRadius: 6,
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(20,20,30,0.9)',
                    titleColor: '#FFD700',
                    bodyFont: { size: 14 }
                }
            },
            scales: {
                x: {
                    display: true,
                    grid: { display: false },
                    ticks: { color: 'rgba(255,255,255,0.5)', maxTicksLimit: 8 }
                },
                y: { display: false }
            }
        }
    });
}
