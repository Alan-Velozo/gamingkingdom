<script>
    import Loader from '../components/Loader.vue';
    import TextWithDefault from '../components/TextWithDefault.vue';
    import UserProfileData from '../components/UserProfileData.vue';
    import { subscribeToAuth } from '../services/auth';
    import { subscribeToPosts, subscribeToComments, getLikesAndDislikes, toggleReaction, categories, categoryStyles, getSavedPosts, toggleSavePost } from '../services/post';
    import PostItem from '../components/PostItem.vue';


    export default {
        name: 'MyProfile',
        components: { TextWithDefault, Loader, UserProfileData, PostItem },
        data() {
            return {
                authUser: {
                    id: null,
                    email: null,
                    displayName: null,
                    bio: null,
                    photoURL: null,
                    bannerURL: null,
                    fullyLoaded: false,
                }, // Datos del usuario autenticado
                posts: [], // Lista de todas las publicaciones
                savedPostIds: [], // IDs de las publicaciones guardadas por el usuario
                comments: {}, // Comentarios organizados por ID de publicación
                newCommentContent: {}, // Contenido de nuevos comentarios
                loadingPosts: true, // Indica si las publicaciones están cargando
                loadingSavedPosts: true, // Indica si los posts guardados están cargando
                activeTab: 'my-activity', // Pestaña activa (mi actividad o guardados)
                unsubscribeFromAuth: () => {}, // Función para cancelar suscripción de autenticación
                unsubscribePosts: () => {}, // Función para cancelar suscripción de posts
                commentUnsubscribers: [],
            }
        },
        computed: {
            // Filtra las publicaciones que pertenecen al usuario autenticado
            userPosts() {
                return this.posts.filter(post => post.user_id === this.authUser.id);
            },
            // Devuelve la lista de categorías disponibles
            categoryList() {
                return categories;
            },
            // Devuelve los estilos de las categorías
            categoryStyles() {
                return categoryStyles;
            },
            // Filtra las publicaciones que están en la lista de guardados
            savedPosts() {
                return this.posts.filter(post => this.savedPostIds.includes(post.id));
            },
        },   
        async mounted() {
            // Suscribe el componente a los cambios en la autenticación del usuario
            this.unsubscribeFromAuth = subscribeToAuth(async (newUserData) => {
                this.authUser = newUserData;
                this.authUser.fullyLoaded = true;

                // Cargar IDs de posts guardados cuando el usuario está autenticado
                if (this.authUser.id) {
                    this.loadingSavedPosts = true;
                    try {
                        this.savedPostIds = await getSavedPosts(this.authUser.id);
                    } catch (error) {
                        console.error("Error al cargar posts guardados:", error);
                    }
                    this.loadingSavedPosts = false;
                }
            });

            // Suscribe el componente a las publicaciones en tiempo real
            this.unsubscribePosts = subscribeToPosts(newPosts => {
                this.posts = newPosts;
                this.loadingPosts = false;
                
                // Suscribe el componente a los comentarios de cada publicación
                newPosts.forEach(post => {
                    if (!this.comments[post.id]) {
                        this.comments[post.id] = [];
                    }
                    this.subscribeToPostComments(post.id);
                });
            });
        },
        unmounted() {
            // Cancela las suscripciones para evitar fugas de memoria
            this.unsubscribeFromAuth();
            this.unsubscribePosts(); // Asegurarse de desuscribirse de los posts

            // Cancela las suscripciones de comentarios de cada publicación
            this.commentUnsubscribers.forEach(fn => fn && fn());
        },
        
        methods: {
            // Formatea una fecha a formato local
            formatDate(date) {
                return Intl.DateTimeFormat('es-AR', {
                    year: 'numeric', month: '2-digit', day: '2-digit',
                }).format(date).replace(',', '');
            },
            
            // Navega a la página de detalle de una publicación
            goToPost(postId) {
                this.$router.push(`/post/${postId}`);
            },
            
            // Se suscribe a los comentarios de una publicación específica
            subscribeToPostComments(postId) {
                if (!this.comments[postId]) {
                    this.comments[postId] = [];
                }

                const unsubscribe = subscribeToComments(postId, newComments => {
                    this.comments[postId] = newComments;
                });

                // ✅ guardá la función de desuscripción
                this.commentUnsubscribers.push(unsubscribe);
            },


            // Alterna el "like" de una publicación
            async toggleLike(postId) {
                try {
                    const post = this.posts.find(p => p.id === postId);
                    if (!post) return;

                    post.likes = post.likes || []; // Asegurar que likes es un array
                    post.dislikes = post.dislikes || []; // Asegurar que dislikes es un array

                    await toggleReaction(postId, "like", this.authUser.id);
                    this.updatePost(postId);
                } catch (error) {
                    console.error("Error al dar like", error);
                }
            },

            // Alterna el "dislike" de una publicación
            async toggleDislike(postId) {
                try {
                    const post = this.posts.find(p => p.id === postId);
                    if (!post) return;

                    post.likes = post.likes || []; // Asegurar que likes es un array
                    post.dislikes = post.dislikes || []; // Asegurar que dislikes es un array

                    await toggleReaction(postId, "dislike", this.authUser.id);
                    this.updatePost(postId);
                } catch (error) {
                    console.error("Error al dar dislike", error);
                }
            },
            
            // Verifica si el usuario dio "like" a una publicación
            isLiked(postId) {
                const post = this.posts.find(p => p.id === postId);
                return post && Array.isArray(post.likes) && post.likes.includes(this.authUser.id);
            },
            
            // Verifica si el usuario dio "dislike" a una publicación
            isDisliked(postId) {
                const post = this.posts.find(p => p.id === postId);
                return post && Array.isArray(post.dislikes) && post.dislikes.includes(this.authUser.id);
            },

            // Alterna el estado de guardado de una publicación
            async toggleSave(postId) {
                try {
                    const isNowSaved = await toggleSavePost(this.authUser.id, postId);

                    if (isNowSaved) {
                        // Si el post se guardó, lo agrega a la lista de guardados
                        if (!this.savedPostIds.includes(postId)) {
                            this.savedPostIds.push(postId);
                        }
                    } else {
                        // Si el post se eliminó, lo quita de la lista de guardados
                        this.savedPostIds = this.savedPostIds.filter(id => id !== postId);
                    }

                } catch (error) {
                    console.error("Error al alternar el estado de guardado:", error);
                }
            },

            // Actualiza los datos de una publicación (likes y dislikes)
            async updatePost(postId) {
                try {
                    const updatedPost = await getLikesAndDislikes(postId);
                    const postIndex = this.posts.findIndex(p => p.id === postId);
                    if (postIndex !== -1) {
                        this.posts[postIndex] = {
                            ...this.posts[postIndex], // Mantener las propiedades originales
                            ...updatedPost // Sobrescribir solo las propiedades actualizadas
                        };
                    }
                } catch (error) {
                    console.error("Error al actualizar el post:", error);
                }
            }

        }
    }
