<script>
    import { createCommunity, updateCommunityPhoto, updateCommunityBanner } from '../../services/community';

    export default {
        data() {
            return {
                name: "",
                description: "",
                photoFile: null, // 📌 Guardamos el archivo en data, no la URL
                bannerFile: null,
                photoPreview: null, // URL para previsualizar la imagen
                bannerPreview: null,

                photoError: "",
                bannerError: "",
                loading: false
            };
        },
        methods: {
            /**
             * Maneja la selección de archivos (imagen o banner)
             * @param {Event} event - Evento de cambio del input file
             * @param {string} type - Tipo de archivo ('photo' o 'banner')
             */
            handleFileUpload(event, type) {
                const file = event.target.files[0];
                if (!file) return;          // Si no hay archivo, termina la ejecución

                // if (!this.name.trim()) {
                //     alert("Por favor, ingresa un nombre para la comunidad antes de subir imágenes.");
                //     return;
                // }

                 // Validación de tamaño máximo (20MB)
                const maxSize = 20 * 1024 * 1024; // 20MB en bytes
                if (file.size > maxSize) {
                    // Configura el mensaje de error según el tipo de archivo
                    if (type === "photo") {
                        this.photoError = "El archivo es demasiado pesado (máx. 20MB)";
                        this.photoFile = null;
                        this.photoPreview = null;
                    } else if (type === "banner") {
                        this.bannerError = "El archivo es demasiado pesado (máx. 20MB)";
                        this.bannerFile = null;
                        this.bannerPreview = null;
                    }
                    // Limpia el valor del input para permitir reintentar
                    event.target.value = "";
                    return;
                } else {
                    // Limpia los errores si el archivo es válido
                    if (type === "photo") {
                        this.photoError = "";
                    } else if (type === "banner") {
                        this.bannerError = "";
                    }
                }

                // Crea una previsualización de la imagen usando FileReader
                const reader = new FileReader();
                reader.onload = () => {
                    // Asigna la previsualización según el tipo de archivo
                    if (type === "photo") {
                        this.photoFile = file;
                        this.photoPreview = reader.result;
                    }
                    if (type === "banner") {
                        this.bannerFile = file;
                        this.bannerPreview = reader.result;
                    }
                };
                reader.readAsDataURL(file);         // Convierte el archivo a URL de datos

                // Guarda el archivo en la variable correspondiente
                if (type === "photo") this.photoFile = file;
                if (type === "banner") this.bannerFile = file;
            },

             /**
             * Método para crear una nueva comunidad
             * 1. Valida que existan los archivos requeridos
             * 2. Crea la comunidad (sin imágenes)
             * 3. Sube las imágenes por separado
             * 4. Redirige a la página de la comunidad creada
             */
            async createCommunity() {

                // Validación de archivos requeridos

                if (!this.photoFile) {
                    this.photoError = "Debes escoger una imagen";
                    return;
                }
                if (!this.bannerFile) {
                    this.bannerError = "Debes escoger un banner";
                    return;
                }

                this.loading = true;

                try {
                    // Paso 1: Crear la comunidad (solo con nombre y descripción)
                    const communityId = await createCommunity({ name: this.name, description: this.description });
                    console.log("Comunidad creada con ID:", communityId);

                    // Paso 2: Subir imágenes por separado
                    if (this.photoFile) {
                        await updateCommunityPhoto(communityId, this.photoFile);
                    }
                    if (this.bannerFile) {
                        await updateCommunityBanner(communityId, this.bannerFile);
                    }

                    // Redirige a la página de la comunidad creada
                    this.$router.push(`/community/${communityId}`);
                } catch (error) {
                    console.error("Error al crear la comunidad:", error);
                } finally {
                    this.loading = false; 
                }
            }
        }
    };
</script>

