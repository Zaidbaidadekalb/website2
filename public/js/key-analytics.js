import { createStore } from '/js/state.js';
import Chart from 'chart.js/auto';

const store = createStore({
    keyAnalytics: null,
});

export function openKeyAnalytics() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Key Analytics</h2>
            <div id="key-analytics-content"></div>
            <div id="key-charts"></div>
            <button id="generate-report">Generate Report</button>
        </div>
    `;
    document.body.appendChild(modal);

    loadKeyAnalytics();
    document.getElementById('generate-report').addEventListener('click', generateReport);
}

async function loadKeyAnalytics() {
    try {
        const response = await fetch('/admin/key-analytics', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        });
        const keyAnalytics = await response.json();
        store.setState({ keyAnalytics });
        renderKeyAnalytics();
        renderKeyCharts();
    } catch (error) {
        console.error('Failed to load key analytics:', error);
        alert('Failed to load key analytics. Please try again.');
    }
}

function renderKeyAnalytics() {
    const keyAnalyticsContent = document.getElementById('key-analytics-content');
    const analytics = store.getState().keyAnalytics;

    keyAnalyticsContent.innerHTML = `
        <h3>Key Usage Summary</h3>
        <p>Total Keys: ${analytics.totalKeys}</p>
        <p>Active Keys: ${analytics.activeKeys}</p>
        <p>Expired Keys: ${analytics.expiredKeys}</p>
        <p>Keys Expiring in 7 Days: ${analytics.expiringKeys}</p>
        <p>Average Usage per Key: ${analytics.averageUsage.toFixed(2)}</p>
        <p>Most Used Key: ${analytics.mostUsedKey.key} (${analytics.mostUsedKey.usageCount} uses)</p>
        <p>Least Used Key: ${analytics.leastUsedKey.key} (${analytics.leastUsedKey.usageCount} uses)</p>
    `;
}

function renderKeyCharts() {
    const keyChartsContainer = document.getElementById('key-charts');
    const analytics = store.getState().keyAnalytics;

    // Key Status Chart
    const keyStatusCtx = document.createElement('canvas');
    keyChartsContainer.appendChild(keyStatusCtx);
    new Chart(keyStatusCtx, {
        type: 'pie',
        data: {
            labels: ['Active', 'Expired', 'Expiring Soon'],
            datasets: [{
                data: [analytics.activeKeys, analytics.expiredKeys, analytics.expiringKeys],
                backgroundColor: ['#4CAF50', '#F44336', '#FFC107'],
            }],
        },
        options: {
            responsive: true,
            title: {
                display: true,
                text: 'Key Status Distribution',
            },
        },
    });

    // Key Usage Chart
    const keyUsageCtx = document.createElement('canvas');
    keyChartsContainer.appendChild(keyUsageCtx);
    new Chart(keyUsageCtx, {
        type: 'bar',
        data: {
            labels: analytics.keyUsageDistribution.map(d => d.range),
            datasets: [{
                label: 'Number of Keys',
                data: analytics.keyUsageDistribution.map(d => d.count),
                backgroundColor: '#2196F3',
            }],
        },
        options: {
            responsive: true,
            title: {
                display: true,
                text: 'Key Usage Distribution',
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Keys',
                    },
                },
                x: {
                    title: {
                        display: true,
                        text: 'Usage Range',
                    },
                },
            },
        },
    });
}

async function generateReport() {
    try {
        const response = await fetch('/admin/generate-report', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = 'key_analytics_report.pdf';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        } else {
            throw new Error('Failed to generate report');
        }
    } catch (error) {
        console.error('Failed to generate report:', error);
        alert('Failed to generate report. Please try again.');
    }
}
