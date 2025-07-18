<script>
    import MainButton from '../components/MainButton.vue';
    import { subscribeToAuth, updateUser, updateUserPhoto, updateUserBanner, updateUserFavoriteGame } from '../services/auth';

    export default {
        name: 'MyProfileEdit',
        components: { MainButton },
        data() {
            return {
                authUser: {
                    id: "",
                    email: "",
                    displayName: "",
                    bio: "",
                    photoURL: null,
                    bannerURL: null
                }, // Datos del usuario autenticado
                unsubscribeFromAuth: () => {}, // Función para desuscribirse de cambios de autenticación
                profileData: { // Datos del perfil en edición
                    displayName: "",
                    bio: "",
                },
                photo: null, // Archivo de foto seleccionado
                banner: null, // Archivo de banner seleccionado
                photoPreview: null, // URL de vista previa de la nueva foto
                bannerPreview: null, // URL de vista previa del nuevo banner
                editingProfile: false, // Indicar si el perfil está en proceso de edición
                uploadingPhoto: false, // Indicar si la foto está en proceso de carga
                uploadingBanner: false, // Indicar si el banner está en proceso de carga

                photoSizeError: "", // Error de tamaño para la foto
                bannerSizeError: "", // Error de tamaño para el banner

                favoriteGameSearch: '', // Término de búsqueda para juegos favoritos
                favoriteGameResults: [], // Resultados de la búsqueda de juegos
                favoriteGameSelected: null, // Juego favorito seleccionado
                favoriteGameLoading: false, // Estado de carga de la búsqueda
                searchTimeout: null, // Timeout para evitar búsquedas excesivas
            }
        },
        watch: {
            // Observa cambios en el campo de búsqueda de juegos favoritos
            favoriteGameSearch(newValue) {
                clearTimeout(this.searchTimeout);
                if (newValue.trim().length < 2) {
                    this.favoriteGameResults = [];
                    return;
                }

                // Implementa un debounce de 300ms para evitar spamear la API
                this.searchTimeout = setTimeout(() => {
                    this.searchFavoriteGames(newValue);
                }, 300); // Espera 300ms para evitar spamear la API
            }
        },
        methods: {
            // Maneja el envío del formulario de edición de perfil
            async handleSubmit() {
                this.editingProfile = true;     // Indicar que el perfil está siendo editado
                try {
                    // Validación de biografía - si está vacía, asigna un valor por defecto
                    if (!this.profileData.bio || !this.profileData.bio.trim()) {
                        this.profileData.bio = "Sin biografía.";
                    }

                    // Actualiza el nombre, biografía y juego favorito del usuario
                    await updateUser({
                        displayName: this.profileData.displayName,
                        bio: this.profileData.bio,
                        favoriteGame: this.favoriteGameSelected ?? this.authUser.favoriteGame ?? null
                    });

                    // Si se seleccionó una nueva foto, se actualiza la foto del perfil
                    if (this.photo && !this.photoSizeError) {
                        await updateUserPhoto(this.photo);
                        this.authUser.photoURL = this.photoPreview; // Actualiza la URL de la foto del usuario
                    }

                    // Si se seleccionó un nuevo banner, se actualiza el banner
                    if (this.banner && !this.bannerSizeError) {
                        await updateUserBanner(this.banner);
                        this.authUser.bannerURL = this.bannerPreview; // Actualiza la URL del banner del usuario
                    }

                    // Redirige al perfil después de la edición exitosa
                    this.$router.push(`/perfil`);
                    
                    
                } catch (error) {
                    console.error('[MyProfileEdit handleSubmit] Error al editar el perfil: ', error);
                }
                this.editingProfile = false;        // Indicar que la edición del perfil terminó
            },
            
            // Maneja la selección de archivos (foto y banner)
            handleFileSelection(event) {
                const file = event.target.files[0]; // Obtener el archivo seleccionado
                if (!file) return;

                // Definir tamaño máximo: 20MB
                const maxSize = 20 * 1024 * 1024;

                // Validar el tamaño del archivo
                if (file.size > maxSize) {
                    if (event.target.id === "photo") {
                        this.photoSizeError = "El archivo es demasiado pesado (máximo 20MB).";
                    } else if (event.target.id === "banner") {
                        this.bannerSizeError = "El archivo es demasiado pesado (máximo 20MB).";
                    }
                    return;
                } else {
                    // Limpiar error si el archivo cumple el tamaño
                    if (event.target.id === "photo") {
                        this.photoSizeError = "";
                    } else if (event.target.id === "banner") {
                        this.bannerSizeError = "";
                    }
                }

                // Crear vista previa del archivo seleccionado
                const reader = new FileReader();
                reader.addEventListener('load', () => {
                    if (event.target.id === "photo") {
                        this.photo = file;
                        this.photoPreview = reader.result;
                    } else if (event.target.id === "banner") {
                        this.banner = file;
                        this.bannerPreview = reader.result;
                    }
                });

                reader.readAsDataURL(file);
            },

            // Busca juegos en la API de RAWG basado en el término de búsqueda
            async searchFavoriteGames(query) {
                this.favoriteGameLoading = true;
                try {
                    const response = await fetch(`https://api.rawg.io/api/games?key=e90ff13c35064a99aa18494691b1e26b&search=${encodeURIComponent(query)}&page_size=5`);
                    const data = await response.json();
                    this.favoriteGameResults = data.results;
                } catch (error) {
                    console.error('Error al buscar juegos:', error);
                } finally {
                    this.favoriteGameLoading = false;
                }
            },
            
            // Selecciona un juego de la lista de resultados
            async selectFavoriteGame(game) {
                this.favoriteGameSelected = {
                    id: game.id,
                    name: game.name
                };
                this.favoriteGameResults = []; // Limpia la lista de resultados
                this.favoriteGameSearch = game.name; // Completa el campo de búsqueda
            }
            
        },
        
        // Hook del ciclo de vida: se ejecuta cuando el componente se monta en el DOM
        mounted() {
            // Suscribe el componente a los cambios en la autenticación del usuario
            this.unsubscribeFromAuth = subscribeToAuth(newUserData => {
                this.authUser = newUserData; // Actualizar los datos del usuario autenticado
                this.profileData.displayName = this.authUser.displayName;
                this.profileData.bio = this.authUser.bio;
                this.photoPreview = this.authUser.photoURL || '/assets/users/user.png';
                this.bannerPreview = this.authUser.bannerURL || '/assets/users/banner.png'
            });
        },
        
        // Hook del ciclo de vida: se ejecuta antes de que el componente se desmonte del DOM
        unmounted() {
            // Desuscribirse de los cambios de autenticación cuando el componente se desmonta
            this.unsubscribeFromAuth();
        }
    }
