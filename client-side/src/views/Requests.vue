<script setup>
import { onMounted } from 'vue';
import { useRequestsStore } from '../store/useRequestsStore.js';

const requestsStore = useRequestsStore();

onMounted(() => {
  requestsStore.fetchRequests();
});

const approve = (id) => {
  requestsStore.approveRequest(id);
};

const deny = (id) => {
  requestsStore.denyRequest(id);
};
</script>

<template>
  <div>
    <h1>Admin Requests</h1>

    <div v-if="requestsStore.loading">Loading...</div>
    <div v-else-if="requestsStore.error">{{ requestsStore.error }}</div>
    <div v-else-if="requestsStore.requests.length === 0">No requests found</div>
    
    <ul v-else>
      <li v-for="user in requestsStore.requests" :key="user._id">
        {{ user.fullName }} - {{ user.email }}
        <button @click="approve(user._id)">Approve</button>
        <button @click="deny(user._id)">Deny</button>
      </li>
    </ul>
  </div>
</template>