</script>

<template>
    <template v-if="authUser.fullyLoaded">
        <div class="user min-h-[1000px]">
            <UserProfileData :user="authUser" />

            <section class="mb-20 min-h-[600px]">
                <div class="tabs-container m-auto w-fit flex gap-28"> <!-- Contenedor de pestañas -->
                    <button 
                        @click="activeTab = 'my-activity'"
                        :class="{ 'border-b-4 pb-1': activeTab === 'my-activity' }"
                        :style="{ borderColor: activeTab === 'my-activity' ? '#000' : 'transparent' }"
                        id="my-activity"
                    >
                        Tu actividad
                    </button>
                    <button 
                        @click="activeTab = 'saved-posts'"
                        :class="{ 'border-b-4 pb-1': activeTab === 'saved-posts' }"
                        :style="{ borderColor: activeTab === 'saved-posts' ? '#000' : 'transparent' }"
                        id="saved"
                    >
                        Guardados
                    </button>
                </div>

                <!-- Sección de posts según pestaña activa -->
                <div v-if="activeTab === 'my-activity'" class="post-container">
                    <div>
                        <ul v-if="!loadingPosts && userPosts.length > 0" class="masonry-gallery">
                            <li v-for="post in userPosts" :key="post.id" class="item">
                                <PostItem
                                    :post="post"
                                    :category-styles="categoryStyles"
                                    :comments-count="comments[post.id] ? comments[post.id].length : 0"
                                    :current-user-id="authUser.id"
                                    :following-list="authUser.following || []"
                                    @go-to-post="goToPost"
                                    @toggle-like="toggleLike"
                                    @toggle-dislike="toggleDislike"
                                />
                            </li>
                        </ul>
                        <div v-else-if="!loadingPosts && userPosts.length === 0" class="no-posts-message">
                            <p class="text-center">No hay actividad reciente.</p>
                        </div>
                        <div v-else class="loader-container m-auto flex justify-center pt-20">
                            <Loader />
                        </div>
                    </div>
                </div>

                <!-- Sección de posts guardados -->
                <div v-if="activeTab === 'saved-posts'" class="post-container">
                    <div>
                        <ul v-if="!loadingSavedPosts && savedPosts.length > 0" class="masonry-gallery">
                            <li v-for="post in savedPosts" :key="post.id" class="item">
                                <PostItem
                                    :post="post"
                                    :category-styles="categoryStyles"
                                    :comments-count="comments[post.id] ? comments[post.id].length : 0"
                                    :current-user-id="authUser.id"
                                    :following-list="authUser.following || []"
                                    :isPostSaved="savedPosts.some(saved => saved.id === post.id)"

                                    @go-to-post="goToPost"
                                    @toggle-like="toggleLike"
                                    @toggle-dislike="toggleDislike"
                                    @toggle-save="toggleSave"
                                />
                            </li>
                        </ul>
                        <div v-else-if="!loadingSavedPosts && savedPosts.length === 0" class="no-posts-message">
                            <p class="text-center">No hay publicaciones guardadas.</p>
                        </div>
                        <div v-else class="loader-container m-auto flex justify-center pt-20">
                            <Loader />
                        </div>
                    </div>
                </div>
            </section>
        </div>
    </template>
    <Loader v-else />
