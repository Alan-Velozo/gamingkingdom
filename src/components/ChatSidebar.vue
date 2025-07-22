<script>
  import { subscribeToAuth } from '../services/auth';
  import { getPrivateChats } from '../services/private-chat';
  import { getUserCommunities } from '../services/community';
  import { getUsersByIds } from '../services/user-profile';
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
        followingUsers: [], // Usuarios a los que sigo
      };
    },
    computed: {
      uniqueChatUsers() {
        // Usuarios de chats privados (pueden tener estructura diferente)
        const chatUsers = this.privateChats.map(chat => chat.participants[0]);
        // Usuarios seguidos
        const following = this.followingUsers;
        // Unifica y elimina duplicados por ID
        const all = [...chatUsers, ...following];
        const unique = {};
        all.forEach(user => {
          if (user && user.id) unique[user.id] = user;
        });
        // Devuelve un array de usuarios únicos
        return Object.values(unique);
      }
    },
    methods: {
      async fetchChats() {
        if (!this.userId) return;
        this.loading = true;

        try {
          this.privateChats = await getPrivateChats(this.userId);
          this.communities = await getUserCommunities(this.userId);
          // Obtener usuarios seguidos
          const user = JSON.parse(localStorage.getItem('user'));
          if (user && user.following && user.following.length > 0) {
            this.followingUsers = await getUsersByIds(user.following);
          } else {
            this.followingUsers = [];
          }
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
        <div v-if="uniqueChatUsers.length === 0 && communities.length === 0" class="empty-message">
          <p>Tu bandeja de entrada está vacía.</p>
        </div>
        
        <template v-else>
          <div v-if="uniqueChatUsers.length > 0">
            <ul>
              <li v-for="user in uniqueChatUsers" :key="user.id" class="chat-item">
                <router-link :to="`/chat/usuario/${user.id}`" class="chat-link">
                  <img v-if="user.photoURL" :src="user.photoURL" class="inline-block w-8 h-8 rounded-full mr-2"/>
                  {{ user.displayName || 'Usuario' }}
                </router-link>
              </li>
            </ul>
          </div>

          <div>
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
          </div>
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
  