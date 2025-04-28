<template>
  <v-card>
    <v-card-title
      class="primary d-flex align-center"
      :class="{ 'flex-row-reverse': $i18n.locale === 'ar' }"
    >
      <v-icon
        class="mx-2"
        :left="$i18n.locale !== 'ar'"
        :right="$i18n.locale === 'ar'"
      >
        mdi-account-cog
      </v-icon>
      <span>{{ $t('userPermissions') }}</span>
    </v-card-title>

    <v-card-text>
      <v-data-table
        :dir="$i18n.locale === 'ar' ? 'rtl' : 'ltr'"
        :headers="userHeaders"
        :items="users"
        class="elevation-1"
      >
        <template v-slot:header="{ headers }">
          <thead>
            <tr>
              <th
                v-for="header in headers"
                :key="header.value"
                class="text-start"
              >
                {{ header.title }}
              </th>
            </tr>
          </thead>
        </template>

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
        // userHeaders: [
        //   { title: 'userName', value: 'name' },
        //   { title: 'userEmail', value: 'email' },
        //   { title: 'userRole', value: 'role' }
        // ],
        users: [
          {
            name: 'Admin User',
            email: 'admin@store.com',
            role: 'superadmin'
          },
          { name: 'Manager', email: 'manager@store.com', role: 'admin' },
          {
            name: 'Content Admin',
            email: 'content@store.com',
            role: 'admin'
          }
        ],
        roles: ['superadmin', 'admin'],
        currentUser: { id: 1, role: 'superadmin' }
      }
    },
    computed: {
      userHeaders() {
        return [
          { title: this.$t('userName'), value: 'name' },
          { title: this.$t('userEmail'), value: 'email' },
          { title: this.$t('userRole'), value: 'role' }
        ]
      },
      isSuperAdmin() {
        return this.currentUser.role === 'superadmin'
      }
    },
    methods: {
      updateUserRole(user) {
        this.$toast.success(
          this.$t('roleUpdated', { name: user.name, role: user.role })
        )
      }
    }
  }
</script>
