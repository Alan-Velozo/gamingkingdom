<script>
  import { getCommunity, isUserInCommunity, toggleCommunityMembership } from '../../services/community'; 
  import { subscribeToPosts, subscribeToComments, getLikesAndDislikes, toggleReaction, savePost, categories, categoryStyles, toggleSavePost, getSavedPosts } from '../../services/post'; 
  import { uploadFileToStorage } from '../../services/storage'; 
  import { subscribeToAuth } from '../../services/auth'; 
  import PostForm from '../../components/PostForm.vue'; 
  import Loader from "../../components/Loader.vue"; 
  import PostItem from '../../components/PostItem.vue'; 

  export default {
    name: "Community", 
    components: { PostForm, Loader, PostItem }, 
    data() {
      return {
        community: null, // Datos de la comunidad
        authUser: { // Datos del usuario autenticado
          id: null,
          email: null,
          photoURL: null,
          displayName: null,
        },
        isMember: false, // Indica si el usuario es miembro de la comunidad
        loadingUser: true, // Indica si los datos del usuario están cargando
        posts: [], // Lista de publicaciones de la comunidad
        loadingPosts: true, // Indica si las publicaciones están cargando
        comments: {}, // Comentarios de las publicaciones (organizados por ID de publicación)
        savedPosts: [], // Lista de publicaciones guardadas por el usuario
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
    },
    methods: {
      // Método para alternar la membresía del usuario en la comunidad
      async handleToggleMembership() {
        try {
          // Llama a la función para alternar la membresía
          const isNowMember = await toggleCommunityMembership(this.authUser.id, this.community.id);
          this.isMember = isNowMember; // Actualiza el estado de membresía
          console.log(isNowMember ? "Unido a la comunidad." : "Eliminado de la comunidad.");
        } catch (error) {
          console.error("Error:", error);
        }
      },

      // Método para manejar la creación de una publicación
      handleCreatePost(postData) {
        // Agrega la información del usuario al post
        postData.user_id = this.authUser.id;
        postData.email = this.authUser.email;
        postData.displayName = this.authUser.displayName;
        postData.photoURL = this.authUser.photoURL;
        // Asigna el ID de la comunidad al post
        postData.communityId = this.community.id;
        // Guarda la publicación en Firestore
        savePost(postData)
          .then(() => {
            
          })
          .catch((error) => console.error("Error al crear post:", error));
      },

      // Método para manejar la subida de una imagen de portada
      handleUploadCover(file, callback) {
        uploadFileToStorage(file, `posts/cover/${file.name}`)
          .then((url) => callback(url)) // Retorna la URL de la imagen subida
          .catch((error) => console.error("Error al subir la portada:", error));
      },

      // Método para alternar el estado de guardado de una publicación
      async toggleSave(postId) {
        try {
          // Llama a la función para alternar el estado de guardado
          const isPostSaved = await toggleSavePost(this.authUser.id, postId);
          if (isPostSaved) {
            // Si el post se guardó, lo agrega a la lista de guardados
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
          this.updatePost(postId); // Actualiza los datos de la publicación
        } catch (error) {
          console.error("Error al dar like", error);
        }
      },

      // Método para alternar el "dislike" de una publicación
      async toggleDislike(postId) {
        try {
          // Llama a la función para alternar el "dislike"
          await toggleReaction(postId, "dislike", this.authUser.id);
          this.updatePost(postId); // Actualiza los datos de la publicación
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

      // Método para formatear una fecha
      formatDate(date) {
        return Intl.DateTimeFormat("es-AR", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(date).replace(",", "");
      },

      // Método para navegar a la página de una publicación
      goToPost(postId) {
        this.$router.push(`/post/${postId}`);
      },

      // Método para actualizar los datos de una publicación
      async updatePost(postId) {
        const index = this.posts.findIndex(p => p.id === postId);
        if (index !== -1) {
          // Obtiene los datos actualizados de la publicación (likes y dislikes)
          this.posts[index] = await getLikesAndDislikes(postId);
        }
      },

      // Método para suscribirse a los comentarios de una publicación
      subscribeToPostComments(postId) {
        if (!this.comments[postId]) {
          this.comments[postId] = [];
        }
        return subscribeToComments(postId, newComments => {
          this.comments[postId] = newComments; // Actualiza los comentarios de la publicación
        });
      },
    },
    async mounted() {
      // Obtiene el ID de la comunidad desde la ruta
      const communityId = this.$route.params.id;
      // Obtiene los datos de la comunidad
      this.community = await getCommunity(communityId);

      // Suscribe el componente a los cambios en la autenticación del usuario
      this.unsubscribeFromAuth = subscribeToAuth(async (user) => {
        this.authUser = user; // Actualiza los datos del usuario autenticado
        this.loadingUser = false; // Indica que los datos del usuario ya no están cargando

        if (this.authUser.id) {
          try {
            // Verifica si el usuario es miembro de la comunidad
            this.isMember = await isUserInCommunity(this.authUser.id, this.community.id);
            // Obtiene las publicaciones guardadas por el usuario
            this.savedPosts = await getSavedPosts(this.authUser.id);
          } catch (error) {
            console.error("Error al obtener los posts guardados:", error);
            this.savedPosts = [];
          }
        }
      });

      // Suscribe el componente a los cambios en las publicaciones
      this.unsubscribeFromPosts = subscribeToPosts(newPosts => {
        // Filtra las publicaciones que pertenecen a la comunidad actual
        this.posts = newPosts.filter(post => post.communityId === this.community.id);
        this.loadingPosts = false; // Indica que las publicaciones ya no están cargando

        // Suscribe el componente a los comentarios de cada publicación
        newPosts.forEach(post => {
          if (!this.comments[post.id]) {
            this.comments[post.id] = [];
          }
          this.subscribeToPostComments(post.id);
        });
      });
    },
    beforeUnmount() {
      // Cancela las suscripciones para evitar fugas de memoria
      if (this.unsubscribeFromAuth) this.unsubscribeFromAuth();
      if (this.unsubscribeFromPosts) this.unsubscribeFromPosts();
      Object.keys(this.comments).forEach(postId => {
        if (this.comments[postId].unsubscribe) {
          this.comments[postId].unsubscribe();
        }
      });
    },
  };
</script>

<template>
  <div v-if="community" class="community-container">
    <!-- Banner -->
    <div class="banner-container">
      <img :src="community.bannerURL || defaultBanner" alt="Banner de la comunidad" class="banner">
    </div>

    <!-- Sección de perfil -->
    <div class="profile-section">
      <div class="profile-image">
        <img :src="community.photoURL || defaultPhoto" alt="Foto de la comunidad" class="profile-pic">
      </div>
      <h1>{{ community.name }}</h1>
      <div class="cta">
        <button
          :class="isMember ? 'leave-button' : 'join-button'"
          @click="handleToggleMembership"
        >
          {{ isMember ? '- Salir' : '+ Unirme' }}
        </button>

        <router-link :to="`/chat/community/${community.id}`" class="chat-button"><i class="fa-solid fa-comments" style="color: #ffffff;"></i> Chat</router-link>
      </div>
    </div>
    <p class="community-description">{{ community.description }}</p>

    <!-- Botón para actualizar imágenes -->
    <div class="posts">

      <PostForm
        :initialPostData="{ title: '', content: '', category: 'General', cover: '' }"
        :community-id="community.id"
        @create-post="handleCreatePost"
        @upload-cover="handleUploadCover"
      />

      <!-- Listado de publicaciones -->
      <section class="w-[100%]">
        <div class="p-4 w-[95vw] m-auto pb-20">
          <ul v-if="!loadingPosts" class="masonry-gallery">
            <li v-for="post in posts" :key="post.id" class="item">       
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
        </div>
      </section>
    </div>
  </div>

  <div v-else class="min-h-[70vh] flex justify-center items-center">
    <Loader/>
  </div>
</template>
  
<style>
  /* .community-container {
    text-align: center;
  } */
  
  .banner-container {
    width: 100%;
    height: 400px;
    overflow: hidden;
  }
  
  .banner {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .profile-section {
    display: flex;
    align-items: center;
    gap: 20px;
    margin: auto;
    margin-top: -100px;
    padding: 20px;
    max-width: 80%;
  }
  
  .profile-image {
    flex-shrink: 0;
  }
  
  .profile-pic {
    width: 250px;
    height: 250px;
    border: 3px solid black;
    object-fit: cover;
    margin-top: -50px;
  }
  
  .profile-info {
    text-align: left;
    padding-left: 2rem;
  }
  
  h1 {
    font-size: 2.5rem;
    margin-top: 100px;
    font-weight: bold;
    max-width: 400px;
    word-wrap: break-word;
    padding-left: 2rem;
  }
  
  .community-description{
    word-wrap: break-word;
    max-width: 80%;
    margin: auto;
    padding: 3rem 0 1rem 0;
  }

  .cta{
    margin-left:auto;
    display: flex;
    padding-top: 50px;
  }
  
  .join-button, .chat-button, .leave-button {
    background-color: #0d76bc;
    color: white;
    border: none;
    padding: 10px 20px;
    font-size: 1rem;
    cursor: pointer;
    border-radius: 5px;
  }
  
  .join-button:hover {
    background-color: #0056b3;
    transition-duration: .5s;
    transition-duration: .5s;
  }

  .chat-button{
    background: #bf3138;
    margin-left: 1rem
  }

  .chat-button:hover{
    background-color: #99282d;
    transition-duration: .5s;
    transition-duration: .5s;
  }

  .leave-button{
    background: #613b93;
  }

  .leave-button:hover{
    background-color: #532096;
    transition-duration: .5s;
    transition-duration: .5s;
  }
  
  .update-images {
    margin-top: 20px;
  }
  
  .update-images input {
    display: block;
    margin: 10px auto;
  }

  /* .posts{
    margin-top: 100px;
  } */

  #posts ul{
    display: grid;
    grid-template-columns: 30% 30% 30%;
    gap:20px;
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

  @media screen and (max-width: 1100px) {
    .masonry-gallery {
      columns: 2; 
    }
  }

  @media screen and (max-width: 700px){
    .masonry-gallery {
      columns: 1; 
    }
  };

  @media screen and (min-width: 1360px){
    .masonry-gallery {
      columns: 4; 
    }
  }

  @media screen and (max-width: 1280px){
    .profile-section {
      display: flex;
      align-items: center;
      gap: 20px;
      margin: auto;
      margin-top: -100px;
      padding: 20px;
      max-width: 95%;
    }
  }

  @media screen and (max-width: 1023px) {
    .profile-section {
      flex-direction: column; 
      padding: 0;
    }
  
    .profile-info {
      text-align: center;
      padding-left: 0;
    }

    h1 {
      margin-top: 0;
      text-align: center;
      font-size: 1.75rem;
      margin-top: 0;
      width: fit-content;
      padding-left: 0;
    }

    .cta{
      margin: auto;
      padding-top: 0;
    }
  }

  .create-post{
    padding: 0 10%;
    margin: 5rem 0;
  }

</style>
