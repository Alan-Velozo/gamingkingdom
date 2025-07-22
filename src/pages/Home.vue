<script>
    import { subscribeToAuth } from '../services/auth';
    import Loader from '../components/Loader.vue';
    import { subscribeToPosts, subscribeToComments, getLikesAndDislikes, toggleReaction, categories, categoryStyles, savePost, toggleSavePost, getSavedPosts } from '../services/post';
    import { uploadFileToStorage } from '../services/storage';
    import PostForm from '../components/PostForm.vue';
    import PostItem from '../components/PostItem.vue';
    import { getUserCommunities } from '../services/community';
    import OrderDropdown from '../components/OrderDropdown.vue';

    export default {
    name: 'Home',
    components: { PostForm, Loader, PostItem, OrderDropdown },
    data() {
        return {

            // Datos del usuario autenticado
            authUser: {
                id: null,
                email: null,
                photoURL: null,
                displayName: null,
            },
            loadingUser: true,          // Indica si los datos del usuario están cargando
            posts: [],                  // Lista de publicaciones
            loadingPosts: true,         // Indica si las publicaciones están cargando
            comments: {},               // Comentarios de las publicaciones (organizados por ID de publicación)
            newCommentContent: {},      // Contenido de nuevos comentarios (no se usa en este código)
            savedPosts: [],             // Lista de publicaciones guardadas por el usuario
            userCommunities: [],        // Lista de comunidades a las que pertenece el usuario
            orderBy: 'todos',
        };
    },
    computed: {
        // Lista de categorías de publicaciones
        categoryList() {
            return categories;
        },

        // Estilos de categorías (colores e íconos)
        categoryStyles() {
            return categoryStyles;
        },
        categoryOptions() {
            // Devuelve las categorías únicas, normalizadas y capitalizadas para mostrar
            const cats = this.posts.map(p => (p.category || '').toLowerCase().trim()).filter(Boolean);
            // Capitaliza la primera letra para mostrar bonito
            return [...new Set(cats)].map(cat => cat.charAt(0).toUpperCase() + cat.slice(1)).sort();
        },
        filteredPosts() {
            if (this.orderBy === 'todos') return this.posts;
            if (this.orderBy === 'seguidos') return this.posts.filter(post => this.authUser.following && this.authUser.following.includes(post.user_id));
            // Si orderBy es una categoría, compara normalizando
            return this.posts.filter(post => (post.category || '').toLowerCase().trim() === this.orderBy.toLowerCase().trim());
        },
    },
    methods: {
        // Método para manejar la creación de una publicación
        handleCreatePost(postData) {
            // Agrega la información del usuario al post
            postData.user_id = this.authUser.id;
            postData.email = this.authUser.email;
            postData.displayName = this.authUser.displayName;
            postData.communityId = null;        // Para Home, communityId es null (no pertenece a una comunidad)
            postData.photoURL = this.authUser.photoURL;

            // Guarda la publicación en Firestore
            savePost(postData)
                .then(() => {
                // Opcional: mostrar mensaje o reiniciar el formulario
                })
                .catch((error) => console.error("Error al crear post:", error));
        },

        // Método para manejar la subida de una imagen de portada
        handleUploadCover(file, callback) {
            uploadFileToStorage(file, `posts/cover/${file.name}`)
                .then((url) => callback(url))           // Retorna la URL de la imagen subida
                .catch((error) => console.error("Error al subir la portada:", error));
        },

        // Método para alternar el estado de guardado de una publicación
        async toggleSave(postId) {
            try {
                // Llama a la función para alternar el estado de guardado
                const isPostSaved = await toggleSavePost(this.authUser.id, postId);
                if (isPostSaved) {
                    // Si el post se guardó, lo añade a la lista de guardados
                    this.savedPosts.push(postId);
                } else {
                    // Si el post se eliminó, lo quita de la lista de guardados
                    this.savedPosts = this.savedPosts.filter(id => id !== postId);
                }
            } catch (error) {
                console.error("Error al alternar el estado de guardado:", error);
            }
        },

        // Método para alternar el "like" de una publicación
        async toggleLike(postId) {
            try {
                // Llama a la función para alternar el "like"
                await toggleReaction(postId, "like", this.authUser.id);
                this.updatePost(postId);            // Actualiza los datos de la publicación
            } catch (error) {
                console.error("Error al dar like", error);
            }
        },

        // Método para alternar el "dislike" de una publicación
        async toggleDislike(postId) {
            try {
                // Llama a la función para alternar el "dislike"
                await toggleReaction(postId, "dislike", this.authUser.id);
                this.updatePost(postId);            // Actualiza los datos de la publicación
            } catch (error) {
                console.error("Error al dar dislike", error);
            }
        },

        // Método para verificar si el usuario dio "like" a una publicación
        isLiked(postId) {
            const post = this.posts.find(p => p.id === postId);
            return post && post.likes && post.likes.includes(this.authUser.id);
        },

        // Método para verificar si el usuario dio "dislike" a una publicación
        isDisliked(postId) {
            const post = this.posts.find(p => p.id === postId);
            return post && post.dislikes && post.dislikes.includes(this.authUser.id);
        },

        // Método para suscribirse a los comentarios de una publicación
        subscribeToPostComments(postId) {
            if (!this.comments[postId]) {
                this.comments[postId] = [];
            }
            return subscribeToComments(postId, newComments => {
                this.comments[postId] = newComments;        // Actualiza los comentarios de la publicación
            });
        },

        // Método para formatear una fecha
        formatDate(date) {
            return Intl.DateTimeFormat('es-AR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
            }).format(date).replace(',', '');
        },

        // Método para navegar a la página de una publicación
        goToPost(postId) {
            this.$router.push(`/post/${postId}`);
        },

        // Método para actualizar los datos de una publicación
        async updatePost(postId) {
            const postIndex = this.posts.findIndex(p => p.id === postId);
            if (postIndex !== -1) {
                // Obtiene los datos actualizados de la publicación (likes y dislikes)
                this.posts[postIndex] = await getLikesAndDislikes(postId);
            }
        },
    },
    mounted() {

        // Suscribe el componente a los cambios en la autenticación del usuario
        this.unsubscribeFromAuth = subscribeToAuth(async (newUserData) => {
            this.authUser = newUserData;        // Actualiza los datos del usuario autenticado
            this.loadingUser = false;           // Indica que los datos del usuario ya no están cargando

            if (this.authUser && this.authUser.id) {
                try {
                    // Obtiene las publicaciones guardadas por el usuario
                    this.savedPosts = await getSavedPosts(this.authUser.id);

                    // Obtiene las comunidades a las que pertenece el usuario
                    this.userCommunities = (await getUserCommunities(this.authUser.id)).map(community => community.id) || [];

                    // Suscribe el componente a los cambios en las publicaciones
                    this.unsubscribeFromPosts = subscribeToPosts(newPosts => {

                        // Filtra las publicaciones que no pertenecen a una comunidad o que pertenecen a una comunidad del usuario
                        this.posts = newPosts.filter(post => !post.communityId || this.userCommunities.includes(post.communityId));
                        this.loadingPosts = false;          // Indica que las publicaciones ya no están cargando

                        // Suscribe el componente a los comentarios de cada publicación
                        newPosts.forEach(post => {
                            if (!this.comments[post.id]) {
                                this.comments[post.id] = [];
                            }
                            this.subscribeToPostComments(post.id);
                        });
                    });
                } catch (error) {
                    console.error("Error al obtener los posts guardados o las comunidades:", error);
                    this.savedPosts = [];
                    this.userCommunities = [];
                }
            }
        });
    },

    // Cancela las suscripciones al desmontar el componente
    unmounted() {
        if (this.unsubscribeFromAuth) this.unsubscribeFromAuth();
        if (this.unsubscribeFromPosts) this.unsubscribeFromPosts();
        Object.keys(this.comments).forEach(postId => {
            if (this.comments[postId].unsubscribe) {
                this.comments[postId].unsubscribe();
            }
        });
    }};
