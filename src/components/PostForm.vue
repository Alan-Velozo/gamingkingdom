<script>
  import Quill from "quill";
  import "quill/dist/quill.snow.css";
  import MainButton from "../components/MainButton.vue";
  import { categories, categoryStyles } from "../services/post";


  export default {
      name: 'Home',
      components: { MainButton },
      props: {
      // Si se usa en la vista de comunidad, se le pasará el ID; en Home será null
      communityId: {
        type: String,
        default: null,
      },
      // Datos iniciales para el formulario (puedes pasarlos para prellenar o dejar los valores por defecto)
      initialPostData: {
        type: Object,
        default: () => ({
          title: "",
          content: "",
          category: "General", // Por defecto "General"
          cover: "",
        }),
      },
    },
    data() {
      return {
        // Se clona la data inicial para trabajar localmente
        postData: { ...this.initialPostData },
        // coverPreview: "",
        coverFileName: "",
        coverError: "",
        editor: null,
        isUploading: false,
      };
    },
      computed: {
      // Podemos exponer las categorías importadas
          categoryList() {
              return categories;
          },

          categoryStyles() {
              return categoryStyles;
          }
      },
      methods: {
      handleCoverUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const maxSize = 20971520;
        if (file.size > maxSize) {
          this.coverError = "El archivo es demasiado pesado";
          // Puedes limpiar el input si lo deseas:
          event.target.value = "";
          return;
        } else {
          this.coverError = "";
        }

        this.coverFileName = "";
        this.isUploading = true;
        this.coverError = "";
        // Emite un evento para que el componente padre se encargue de subir la imagen
        // El callback recibe la URL de la imagen subida
        this.$emit("upload-cover", file, (url) => {
          this.postData.cover = url;
          this.coverFileName = file.name;
          this.isUploading = false;
          // this.coverPreview = url;
        });
      },
      handleSubmit() {
        if (!this.postData.cover) {
          this.coverError = "¡Debes adjuntar un archivo!";
          return;
        } else {
          this.coverError = "";
        }
        // Actualiza el contenido del post desde el editor
        this.postData.content = this.editor.root.innerHTML;
        // Si se recibe un communityId, se asigna; de lo contrario, se deja null
        this.postData.communityId = this.communityId || null;
        // Emite el evento "create-post" con los datos del post
        this.$emit("create-post", this.postData);




        this.postData = { ...this.initialPostData };
        // 2. Limpia el contenido del editor
        this.editor.root.innerHTML = "";
        // 3. Limpia el nombre del archivo (si lo mostrás en el label)
        this.coverFileName = "";
      },
    },
    mounted() {
      this.editor = new Quill(this.$refs.editor, {
        theme: "snow",
        placeholder: "¿En qué estás pensando?",
        modules: {
          toolbar: [
            [{ header: [1, 2, false] }],
            ["bold", "italic", "underline", "strike"],
            ["link", "image", "video"],
            [{ list: "ordered" }, { list: "bullet" }],
            ["clean"],
          ],
        },
      });
      this.editor.on("text-change", () => {
        this.postData.content = this.editor.root.innerHTML;
      });
    },
  };
</script>



<template>
    <section>
            <form @submit.prevent="handleSubmit" class="create-post">
                    
                <div class="post-thumbnail-form">
                        <div class="post-title-form">
                            <label for="title" class="font-bold">Título</label>
                            <input v-model="postData.title" type="text" placeholder="Escoge un título interesante para tu publicación" required id="title" maxlength="60"/>
                        </div>
                        <div class="post-cover-form">
                            
                            <input type="file" @change="handleCoverUpload" accept="image/*,video/*" id="cover" class="file-input"/>
                            <label for="cover" class="file-label">
                              <div>
                                <i class="fa-solid fa-file-image"></i>
                                <span v-if="isUploading">Cargando...</span>
                                <span v-else-if="coverFileName">{{ coverFileName }}</span>
                                <span v-else>Portada</span>
                              </div>
                              <p v-if="coverError" class="error-text">{{ coverError }}</p>
                            </label>

                        </div>
                </div>

                <div ref="editor" class="quill-editor"></div>

                <label for="category">Categoría: </label>
                <select v-model="postData.category" id="category">
                        <option v-for="cat in categoryList" :key="cat" :value="cat">
                            {{ cat === "Guia" ? "Guía" : cat }}
                        </option>
                </select>

                <MainButton>Publicar</MainButton>
            </form>
    </section>
</template>

<style scoped>

    .post-thumbnail-form{
        display: flex;
        justify-content: space-between;
        padding-bottom: 50px;
    }

    .post-thumbnail-form .post-title-form{
        width: 45%;
    }

    .post-thumbnail-form .post-title-form input{
        width: 100%;
        border: 1px solid #CCCCCC;
        padding: 10px;
        margin-top: 15px;
    }

    .post-thumbnail-form .post-title-form input:hover{
        border: 1px solid black;
        transition-duration: .5s;
        transition-property: border;
    }

    .file-label{
      display: flex;
      flex-direction: column;
    }
    .error-text{
      color: #DE1B1B;
      padding-top: .5rem;
    }

    .quill-editor {
        min-height: 125px;
    }

    .file-input{
        display: none;
    }

    .post-cover-form{
        width: 45%;
        display: flex;
    }

    .post-cover-form label{
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

    .post-cover-form label i{
        padding-right: 20px;
    }

    .post-cover-form label:hover{
        transition-property: border;
        transition-duration: .5s;
        border: 2px dashed black;
    }

    #category{
        margin: 2rem 0;
    }

    .mainbutton{
        display: block;
    }

    @media screen and (max-width: 1023px) {
        .post-thumbnail-form{
            flex-direction: column;
        }

        .post-thumbnail-form .post-cover-form, 
        .post-thumbnail-form .post-title-form{
            width: 100%;
        }

        .post-thumbnail-form .post-title-form{
            padding-bottom: 2.5rem;
        }
    }

    @media screen and (max-width: 900px){
        .create-post{
            padding: 0 5%;
        }
    }
</style>