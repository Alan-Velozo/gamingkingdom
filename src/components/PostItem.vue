<script>
  export default {
    name: "PostItem",
    props: {
      // Propiedad: Datos de la publicación
      post: {
        type: Object,
        required: true,
      },
      // Propiedad: Estilos de categorías (colores e íconos)
      categoryStyles: {
        type: Object,
        required: true,
      },
      // Propiedad: Cantidad de comentarios en la publicación
      commentsCount: {
        type: Number,
        default: 0,
      },
      // Propiedad: ID del usuario actual
      currentUserId: {
        type: String,
        required: true,
      },
      // Propiedad: Indica si la publicación está guardada por el usuario
      isPostSaved: { 
        type: Boolean,
        default: false,
      },
      followingList: {
        type: Array,
        default: () => []
      },
    },
    data() {
      return {
        // Indica si la portada de la publicación es una imagen (por defecto es true)
        isImage: true 
      };
    },
    methods: {
      // Método para navegar a la página de la publicación
      goToPost() {
        // Emite un evento para que el componente padre maneje la navegación
        this.$emit("go-to-post", this.post.id);
      },

      // Método para alternar el estado de guardado de la publicación
      toggleSave() {
        // Emite un evento para que el componente padre maneje el guardado
        this.$emit("toggle-save", this.post.id); // Emitir el evento para alternar el estado
      },

      // Método para alternar el "like" de la publicación
      toggleLike() {
        // Emite un evento para que el componente padre maneje el like
        this.$emit("toggle-like", this.post.id);
      },

      // Método para alternar el "dislike" de la publicación
      toggleDislike() {
        // Emite un evento para que el componente padre maneje el dislike
        this.$emit("toggle-dislike", this.post.id);
      },

      // Método para formatear una fecha
      formatDate(date) {
        return new Intl.DateTimeFormat("es-AR", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(date).replace(",", "");
      },

      // Método para manejar errores al cargar la imagen de portada
      onImageError() {
        this.isImage = false;         // Si la imagen no carga, asume que es un video
      }
    }
  };
</script>

<template>
  <div class="post-item">
    <!-- Portada del post -->
    <img v-if="isImage" :src="post.cover" class="post-cover" @error="onImageError" @click="goToPost"/>
    <video v-else :src="post.cover" class="post-cover" controls></video>

    <!-- Contenedor de la miniatura del post -->
    <div class="post-thumbnail">
      <!-- Información del post: categoría y fecha -->
      <div class="post-info" @click="goToPost">
        <span
          v-if="post.category && categoryStyles[post.category.toLowerCase()]"
          class="post-category"
          :style="{ backgroundColor: categoryStyles[post.category.toLowerCase()].color }"
        >
          <i :class="['fa', categoryStyles[post.category.toLowerCase()].icon]"></i>
          {{ post.category === 'Guia' ? 'Guía' : post.category }}
        </span>
    
        <span v-if="post.created_at" class="post-date">
          {{ formatDate(post.created_at.toDate()) }}
        </span>
      </div>

      <!-- Título del post -->
      <p class="post-title" @click="goToPost">{{ post.title }}</p>

      <span v-if="followingList && followingList.includes(post.user_id)" class="flex pt-4 pl-5 font-normal">
        <router-link :to="`/usuario/${post.user_id}`" @click.stop>
          <i class="fa-solid fa-user-check pr-2" title="Sigues a este usuario"></i>
          {{ post.displayName }}
        </router-link>
      </span>

      <!-- Acciones: like, dislike y comentarios -->
      <div class="post-actions flex">
        <button @click.prevent="toggleLike" :class="{ liked: post.likes && post.likes.includes(currentUserId) }">
          <i class="fa-solid fa-up-long" style="color: #0d76bc;"></i> 
          <!-- {{ post.likes ? post.likes.length : 0 }} -->
          <span :style="{ color: post.likes && post.likes.includes(currentUserId) ? '#0d76bc' : 'black' }">
            {{ post.likes ? post.likes.length : 0 }}
          </span>
        </button>
        <button @click.prevent="toggleDislike" :class="{ disliked: post.dislikes && post.dislikes.includes(currentUserId) }">
          <i class="fa-solid fa-down-long" style="color: #bf3138;"></i> 
          <!-- {{ post.dislikes ? post.dislikes.length : 0 }} -->
          <span :style="{ color: post.dislikes && post.dislikes.includes(currentUserId) ? '#bf3138' : 'black' }">
            {{ post.dislikes ? post.dislikes.length : 0 }}
          </span>
        </button>
        <button class="comment-counter" @click="goToPost">
          <i class="fa-regular fa-comment" style="color: #000000;"></i> {{ commentsCount }}
        </button>

        <button v-if="post.user_id !== currentUserId" @click.prevent="toggleSave" :class="{ saved: isPostSaved }" aria-label="Guardar post" id="save-btn">
          <i :class="isPostSaved ? 'fa-solid fa-bookmark' : 'fa-regular fa-bookmark'"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .post-actions button:nth-child(2){
      padding: 0 2rem;
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

  .post-thumbnail .post-info .post-category{
      padding: 5px 10px;
      color: white;
  }

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

  .post-actions #save-btn{
    margin-left: auto;
  }
</style>
