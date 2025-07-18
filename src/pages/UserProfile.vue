<script>
    import Loader from '../components/Loader.vue';
    import ExternalUserProfileData from '../components/ExternalUserProfileData.vue';
    import { getUserProfileById } from '../services/user-profile';
    import { subscribeToPosts, subscribeToComments, getLikesAndDislikes, toggleReaction, categories, categoryStyles, toggleSavePost, getSavedPosts } from '../services/post';
    import { subscribeToAuth } from '../services/auth';
    import PostItem from '../components/PostItem.vue';

    export default {
        name: 'UserProfile',
        components: { Loader, ExternalUserProfileData, PostItem },
        data() {
            return {
                user: {
                    id: null,
                    email: null,
                    displayName: null,
                    bio: null,
                    photoURL: null,
                    fullyLoaded: false,
                }, // Datos del usuario cuyo perfil se está viendo
                posts: [], // Lista de todas las publicaciones
                userLoaded: false, // Indica si los datos del usuario están cargados
                loadingPosts: true, // Indica si las publicaciones están cargando
                unsubscribePosts: () => {}, // Función para cancelar suscripción de posts
                comments: {}, // Comentarios organizados por ID de publicación
                newCommentContent: {}, // Contenido de nuevos comentarios
                unsubscribeFromAuth: () => {}, // Función para cancelar suscripción de autenticación
                unsubscribeComments: () => {}, // Función para cancelar suscripción de comentarios
                savedPosts: [], // Lista de publicaciones guardadas por el usuario autenticado
            }
        },
        computed: {
            // Filtra las publicaciones que pertenecen al usuario del perfil
            userPosts() {
                return this.posts.filter(post => post.user_id === this.user.id);
            },
            // Devuelve la lista de categorías disponibles
            categoryList() {
                return categories;
            },
            // Devuelve los estilos de las categorías
            categoryStyles() {
                return categoryStyles;
            },
        },
        // Hook del ciclo de vida: se ejecuta cuando el componente se monta en el DOM
        async mounted() {
            this.userLoaded = false;

            // Obtener usuario autenticado y suscribirse a cambios
            this.unsubscribeFromAuth = subscribeToAuth(user => {
                this.authUser = user;
            });

            // Obtener las publicaciones guardadas del usuario autenticado
            if (this.authUser.id) {
                this.savedPosts = await getSavedPosts(this.authUser.id);
            }

            // Obtener datos del perfil del usuario desde la ruta
            this.user = await getUserProfileById(this.$route.params.id);
            this.userLoaded = true;

            console.log(this.user);

            // Suscribirse a las publicaciones en tiempo real
            this.unsubscribeFromPosts = subscribeToPosts(newPosts => {
                this.posts = newPosts;
                this.loadingPosts = false;

                // Suscribirse a los comentarios de cada publicación
                newPosts.forEach(post => {
                    if (!this.unsubscribeComments[post.id]) {
                        this.unsubscribeComments[post.id] = this.subscribeToPostComments(post.id);
                    }
                });
            });
        },

        // Hook del ciclo de vida: se ejecuta antes de que el componente se desmonte del DOM
        beforeUnmount() {
            // Cancela las suscripciones para evitar fugas de memoria
            if (this.unsubscribeFromPosts) this.unsubscribeFromPosts();
            if (this.unsubscribeFromAuth) this.unsubscribeFromAuth();
            
            // Desuscribirse de los comentarios de cada publicación
            Object.values(this.unsubscribeComments).forEach(unsub => {
                if (typeof unsub === "function") unsub();
            });
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
                return subscribeToComments(postId, newComments => {
                    this.comments[postId] = newComments;
                });
            },

            // Alterna el estado de guardado de una publicación
            async toggleSave(postId) {
                try {
                    const isPostSaved = await toggleSavePost(this.authUser.id, postId);
                    if (isPostSaved) {
                        // Si el post se guardó, lo agregamos a la lista de guardados
                        this.savedPosts.push(postId);
                    } else {
                        // Si el post se eliminó, lo quitamos de la lista de guardados
                        this.savedPosts = this.savedPosts.filter(id => id !== postId);
                    }
                } catch (error) {
                    console.error("Error al alternar el estado de guardado:", error);
                }
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

            // Verifica si el usuario autenticado dio "like" a una publicación
            isLiked(postId) {
                const post = this.posts.find(p => p.id === postId);
                return post && Array.isArray(post.likes) && post.likes.includes(this.authUser?.id);
            },
            
            // Verifica si el usuario autenticado dio "dislike" a una publicación
            isDisliked(postId) {
                const post = this.posts.find(p => p.id === postId);
                return post && Array.isArray(post.dislikes) && post.dislikes.includes(this.authUser?.id);
            },

            // Actualiza los datos de una publicación (likes y dislikes)
            async updatePost(postId) {
                const postIndex = this.posts.findIndex(p => p.id === postId);
                if (postIndex !== -1) {
                    // Solicita la actualización del post directamente
                    this.posts[postIndex] = await getLikesAndDislikes(postId);
                }
            }
        }
    }
</script>

<template>
    <div v-if="!userLoaded" class="loader-container m-auto flex justify-center h-[100vh] items-center">
        <Loader />
    </div>
    <template v-else>
        <div class="user">
            <ExternalUserProfileData :user="user" />

            <section>
                <h2 class="m-auto mb-20 text-4xl w-fit mt-28">Actividad</h2>
                <div class="post-container">
                    <div class="min-h-[400px] pb-20">
                        <ul v-if="!loadingPosts && userPosts.length > 0" class="masonry-gallery">
                            <li v-for="post in userPosts" :key="post.id" class="item">
                                <PostItem
                                    :post="post"
                                    :category-styles="categoryStyles"
                                    :comments-count="comments[post.id] ? comments[post.id].length : 0"
                                    :current-user-id="authUser.id"
                                    @go-to-post="goToPost"
                                    @toggle-like="toggleLike"
                                    @toggle-dislike="toggleDislike"
                                    :is-post-saved="savedPosts.includes(post.id)"
                                    @toggle-save="toggleSave"
                                />
                            </li>
                        </ul>
                        <p v-else-if="!loadingPosts" class="text-center text-gray-500 mt-10">No hay actividad.</p>
                        <div v-else class="loader-container m-auto flex justify-center pt-20">
                            <Loader />
                        </div>
                    </div>
                </div>
            </section>
        </div>
    </template>
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

    .item:hover{
        transform: scale(1.05);
        transition-property: transform;
        transition-duration: .5s;
    }

    .masonry-gallery {
        columns: 2; /* Número de columnas */
        column-gap: 50px; /* Espaciado entre columnas */
        list-style-type: none; /* Elimina el estilo predeterminado de listas */
        padding: 0;
        margin: 0;
    }

    .post-container{
        padding: 0 5%
    } 

    @media screen and (max-width: 700px){
        .masonry-gallery {
            columns: 1; /* Número de columnas */
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
        section {
            margin-top: 100px;
            margin-left: 0;
        }

        h2{
            margin-bottom: 5rem;
        }
    }
</style>
