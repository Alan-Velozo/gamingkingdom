<script>
  import ChatSidebar from '../components/ChatSidebar.vue';

  export default {
    name: 'ChatLayout',
    components: { ChatSidebar },
    data() {
      return {
        collapsed: false,
      };
    },
    computed: {
      isOnChatHome() {
        return this.$route.path === '/chat';
      }
    },
    methods: {
      toggleSidebar() {
        this.collapsed = !this.collapsed;
      },
    },
  };
</script>

<template>
  <div class="chat-layout">
    <ChatSidebar :collapsed="collapsed" @toggle="toggleSidebar" />
    
    <div :class="['chat-content', { expanded: collapsed }]">
      <template v-if="isOnChatHome">
        <div class="empty-chat-message">
          <p>Selecciona un chat para empezar...</p>
        </div>
      </template>
      <template v-else>
        <router-view />
      </template>
    </div>
  </div>
</template>

<style scoped>
  .chat-layout {
    display: flex;
    overflow: hidden;
  }

  .chat-content {
    flex: 1;
    transition: all 0.3s ease;
    background: white;
    position: relative;
  }

  .chat-content.expanded {
    width: 100%;
  }

  .empty-chat-message {
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 24px;
    color: #888;
    text-align: center;
  }
</style>
