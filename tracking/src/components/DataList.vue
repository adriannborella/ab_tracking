<template>
<div class="flex flex-col items-center">
    <div class="w-full md:w-1/2 flex flex-col items-center h-64">
        <div class="w-full px-4">
            <div class="flex flex-col items-center relative">                
                <div class="absolute shadow bg-white z-40 w-full lef-0 rounded max-h-select overflow-y-auto svelte-5uyqqj">
                    <div class="flex flex-col w-full">
                        <div class="cursor-pointer w-full border-gray-200 rounded-t border-b hover:bg-teal-100">
                            <div
                                class="flex w-full items-center p-2 pl-2 border-gray-300 border-2 mb-2 relative hover:border-teal-100">
                                <div class="w-full items-center flex">
                                    <button
                                    @click="addData"
                                    class="bg-green-600 text-white px-4 py-2 rounded w-full"
                                    >
                                        Agregar Dato
                                    </button>
                                </div>                                
                            </div>
                            <div
                                v-for="item in store.getDataDesc(metric.key)"
                                :key="item.date" 
                                class="flex w-full items-center p-2 pl-2 border-gray-300 border-2 mb-2 relative hover:border-teal-100"
                                @click="editData(item)">
                                <div class="w-full items-center flex">
                                    <div class="mx-2 -mt-1  "> {{ item.value}}
                                        <div class="text-xs truncate w-full normal-case font-normal -mt-1 text-gray-500">{{  item.date }}</div>
                                    </div>
                                </div>                                
                            </div>
                        </div>                        
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
</template>

<script setup>
import { useTrackingStore } from '@/stores/trackingStore'
import Swal from 'sweetalert2'
import { notify } from "@kyvg/vue3-notification";

const store = useTrackingStore()

const props = defineProps({
    metric: {
        type:Object,
        required: true,
    }
})

function addData() {
    const newValue = {
        date: new Date().toISOString().split('T')[0],
        value: '',
    }
    editData(newValue)
}

function editData(item) {
    Swal.fire({
        title: 'Editar Dato',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Guardar',
        cancelButtonText: 'Cancelar',
        html: `
            <div class="my-2">
                <label for="date" class="text-sm sm:text-md font-bold text-gray-700 dark:text-gray-300">Fecha</label>
                <input id="swal-date"
                    type="date"
                    name="date" 
                    value="${item.date}"
                    class="block w-full border border-emerald-500 outline-emerald-800 px-2 py-2 text-sm sm:text-md rounded-md my-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
            </div>
            <div class="my-2">
                <label for="value" class="text-sm sm:text-md font-bold text-gray-700 dark:text-gray-300">Valor</label>
                <input id="swal-value"
                    type="number"
                    name="value" 
                    value="${item.value}"
                    class="block w-full border border-emerald-500 outline-emerald-800 px-2 py-2 text-sm sm:text-md rounded-md my-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
            </div>
        `,
        focusConfirm: false,
        preConfirm: () => {
            const date = document.getElementById('swal-date').value
            const value = document.getElementById('swal-value').value
            return { date, value }
        }
    }).then((result) => {
        if (result.isConfirmed) {
            store.addDataPoint(props.metric.key, result.value.date, result.value.value)
            notify({
                title: "Agregado exitoso",
                text: "Tu dato ha sido agregado exitosamente",
                type: "success",
                duration: 2000,
            });
        }
    })
}

</script>