</template>

<style scoped>
    section {
        margin-top: -450px;
        margin-left: 300px;
        padding: 0 5%;
    }

    .pp{
        object-fit: cover;
        border-radius: 50%;
        width: 40px;
        height: 40px;
    }

    .tabs-container{
        margin-bottom: 5rem;
    }

    .masonry-gallery {
        columns: 2; /* Número de columnas */
        column-gap: 50px; /* Espaciado entre columnas */
        list-style-type: none; /* Elimina el estilo predeterminado de listas */
        padding: 0;
        margin: 0;
    }

    .item {
        padding: 0;
        margin-bottom: 50px; 
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        break-inside: avoid; 
        word-wrap: break-word; 
        word-break: break-word; 
        overflow-wrap: break-word; 
        hyphens: auto;
        background: white;
        border: 2px solid black;
        border-radius: 0px;
        cursor: pointer;
    }

    .item:hover{
        transform: scale(1.05);
        transition-property: transform;
        transition-duration: .5s;
    }

    .post-container{
        padding: 0 5%
    } 

    #my-activity, #saved{
        font-family: "Jersey 15", sans-serif;
        font-size: 3.25rem;
    }

    @media screen and (max-width: 700px){
        .masonry-gallery {
            columns: 1; /* Número de columnas */
        }
    };

    @media screen and (max-width: 649px){

        .tabs-container{
            gap: 50px;
        }

        .tabs-container #my-activity,
        .tabs-container #saved{
            font-size: 2.25rem;
        }
    };

    @media screen and (min-width: 1600px){
        .masonry-gallery {
            columns: 3; /* Número de columnas */
        }

    };

    @media screen and (max-width: 1150px) {
        .post-container{
            padding: 0 0%
        }
    }
    

    h2 {
        font-family: "Jersey 15", "sans-serif";
        font-size: 4rem;
    }

    @media screen and (max-width: 1023px) {
        
        .tabs-container{
            margin-top: 100px
        }
        
        section {
            margin-top: 0;
            margin-left: 0;
        }
    }
</style>
