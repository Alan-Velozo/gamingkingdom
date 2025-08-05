<script>
  import MainButton from '../../../components/MainButton.vue';
  import Loader from '../../../components/Loader.vue';
  import { subscribeToAuth } from '../../../services/auth';
  import { getCommunityById } from '../../../services/community';
  import { saveCommunityChatMessage, subscribeToCommunityChatMessages } from '../../../services/community-chat';
  import Quill from 'quill';
  import 'quill/dist/quill.snow.css';

  export default {
    name: "CommunityChat",
    components: { MainButton, Loader },
    data() {
      return {
        authUser: { id: null, email: null, photoURL: null, displayName: null }, // Datos del usuario autenticado
        loadingUser: true, // Indica si los datos del usuario están cargando
        messages: [], // Lista de mensajes del chat
        loadingMessages: true, // Indica si los mensajes están cargando
        communityId: this.$route.params.id, // ID de la comunidad desde la ruta
        editor: null, // Instancia del editor Quill
        community: { name: null, photoURL: null }, // Datos de la comunidad
      };
    },
    methods: {
      /**
       * Envía un mensaje al chat de la comunidad
       * 1. Obtiene el contenido HTML del editor
       * 2. Valida que no esté vacío
       * 3. Guarda el mensaje en la base de datos
       * 4. Limpia el editor
       */
      sendMessage() {
        // Obtener el contenido del editor Quill
        const content = this.editor.root.innerHTML;

        // Eliminar etiquetas HTML y espacios en blanco para validar
        const strippedContent = content.replace(/<[^>]+>/g, '').trim();

        // Validar si el mensaje está vacío o solo contiene espacios
        if (strippedContent === '') {
          return;
        }

      // Enviar el mensaje si es válido
      saveCommunityChatMessage(this.communityId, {
        user_id: this.authUser.id,
        email: this.authUser.email,
        displayName: this.authUser.displayName,
        content: content,           // Guarda con formato HTML
      })
      .then(doc => {
        console.log("Mensaje enviado, ID:", doc.id);
          // Vaciar el editor después de enviar
          this.editor.root.innerHTML = ''; // Limpiar el contenido del editor
        })
        .catch(error => {
          console.error("Error al enviar el mensaje:", error);
        });
      },
      
      // Formatea una fecha a formato local con hora
      formatDate(date) {
        return Intl.DateTimeFormat('es-AR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }).format(date).replace(',', '');
      },
    },
    mounted() {
      // Suscripción a mensajes del chat (actualización en tiempo real)
      this.unsubscribeFromMessages = subscribeToCommunityChatMessages(this.communityId, newMessages => {
        this.messages = newMessages;
        this.loadingMessages = false;
      });

      // Suscripción a cambios de autenticación del usuario
      this.unsubscribeFromAuth = subscribeToAuth(newUserData => {
        this.authUser = newUserData;
        this.loadingUser = false;
      });

      // Inicialización del editor Quill después de que el DOM esté listo
      this.$nextTick(() => {
        if (this.$refs.editor) {
          // Crea una nueva instancia del editor Quill
          this.editor = new Quill(this.$refs.editor, {
            theme: 'snow',
            placeholder: 'Escribe tu mensaje...',
            modules: {
              toolbar: false, // Sin barra de herramientas
              clipboard: {
                matchVisual: false // No mantener formato visual al pegar
              }
            }
          });
          
          // Elimina formatos al pegar contenido (solo texto plano)
          this.editor.clipboard.addMatcher(Node.ELEMENT_NODE, (node, delta) => {
            delta.ops = delta.ops.map(op => {
              if (op.insert && typeof op.insert === 'string') {
                return { insert: op.insert }; // Solo texto plano
              }
              return op;
            });
            return delta;
          });
        } else {
          console.error("El contenedor de Quill no está disponible.");
        }
      });

      // Obtiene los datos de la comunidad
      getCommunityById(this.communityId)
        .then(data => {
          this.community = data;
        })
        .catch(error => {
          console.error("Error al obtener la comunidad:", error);
        });
    },
    unmounted() {
      // Limpieza al desmontar el componente
      if (this.unsubscribeFromMessages) this.unsubscribeFromMessages(); // Cancela la suscripción a mensajes
      if (this.unsubscribeFromAuth) this.unsubscribeFromAuth(); // Cancela la suscripción a auth
    }
  };
</script>

<template>
  <div class="community-chat-container">

    <!-- Nombre de la comunidad -->
    <div class="chat-header">
        <span v-if="!loadingMessages">
          <router-link :to="`/comunidad/${communityId}`">
            <img
              :src="community.photoURL"
              alt="Foto de la comunidad"
              class="w-12 h-12 rounded-full object-cover"
            />
            {{ community.name }}
          </router-link>
        </span>
        <span v-else>Cargando comunidad...</span>
      </div>

    <!-- Área de mensajes -->
    <main class="chat-messages-container">
      <ul v-if="!loadingMessages" class="messages-list">
        <li
          v-for="message in messages"
          :key="message.id"
          :class="['message-item', message.user_id === authUser.id ? 'sent' : 'received']"
        >
          <p>
            <strong>
              <template v-if="message.user_id !== authUser.id">
                <router-link :to="`/usuario/${message.user_id}`" class="message-sender">
                  {{ message.displayName }}
                </router-link>
              </template>
              <template v-else>
                {{ message.displayName }}
              </template>
            </strong>
          </p>
          <div v-html="message.content" class="message-content"></div>
          <p class="message-date" v-if="message.created_at">
            {{ formatDate(message.created_at.toDate()) }}
          </p>
          <p v-else>Enviando...</p>
        </li>
      </ul>
      <div v-else class="loading-messages flex justify-center items-center w-[100%] h-[100%]">
        <Loader/>
      </div>
    </main>

    
      <!-- Área fija para el input del chat -->
    <footer class="chat-input-container">
      <form @submit.prevent="sendMessage" class="chat-input-form">
          <!-- Contenedor para Quill (sin toolbar) -->
        <div ref="editor" class="quill-editor"></div>
        <MainButton class="send-button">
          <i class="fa-solid fa-paper-plane" style="color: #0d76bc;"></i>
        </MainButton>
      </form>
    </footer>
  </div>
</template>

<style scoped>

  .community-chat-container {
    display: flex;
    flex-direction: column;
    height: calc(100vh - 80px);
  }

  .chat-header {
    padding: 1rem;
    text-align: center;
    border-bottom: 1px solid black;
    font-weight: bold;
  }

  .chat-header span a{
    display: flex;
    align-items: center;
    font-size: 1.1rem;
  }

  .chat-header span a img{
    margin-right: 2rem;
  }

  .chat-messages-container {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    background-color: white;
  }

  .messages-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
  }

  .message-item {
    margin-bottom: 1rem;
    padding: 0.75rem;
    width: fit-content;
    max-width: 70%;
    word-break: break-word;
    overflow: hidden;
    color: white;
  }

  .message-item.sent {
    align-self: flex-end;
    background-color: #ef6532;
    float: right;
    flex-direction: column;
    display: block;
  }

  .message-content{
    padding: 1.5rem 0 0 0;
  }

  .message-item.received {
    align-self: flex-start;
    background-color: #0d76bc;
    color: white;
  }

  .message-date {
    margin-top: 1rem;
    text-align: right;
    font-weight: bold;
  }

  .chat-input-container {
    padding: 0.5rem;
    padding-right: 2.5%;
    border-top: 1px solid #dee2e6;
    background-color: white;
    position: sticky;
    bottom: 0;
    width: 100%;
  }

  .chat-input-form {
    display: flex;
    align-items: center;
  }

  .quill-editor {
    flex: 1;
    min-height: 50px;
    border: 1px solid #ced4da;
    border-radius: 0.25rem;
    margin-right: 0.5rem;
    padding: 0.5rem;

    max-height: 150px; 
    overflow-y: auto;
  }

  .send-button {
    flex-shrink: 0;
  }

  .mainbutton{
    padding: 0 !important;
    background: white;
  }

  .mainbutton:hover{
    background: white;
  }

  .mainbutton i{
    font-size: 30px;
  }

  .ql-toolbar, .ql-snow {
    border: 0 !important;
  }

  @media screen and (max-width: 1023px) {
    .message-item{
      max-width: 90%;
    }
  }

</style>
