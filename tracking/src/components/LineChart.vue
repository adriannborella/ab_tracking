<template>
    <canvas ref="chartCanvas"></canvas>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables)
const chartCanvas = ref(null);

const props = defineProps({
    metric: {
        type:Object,
        required: true,
    }
})

function startChart() {
    const dataChar = props.metric.data.sort((a, b) => {
        return new Date(a.date) - new Date(b.date);
    });
    
    new Chart(chartCanvas.value, {
        type: 'line',
        data: {
            labels: dataChar.map((dp) => {
                const date = new Date(dp.date);
                return `${date.getDate()}/${date.getMonth() + 1}`;
            }),
            datasets: [
                {
                    label: 'Progreso',
                    data: dataChar.map((dp) => dp.value),
                    fill: true,
                    borderColor: props.metric.color,
                    tension: 0.4,                
                    borderWidth: 1,
                },
            ],
        },
        options: {
            responsive: true,
            animation: {
                duration: 1500,
                easing: 'easeOutQuart'
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        callback: value => `${value}`
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

onMounted(async () => {  
    startChart();
});

</script>
