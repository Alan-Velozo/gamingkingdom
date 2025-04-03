<script>
    export default {
        name: 'MainButton',
    }
</script>

<template>
    <button type="submit" class="mainbutton">
        <slot />
    </button>
</template>


<style scoped>

    .mainbutton{
        background: #1D71B8;
        color: white;
        padding: .55rem 1rem;
    }

    .mainbutton:hover{
        background: #145285;
        transition-property: background;
        transition-duration: .5s;
    }

</style>