<template>
    <div class="container">
        <h1>Crear una nueva comunidad</h1>

        <form @submit.prevent="createCommunity">
            
            <div>
                <div>
                    <label>Nombre:</label>
                    <input v-model="name" type="text" maxlength="20" required placeholder="¿Cómo se llamará tu comunidad?"/>
                </div>

                <div>
                    <label>Descripción:</label>
                    <textarea v-model="description" required placeholder="¿En qué consiste tu comunidad?"></textarea>
                </div>
            </div>

            <div>
                <div>
                    <input type="file" id="photo" @change="handleFileUpload($event, 'photo')" accept="image/*" class="file-input">

                    <label for="photo" class="file-label">
                        <div>

                            <div class="file-placeholder"> 
                                <i class="fa-solid fa-file-image"></i>
                                <span>Imagen</span>
                            </div>
                            <span v-if="photoError" class="error-text">{{ photoError }}</span>

                            <img v-if="photoPreview" :src="photoPreview" alt="Vista previa de la imagen" class="photo-preview pt-5 pb-5" />

                        </div>
                    </label>

                </div>

                <div>

                    <input type="file" @change="handleFileUpload($event, 'banner')" accept="image/*" id="banner" class="file-input"/>

                    <label for="banner" class="file-label">
                        <div>
                            <div class="file-placeholder"> 
                                <i class="fa-solid fa-file-image"></i>
                                <span>Banner</span>
                            </div>
                            <span v-if="bannerError" class="error-text">{{ bannerError }}</span>

                            <img v-if="bannerPreview" :src="bannerPreview" alt="Vista previa del banner" class="banner-preview pt-5 pb-5"/>
                        </div>
                    </label>
                </div>
            </div>

            <button type="submit">
                {{ loading ? "Cargando..." : "Crear" }}
            </button>
        </form>
    </div>
</template>

<style scoped>

    .container{
        padding: 5%;
        margin: auto;
    }

    h1{
        font-size: 4rem;
        text-align: center;
        font-family: "Jersey 15", sans-serif;
        font-weight: bold;
        max-width: none;
        margin-top: none;
        padding-left: 0;
        margin-top: 0;
    }

    form{
        display: flex;
        flex-direction: column;
        padding-top: 5rem;
        margin-bottom: 50px;
    }

    form div{
        display: flex;
        justify-content: space-between;
        margin-bottom: 1.5rem;
    }

    form div div{
        display: flex;
        flex-direction: column;
        width: 45%;
        justify-content: center;
        margin-bottom: auto;
    }

    form div div div{
        width: 80%;
        margin: auto;
    }

    form label{
        font-size: 2rem;
        font-family: "Jersey 15", sans-serif;
    }

    .file-label .file-placeholder{
        display: flex;
        flex-direction: row;
        align-items: center;
    }

    .file-label .file-placeholder i{
        padding-right: 1rem;
    }

    .error-text{
        color: #DE1B1B;
        padding-top: .5rem;
    }

    form input, textarea{
        padding: 10px;
        margin-top: 1rem;
        width: 100%;
        border: 1px solid #CCCCCC;
    }

    form input:hover, textarea:hover{
        border: 1px solid black;
        transition-duration: .5s;
        transition-property: border;
    }

    form textarea{
        resize: none;
        min-height: 100px;
    }

    form button{
        background: #0d76bc;
        padding: 10px 0;
        color: white;
        font-family: "Jersey 15", sans-serif;
        font-size: 2.5rem;
        margin-top: 50px;
    }

    form button:hover{
        background: #084f7e;
        transition-property: background;
        transition-duration: .5s
    }














    .file-label{
        display: flex;
        flex-direction: column;
        padding: 20px 30px;
        border: 2px dashed #ccc;
        cursor: pointer;
        width: 100%;
        text-align: center;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 1.25rem;
    }

    .file-label:hover{
        transition-property: border;
        transition-duration: .5s;
        border: 2px dashed black;
    }

    .file-input{
        display: none;
    }















    @media screen and (max-width: 1023px) {
        form div div{
            width: 100%;
        }

        form div{
            display: flex;
            flex-direction: column;
        }

        form div div{
            margin-top: 2.5rem;
        }

        form div div:first-of-type{
            margin-top: 0;
        }
    }

    @media screen and (max-width: 799px){
        h1{
            font-size: 3rem;
            margin: auto;
        }
    }

</style>
