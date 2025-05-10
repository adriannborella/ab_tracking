<template>
    <canvas ref="chartCanvas"></canvas>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables)
const chartCanvas = ref(null);

const props = defineProps({
    dataPoints: {
        type: Array,
        required: true,
    },
})

onMounted(async () => {  
    new Chart(chartCanvas.value, {
      type: 'line',
      data: {
        labels: props.dataPoints.map((dp) => dp.date),
        datasets: [
            {
                label: 'Progreso',
                data: props.dataPoints.map((dp) => dp.value),
                fill: true,
                borderColor: '#3b82f6',
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
              callback: value => `USD ${value}`
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
  });

</script>
