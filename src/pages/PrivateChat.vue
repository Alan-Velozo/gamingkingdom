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
              },
              unsubscribeFromAuth: () => { },

              user: {
                  id: null,
                  email: null,
              },
              loadingUser: true,

              messages: [],
              loadingMessages: true,
              unsubscribeFromMessages: () => { },
              
              newMessage: {
                  content: '',
              }
          };
      },
      methods: {
        handleSubmit() {
          // Eliminar espacios en blanco al inicio y al final del mensaje
          const trimmedMessage = this.newMessage.content.trim();

          // Validar si el mensaje está vacío o solo contiene espacios
          if (trimmedMessage === '') {
            return;
          }

          try {
            sendPrivateChatMessage(this.authUser.id, this.user.id, trimmedMessage);
            this.newMessage.content = ''; // Limpiar el campo de mensaje
          } catch (error) {
            console.error("Error al mandar el mensaje privado.", error);
          }
        },
          
        formatDate(date) {
            return Intl.DateTimeFormat('es-AR', {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit'
            }).format(date).replace(',', '');
        },
      },
      computed: {
        isMessageEmpty() {
          return this.newMessage.content.trim() === '';
        }
      },
      async mounted() {
          getUserProfileById(this.$route.params.id).then((user) => {
              this.user = user;
              this.loadingUser = false;
          });
          this.unsubscribeFromAuth = subscribeToAuth(newUserData => this.authUser = newUserData);
          this.unsubscribeFromMessages = subscribeToPrivateChat(this.authUser.id, this.$route.params.id, newMessages => {
              this.messages = newMessages;
              this.loadingMessages = false;
          });
      },
      unmounted() {
          this.unsubscribeFromAuth();
          this.unsubscribeFromMessages();
      },
  }
</script>

<template>
    <div class="community-chat-container">
  
      <!-- Área de mensajes -->
      <main class="chat-messages-container">
        <ul v-if="!loadingMessages" class="messages-list">
          <li
            v-for="message in messages"
            :key="message.id"
            class="message-item"
            :class="{
              'bg-[#fff]': message.sender_id == authUser.id,
              'self-end': message.sender_id == authUser.id,
              'bg-[#f1f1f1]': message.sender_id != authUser.id,
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
    height: 90vh;
    margin-top: 1.5%;
  }

  .chat-header {
    padding: 1rem;
    background-color: white;
    text-align: center;
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
  border: 1px solid black;
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
