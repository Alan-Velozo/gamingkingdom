<script>
  import { subscribeToPosts, subscribeToComments, saveComment, getLikesAndDislikes, toggleReaction, toggleCommentReaction, toggleSavePost, getSavedPosts } from '../services/post'; 
  import { subscribeToAuth } from '../services/auth'; 
  import Loader from "../components/Loader.vue";
  import Quill from 'quill';
  import 'quill/dist/quill.snow.css';

  export default {
    components: { Loader },
    data() {
      return {
        post: null, // El post que se mostrará
        comments: [], // Los comentarios del post
        newComment: '', // Contenido del nuevo comentario
        postId: this.$route.params.id, // Obtener el ID del post desde la ruta
        authUser: null, // Datos del usuario autenticado
        unsubscribeAuth: null, // Para limpiar suscripciones de autenticación
        commentEditor: null, // Instancia del editor Quill para comentarios
        isImage: true, // Indica si el contenido es una imagen o video
        isSaved: false, // Indica si el post está guardado por el usuario
        loading: true, // Indica si los datos están cargando
      };
    },
    methods: {
      // Formatea una fecha a formato local
      formatDate(date) {
        return Intl.DateTimeFormat('es-AR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }).format(date).replace(',', '');
      },
      
      // Obtiene el post específico desde la lista de posts
      fetchPost() {
        subscribeToPosts((posts) => {
          const foundPost = posts.find((post) => post.id === this.postId); // Buscar el post por ID
          if (foundPost) {
            this.post = foundPost;
            this.loading = false;
          }
        });
      },
      
      // Obtiene los comentarios del post en tiempo real
      fetchComments() {
        subscribeToComments(this.postId, (comments) => {
          this.comments = comments; // Actualizamos los comentarios
          this.loading = false;
        });
      },
      
      // Envía un nuevo comentario
      submitComment() {
        // Eliminar etiquetas HTML y espacios en blanco para validar
        const strippedContent = this.newComment.replace(/<[^>]+>/g, '').trim();

        // Validar si el comentario está vacío o solo contiene espacios
        if (strippedContent === '') {
          return;
        }

        // Crear objeto del comentario con datos del usuario
        const comment = {
          user_id: this.authUser.id,
          email: this.authUser.email,
          displayName: this.authUser.displayName,
          content: this.newComment, // Guardar el contenido con las etiquetas HTML
          photoURL: this.authUser.photoURL, // URL del avatar del usuario
        };

        // Guardar el comentario y limpiar el editor
        saveComment(this.postId, comment).then(() => {
          // Limpiar el editor Quill
          if (this.commentEditor) {
            this.commentEditor.root.innerHTML = ''; // Limpiar el contenido del editor
          }
          this.newComment = ''; // Reiniciar la variable newComment
        });
      },

      // Alterna el estado de guardado del post
      async toggleSave() {
        try {
          const isNowSaved = await toggleSavePost(this.authUser.id, this.postId);
          this.isSaved = isNowSaved; // Actualiza el estado de guardado
        } catch (error) {
          console.error("Error al guardar/desguardar el post:", error);
        }
      },

      // Verifica si el post está guardado por el usuario
      async checkIfPostIsSaved() {
        if (this.authUser && this.postId) {
          try {
            const savedPostIds = await getSavedPosts(this.authUser.id);
            this.isSaved = savedPostIds.includes(this.postId); // Verifica si el post está guardado
          } catch (error) {
            console.error("Error al verificar si el post está guardado:", error);
          }
        }
      },
      
      // Alterna el "like" del post
      async toggleLike() {
        try {
          await toggleReaction(this.postId, "like", this.authUser.id);
          this.updatePost();
        } catch (error) {
          console.error("Error al dar like", error);
        }
      },
      
      // Alterna el "dislike" del post
      async toggleDislike() {
        try {
          await toggleReaction(this.postId, "dislike", this.authUser.id);
          this.updatePost();
        } catch (error) {
          console.error("Error al dar dislike", error);
        }
      },
      
      // Verifica si el usuario dio "like" al post
      isLiked() {
        return this.post && this.post.likes && this.post.likes.includes(this.authUser.id);
      },
      
      // Verifica si el usuario dio "dislike" al post
      isDisliked() {
        return this.post && this.post.dislikes && this.post.dislikes.includes(this.authUser.id);
      },
      
      // Actualiza los datos del post (likes y dislikes)
      async updatePost() {
        // Actualiza solo los likes/dislikes del post
        const updated = await getLikesAndDislikes(this.postId);
        if (updated) {
          this.post.likes = updated.likes;
          this.post.dislikes = updated.dislikes;
        }
      },
      
      // Alterna el "like" de un comentario
      async toggleCommentLike(comment) {
        try {
          await toggleCommentReaction(this.postId, comment.id, "like", this.authUser.id);
        } catch (error) {
          console.error("Error al dar like al comentario:", error);
        }
      },
      
      // Alterna el "dislike" de un comentario
      async toggleCommentDislike(comment) {
        try {
          await toggleCommentReaction(this.postId, comment.id, "dislike", this.authUser.id);
        } catch (error) {
          console.error("Error al dar dislike al comentario:", error);
        }
      },
      
      // Verifica si el usuario dio "like" a un comentario
      isCommentLiked(comment) {
        return comment.likes && comment.likes.includes(this.authUser.id);
      },
      
      // Verifica si el usuario dio "dislike" a un comentario
      isCommentDisliked(comment) {
        return comment.dislikes && comment.dislikes.includes(this.authUser.id);
      },

      // Maneja errores de carga de imagen
      onImageError() {
        // Si ocurre un error al cargar la imagen, asumimos que no es una imagen y mostramos video
        this.isImage = false;
      }
    },

    computed: {
      // Verifica si el comentario está vacío para deshabilitar el botón de envío
      isCommentEmpty() {
        const strippedContent = this.newComment.replace(/<[^>]+>/g, '').trim();
        return strippedContent === '';
      }
    },
    mounted() {
      // Suscribir al usuario autenticado
      this.unsubscribeAuth = subscribeToAuth((newUserData) => {
        this.authUser = newUserData; // Actualizar los datos del usuario autenticado
        this.checkIfPostIsSaved();
      });

      // Obtener post y comentarios
      this.fetchPost();
      this.fetchComments();

      // Inicializar Quill para los comentarios después de que el DOM esté listo
      this.$nextTick(() => {
        const commentContainer = this.$refs.commentEditor;
        if (commentContainer) {
          // Crea una nueva instancia del editor Quill
          this.commentEditor = new Quill(commentContainer, {
            theme: 'snow',
            placeholder: 'Escribe un comentario...',
            modules: {
              toolbar: [
                      ['bold', 'italic', 'underline', 'strike'],
                      ['link'],
                  ],
              clipboard: {
                // Opcional: eliminar formatos al pegar
                matchVisual: false,
              },
            },
          });
          
          // Escucha cambios en el editor para actualizar newComment
          this.commentEditor.on('text-change', () => {
            this.newComment = this.commentEditor.root.innerHTML;
          });
          
          // Elimina formatos al pegar contenido (solo texto plano)
          this.commentEditor.clipboard.addMatcher(Node.ELEMENT_NODE, (node, delta) => {
            delta.ops = delta.ops.map(op => {
              if (op.insert && typeof op.insert === 'string') {
                return { insert: op.insert };
              }
              return op;
            });
            return delta;
          });
        } else {
          console.error("El contenedor para el editor de comentarios no está disponible.");
        }
      });
    },
    beforeUnmount() {
      // Limpiar las suscripciones para evitar fugas de memoria
      if (this.unsubscribeAuth) this.unsubscribeAuth();
    },
  };
</script>

<template>



  <div>
    <div v-if="loading" class="min-h-[70vh] flex justify-center items-center">
      <Loader />
    </div>
    <div v-else>
      <!-- Mostrar el post -->
      <div v-if="post" class="post">
        <router-link :to="post.user_id === authUser.id ? '/perfil' : `/usuario/${post.user_id}`">
          <div class="post-info">
            <img :src="post.photoURL" alt="Post imagen" v-if="post.photoURL" />
            <p class="post-username">
              {{ post.displayName }}
              <span v-if="authUser && authUser.following && authUser.following.includes(post.user_id)" class="ml-10 align-middle">
                <router-link :to="`/usuario/${post.user_id}`" @click.stop>
                  <i class="fa-solid fa-user-check" title="Sigues a este usuario"></i>
                </router-link>
              </span>
            </p>
            <p v-if="post.created_at !== null" class="post-date">
              {{ formatDate(post.created_at.toDate()) }}
            </p>
          </div>
        </router-link>

        <div class="post-cover">
          <img v-if="isImage" :src="post.cover" class="m-auto pb-10" @error="onImageError"/>
          <video v-else :src="post.cover" class="m-auto pb-10" controls></video>
          <h1>{{ post.title }}</h1>
        </div>
        
        <div v-html="post.content" class="post-content"></div>

        <div class="post-actions">
          <button @click.prevent="toggleLike" :class="{ liked: isLiked() }">
            <i class="fa-solid fa-up-long" style="color: #0d76bc;"></i> 
            <!-- {{ post.likes ? post.likes.length : 0 }} -->
            <span :style="{ color: isLiked() ? '#0d76bc' : 'black' }">
              {{ post.likes ? post.likes.length : 0 }}
            </span>
          </button>
          <button @click.prevent="toggleDislike" :class="{ disliked: isDisliked() }">
            <i class="fa-solid fa-down-long" style="color: #bf3138;"></i> 
            <!-- {{ post.dislikes ? post.dislikes.length : 0 }} -->
            <span :style="{ color: isDisliked() ? '#bf3138' : 'black' }">
              {{ post.dislikes ? post.dislikes.length : 0 }}
            </span>
          </button>

          <button class="comment-counter">
            <i class="fa-regular fa-comment" style="color: #000000;"></i> {{ comments.length || 0 }}
          </button>

          <button 
            v-if="post.user_id !== authUser.id" 
            @click.prevent="toggleSave" 
            :class="{ saved: isSaved }" 
            id="save-btn">
            <i :class="isSaved ? 'fa-solid fa-bookmark' : 'fa-regular fa-bookmark'"></i>
          </button>

        </div>
      </div>
    </div>






      <!-- Formulario para agregar un comentario -->
    <div class="comment-input-container">
      <!-- Contenedor para el editor de comentario -->
      <div ref="commentEditor" class="quill-comment-editor"></div>
      <button @click="submitComment" :disabled="isCommentEmpty" class="submit-comment-button">Comentar</button>
    </div>







    <!-- Mostrar los comentarios -->
    <div v-if="comments.length" class="comments-section">
      <ul>
        <li v-for="comment in comments" :key="comment.id">
          <div class="comment">
            <router-link :to="comment.user_id === authUser.id ? '/perfil' : `/usuario/${comment.user_id}`">
              <div class="comment-info">
                  <img :src="comment.photoURL" alt="Comment foto" v-if="comment.photoURL" class="comment-photo" />
                  <p class="comment-username">{{ comment.displayName }}</p>
                  <p v-if="comment.created_at !== null" class="comment-date">
                    {{ formatDate(comment.created_at.toDate()) }}
                  </p>
              </div>
            </router-link>

            <div v-html="comment.content" class="comment-content"></div>


            <div class="comment-reactions">
              <button @click.prevent="toggleCommentLike(comment)" :class="{ liked: isCommentLiked(comment) }">
                <i class="fa-solid fa-up-long" style="color: #0d76bc;"></i> 
                <!-- {{ comment.likes ? comment.likes.length : 0 }} -->
                <span :style="{ color: isCommentLiked(comment) ? '#0d76bc' : 'black' }">
                  {{ comment.likes ? comment.likes.length : 0 }}
                </span>
              </button>
              <button @click.prevent="toggleCommentDislike(comment)" :class="{ disliked: isCommentDisliked(comment) }">
                <i class="fa-solid fa-down-long" style="color: #bf3138;"></i> 
                <!-- {{ comment.dislikes ? comment.dislikes.length : 0 }} -->
                <span :style="{ color: isCommentDisliked(comment) ? '#bf3138' : 'black' }">
                  {{ comment.dislikes ? comment.dislikes.length : 0 }}
                </span>
              </button>
            </div>
          </div>
        </li>
      </ul>
    </div>

  </div>
</template>


  


<style scoped>

  .post{
    padding-top: 5%;
    max-width: 90%;
    margin: auto;
    word-break: break-word;
    overflow: hidden;
  }

  h1{
    text-align: center;
    font-weight: bold;
    padding-bottom: 2rem;
    font-size: 2rem;
  }

  .post img, .post video{
    max-height: 80vh;
    object-fit: contain;
    width: 100%;
  }

  ::v-deep .post-content img {
    max-width: 600px;
    margin: auto;
  }

  .post-actions{
    border-top: 1px solid #CCCCCC;
    border-bottom: 1px solid #CCCCCC;
    padding: 1rem 0;
    font-weight: bold;
    font-size: 1.25rem;
    display: flex;
  }

  .comment-reactions{
    padding: 2rem 0 1rem 0;
    font-weight: bold;
  }

  .post-actions button i, .comment-reactions i{
    padding-right: 5px;
  }

  .comment-reactions button:last-of-type{
    padding-left: 3rem;
  } 

  .post-actions button:nth-child(2){
    padding: 0 3rem;
  }

  #save-btn{
    margin-left: auto !important;
  }

  .comment-input-container{
    padding: 0 5%;
    margin: 50px 0 50px 0;
  }

  .submit-comment-button{
    background: #0d76bc;
    color: white;
    padding: 15px 50px;
    margin-top: 20px;
  }

  .submit-comment-button:hover{
    background: #0b67a5;
    transition-property: background;
    transition-duration: .5s;
  }

  .comment{
    border-bottom: 1px solid black;
    word-break: break-word;
    overflow: hidden;
  }

  .post-info, .comment-info{
    display: flex;
    align-items: center;
    padding-bottom: 3rem;
  }

  .comment-info{
    padding: 1.5rem 0 1rem 0;
  }

  .post-info img, .comment-info img{
    border-radius: 50%;
    height: 50px;
    width: 50px;
    object-fit: cover;
  }

  .post-info .post-username, .comment-info .comment-username{
    font-weight: bold;
    padding-left: 2rem;
    font-size: 1.5rem;
  }

  .comment-info .comment-username{
    font-size: 1.25rem;
  }

  .quill-comment-editor{
    min-height: 100px;
  }

  .post-content{
    padding-bottom: 2.5rem;
  }

  .post-date, .comment-date{
    color: #848687;
  }

  @media screen and (max-width: 700px) {
    .post-info .post-username, .comment-info .comment-username{
      font-size: 1rem;
    }

    .post-info .post-date, .comment-date{
      margin-left: auto;
      font-size: .5rem;
    }

  }

  .post-info .post-date, .comment-date{
    margin-left: auto;
    font-size: 1.10rem;
  }

  .post-file{
    margin: auto;
    max-width: 100%;
  }




  .comments-section{
    padding: 0 5%;
  }





  @media screen and (max-width: 1023px) {
      
    .post img, .post video{
      height: fit-content;
      width: 100%;
    }

    .post .post-info img{
      height: 50px;
      width: 50px;
    }
      
  }



  @media screen and (max-width: 700px) {
    .post-info .post-username, .comment-info .comment-username{
      font-size: 1rem;
      padding-left: 1rem;
    }

    .post-info .post-date, .comment-date{
      margin-left: auto;
      font-size: 1rem;
    }
  }

  @media screen and (max-width: 550px) {
    h1{
      font-size: 1.5rem;
    }
  }

</style>