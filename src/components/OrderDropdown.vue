<script>
    export default {
        name: 'OrderDropdown',
        props: {
            modelValue: {
                type: String,
                default: 'todos'
            },
            categories: {
                type: Array,
                default: () => []
            }
        },
        methods: {
            onChange(e) {
                this.$emit('update:modelValue', e.target.value);
            }
        }
    };
</script>

<template>
  <div class="inline-block pl-[3%]">
    <label class="font-semibold mr-2">Ordenar por:</label>
    <select
      :value="modelValue"
      @change="onChange"
      class="text-gray-800 font-semibold py-2 px-2"
    >
      <option value="todos">Todos</option>
      <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
      <option value="seguidos">Seguidos</option>
    </select>
  </div>
</template>

<style scoped>
    select:focus { 
        outline: none; 
    }

    option{
        background: white;
    }
</style> 