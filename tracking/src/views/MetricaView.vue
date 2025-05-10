<template>
    <div class="min-h-screen bg-gray-50 p-4">
        <div class="bg-gray-100 flex justify-center p-4">
            <div class="max-w-sm w-full bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all">
                <div class="relative">
                    <LineChart class="w-full h-52 m-2 object-cover" v-if="selectedMetric.data.length !== 0" :metric="selectedMetric" />                
                    <span class="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                        {{ metrica }}
                    </span>
                </div>
                
                <div class="p-5">                
                    <div class="flex justify-between items-center">
                        <form class="space-y-4 w-full">
                            <div class="my-2">
                                <label for="name" class="text-sm sm:text-md font-bold text-gray-700 dark:text-gray-300">Nombre</label>
                                <input id="name"
                                    type="text"
                                    v-model="form.name" 
                                    name="name" 
                                    class="block w-full border border-emerald-500 outline-emerald-800 px-2 py-2 text-sm sm:text-md rounded-md my-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                            </div>
                            <div>
                                <label for="color" class="text-sm sm:text-md font-bold text-gray-700 dark:text-gray-300">Color</label>
                                <input
                                    id="color"
                                    type="color"
                                    v-model="form.color"
                                    class="block w-full border border-emerald-500 outline-emerald-800 mt-2 mb-2 text-sm sm:text-md rounded-md my-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>
                        </form>
                    </div>

                    <button 
                        @click="saveMetric"
                        class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-lg transition-colors">
                        Guardar
                    </button>
                </div>
            </div>
        </div>
        
        <DataList :metric="selectedMetric" />
    </div>

</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useTrackingStore } from '@/stores/trackingStore'
import { storeToRefs } from 'pinia'
import { notify } from "@kyvg/vue3-notification";
import LineChart from '@/components/LineChart.vue'
import DataList from '@/components/DataList.vue'

const store = useTrackingStore()
const { trackedValues } = storeToRefs(store)

const props = defineProps({
    metrica: {
        type: String,
        required: true
    }
})

const selectedMetric = computed(() => {
    console.log(trackedValues.value[props.metrica])
    return trackedValues.value[props.metrica]
})

const form = ref({
})

onMounted(() => {
    form.value.name = selectedMetric.value.name || props.metrica
    form.value.color = selectedMetric.value.color || '#2d0da0'
})

function saveMetric() {
    store.saveMetric(props.metrica, form.value)
    notify({
        title: 'Metrica actualizada',
        text: 'La métrica ha sido actualizada correctamente.',
        type: 'success',
        duration: 2000,
    });
}

</script>