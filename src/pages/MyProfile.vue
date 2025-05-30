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
                },
                posts: [],
                savedPostIds: [],
                comments: {},
                newCommentContent: {},
                loadingPosts: true, // Añadir estado de carga para los posts
                loadingSavedPosts: true,
                activeTab: 'my-activity',
                unsubscribeFromAuth: () => {},
                unsubscribePosts: () => {}, // Añadir referencia para desuscripción
                unsubscribeComments: () => {}
            }
        },
        computed: {
            userPosts() {
                return this.posts.filter(post => post.user_id === this.authUser.id);
            },
            categoryList() {
                return categories;
            },
            categoryStyles() {
                return categoryStyles;
            },
            savedPosts() {
                // Filtrar los posts que están en la lista de guardados
                return this.posts.filter(post => this.savedPostIds.includes(post.id));
            },
        },
        async mounted() {
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

            this.unsubscribePosts = subscribeToPosts(newPosts => {
                this.posts = newPosts;
                this.loadingPosts = false;
                newPosts.forEach(post => {
                    if (!this.comments[post.id]) {
                        this.comments[post.id] = [];
                    }
                    this.subscribeToPostComments(post.id);
                });
            });
        },
        unmounted() {
            this.unsubscribeFromAuth();
            this.unsubscribePosts(); // Asegurarse de desuscribirse de los posts

            Object.values(this.unsubscribeComments).forEach(unsub => unsub());
        },
        methods: {
            formatDate(date) {
                return Intl.DateTimeFormat('es-AR', {
                    year: 'numeric', month: '2-digit', day: '2-digit',
                }).format(date).replace(',', '');
            },
            goToPost(postId) {
                this.$router.push(`/post/${postId}`);
            },
            subscribeToPostComments(postId) {
                if (!this.comments[postId]) {
                    this.comments[postId] = [];
                }
                return subscribeToComments(postId, newComments => {
                    this.comments[postId] = newComments;
                });
            },

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
            isLiked(postId) {
                const post = this.posts.find(p => p.id === postId);
                return post && Array.isArray(post.likes) && post.likes.includes(this.authUser.id);
            },
            isDisliked(postId) {
                const post = this.posts.find(p => p.id === postId);
                return post && Array.isArray(post.dislikes) && post.dislikes.includes(this.authUser.id);
            },

            async toggleSave(postId) {
                
                try {
                    const isNowSaved = await toggleSavePost(this.authUser.id, postId);

                    if (isNowSaved) {
                        if (!this.savedPostIds.includes(postId)) {
                            this.savedPostIds.push(postId);
                        }
                    } else {
                        this.savedPostIds = this.savedPostIds.filter(id => id !== postId);
                    }

                } catch (error) {
                    console.error("Error al alternar el estado de guardado:", error);
                }
            },

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
        margin-top: -400px;
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
