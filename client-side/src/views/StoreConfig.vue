<template>
  <v-container>
    <!-- Store Settings Section -->
    <v-card class="mb-6">
      <v-card-title class="primary">
        <v-icon left>mdi-store</v-icon>
        Store Settings
      </v-card-title>
      <v-card-text class="secondary">
        <v-form @submit.prevent="saveSettings" class="secondary">
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="storeSettings.name"
                label="Store Name"
                outlined
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="3">
              <v-select
                v-model="storeSettings.currency"
                :items="currencies"
                label="Currency"
                outlined
              ></v-select>
            </v-col>
            <v-col cols="12" md="3">
              <v-select
                v-model="storeSettings.language"
                :items="languages"
                label="Default Language"
                outlined
              ></v-select>
            </v-col>
          </v-row>
          <v-btn
            type="submit"
            :color="$vuetify.theme.current.dark ? 'dark-primary' : 'primary'"
          >
            Save Settings
          </v-btn>
        </v-form>
      </v-card-text>
    </v-card>

    <!-- Shipping Methods Section -->
    <v-card class="mb-6">
      <v-card-title class="primary">
        <v-icon left>mdi-truck</v-icon>
        Shipping Methods
      </v-card-title>
      <v-card-text>
        <v-data-table
          :headers="shippingHeaders"
          :items="shippingMethods"
          :items-per-page="10"
          class="elevation-1"
        >
          <!-- Explicit header template -->
          <template v-slot:header="{ headers }">
            <thead>
              <tr>
                <th
                  v-for="header in headers"
                  :key="header.value"
                  :class="['text-' + header.align || 'start']"
                >
                  {{ header.title }}
                </th>
              </tr>
            </thead>
          </template>

          <!-- Your existing item templates -->
          <template v-slot:item.cost="{ item }">
            {{ formatCurrency(item.cost) }}
          </template>
          <template v-slot:item.actions="{ item }">
            <!-- Your action buttons -->
          </template>
        </v-data-table>
        <!-- Shipping Method Dialog -->
        <v-dialog v-model="shippingDialog" max-width="500px">
          <v-card>
            <v-card-title>
              {{ editingShipping ? 'Edit' : 'New' }} Shipping Method
            </v-card-title>
            <v-card-text>
              <v-form @submit.prevent="saveShippingMethod">
                <v-text-field
                  v-model="currentShipping.name"
                  label="Method Name"
                  required
                ></v-text-field>
                <v-text-field
                  v-model.number="currentShipping.cost"
                  label="Cost"
                  type="number"
                  prefix="$"
                  required
                ></v-text-field>
                <v-btn
                  type="submit"
                  :color="
                    $vuetify.theme.current.dark ? 'dark-primary' : 'primary'
                  "
                >
                  Save
                </v-btn>
              </v-form>
            </v-card-text>
          </v-card>
        </v-dialog>
      </v-card-text>
    </v-card>

    <!-- User Roles Section -->
    <v-card>
      <v-card-title class="primary">
        <v-icon left>mdi-account-cog</v-icon>
        User Permissions
      </v-card-title>
      <v-card-text>
        <v-data-table :headers="userHeaders" :items="users" class="elevation-1">
          <!-- Explicit header template -->
          <template v-slot:header="{ headers }">
            <thead>
              <tr>
                <th
                  v-for="header in headers"
                  :key="header.value"
                  :class="['text-' + header.align || 'start']"
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
  </v-container>
</template>

<script>
  export default {
    data() {
      return {
        // Store Settings
        storeSettings: {
          name: 'My Awesome Store',
          currency: 'USD',
          language: 'en'
        },
        currencies: ['USD', 'EUR', 'GBP', 'AED'],
        languages: [
          { text: 'English', value: 'en' },
          { text: 'Arabic', value: 'ar' },
          { text: 'French', value: 'fr' }
        ],

        // Shipping Methods
        shippingHeaders: [
          {
            title: 'Method', // Use 'title' instead of 'text'
            value: 'name',
            sortable: true,
            align: 'start'
          },
          {
            title: 'Cost',
            value: 'cost',
            sortable: true
          },
          {
            title: 'Actions',
            value: 'actions',
            sortable: false
          }
        ],
        shippingMethods: [
          { id: 1, name: 'Standard Shipping', cost: 5.99 },
          { id: 2, name: 'Express Shipping', cost: 12.99 },
          { id: 3, name: 'International', cost: 24.99 }
        ],
        shippingDialog: false,
        currentShipping: { name: '', cost: 0 },
        editingShipping: false,

        // User Management
        userHeaders: [
          { title: 'Name', value: 'name', align: 'start' },
          { title: 'Email', value: 'email', align: 'start' },
          { title: 'Role', value: 'role', align: 'start' }
        ],
        users: [
          {
            id: 1,
            name: 'Admin User',
            email: 'admin@store.com',
            role: 'superadmin'
          },
          { id: 2, name: 'Manager', email: 'manager@store.com', role: 'admin' },
          {
            id: 3,
            name: 'Content admin',
            email: 'admin@store.com',
            role: 'admin'
          }
        ],
        roles: ['superadmin', 'admin'],
        currentUser: { id: 1, role: 'superadmin' } // Mock current user
      }
    },

    computed: {
      isSuperAdmin() {
        return this.currentUser.role === 'superadmin'
      }
    },

    methods: {
      // Store Settings Methods
      saveSettings() {
        console.log('Settings saved:', this.storeSettings)
        this.$toast.success('Settings saved successfully')
      },

      // Shipping Methods
      openShippingDialog(item) {
        this.editingShipping = !!item
        this.currentShipping = item ? { ...item } : { name: '', cost: 0 }
        this.shippingDialog = true
      },

      saveShippingMethod() {
        if (this.editingShipping) {
          const index = this.shippingMethods.findIndex(
            (m) => m.id === this.currentShipping.id
          )
          this.shippingMethods.splice(index, 1, { ...this.currentShipping })
        } else {
          this.shippingMethods.push({
            ...this.currentShipping,
            id: Math.max(...this.shippingMethods.map((m) => m.id)) + 1
          })
        }
        this.shippingDialog = false
        this.$toast.success(
          `Shipping method ${this.editingShipping ? 'updated' : 'added'}`
        )
      },

      deleteShippingMethod(id) {
        if (confirm('Are you sure you want to delete this shipping method?')) {
          this.shippingMethods = this.shippingMethods.filter((m) => m.id !== id)
          this.$toast.success('Shipping method deleted')
        }
      },

      formatCurrency(value) {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: this.storeSettings.currency
        }).format(value)
      },

      // User Management
      updateUserRole(user) {
        console.log(`Updated user ${user.name} to role ${user.role}`)
        this.$toast.success(`Updated ${user.name}'s role to ${user.role}`)
      }
    }
  }
</script>

<style scoped>
  /* Custom card header colors matching your theme */
  .v-card-title.primary {
    background-color: rgb(var(--v-theme-primary));
    color: white;
  }

  .v-card-title.secondary {
    background-color: rgb(var(--v-theme-secondary));
    color: white;
  }

  /* Add some spacing between sections */
  .v-card {
    margin-bottom: 24px;
  }
</style>
