<template>
  <v-card>
    <v-card-title class="accent">
      <v-icon left>mdi-account-cog</v-icon>
      User Permissions
    </v-card-title>
    <v-card-text>
      <v-data-table :headers="userHeaders" :items="users" class="elevation-1">
        <template v-slot:item.role="{ item }">
          <v-select
            v-model="item.role"
            :items="roles"
            :disabled="!isSuperAdmin || item.id === currentUser.id"
            @change="updateUserRole(item)"
            dense
            outlined
          ></v-select>
        </template>
      </v-data-table>
    </v-card-text>
  </v-card>
</template>

<script>
  export default {
    data() {
      return {
        userHeaders: [
          { text: 'Name', value: 'name' },
          { text: 'Email', value: 'email' },
          { text: 'Role', value: 'role' }
        ],
        users: []
      }
    },
    async created() {
      this.users = await this.$axios.get('/api/users')
    },
    methods: {
      async updateRole(user) {
        await this.$axios.patch(`/api/users/${user.id}`, { role: user.role })
      }
    }
  }
</script>
