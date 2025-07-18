<script>
  import { subscribeToAuth } from '../services/auth';
  import { getUserProfileById } from '../services/user-profile';
  import { subscribeToPrivateChat, sendPrivateChatMessage } from '../services/private-chat';
  import MainButton from '../components/MainButton.vue';
  import Loader from '../components/Loader.vue';
  import ChatLoader from '../components/ChatLoader.vue';

  export default {
      name: 'PrivateChat',
      components: { MainButton, Loader, ChatLoader },
      data() {
          return {
              authUser: {
                  id: null,
                  email: null,
              }, // Datos del usuario autenticado
              unsubscribeFromAuth: () => { }, // Función para cancelar suscripción de autenticación

              user: {
                  id: null,
                  email: null,
              }, // Datos del usuario con quien se está chateando
              loadingUser: true, // Indica si los datos del usuario están cargando

              messages: [], // Lista de mensajes del chat privado
              loadingMessages: true, // Indica si los mensajes están cargando
              unsubscribeFromMessages: () => { }, // Función para cancelar suscripción de mensajes
              
              newMessage: {
                  content: '', // Contenido del nuevo mensaje a enviar
              }
          };
      },
      methods: {
        // Maneja el envío de un mensaje privado
        handleSubmit() {
          // Eliminar espacios en blanco al inicio y al final del mensaje
          const trimmedMessage = this.newMessage.content.trim();

          // Validar si el mensaje está vacío o solo contiene espacios
          if (trimmedMessage === '') {
            return;
          }

          try {
            // Envía el mensaje privado usando el servicio
            sendPrivateChatMessage(this.authUser.id, this.user.id, trimmedMessage);
            this.newMessage.content = ''; // Limpiar el campo de mensaje
          } catch (error) {
            console.error("Error al mandar el mensaje privado.", error);
          }
        },
          
        // Formatea una fecha a formato local con hora
        formatDate(date) {
            return Intl.DateTimeFormat('es-AR', {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit'
            }).format(date).replace(',', '');
        },
      },
      computed: {
        // Verifica si el mensaje está vacío para deshabilitar el botón de envío
        isMessageEmpty() {
          return this.newMessage.content.trim() === '';
        }
      },
      // Hook del ciclo de vida: se ejecuta cuando el componente se monta en el DOM
      async mounted() {
          // Obtiene los datos del usuario con quien se está chateando
          getUserProfileById(this.$route.params.id).then((user) => {
              this.user = user;
              this.loadingUser = false;
          });
          
          // Suscribe el componente a los cambios en la autenticación del usuario
          this.unsubscribeFromAuth = subscribeToAuth(newUserData => this.authUser = newUserData);
          
          // Suscribe el componente a los mensajes del chat privado en tiempo real
          this.unsubscribeFromMessages = subscribeToPrivateChat(this.authUser.id, this.$route.params.id, newMessages => {
              this.messages = newMessages;
              this.loadingMessages = false;
          });
      },
      // Hook del ciclo de vida: se ejecuta antes de que el componente se desmonte del DOM
      unmounted() {
          // Cancela las suscripciones para evitar fugas de memoria
          this.unsubscribeFromAuth();
          this.unsubscribeFromMessages();
      },
  }
</script>

<template>
    <div class="community-chat-container">

      <!-- Nombre del usuario receptor -->
      <div class="chat-header">
        <span v-if="!loadingUser">
          <router-link :to="`/usuario/${user.id}`">
            <img
              :src="user.photoURL"
              alt="Foto de perfil"
              class="w-12 h-12 rounded-full object-cover"
            />
            {{ user.displayName }}
          </router-link>
        </span>
        <span v-else>Cargando usuario...</span>
      </div>
  
      <!-- Área de mensajes -->
      <main class="chat-messages-container">
        <ul v-if="!loadingMessages" class="messages-list">
          <li
            v-for="message in messages"
            :key="message.id"
            class="message-item"
            :class="{
              'bg-[#0D76BC]': message.sender_id == authUser.id,
              'self-end': message.sender_id == authUser.id,
              'bg-[#EF6532]': message.sender_id != authUser.id,
            }"
          >
            <p>{{ message.content }}</p>
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
        <form action="#"
              class="chat-input-form"
              @submit.prevent="handleSubmit">
            <!-- Contenedor para Quill (sin toolbar) -->
          <textarea 
                  id="message"
                  placeholder="Escribe un mensaje..."
                  class="w-full px-4 py-2 text-black no-resize"
                  aria-label="Mensaje"
                  v-model="newMessage.content"
              ></textarea>
          <MainButton class="send-button" :disabled="isMessageEmpty">
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
    max-width: 70%;
    width: fit-content;
    word-break: break-word;
    overflow: hidden;
    color: white;  
  }

  .message-date {
    margin-top: 0.5rem;
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
      width: auto;
      max-width: 80%;
    }
  }

  @media screen and (max-width: 700px) {
    .message-item{
      width: auto;
      max-width: 90%;
    }
  }
</style>
