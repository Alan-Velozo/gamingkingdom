<script>
  import { subscribeToAuth } from '../services/auth';
  import { getPrivateChats } from '../services/private-chat';
  import { getUserCommunities } from '../services/community';
  import CircleLoader from './CircleLoader.vue';

  export default {
    name: 'ChatSidebar',
    components: { CircleLoader },
    data() {
      return {
        privateChats: [],
        communities: [],
        userId: null,
        collapsed: false,
        loading: true,
        unsubscribeFromAuth: () => {},
      };
    },
    methods: {
      async fetchChats() {
        if (!this.userId) return;
        this.loading = true;

        try {
          this.privateChats = await getPrivateChats(this.userId);
          this.communities = await getUserCommunities(this.userId);
          this.loading = false;
        } catch (error) {
          console.error('Error cargando chats:', error);
          this.loading = false;
        }
      },
      toggleSidebar() {
        this.collapsed = !this.collapsed;

        const chatContent = document.querySelector('.chat-content');

        if (window.innerWidth < 700) {
          if (this.collapsed) {
            // Si el sidebar está colapsado, mostrar el chat
            chatContent.style.display = 'block';
          } else {
            // Si el sidebar está expandido, ocultar el chat
            chatContent.style.display = 'none';
          }
        } else {
          // Si no es mobile, siempre está visible
          chatContent.style.display = 'block';
        }
      },
    },
    mounted() {
      this.unsubscribeFromAuth = subscribeToAuth((userData) => {
        this.userId = userData?.id;
        if (this.userId) {
          this.fetchChats();
        }
      });
    },
    unmounted() {
      this.unsubscribeFromAuth();
    }
  };
</script>

<template>
  <aside :class="['chat-sidebar', { collapsed }]">
    <button class="toggle-button" @click="toggleSidebar">
      <i v-if="collapsed" class="fa-solid fa-angle-right"></i>
      <i v-else class="fa-solid fa-angle-left"></i>
    </button>

    <div v-show="!collapsed" class="sidebar-content">
      <div v-if="loading" class="loader">
        <CircleLoader/>
      </div>

      <template v-else>
        <div v-if="privateChats.length === 0 && communities.length === 0" class="empty-message">
          <p>Tu bandeja de entrada está vacía.</p>
        </div>
        
        <template v-else>
          <section>
            <ul>
              <li 
                v-for="chat in privateChats" 
                :key="chat.chatId"
                class="chat-item"
              >
                <router-link
                  :to="`/chat/usuario/${chat.participants[0]?.id}`"
                  class="chat-link"
                >
                  {{ chat.participants[0]?.displayName || 'Usuario' }}
                </router-link>
              </li>
            </ul>
          </section>

          <section>
            <ul>
              <li 
                v-for="community in communities" 
                :key="community.id"
                class="chat-item"
              >
                <router-link 
                  :to="`/chat/community/${community.id}`"
                  class="chat-link"
                >
                  <i class="fa-solid fa-users"></i> {{ community.name }}
                </router-link>
              </li>
            </ul>
          </section>
        </template>
      </template>
    </div>
  </aside>
</template>

  
<style scoped>

  .loader{
    margin: auto;
    text-align: center;
    display: flex;
    justify-content: center;
    align-items: center;
    align-content: center;
    margin-top: 50%;
  }

  .empty-message{
    color: white;
  }

  .chat-sidebar {
    position: relative;
    width: 300px;
    background: black;
    padding: 1rem;
    height: calc(100vh - 80px);
    overflow-y: auto;
    overflow-x: hidden;
    transition: all 0.3s ease;
    bottom: 0;
  }

  .chat-sidebar.collapsed {
    width: 30px;
    padding: 1rem 0.25rem;
    overflow: hidden;
    background: none;
    border: none;
  }

  .toggle-button {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    right: 0px;
    background: white;
    color: black;
    width: 30px; 
    height: 30px;
    line-height: 1;
    font-size: 1.5rem;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .chat-sidebar.collapsed .toggle-button {
    left: 0;
    background: black;
    color: white;
  }

  .sidebar-content {
    transition: opacity 0.2s ease;
  }

  .chat-item {
    margin-bottom: 0.5rem;
  }

  .chat-link {
    display: block;
    padding: 0.5rem;
    text-decoration: none;
    transition: background 0.2s;
    color: white;
    border-bottom: 1px solid white;
  }

  .chat-link:hover {
    font-weight: bold;
    transition-property: font-weight;
    transition-duration: .25s;
  }

  .router-link-exact-active {
    font-weight: bold;
  }

  @media screen and (max-width: 700px) {
    .chat-sidebar{
      width: 100%;
    }
  }

</style>
  