</script>


<template>
    <div class="container">

        <form @submit.prevent="handleSubmit">
            
            <div>
                <div>
                    <label for="displayName">Nombre</label>
                    <input
                        type="text"
                        id="displayName"
                        :disabled="editingProfile"
                        v-model="profileData.displayName"
                        maxlength="20"
                        required
                        placeholder="¿Con qué nombre quieres que te identifiquen?"
                    >
                </div>

                <div>
                    <label for="bio">Biografía</label>
                    <textarea
                        id="bio"
                        :disabled="editingProfile"
                        v-model="profileData.bio"
                        maxlength="100"
                        placeholder="Cuéntanos sobre ti..."
                    ></textarea>
                </div>
            </div>

            <div>
                <div>
                    <input type="file" id="photo" :read-only="uploadingPhoto" @change="handleFileSelection" accept="image/*" class="file-input">

                    <label for="photo" class="file-label">
                        <div class="pt-5">
                            <i class="fa-solid fa-file-image"></i>
                            <span>Foto de perfil</span>
                        </div>
                        <p v-if="photoSizeError" class="error-text">{{ photoSizeError }}</p>
                        <img v-if="photoPreview != null" :src="photoPreview" alt="" class="photo-preview pb-10">
                    </label>

                    <!-- <div>
                        <img v-if="photoPreview != null" :src="photoPreview" alt="" class="photo-preview">
                    </div> -->
                </div>

                <div>

                    <input type="file" id="banner" :read-only="uploadingBanner" @change="handleFileSelection" accept="image/*" class="file-input">

                    <label for="banner" class="file-label">
                        <div class="pt-5">
                            <i class="fa-solid fa-file-image"></i>
                            <span>Banner</span>
                        </div>
                        <p v-if="bannerSizeError" class="error-text">{{ bannerSizeError }}</p>
                        <img v-if="bannerPreview != null" :src="bannerPreview" alt="" class="banner-preview pb-10">
                    </label>

                    <!-- <div>
                        <img v-if="bannerPreview != null" :src="bannerPreview" alt="" class="banner-preview">
                    </div> -->
                </div>
            </div>

            <div>
                <div class="favorite-videogame">
                    <label class="mb-1">Videojuego favorito</label>
                    <input type="text" v-model="favoriteGameSearch" placeholder="Escribe tu juego favorito..."/>

                    <ul v-if="favoriteGameResults.length > 0" class="border bg-white shadow">
                        <li
                        v-for="game in favoriteGameResults"
                        :key="game.id"
                        class="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                        @click="selectFavoriteGame(game)"
                        >
                        {{ game.name }}
                        </li>
                    </ul>
                </div>

                <button type="submit">
                    {{ editingProfile ? 'Cargando...' : 'Editar' }}
                </button>
            </div>

    
        </form>
    </div>
</template> 

<style scoped>

    .container{
        margin: auto;
    }

    h1{
        font-size: 4rem;
        text-align: center;
        font-family: "Jersey 15", sans-serif;
        font-weight: bold;
    }

    form{
        display: flex;
        flex-direction: column;
        padding: 5rem 5% 0 5%;
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

    form label, span{
        font-size: 2rem;
        font-family: "Jersey 15", sans-serif;
    }

    .photo-preview, .banner-preview{
        display: flex;
        margin: auto;
        justify-content: center;
        text-align: center;
        width: fit-content;
        margin-top: 2rem;

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
        width: 45%;
        font-family: "Jersey 15", sans-serif;
        font-size: 2.5rem;
        margin-top: 50px;
    }

    form button:hover{
        background: #0b6bac;
        border: 2px solid black;
        transition-property: background, border;
        transition-duration: .25s
    }

    form div:last-of-type{
        display: flex;
    }
    
    form .favorite-videogame{
        display: flex;
        padding: 2rem 0 0 0;
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

    .file-label{
        display: flex;
        flex-direction: column;
        padding: 10px 30px;
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

    .file-label div{
        display: flex;
        flex-direction: row;
        align-items: center;
    }

    .file-label div i{
        padding-right: 1rem;
    }

    .file-input{
        display: none;
    }

</style>