</script>

<template>

    <template v-if="authUser.id === null">
        <div class="content" >

            <div class="banner">

                <div class="banner-content">
                    <div class="banner-1">
                        <h1>Bienvenidos a <br/>GamingKingdom</h1>
                        <p>Entra en el reino de los videojuegos donde la pasión, la comunidad y la aventura se encuentran. Únete a nosotros para compartir tus experiencias, descubrir nuevos juegos y conectar con jugadores de todo el mundo.</p>
                        <div class="banner-cta">
                            <button class="login-cta" @click="$router.push('/iniciar-sesion')">
                                Iniciar sesión
                            </button>
                            <button class="register-cta" @click="$router.push('/registro')">
                                Registrarse
                            </button>
                        </div>
                    </div>

                    <div class="banner-2">
                        <img alt="Isologotipo de GamingKingdom" src="/assets/isotipo.svg" class="banner-img">
                    </div>
                </div>
            </div>

            <section>
                <div class="quienes-somos" id="nosotros">

                    <div class="p1">
                        <div class="p1-content">
                            <p>En GamingKingdom, somos una comunidad apasionada de jugadores que va más allá de solo disfrutar de los videojuegos. Creado por un chico normal al que le gustaba jugar, este foro es un espacio dedicado a conectar a jugadores de todo el mundo, promoviendo la interacción, el aprendizaje y el intercambio de experiencias. Creemos en el poder de los videojuegos para unir a las personas, y nuestro objetivo es crear un entorno inclusivo y acogedor donde todos los jugadores, desde principiantes hasta expertos, puedan sentirse en casa.</p>
                        </div>
                        <div class="image">
                            <img alt="Jefe Maestro" src="/assets/home/home-1.jpg">
                            <img alt="Orco de la Horda y soldado de la Alianza luchando" src="/assets/home/home-3.jpg">
                        </div>
                    </div>
                    
                    <div class="p2">
                        <div class="p2-content">
                            <p>Nuestro foro no es solo un lugar para discutir estrategias y compartir logros, sino también una plataforma para descubrir lo inesperado y explorar nuevos horizontes en el mundo de los videojuegos. Vas a tener la posibilidad de interactuar, compartir tus gustos y expresarte libremente. Aquí, cada miembro tiene la oportunidad de contribuir y crecer dentro de una comunidad que valora la creatividad, la camaradería y la pasión por los videojuegos. ¡Únete a nosotros y sé parte de la aventura nuestra familia!</p>

                        </div>
                        <div class="image">
                            <img alt="Ser de Ceniza avivando una hoguera" src="/assets/home/home-2.jpg">
                            <img alt="Link escalando una montaña" src="/assets/home/home-4.jpg">
                        </div>
                    </div>
                </div>
            </section>

            <section>
                <div class="section-2">
                    <div class="section-2-content">
                        <div class="section-2-text">
                            <h2>Conectate con jugadores alrededor del mundo</h2>
                        </div>
                        <div class="section-2-image">
                            <img src="/assets/home/mapa.png" alt="Ilustración de jugadores conectados alrededor del mundo">
                        </div>
                    </div>
                </div>
            </section>

        </div>
    </template>

    <template v-else>
        <div class="feed">

            <PostForm
                :initialPostData="{ title: '', content: '', category: 'General', cover: '' }"
                @create-post="handleCreatePost"
                @upload-cover="handleUploadCover"
            />

            <OrderDropdown v-model="orderBy" :categories="categoryOptions" class="mb-4" />

            <div class="w-[100%]">
                <div class="p-4 w-[95vw] m-auto">
                    <ul v-if="!loadingPosts" class="masonry-gallery">
                        <li v-for="post in filteredPosts" :key="post.id" class="item">

                            <PostItem
                                :post="post"
                                :category-styles="categoryStyles"
                                :comments-count="comments[post.id] ? comments[post.id].length : 0"
                                :current-user-id="authUser.id"
                                :following-list="authUser.following || []"
                                @go-to-post="goToPost"
                                @toggle-like="toggleLike"
                                @toggle-dislike="toggleDislike"
                                :is-post-saved="savedPosts.includes(post.id)"
                                @toggle-save="toggleSave"
                            />
                            
                        </li>
                    </ul>
                    <div v-else class="flex justify-center mt-40">
                        <Loader />
                    </div>
                </div>
            </div>
        </div>
    </template>

</template>


<style scoped>

    /* .content{
        padding: 0 10%;
    } */

    section, .banner{
        padding: 0 10%;
    }

    section:nth-child(2){
        background: black;
        color: white;
        padding: 3rem 10%;
    }

    .banner{
        width: 100%;
        align-content: center;
        padding: 5rem 10% 10rem 10%;
    }

    .banner .banner-content{
        display: flex;
        justify-content: space-around;
        align-items: center;
        gap: 50px;
    }

    .banner .banner-content .banner-1 h1{
        font-family: "Jersey 15", sans-serif;
        font-size: 6rem;
        letter-spacing: 5px;
        padding-left: 0;
        max-width: none;
        font-weight: 500;
        line-height: 1;
    }

    .banner .banner-content .banner-1 p{
        max-width: 40vw;
        padding: 3rem 0;
    }

    .banner .banner-content .banner-2 img{
        max-width: 100%;
        width: 100%;
        min-width: 400px;
    }

    .banner .banner-content .banner-1 .banner-cta{
        display: flex;
        width: 100%;
        padding-top: 2rem;
    }

    .banner .banner-content .banner-1 .banner-cta .login-cta,
    .banner .banner-content .banner-1 .banner-cta .register-cta{
        padding: 1rem 2rem;
        color: white;
        border-radius: 100px;
    }

    .banner .banner-content .banner-1 .banner-cta .login-cta a,
    .banner .banner-content .banner-1 .banner-cta .register-cta a{
        color: white;
        text-decoration: none;
    }

    .banner .banner-content .banner-1 .banner-cta .login-cta{
        background: #C0282E;
    }

    .banner .banner-content .banner-1 .banner-cta .login-cta:hover{
        background: #9b2024;
        transition-property: background, border;
        transition-duration: .5s;
        border: 1px solid black;
    }

    .banner .banner-content .banner-1 .banner-cta .register-cta{
        background: #0d71b8;
        margin-left: 1.5rem;
    }

    
    .banner .banner-content .banner-1 .banner-cta .register-cta:hover{
        background: #0a5f9c;
        transition-property: background, border;
        transition-duration: .5s;
        border: 1px solid black;
    }

    @media screen and (max-width: 1340px) {

        .banner .banner-content .banner-1 h1{
            font-size: 5rem;
        }

        .banner .banner-content .banner-2 img{
            min-width: auto;
        }

        .section-2 .section-2-content .section-2-text h2{
            line-height: 1;
        }
    }

    @media screen and (max-width: 1023px) {
        
        .banner .banner-content{
            flex-direction: column-reverse;
            align-items: center;
        }

        .banner .banner-content .banner-1 h1{
            text-align: center;
            width: 100%;
        }

        .banner .banner-content .banner-1 .banner-cta{
            margin: auto;
            width: fit-content;
        }

    }


    @media screen and (max-width: 640px) {
        
        .banner .banner-content .banner-1 h1{
            font-size: 4rem;
        }

        .banner .banner-content .banner-1 .banner-cta{
            flex-direction: column;
            width: 100%;
            padding-top: 2rem;
        }

        .banner .banner-content .banner-1 .banner-cta .register-cta,
        .banner .banner-content .banner-1 .banner-cta .login-cta{
            text-align: center;
        }


        .banner .banner-content .banner-1 .banner-cta .register-cta{
            background: #0d71b8;
            margin-left: 0;
            margin-top: 1rem;
        }
    }

    @media screen and (max-width: 479px) {
        .banner .banner-content .banner-1 h1{
            font-size: 3rem;
        }
    
    }

    .text-heading{
        font-size: 5rem;
        margin-bottom: 5rem;
        text-decoration: underline;
        font-family: "Jersey 15", sans-serif;
    }

    .p1, .p2{
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: 4.5rem;
    }

    .p2{
        flex-direction: row-reverse;
        margin-bottom: 5rem;
    }

    .p1-content, .p2-content {
        width: 45%;
        text-align: start;
        font-size: 1.1rem;
    }

    .image{
        position: relative;
        width: 50%;
        display: flex;
        justify-content: space-between;
    }

    .image img{
        max-width: 49%;
        min-height: 350px;
        object-fit: cover;
        /* box-shadow: -1px 1px 60px -20px rgba(0, 0, 0, 0.20); */
        padding-top: 2rem;
    }

    .image img:nth-child(2){
        position: absolute;
        top: -10%;
        right: 0;
    }

    .section-2 .section-2-content{
        display: grid;
        grid-template-columns: 50% 50%;
        padding: 5rem 0;
    }

    .section-2 .section-2-content .section-2-text{
        display: flex;
        align-items: center;
    }

    .section-2 .section-2-content .section-2-text h2{
        font-size: 4.5rem;
        font-family: "Jersey 15", sans-serif;
        letter-spacing: 3px;
    }

    .section-2 .section-2-content .section-2-image{
        display: flex;
        align-items: center;
    }

    .section-2 .section-2-content .section-2-image img{
        max-width: 100%;
    }

    .feed-heading{
        font-family: "Jersey 15" , "sans-serif";
        font-size: 4rem;
        text-align: center;
        padding: 3rem 0 5rem 0;
    }

    #posts ul{
        display: grid;
        grid-template-columns: 30% 30% 30%;
        gap:20px;
    }



    @media screen and (max-width:1023px) {
        
        .section-2 .section-2-content{
            display: flex;
            flex-direction: column;
        }

        .section-2 .section-2-content .section-2-text h2{
            padding-bottom: 3rem;
        }

        .banner .banner-content .banner-1 p{
            max-width: none;
            padding: 2rem 0 1rem 0;
        }

    }


    @media screen and (max-width: 479px) {
        .section-2 .section-2-content .section-2-text h2{
            font-size: 3rem;
        }
    }




    /* Responsive */



    @media screen and (max-width: 850px){

        .text-heading{
            font-size: 2rem;
        }

        .p1, .p2{
            display: flex;
            flex-direction: column-reverse;
            margin-top: 2.5rem;
        }

        .p2{
            margin-bottom: 1rem;
        }

        .p1-content, .p2-content{
            width: 100%;
            margin: 2rem 0;
        }

        .image{
            width: 100%;
            margin: 2rem 0;
        }

        .image img{
            min-height: 250px;
        }
    }

    .feed{
        margin: auto;
        padding: 1rem 0 5rem 0;
    }

    .masonry-gallery {
        columns: 3; 
        column-gap: 50px; 
        list-style-type: none; 
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

    .user-pic{
        height: 35px;
        width: 35px;
        object-fit: cover;
        margin-right: 1rem;
    }




    @media screen and (max-width: 1100px) {
        .masonry-gallery {
            columns: 2; 
        }
    }



    @media screen and (max-width: 700px){
        .masonry-gallery {
            columns: 1; 
        }

        .feed{
            padding: .1rem 0 1rem 0;
        }
    };

    @media screen and (min-width: 1360px){
        .masonry-gallery {
            columns: 4; 
        }
    }




    .quill-editor {
        min-height: 100px;
        border: 1px solid #ccc;
        padding: 10px;
        background-color: white;
    }


    .post-actions button:nth-child(2){
        padding-left: 2rem;
    }

    .post-actions button i{
        padding-right: 5px;
    }

    .post-thumbnail{
        font-weight: bold;
    }

    .post-cover{
        width: 100%;
        object-fit: cover;
    }

    .post-thumbnail .post-info{
        padding: 1rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .post-thumbnail .post-info .post-date{
        font-weight: lighter;
        color: #848687;
    }

    /* .post-thumbnail .post-info .post-category{
        padding: 5px 20px;
        color: white;
    } */

    .post-thumbnail .post-info .post-category i{
        padding-right: 10px;
    }

    .post-title, .post-actions{
        padding: 0 1rem;
    }

    .post-title{
        font-size: 1.25rem;
        font-weight: 600;
    }

    .post-actions{
        padding: 1.5rem 1rem 1rem 1rem;
    }
    
</style>