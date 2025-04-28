<template>
  <v-container class="customer-details-container">
    <!-- Header with breadcrumbs and actions -->
    <v-row class="mb-4">
      <v-col cols="12" sm="6">
        <v-breadcrumbs :items="breadcrumbs" class="px-0">
          <template v-slot:divider>
            <v-icon>mdi-chevron-right</v-icon>
          </template>
        </v-breadcrumbs>
      </v-col>
      <v-col cols="12" sm="6" class="text-sm-right">
        <v-btn color="secondary" class="mr-2" @click="printCustomerDetails">
          <v-icon left>mdi-printer</v-icon>
          Print
        </v-btn>
        <v-btn color="error" v-if="customer.status !== 'denied'" @click="confirmDenyDialog = true">
          <v-icon left>mdi-cancel</v-icon>
          Deny Account
        </v-btn>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="4">
        <!-- Enhanced Profile Card -->
        <v-card class="profile-card" elevation="2">
          <div class="profile-header"></div>
          <v-card-text class="text-center pt-8">
            <v-avatar size="120" class="mb-4 avatar-border">
              <v-img :src="customer.avatar" alt="Customer Avatar">
                <template v-slot:placeholder>
                  <v-icon size="64" color="grey lighten-2">mdi-account</v-icon>
                </template>
              </v-img>
              <v-btn 
                fab 
                small 
                absolute 
                bottom 
                right 
                color="primary"
                @click="avatarUploadDialog = true"
              >
                <v-icon>mdi-camera</v-icon>
              </v-btn>
            </v-avatar>
            
            <h2 class="text-h5 font-weight-bold">{{ customer.fullName }}</h2>
            <div class="text-subtitle-1 mb-2">
              <v-icon small color="grey">mdi-email</v-icon>
              {{ customer.email }}
            </div>
            
            <v-chip 
              :color="getStatusColor(customer.status)" 
              class="mb-3"
              label
              outlined
            >
              <v-icon left small>{{ getStatusIcon(customer.status) }}</v-icon>
              {{ customer.status }}
            </v-chip>
            
            <v-divider class="my-3"></v-divider>
            
            <v-list dense class="text-left">
              <v-list-item>
                <v-list-item-icon>
                  <v-icon small color="grey">mdi-identifier</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title>Customer ID</v-list-item-title>
                  <v-list-item-subtitle class="font-weight-medium">{{ customer._id }}</v-list-item-subtitle>
                </v-list-item-content>
                <v-list-item-action>
                  <v-tooltip bottom>
                    <template v-slot:activator="{ on }">
                      <v-btn icon small v-on="on" @click="copyToClipboard(customer._id)">
                        <v-icon small>mdi-content-copy</v-icon>
                      </v-btn>
                    </template>
                    <span>Copy to clipboard</span>
                  </v-tooltip>
                </v-list-item-action>
              </v-list-item>
              
              <v-list-item>
                <v-list-item-icon>
                  <v-icon small color="grey">mdi-calendar</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title>Member Since</v-list-item-title>
                  <v-list-item-subtitle class="font-weight-medium">{{ formatDate(customer.joinDate) }}</v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
              
              <v-list-item>
                <v-list-item-icon>
                  <v-icon small color="grey">mdi-phone</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title>Phone</v-list-item-title>
                  <v-list-item-subtitle class="font-weight-medium">
                    {{ customer.mobile || 'Not provided' }}
                    <v-chip v-if="customer.verification?.phoneVerified" x-small color="success" class="ml-1">
                      <v-icon x-small>mdi-check</v-icon> Verified
                    </v-chip>
                  </v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
              
              <v-list-item>
                <v-list-item-icon>
                  <v-icon small color="grey">mdi-account-star</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title>Tier</v-list-item-title>
                  <v-list-item-subtitle>
                    <v-chip small :color="getTierColor(customer.customerTier)" dark>
                      <v-icon left small>{{ getTierIcon(customer.customerTier) }}</v-icon>
                      {{ customer.customerTier }}
                    </v-chip>
                  </v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </v-card-text>
          
          <v-card-actions class="justify-center pb-4">
            <v-btn 
              color="primary" 
              @click="editProfileDialog = true"
              depressed
            >
              <v-icon left>mdi-pencil</v-icon>
              Edit Profile
            </v-btn>
            <v-btn 
              color="secondary" 
              @click="sendWelcomeEmail"
              depressed
              class="ml-2"
              :loading="sendingEmail"
            >
              <v-icon left>mdi-email</v-icon>
              Resend Welcome
            </v-btn>
          </v-card-actions>
        </v-card>
        
        <!-- Enhanced Stats Card -->
        <v-card class="mt-4 stats-card" elevation="2">
          <v-card-title class="text-h6">
            <v-icon left color="primary">mdi-chart-bar</v-icon>
            Customer Stats
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="6" class="text-center">
                <div class="stat-value">{{ customer.ordersCount }}</div>
                <div class="stat-label">Orders</div>
                <v-progress-linear
                  :value="Math.min(customer.ordersCount, 100)"
                  height="4"
                  color="primary"
                  class="mt-2"
                ></v-progress-linear>
              </v-col>
              <v-col cols="6" class="text-center">
                <div class="stat-value">${{ formatCurrency(customer.totalSpent) }}</div>
                <div class="stat-label">Total Spent</div>
                <v-progress-linear
                  :value="Math.min(customer.totalSpent / 100, 100)"
                  height="4"
                  color="primary"
                  class="mt-2"
                ></v-progress-linear>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="6" class="text-center">
                <div class="stat-value">${{ formatCurrency(customer.averageOrderValue) }}</div>
                <div class="stat-label">Avg. Order</div>
                <v-progress-linear
                  :value="Math.min(customer.averageOrderValue, 100)"
                  height="4"
                  color="primary"
                  class="mt-2"
                ></v-progress-linear>
              </v-col>
              <v-col cols="6" class="text-center">
                <div class="stat-value">{{ customer.reviews?.length || 0 }}</div>
                <div class="stat-label">Reviews</div>
                <v-progress-linear
                  :value="Math.min((customer.reviews?.length || 0) * 10, 100)"
                  height="4"
                  color="primary"
                  class="mt-2"
                ></v-progress-linear>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
        
        <!-- Enhanced Tags & Segments -->
        <v-card class="mt-4" elevation="2">
          <v-card-title class="text-h6">
            <v-icon left color="primary">mdi-tag</v-icon>
            Tags & Segments
          </v-card-title>
          <v-card-text>
            <div class="mb-4">
              <div class="text-subtitle-2 mb-2 d-flex align-center">
                <v-icon small class="mr-1">mdi-tag</v-icon>
                Tags
                <v-spacer></v-spacer>
                <v-btn 
                  x-small 
                  icon 
                  @click="tagEditMode = !tagEditMode"
                >
                  <v-icon small>{{ tagEditMode ? 'mdi-check' : 'mdi-pencil' }}</v-icon>
                </v-btn>
              </div>
              <div v-if="customer.tags?.length">
                <v-chip 
                  v-for="tag in customer.tags" 
                  :key="tag" 
                  small 
                  class="mr-1 mb-1"
                  :close="tagEditMode"
                  @click:close="removeTag(tag)"
                >
                  <v-icon left small>{{ getTagIcon(tag) }}</v-icon>
                  {{ tag }}
                </v-chip>
              </div>
              <v-alert v-else type="info" dense outlined>
                No tags assigned
              </v-alert>
              
              <v-combobox
                v-if="tagEditMode"
                v-model="newTag"
                :items="availableTags"
                label="Add new tag"
                small-chips
                multiple
                append-icon=""
                class="mt-2"
              >
                <template v-slot:append-outer>
                  <v-btn 
                    x-small 
                    icon 
                    color="primary"
                    @click="addTags"
                  >
                    <v-icon small>mdi-plus</v-icon>
                  </v-btn>
                </template>
              </v-combobox>
            </div>
            
            <v-divider></v-divider>
            
            <div class="mt-4">
              <div class="text-subtitle-2 mb-2 d-flex align-center">
                <v-icon small class="mr-1">mdi-segment</v-icon>
                Segments
                <v-spacer></v-spacer>
                <v-btn 
                  x-small 
                  icon 
                  @click="segmentDialog = true"
                >
                  <v-icon small>mdi-plus</v-icon>
                </v-btn>
              </div>
              <div v-if="customer.segments?.length">
                <v-chip 
                  v-for="segment in customer.segments" 
                  :key="segment.name" 
                  small 
                  class="mr-1 mb-1" 
                  outlined
                  :close="segmentEditMode"
                  @click:close="removeSegment(segment.name)"
                >
                  <v-icon left small>{{ getSegmentIcon(segment.name) }}</v-icon>
                  {{ segment.name }}
                  <v-tooltip bottom v-if="segment.expiresAt">
                    <template v-slot:activator="{ on }">
                      <v-icon small right v-on="on">mdi-clock</v-icon>
                    </template>
                    <span>Expires: {{ formatDate(segment.expiresAt) }}</span>
                  </v-tooltip>
                </v-chip>
              </div>
              <v-alert v-else type="info" dense outlined>
                No segments assigned
              </v-alert>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="8">
        <!-- Enhanced Tabs with indicators -->
        <v-tabs 
          v-model="tab" 
          grow
          background-color="transparent"
          slider-color="primary"
          class="elevation-1 rounded-t"
        >
          <v-tab value="overview">
            <v-icon left>mdi-account-details</v-icon>
            Overview
            <v-badge 
              v-if="customer.adminRequest" 
              color="red" 
              dot 
              offset-x="10" 
              offset-y="10"
            ></v-badge>
          </v-tab>
          <v-tab value="orders">
            <v-icon left>mdi-shopping</v-icon>
            Orders
            <v-badge 
              v-if="customer.ordersCount > 0" 
              :content="customer.ordersCount" 
              color="primary" 
              offset-x="10" 
              offset-y="10"
            ></v-badge>
          </v-tab>
          <v-tab value="activity">
            <v-icon left>mdi-history</v-icon>
            Activity
          </v-tab>
          <v-tab value="support">
            <v-icon left>mdi-help-circle</v-icon>
            Support
            <v-badge 
              v-if="customer.supportTickets?.filter(t => t.status === 'open').length > 0" 
              :content="customer.supportTickets.filter(t => t.status === 'open').length" 
              color="orange" 
              offset-x="10" 
              offset-y="10"
            ></v-badge>
          </v-tab>
          <v-tab value="credit">
            <v-icon left>mdi-credit-card</v-icon>
            Credit
          </v-tab>
        </v-tabs>
        
        <v-window v-model="tab" class="mt-0">
          <!-- Enhanced Overview Tab -->
          <v-window-item value="overview">
            <v-card elevation="2" class="rounded-t-0">
              <v-card-title class="d-flex align-center">
                <v-icon left color="primary">mdi-information</v-icon>
                Customer Overview
                <v-spacer></v-spacer>
                <v-chip 
                  v-if="customer.adminRequest"
                  color="orange"
                  class="ml-2"
                >
                  <v-icon left>mdi-alert</v-icon>
                  Admin Request Pending
                </v-chip>
              </v-card-title>
              
              <v-card-text>
                <v-expansion-panels flat multiple>
                  <!-- Personal Information -->
                  <v-expansion-panel>
                    <v-expansion-panel-header>
                      <v-icon left>mdi-account</v-icon>
                      Personal Information
                    </v-expansion-panel-header>
                    <v-expansion-panel-content>
                      <v-row>
                        <v-col cols="12" md="6">
                          <v-list dense>
                            <v-list-item>
                              <v-list-item-icon>
                                <v-icon small color="grey">mdi-account</v-icon>
                              </v-list-item-icon>
                              <v-list-item-content>
                                <v-list-item-title>Full Name</v-list-item-title>
                                <v-list-item-subtitle class="font-weight-medium">{{ customer.fullName }}</v-list-item-subtitle>
                              </v-list-item-content>
                            </v-list-item>
                            
                            <v-list-item>
                              <v-list-item-icon>
                                <v-icon small color="grey">mdi-email</v-icon>
                              </v-list-item-icon>
                              <v-list-item-content>
                                <v-list-item-title>Email</v-list-item-title>
                                <v-list-item-subtitle class="font-weight-medium">
                                  {{ customer.email }}
                                  <v-chip v-if="customer.verification?.emailVerified" x-small color="success" class="ml-1">
                                    <v-icon x-small>mdi-check</v-icon> Verified
                                  </v-chip>
                                </v-list-item-subtitle>
                              </v-list-item-content>
                            </v-list-item>
                            
                            <v-list-item>
                              <v-list-item-icon>
                                <v-icon small color="grey">mdi-phone</v-icon>
                              </v-list-item-icon>
                              <v-list-item-content>
                                <v-list-item-title>Phone</v-list-item-title>
                                <v-list-item-subtitle class="font-weight-medium">
                                  {{ customer.mobile || 'Not provided' }}
                                  <v-chip v-if="customer.verification?.phoneVerified" x-small color="success" class="ml-1">
                                    <v-icon x-small>mdi-check</v-icon> Verified
                                  </v-chip>
                                </v-list-item-subtitle>
                              </v-list-item-content>
                            </v-list-item>
                          </v-list>
                        </v-col>
                        
                        <v-col cols="12" md="6">
                          <v-list dense>
                            <v-list-item>
                              <v-list-item-icon>
                                <v-icon small color="grey">mdi-cake</v-icon>
                              </v-list-item-icon>
                              <v-list-item-content>
                                <v-list-item-title>Birth Date</v-list-item-title>
                                <v-list-item-subtitle class="font-weight-medium">
                                  {{ customer.birthDate ? formatDate(customer.birthDate) : 'Not provided' }}
                                  <span v-if="customer.birthDate" class="text-caption ml-1">
                                    (Age: {{ calculateAge(customer.birthDate) }})
                                  </span>
                                </v-list-item-subtitle>
                              </v-list-item-content>
                            </v-list-item>
                            
                            <v-list-item>
                              <v-list-item-icon>
                                <v-icon small color="grey">mdi-gender-male-female</v-icon>
                              </v-list-item-icon>
                              <v-list-item-content>
                                <v-list-item-title>Gender</v-list-item-title>
                                <v-list-item-subtitle class="font-weight-medium">
                                  {{ customer.gender ? formatGender(customer.gender) : 'Not specified' }}
                                </v-list-item-subtitle>
                              </v-list-item-content>
                            </v-list-item>
                            
                            <v-list-item>
                              <v-list-item-icon>
                                <v-icon small color="grey">mdi-bell</v-icon>
                              </v-list-item-icon>
                              <v-list-item-content>
                                <v-list-item-title>Notifications</v-list-item-title>
                                <v-list-item-subtitle>
                                  <v-chip-group column>
                                    <v-chip 
                                      v-for="(value, key) in customer.communicationPreferences" 
                                      :key="key"
                                      x-small
                                      :color="value ? 'primary' : 'grey lighten-2'"
                                      :outlined="!value"
                                    >
                                      <v-icon x-small left>{{ getNotificationIcon(key) }}</v-icon>
                                      {{ formatPreferenceKey(key) }}
                                    </v-chip>
                                  </v-chip-group>
                                </v-list-item-subtitle>
                              </v-list-item-content>
                            </v-list-item>
                          </v-list>
                        </v-col>
                      </v-row>
                    </v-expansion-panel-content>
                  </v-expansion-panel>
                  
                  <!-- Account Details -->
                  <v-expansion-panel>
                    <v-expansion-panel-header>
                      <v-icon left>mdi-account-cog</v-icon>
                      Account Details
                    </v-expansion-panel-header>
                    <v-expansion-panel-content>
                      <v-row>
                        <v-col cols="12" md="6">
                          <v-list dense>
                            <v-list-item>
                              <v-list-item-icon>
                                <v-icon small color="grey">mdi-shield-account</v-icon>
                              </v-list-item-icon>
                              <v-list-item-content>
                                <v-list-item-title>Status</v-list-item-title>
                                <v-list-item-subtitle>
                                  <v-chip small :color="getStatusColor(customer.status)" label>
                                    <v-icon left small>{{ getStatusIcon(customer.status) }}</v-icon>
                                    {{ customer.status }}
                                  </v-chip>
                                </v-list-item-subtitle>
                              </v-list-item-content>
                            </v-list-item>
                            
                            <v-list-item>
                              <v-list-item-icon>
                                <v-icon small color="grey">mdi-account-key</v-icon>
                              </v-list-item-icon>
                              <v-list-item-content>
                                <v-list-item-title>Role</v-list-item-title>
                                <v-list-item-subtitle class="font-weight-medium">
                                  <v-chip small :color="getRoleColor(customer.role)" dark>
                                    <v-icon left small>{{ getRoleIcon(customer.role) }}</v-icon>
                                    {{ formatRole(customer.role) }}
                                  </v-chip>
                                </v-list-item-subtitle>
                              </v-list-item-content>
                            </v-list-item>
                            
                            <v-list-item>
                              <v-list-item-icon>
                                <v-icon small color="grey">mdi-calendar-star</v-icon>
                              </v-list-item-icon>
                              <v-list-item-content>
                                <v-list-item-title>Member Since</v-list-item-title>
                                <v-list-item-subtitle class="font-weight-medium">{{ formatDate(customer.joinDate) }}</v-list-item-subtitle>
                              </v-list-item-content>
                            </v-list-item>
                          </v-list>
                        </v-col>
                        
                        <v-col cols="12" md="6">
                          <v-list dense>
                            <v-list-item>
                              <v-list-item-icon>
                                <v-icon small color="grey">mdi-clock</v-icon>
                              </v-list-item-icon>
                              <v-list-item-content>
                                <v-list-item-title>Last Visit</v-list-item-title>
                                <v-list-item-subtitle class="font-weight-medium">
                                  {{ customer.lastSiteVisit ? formatDateTime(customer.lastSiteVisit) : 'Unknown' }}
                                </v-list-item-subtitle>
                              </v-list-item-content>
                            </v-list-item>
                            
                            <v-list-item>
                              <v-list-item-icon>
                                <v-icon small color="grey">mdi-cart</v-icon>
                              </v-list-item-icon>
                              <v-list-item-content>
                                <v-list-item-title>Last Order</v-list-item-title>
                                <v-list-item-subtitle class="font-weight-medium">
                                  {{ customer.lastOrderDate ? formatDate(customer.lastOrderDate) : 'No orders yet' }}
                                </v-list-item-subtitle>
                              </v-list-item-content>
                            </v-list-item>
                            
                            <v-list-item>
                              <v-list-item-icon>
                                <v-icon small color="grey">mdi-account-question</v-icon>
                              </v-list-item-icon>
                              <v-list-item-content>
                                <v-list-item-title>Admin Request</v-list-item-title>
                                <v-list-item-subtitle>
                                  <v-chip small :color="customer.adminRequest ? 'orange' : 'grey'" dark>
                                    {{ customer.adminRequest ? 'Pending Approval' : 'No Request' }}
                                  </v-chip>
                                </v-list-item-subtitle>
                              </v-list-item-content>
                            </v-list-item>
                          </v-list>
                        </v-col>
                      </v-row>
                    </v-expansion-panel-content>
                  </v-expansion-panel>
                  
                  <!-- Addresses -->
                  <v-expansion-panel>
                    <v-expansion-panel-header>
                      <v-icon left>mdi-map-marker</v-icon>
                      Addresses
                      <v-badge 
                        v-if="customer.addresses?.length > 0" 
                        :content="customer.addresses.length" 
                        color="primary" 
                        inline
                        class="ml-2"
                      ></v-badge>
                    </v-expansion-panel-header>
                    <v-expansion-panel-content>
                      <v-row v-if="customer.addresses?.length">
                        <v-col 
                          v-for="(address, index) in customer.addresses" 
                          :key="index" 
                          cols="12" 
                          md="6"
                        >
                          <v-card outlined>
                            <v-card-text>
                              <div class="d-flex justify-space-between">
                                <div>
                                  <strong>Address {{ index + 1 }}</strong>
                                  <span v-if="address.isDefault" class="ml-2">
                                    <v-chip x-small color="primary">
                                      <v-icon x-small left>mdi-check</v-icon>
                                      Default
                                    </v-chip>
                                  </span>
                                </div>
                                <div>
                                  <v-btn 
                                    icon 
                                    small 
                                    @click="editAddress(address)"
                                    class="mr-1"
                                  >
                                    <v-icon small>mdi-pencil</v-icon>
                                  </v-btn>
                                  <v-btn 
                                    icon 
                                    small 
                                    @click="deleteAddress(address)"
                                    color="error"
                                  >
                                    <v-icon small>mdi-delete</v-icon>
                                  </v-btn>
                                </div>
                              </div>
                              <div class="mt-2">
                                <div class="d-flex align-center mb-1">
                                  <v-icon small color="grey" class="mr-1">mdi-road</v-icon>
                                  {{ address.street }}
                                </div>
                                <div class="d-flex align-center mb-1">
                                  <v-icon small color="grey" class="mr-1">mdi-city</v-icon>
                                  {{ address.city.name }}, {{ address.province.name }}
                                </div>
                                <div class="d-flex align-center">
                                  <v-icon small color="grey" class="mr-1">mdi-post</v-icon>
                                  {{ address.postalCode }}
                                </div>
                              </div>
                              <v-btn 
                                v-if="!address.isDefault"
                                small
                                color="primary"
                                class="mt-3"
                                @click="setDefaultAddress(address)"
                              >
                                Set as Default
                              </v-btn>
                            </v-card-text>
                          </v-card>
                        </v-col>
                      </v-row>
                      <v-alert v-else type="info" outlined>
                        No addresses saved
                      </v-alert>
                      
                      <v-btn 
                        color="primary" 
                        class="mt-4"
                        @click="addAddressDialog = true"
                      >
                        <v-icon left>mdi-plus</v-icon>
                        Add New Address
                      </v-btn>
                    </v-expansion-panel-content>
                  </v-expansion-panel>
                </v-expansion-panels>
              </v-card-text>
            </v-card>
          </v-window-item>
          
          <!-- Enhanced Orders Tab -->
          <v-window-item value="orders">
            <v-card elevation="2" class="rounded-t-0">
              <v-card-title class="d-flex align-center">
                <v-icon left color="primary">mdi-shopping</v-icon>
                Order History
                <v-spacer></v-spacer>
                <v-text-field
                  v-model="orderSearch"
                  append-icon="mdi-magnify"
                  label="Search orders"
                  single-line
                  hide-details
                  class="search-field"
                  style="max-width: 300px;"
                ></v-text-field>
                <v-btn 
                  color="primary" 
                  class="ml-2"
                  @click="exportOrders"
                  :loading="exportingOrders"
                >
                  <v-icon left>mdi-download</v-icon>
                  Export
                </v-btn>
              </v-card-title>
              
              <v-card-text>
                <v-data-table
                  :headers="orderHeaders"
                  :items="customer.orders || []"
                  :search="orderSearch"
                  :items-per-page="10"
                  class="elevation-1"
                >
                  <template v-slot:item.orderDate="{ item }">
                    <span class="font-weight-medium">{{ formatDate(item.orderDate) }}</span>
                  </template>
                  <template v-slot:item.status="{ item }">
                    <v-chip small :color="getOrderStatusColor(item.status)" dark>
                      <v-icon left small>{{ getOrderStatusIcon(item.status) }}</v-icon>
                      {{ item.status }}
                    </v-chip>
                  </template>
                  <template v-slot:item.total="{ item }">
                    <span class="font-weight-medium">${{ formatCurrency(item.total) }}</span>
                  </template>
                  <template v-slot:item.actions="{ item }">
                    <v-tooltip bottom>
                      <template v-slot:activator="{ on }">
                        <v-btn 
                          icon 
                          small 
                          v-on="on"
                          @click="viewOrder(item)"
                          color="primary"
                        >
                          <v-icon small>mdi-eye</v-icon>
                        </v-btn>
                      </template>
                      <span>View Details</span>
                    </v-tooltip>
                    <v-tooltip bottom>
                      <template v-slot:activator="{ on }">
                        <v-btn 
                          icon 
                          small 
                          v-on="on"
                          @click="printOrder(item)"
                          color="secondary"
                          class="ml-1"
                        >
                          <v-icon small>mdi-printer</v-icon>
                        </v-btn>
                      </template>
                      <span>Print Order</span>
                    </v-tooltip>
                  </template>
                </v-data-table>
              </v-card-text>
            </v-card>
          </v-window-item>
          
          <!-- Enhanced Activity Tab -->
          <v-window-item value="activity">
            <v-card elevation="2" class="rounded-t-0">
              <v-card-title class="d-flex align-center">
                <v-icon left color="primary">mdi-history</v-icon>
                Activity Log
                <v-spacer></v-spacer>
                <v-select
                  v-model="activityFilter"
                  :items="activityTypes"
                  label="Filter by type"
                  clearable
                  dense
                  outlined
                  hide-details
                  prepend-inner-icon="mdi-filter"
                  class="filter-select"
                  style="max-width: 200px;"
                ></v-select>
                <v-btn 
                  color="primary" 
                  class="ml-2"
                  @click="exportActivity"
                  :loading="exportingActivity"
                >
                  <v-icon left>mdi-download</v-icon>
                  Export
                </v-btn>
              </v-card-title>
              
              <v-card-text>
                <v-timeline dense align-top>
                  <v-timeline-item
                    v-for="(activity, index) in filteredActivities"
                    :key="index"
                    small
                    :color="getActivityColor(activity.activityType)"
                    :icon="getActivityIcon(activity.activityType)"
                    fill-dot
                  >
                    <template v-slot:opposite>
                      <span class="text-caption">{{ formatDateTime(activity.date) }}</span>
                    </template>
                    <v-card elevation="2" class="pa-2">
                      <div class="d-flex justify-space-between">
                        <div>
                          <strong>{{ formatActivityType(activity.activityType) }}</strong>
                          <div class="text-caption">{{ activity.description }}</div>
                        </div>
                        <v-chip 
                          v-if="activity.ipAddress"
                          x-small
                          color="grey lighten-3"
                          class="ml-2"
                        >
                          {{ activity.ipAddress }}
                        </v-chip>
                      </div>
                      <div class="text-caption mt-1 d-flex align-center">
                        <v-icon x-small class="mr-1">mdi-desktop-classic</v-icon>
                        {{ activity.deviceInfo }}
                      </div>
                      <div 
                        v-if="activity.referenceId"
                        class="text-caption mt-1 d-flex align-center"
                      >
                        <v-icon x-small class="mr-1">mdi-link</v-icon>
                        Reference: {{ activity.referenceId }}
                      </div>
                    </v-card>
                  </v-timeline-item>
                </v-timeline>
                
                <v-pagination
                  v-if="filteredActivities.length > 10"
                  v-model="activityPage"
                  :length="Math.ceil(filteredActivities.length / 10)"
                  class="mt-4"
                ></v-pagination>
              </v-card-text>
            </v-card>
          </v-window-item>
          
          <!-- Enhanced Support Tab -->
          <v-window-item value="support">
            <v-card elevation="2" class="rounded-t-0">
              <v-card-title class="d-flex align-center">
                <v-icon left color="primary">mdi-help-circle</v-icon>
                Support Tickets
                <v-spacer></v-spacer>
                <v-text-field
                  v-model="ticketSearch"
                  append-icon="mdi-magnify"
                  label="Search tickets"
                  single-line
                  hide-details
                  class="search-field"
                  style="max-width: 300px;"
                ></v-text-field>
                <v-btn 
                  color="primary" 
                  class="ml-2"
                  @click="newTicketDialog = true"
                >
                  <v-icon left>mdi-plus</v-icon>
                  New Ticket
                </v-btn>
              </v-card-title>
              
              <v-card-text>
                <v-data-table
                  :headers="ticketHeaders"
                  :items="customer.supportTickets || []"
                  :search="ticketSearch"
                  :items-per-page="10"
                  class="elevation-1"
                >
                  <template v-slot:item.status="{ item }">
                    <v-chip small :color="getTicketStatusColor(item.status)" dark>
                      <v-icon left small>{{ getTicketStatusIcon(item.status) }}</v-icon>
                      {{ item.status }}
                    </v-chip>
                  </template>
                  <template v-slot:item.priority="{ item }">
                    <v-chip small :color="getPriorityColor(item.priority)" dark>
                      <v-icon left small>{{ getPriorityIcon(item.priority) }}</v-icon>
                      {{ item.priority }}
                    </v-chip>
                  </template>
                  <template v-slot:item.createdAt="{ item }">
                    <span class="font-weight-medium">{{ formatDate(item.createdAt) }}</span>
                  </template>
                  <template v-slot:item.actions="{ item }">
                    <v-tooltip bottom>
                      <template v-slot:activator="{ on }">
                        <v-btn 
                          icon 
                          small 
                          v-on="on"
                          @click="viewTicket(item)"
                          color="primary"
                        >
                          <v-icon small>mdi-eye</v-icon>
                        </v-btn>
                      </template>
                      <span>View Details</span>
                    </v-tooltip>
                    <v-tooltip bottom>
                      <template v-slot:activator="{ on }">
                        <v-btn 
                          icon 
                          small 
                          v-on="on"
                          @click="printTicket(item)"
                          color="secondary"
                          class="ml-1"
                        >
                          <v-icon small>mdi-printer</v-icon>
                        </v-btn>
                      </template>
                      <span>Print Ticket</span>
                    </v-tooltip>
                  </template>
                </v-data-table>
              </v-card-text>
            </v-card>
          </v-window-item>
          
          <!-- Enhanced Credit Tab -->
          <v-window-item value="credit">
            <v-card elevation="2" class="rounded-t-0">
              <v-card-title class="d-flex align-center">
                <v-icon left color="primary">mdi-credit-card</v-icon>
                Credit Information
                <v-spacer></v-spacer>
                <v-btn 
                  color="primary" 
                  @click="exportCreditHistory"
                  :loading="exportingCreditHistory"
                >
                  <v-icon left>mdi-download</v-icon>
                  Export
                </v-btn>
              </v-card-title>
              
              <v-card-text>
                <v-row>
                  <v-col cols="12" md="6">
                    <v-card outlined>
                      <v-card-title class="text-h6">
                        <v-icon left color="primary">mdi-chart-pie</v-icon>
                        Credit Summary
                      </v-card-title>
                      <v-card-text>
                        <v-list dense>
                          <v-list-item>
                            <v-list-item-icon>
                              <v-icon color="primary">mdi-currency-usd</v-icon>
                            </v-list-item-icon>
                            <v-list-item-content>
                              <v-list-item-title>Current Credit</v-list-item-title>
                              <v-list-item-subtitle class="text-right font-weight-bold text-h6">
                                ${{ formatCurrency(customer.currentCredit) }}
                              </v-list-item-subtitle>
                            </v-list-item-content>
                          </v-list-item>
                          
                          <v-list-item>
                            <v-list-item-icon>
                              <v-icon color="primary">mdi-finance</v-icon>
                            </v-list-item-icon>
                            <v-list-item-content>
                              <v-list-item-title>Credit Limit</v-list-item-title>
                              <v-list-item-subtitle class="text-right font-weight-bold text-h6">
                                ${{ formatCurrency(customer.creditLimit) }}
                              </v-list-item-subtitle>
                            </v-list-item-content>
                          </v-list-item>
                          
                          <v-list-item>
                            <v-list-item-icon>
                              <v-icon color="primary">mdi-cash-multiple</v-icon>
                            </v-list-item-icon>
                            <v-list-item-content>
                              <v-list-item-title>Available Credit</v-list-item-title>
                              <v-list-item-subtitle class="text-right font-weight-bold text-h6">
                                ${{ formatCurrency(customer.creditLimit - customer.currentCredit) }}
                              </v-list-item-subtitle>
                            </v-list-item-content>
                          </v-list-item>
                        </v-list>
                        
                        <v-divider class="my-3"></v-divider>
                        
                        <v-progress-linear
                          :value="(customer.currentCredit / customer.creditLimit) * 100"
                          height="10"
                          :color="(customer.currentCredit / customer.creditLimit) > 0.8 ? 'error' : 'primary'"
                          striped
                        ></v-progress-linear>
                        <div class="text-caption text-center mt-1">
                          Credit Utilization: {{ Math.round((customer.currentCredit / customer.creditLimit) * 100) }}%
                        </div>
                      </v-card-text>
                    </v-card>
                  </v-col>
                  
                  <v-col cols="12" md="6">
                    <v-card outlined>
                      <v-card-title class="text-h6">
                        <v-icon left color="primary">mdi-plus-circle</v-icon>
                        Add Credit Transaction
                      </v-card-title>
                      <v-card-text>
                        <v-form @submit.prevent="addCreditTransaction">
                          <v-select
                            v-model="creditTransaction.type"
                            :items="creditTypes"
                            label="Transaction Type"
                            required
                            outlined
                            prepend-inner-icon="mdi-swap-horizontal"
                          ></v-select>
                          
                          <v-text-field
                            v-model="creditTransaction.amount"
                            label="Amount"
                            type="number"
                            required
                            outlined
                            prepend-inner-icon="mdi-currency-usd"
                          ></v-text-field>
                          
                          <v-textarea
                            v-model="creditTransaction.description"
                            label="Description"
                            required
                            outlined
                            rows="2"
                            prepend-inner-icon="mdi-text"
                          ></v-textarea>
                          
                          <v-text-field
                            v-model="creditTransaction.reference"
                            label="Reference (Optional)"
                            outlined
                            prepend-inner-icon="mdi-link"
                          ></v-text-field>
                          
                          <v-btn 
                            color="primary" 
                            type="submit" 
                            block
                            large
                            :disabled="!creditTransaction.amount || !creditTransaction.description"
                          >
                            <v-icon left>mdi-check</v-icon>
                            Add Transaction
                          </v-btn>
                        </v-form>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
                
                <v-divider class="my-4"></v-divider>
                
                <h3 class="text-h6 mb-3 d-flex align-center">
                  <v-icon left color="primary">mdi-history</v-icon>
                  Credit History
                </h3>
                
                <v-data-table
                  :headers="creditHeaders"
                  :items="customer.creditHistory || []"
                  :items-per-page="10"
                  class="elevation-1"
                >
                  <template v-slot:item.type="{ item }">
                    <v-chip small :color="item.type === 'credit' ? 'green' : 'red'" dark>
                      <v-icon left small>{{ item.type === 'credit' ? 'mdi-plus' : 'mdi-minus' }}</v-icon>
                      {{ item.type }}
                    </v-chip>
                  </template>
                  <template v-slot:item.amount="{ item }">
                    <span class="font-weight-medium">${{ formatCurrency(item.amount) }}</span>
                  </template>
                  <template v-slot:item.date="{ item }">
                    <span class="font-weight-medium">{{ formatDateTime(item.date) }}</span>
                  </template>
                  <template v-slot:item.processedBy="{ item }">
                    <span v-if="item.processedBy">{{ getUserName(item.processedBy) }}</span>
                    <span v-else class="text-caption">System</span>
                  </template>
                </v-data-table>
              </v-card-text>
            </v-card>
          </v-window-item>
        </v-window>
      </v-col>
    </v-row>
    
    <!-- Edit Profile Dialog -->
    <v-dialog v-model="editProfileDialog" max-width="800" persistent>
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon left>mdi-account-edit</v-icon>
          Edit Customer Profile
          <v-spacer></v-spacer>
          <v-btn icon @click="editProfileDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        
        <v-card-text>
          <v-tabs v-model="editTab" grow>
            <v-tab>
              <v-icon left>mdi-account</v-icon>
              Basic Info
            </v-tab>
            <v-tab>
              <v-icon left>mdi-shield-account</v-icon>
              Account Settings
            </v-tab>
            <v-tab>
              <v-icon left>mdi-bell</v-icon>
              Notifications
            </v-tab>
          </v-tabs>
          
          <v-tabs-items v-model="editTab" class="mt-4">
            <v-tab-item>
              <v-form ref="basicInfoForm" @submit.prevent="saveProfile">
                <v-row>
                  <v-col cols="12" md="6">
                    <v-text-field 
                      v-model="editForm.firstName" 
                      label="First Name" 
                      required
                      outlined
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field 
                      v-model="editForm.lastName" 
                      label="Last Name" 
                      required
                      outlined
                    ></v-text-field>
                  </v-col>
                </v-row>
                
                <v-text-field 
                  v-model="editForm.email" 
                  label="Email" 
                  type="email" 
                  required
                  outlined
                  :rules="emailRules"
                ></v-text-field>
                
                <v-text-field 
                  v-model="editForm.mobile" 
                  label="Phone Number"
                  outlined
                  :rules="phoneRules"
                ></v-text-field>
                
                <v-select
                  v-model="editForm.gender"
                  :items="genderOptions"
                  label="Gender"
                  outlined
                ></v-select>
                
                <v-menu
                  v-model="birthDateMenu"
                  :close-on-content-click="false"
                  transition="scale-transition"
                  offset-y
                  min-width="auto"
                >
                  <template v-slot:activator="{ on, attrs }">
                    <v-text-field
                      v-model="editForm.birthDate"
                      label="Birth Date"
                      readonly
                      outlined
                      v-bind="attrs"
                      v-on="on"
                      prepend-inner-icon="mdi-calendar"
                    ></v-text-field>
                  </template>
                  <v-date-picker
                    v-model="editForm.birthDate"
                    no-title
                    scrollable
                  ></v-date-picker>
                </v-menu>
              </v-form>
            </v-tab-item>
            
            <v-tab-item>
              <v-form ref="accountForm">
                <v-select
                  v-model="editForm.status"
                  :items="statusOptions"
                  label="Status"
                  outlined
                ></v-select>
                
                <v-select
                  v-model="editForm.role"
                  :items="roleOptions"
                  label="Role"
                  outlined
                ></v-select>
                
                <v-select
                  v-model="editForm.customerTier"
                  :items="tierOptions"
                  label="Customer Tier"
                  outlined
                ></v-select>
                
                <v-text-field
                  v-model="editForm.creditLimit"
                  label="Credit Limit"
                  type="number"
                  outlined
                  prefix="$"
                ></v-text-field>
                
                <v-switch
                  v-model="editForm.isSubscribedToNewsletter"
                  label="Subscribed to Newsletter"
                  color="primary"
                ></v-switch>
              </v-form>
            </v-tab-item>
            
            <v-tab-item>
              <v-form ref="notificationsForm">
                <v-card outlined class="mb-4">
                  <v-card-title class="text-subtitle-1">Communication Preferences</v-card-title>
                  <v-card-text>
                    <v-switch
                      v-model="editForm.communicationPreferences.email"
                      label="Email Notifications"
                      color="primary"
                    ></v-switch>
                    
                    <v-switch
                      v-model="editForm.communicationPreferences.sms"
                      label="SMS Notifications"
                      color="primary"
                    ></v-switch>
                    
                    <v-switch
                      v-model="editForm.communicationPreferences.whatsapp"
                      label="WhatsApp Notifications"
                      color="primary"
                    ></v-switch>
                    
                    <v-switch
                      v-model="editForm.communicationPreferences.pushNotifications"
                      label="Push Notifications"
                      color="primary"
                    ></v-switch>
                  </v-card-text>
                </v-card>
              </v-form>
            </v-tab-item>
          </v-tabs-items>
        </v-card-text>
        
        <v-card-actions class="px-4 pb-4">
          <v-spacer></v-spacer>
          <v-btn 
            text 
            @click="editProfileDialog = false"
            class="mr-2"
          >
            Cancel
          </v-btn>
          <v-btn 
            color="primary" 
            @click="saveProfile"
            :loading="savingProfile"
            depressed
          >
            <v-icon left>mdi-content-save</v-icon>
            Save Changes
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Avatar Upload Dialog -->
    <v-dialog v-model="avatarUploadDialog" max-width="500">
      <v-card>
        <v-card-title>
          <v-icon left>mdi-account</v-icon>
          Update Profile Picture
        </v-card-title>
        <v-card-text>
          <v-file-input
            v-model="avatarFile"
            accept="image/*"
            label="Select an image"
            prepend-icon="mdi-camera"
            outlined
          ></v-file-input>
          
          <div v-if="avatarPreview" class="text-center">
            <v-avatar size="200" class="mb-4">
              <v-img :src="avatarPreview"></v-img>
            </v-avatar>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="avatarUploadDialog = false">Cancel</v-btn>
          <v-btn 
            color="primary" 
            @click="uploadAvatar"
            :disabled="!avatarFile"
            :loading="uploadingAvatar"
          >
            Upload
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Add Address Dialog -->
    <v-dialog v-model="addAddressDialog" max-width="600">
      <v-card>
        <v-card-title>
          <v-icon left>mdi-map-marker-plus</v-icon>
          Add New Address
        </v-card-title>
        <v-card-text>
          <v-form ref="addressForm">
            <v-row>
              <v-col cols="12" md="6">
                <v-select
                  v-model="newAddress.province"
                  :items="provinces"
                  item-text="name"
                  item-value="id"
                  label="Province"
                  outlined
                  required
                  @change="loadCities"
                ></v-select>
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="newAddress.city"
                  :items="cities"
                  item-text="name"
                  item-value="id"
                  label="City"
                  outlined
                  required
                  :disabled="!newAddress.province"
                ></v-select>
              </v-col>
            </v-row>
            
            <v-text-field
              v-model="newAddress.street"
              label="Street Address"
              outlined
              required
            ></v-text-field>
            
            <v-text-field
              v-model="newAddress.postalCode"
              label="Postal Code"
              outlined
              required
            ></v-text-field>
            
            <v-switch
              v-model="newAddress.isDefault"
              label="Set as default address"
              color="primary"
            ></v-switch>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="addAddressDialog = false">Cancel</v-btn>
          <v-btn 
            color="primary" 
            @click="saveAddress"
            :loading="savingAddress"
          >
            Save Address
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Add Segment Dialog -->
    <v-dialog v-model="segmentDialog" max-width="500">
      <v-card>
        <v-card-title>
          <v-icon left>mdi-segment</v-icon>
          Add Segment
        </v-card-title>
        <v-card-text>
          <v-form>
            <v-select
              v-model="newSegment.name"
              :items="availableSegments"
              label="Segment Name"
              outlined
              required
            ></v-select>
            
            <v-menu
              v-model="segmentExpiryMenu"
              :close-on-content-click="false"
              transition="scale-transition"
              offset-y
              min-width="auto"
            >
              <template v-slot:activator="{ on, attrs }">
                <v-text-field
                  v-model="newSegment.expiresAt"
                  label="Expiry Date (Optional)"
                  readonly
                  outlined
                  v-bind="attrs"
                  v-on="on"
                  prepend-inner-icon="mdi-calendar"
                ></v-text-field>
              </template>
              <v-date-picker
                v-model="newSegment.expiresAt"
                no-title
                scrollable
              ></v-date-picker>
            </v-menu>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="segmentDialog = false">Cancel</v-btn>
          <v-btn 
            color="primary" 
            @click="addSegment"
            :disabled="!newSegment.name"
          >
            Add Segment
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Confirm Deny Dialog -->
    <v-dialog v-model="confirmDenyDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h5">
          <v-icon left color="error">mdi-alert</v-icon>
          Deny Customer Account
        </v-card-title>
        <v-card-text>
          <p>Are you sure you want to deny this customer's account? This action cannot be undone.</p>
          <v-textarea
            v-model="denyReason"
            label="Reason for denial"
            outlined
            rows="3"
            class="mt-4"
          ></v-textarea>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="confirmDenyDialog = false">Cancel</v-btn>
          <v-btn 
            color="error" 
            @click="denyAccount"
            :disabled="!denyReason"
            depressed
          >
            Confirm Deny
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- View Order Dialog -->
    <v-dialog v-model="viewOrderDialog" max-width="800" scrollable>
      <v-card v-if="selectedOrder">
        <v-card-title class="d-flex align-center">
          <v-icon left>mdi-shopping</v-icon>
          Order #{{ selectedOrder.orderId }}
          <v-spacer></v-spacer>
          <v-chip :color="getOrderStatusColor(selectedOrder.status)" dark>
            {{ selectedOrder.status }}
          </v-chip>
        </v-card-title>
        
        <v-card-text>
          <v-row>
            <v-col cols="12" md="6">
              <v-list dense>
                <v-list-item>
                  <v-list-item-icon>
                    <v-icon small>mdi-calendar</v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title>Order Date</v-list-item-title>
                    <v-list-item-subtitle>{{ formatDateTime(selectedOrder.orderDate) }}</v-list-item-subtitle>
                  </v-list-item-content>
                </v-list-item>
                
                <v-list-item>
                  <v-list-item-icon>
                    <v-icon small>mdi-currency-usd</v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title>Total Amount</v-list-item-title>
                    <v-list-item-subtitle>${{ formatCurrency(selectedOrder.total) }}</v-list-item-subtitle>
                  </v-list-item-content>
                </v-list-item>
                
                <v-list-item>
                  <v-list-item-icon>
                    <v-icon small>mdi-credit-card</v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title>Payment Method</v-list-item-title>
                    <v-list-item-subtitle>{{ selectedOrder.paymentMethod }}</v-list-item-subtitle>
                  </v-list-item-content>
                </v-list-item>
              </v-list>
            </v-col>
            
            <v-col cols="12" md="6">
              <v-list dense>
                <v-list-item>
                  <v-list-item-icon>
                    <v-icon small>mdi-truck</v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title>Shipping Method</v-list-item-title>
                    <v-list-item-subtitle>{{ selectedOrder.shippingMethod }}</v-list-item-subtitle>
                  </v-list-item-content>
                </v-list-item>
                
                <v-list-item>
                  <v-list-item-icon>
                    <v-icon small>mdi-map-marker</v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title>Shipping Address</v-list-item-title>
                    <v-list-item-subtitle>
                      {{ selectedOrder.shippingAddress.street }}, 
                      {{ selectedOrder.shippingAddress.city }}, 
                      {{ selectedOrder.shippingAddress.province }}
                    </v-list-item-subtitle>
                  </v-list-item-content>
                </v-list-item>
                
                <v-list-item>
                  <v-list-item-icon>
                    <v-icon small>mdi-note</v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title>Customer Notes</v-list-item-title>
                    <v-list-item-subtitle>{{ selectedOrder.customerNotes || 'None' }}</v-list-item-subtitle>
                  </v-list-item-content>
                </v-list-item>
              </v-list>
            </v-col>
          </v-row>
          
          <v-divider class="my-4"></v-divider>
          
          <h3 class="text-h6 mb-3">Order Items</h3>
          <v-simple-table>
            <template v-slot:default>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in selectedOrder.items" :key="index">
                  <td>
                    <div class="d-flex align-center">
                      <v-avatar size="40" class="mr-2">
                        <v-img :src="item.image"></v-img>
                      </v-avatar>
                      {{ item.name }}
                    </div>
                  </td>
                  <td>${{ formatCurrency(item.price) }}</td>
                  <td>{{ item.quantity }}</td>
                  <td>${{ formatCurrency(item.price * item.quantity) }}</td>
                </tr>
              </tbody>
            </template>
          </v-simple-table>
          
          <v-divider class="my-4"></v-divider>
          
          <v-row>
            <v-col cols="12" md="6">
              <v-card outlined>
                <v-card-title class="text-subtitle-1">Order Summary</v-card-title>
                <v-card-text>
                  <v-simple-table>
                    <template v-slot:default>
                      <tbody>
                        <tr>
                          <td>Subtotal</td>
                          <td class="text-right">${{ formatCurrency(selectedOrder.subtotal) }}</td>
                        </tr>
                        <tr>
                          <td>Shipping</td>
                          <td class="text-right">${{ formatCurrency(selectedOrder.shippingCost) }}</td>
                        </tr>
                        <tr>
                          <td>Tax</td>
                          <td class="text-right">${{ formatCurrency(selectedOrder.tax) }}</td>
                        </tr>
                        <tr>
                          <td>Discount</td>
                          <td class="text-right">-${{ formatCurrency(selectedOrder.discount) }}</td>
                        </tr>
                        <tr class="font-weight-bold">
                          <td>Total</td>
                          <td class="text-right">${{ formatCurrency(selectedOrder.total) }}</td>
                        </tr>
                      </tbody>
                    </template>
                  </v-simple-table>
                </v-card-text>
              </v-card>
            </v-col>
            
            <v-col cols="12" md="6">
              <v-card outlined>
                <v-card-title class="text-subtitle-1">Order Actions</v-card-title>
                <v-card-text>
                  <v-select
                    v-model="orderStatusUpdate"
                    :items="orderStatusOptions"
                    label="Update Status"
                    outlined
                  ></v-select>
                  
                  <v-btn 
                    color="primary" 
                    block 
                    class="mb-2"
                    @click="updateOrderStatus"
                  >
                    Update Status
                  </v-btn>
                  
                  <v-btn 
                    color="secondary" 
                    block 
                    class="mb-2"
                    @click="resendOrderConfirmation"
                  >
                    Resend Confirmation
                  </v-btn>
                  
                  <v-btn 
                    color="error" 
                    block 
                    outlined
                    @click="cancelOrder"
                  >
                    Cancel Order
                  </v-btn>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="viewOrderDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
export default {
  data() {
    return {
      customer: {
        _id: '12345',
        firstName: 'John',
        lastName: 'Doe',
        fullName: 'John Doe',
        email: 'john.doe@example.com',
        mobile: '+1234567890',
        avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
        status: 'approved',
        role: 'user',
        customerTier: 'gold',
        joinDate: '2022-01-15T00:00:00Z',
        lastSiteVisit: '2023-04-25T14:30:00Z',
        lastOrderDate: '2023-04-20T10:15:00Z',
        ordersCount: 12,
        totalSpent: 2450.75,
        averageOrderValue: 204.23,
        creditLimit: 5000,
        currentCredit: 1250,
        isSubscribedToNewsletter: true,
        adminRequest: false,
        birthDate: '1985-05-15',
        gender: 'male',
        verification: {
          emailVerified: true,
          phoneVerified: true
        },
        communicationPreferences: {
          email: true,
          sms: false,
          whatsapp: false,
          pushNotifications: true
        },
        tags: ['premium', 'frequent'],
        segments: [
          { name: 'high-value', expiresAt: '2023-12-31' }
        ],
        addresses: [
          {
            _id: 'addr1',
            street: '123 Main St',
            city: { name: 'New York' },
            province: { name: 'NY' },
            postalCode: '10001',
            isDefault: true
          },
          {
            _id: 'addr2',
            street: '456 Second Ave',
            city: { name: 'Brooklyn' },
            province: { name: 'NY' },
            postalCode: '11201',
            isDefault: false
          }
        ],
        orders: [
          {
            _id: 'order1',
            orderId: 'ORD-1001',
            orderDate: '2023-04-20T10:15:00Z',
            status: 'delivered',
            total: 199.99,
            subtotal: 179.99,
            shippingCost: 15.00,
            tax: 5.00,
            discount: 0,
            paymentMethod: 'Credit Card',
            shippingMethod: 'Standard',
            customerNotes: 'Please deliver after 5pm',
            shippingAddress: {
              street: '123 Main St',
              city: 'New York',
              province: 'NY',
              postalCode: '10001'
            },
            items: [
              {
                _id: 'item1',
                name: 'Smartphone X',
                price: 179.99,
                quantity: 1,
                image: 'https://via.placeholder.com/80'
              }
            ]
          },
          {
            _id: 'order2',
            orderId: 'ORD-1002',
            orderDate: '2023-03-15T14:30:00Z',
            status: 'shipped',
            total: 450.50,
            subtotal: 400.00,
            shippingCost: 25.00,
            tax: 25.50,
            discount: 0,
            paymentMethod: 'PayPal',
            shippingMethod: 'Express',
            shippingAddress: {
              street: '123 Main St',
              city: 'New York',
              province: 'NY',
              postalCode: '10001'
            },
            items: [
              {
                _id: 'item2',
                name: 'Laptop Pro',
                price: 1200.00,
                quantity: 1,
                image: 'https://via.placeholder.com/80'
              },
              {
                _id: 'item3',
                name: 'Mouse Wireless',
                price: 25.00,
                quantity: 2,
                image: 'https://via.placeholder.com/80'
              }
            ]
          }
        ],
        activityLog: [
          {
            _id: 'act1',
            activityType: 'login',
            date: '2023-04-25T14:30:00Z',
            description: 'User logged in',
            ipAddress: '192.168.1.1',
            deviceInfo: 'Chrome on Windows 10'
          },
          {
            _id: 'act2',
            activityType: 'purchase',
            date: '2023-04-20T10:15:00Z',
            description: 'Placed order ORD-1001',
            ipAddress: '192.168.1.2',
            deviceInfo: 'Chrome on Windows 10',
            referenceId: 'ORD-1001'
          }
        ],
        supportTickets: [
          {
            _id: 'ticket1',
            ticketId: 'TKT-1001',
            title: 'Shipping delay',
            issueType: 'shipping',
            status: 'open',
            priority: 'medium',
            createdAt: '2023-04-22T09:30:00Z'
          }
        ],
        creditHistory: [
          {
            _id: 'credit1',
            transactionId: 'CRD-1001',
            type: 'credit',
            amount: 1000,
            date: '2023-01-10T00:00:00Z',
            description: 'Initial credit',
            processedBy: null
          },
          {
            _id: 'credit2',
            transactionId: 'CRD-1002',
            type: 'debit',
            amount: 250,
            date: '2023-04-20T10:15:00Z',
            description: 'Order ORD-1001',
            processedBy: 'system'
          }
        ],
        reviews: [
          {
            _id: 'rev1',
            productId: 'prod1',
            rating: 5,
            comment: 'Great product!',
            date: '2023-04-25T00:00:00Z'
          }
        ]
      },
      tab: 'overview',
      editProfileDialog: false,
      newTicketDialog: false,
      viewTicketDialog: false,
      birthDateMenu: false,
      avatarUploadDialog: false,
      addAddressDialog: false,
      segmentDialog: false,
      segmentExpiryMenu: false,
      confirmDenyDialog: false,
      viewOrderDialog: false,
      editTab: 0,
      tagEditMode: false,
      segmentEditMode: false,
      activityPage: 1,
      editForm: {
        firstName: '',
        lastName: '',
        email: '',
        mobile: '',
        gender: '',
        birthDate: '',
        status: '',
        role: '',
        customerTier: '',
        creditLimit: 0,
        isSubscribedToNewsletter: false,
        communicationPreferences: {
          email: true,
          sms: false,
          whatsapp: false,
          pushNotifications: true
        }
      },
      newTicket: {
        title: '',
        issueType: '',
        description: '',
        priority: 'medium',
        attachments: []
      },
      selectedTicket: null,
      ticketStatusUpdate: {
        status: '',
        satisfaction: null,
        notes: ''
      },
      creditTransaction: {
        type: 'credit',
        amount: 0,
        description: '',
        reference: ''
      },
      newTag: [],
      newSegment: {
        name: '',
        expiresAt: null
      },
      newAddress: {
        province: null,
        city: null,
        street: '',
        postalCode: '',
        isDefault: false
      },
      denyReason: '',
      selectedOrder: null,
      orderStatusUpdate: '',
      orderSearch: '',
      ticketSearch: '',
      activityFilter: null,
      avatarFile: null,
      avatarPreview: null,
      provinces: [
        { id: 1, name: 'Cairo' },
        { id: 2, name: 'Alexandria' },
        { id: 3, name: 'Giza' }
      ],
      cities: [
        { id: 1, name: 'Downtown', provinceId: 1 },
        { id: 2, name: 'Nasr City', provinceId: 1 },
        { id: 3, name: 'Montaza', provinceId: 2 },
        { id: 4, name: 'Smouha', provinceId: 2 },
        { id: 5, name: 'Dokki', provinceId: 3 }
      ],
      sendingEmail: false,
      savingProfile: false,
      uploadingAvatar: false,
      savingAddress: false,
      exportingOrders: false,
      exportingActivity: false,
      exportingCreditHistory: false
    }
  },
  computed: {
    breadcrumbs() {
      return [
        { text: 'Dashboard', disabled: false, href: '/' },
        { text: 'Customers', disabled: false, href: '/customers' },
        { text: this.customer.fullName || 'Customer Details', disabled: true }
      ]
    },
    availableTags() {
      const allTags = ['premium', 'frequent', 'new', 'vip', 'loyal', 'wholesale', 'business']
      return allTags.filter(tag => !this.customer.tags?.includes(tag))
    },
    availableSegments() {
      const allSegments = ['high-value', 'frequent-buyer', 'inactive', 'new-customer', 'abandoned-cart']
      const currentSegments = this.customer.segments?.map(s => s.name) || []
      return allSegments.filter(segment => !currentSegments.includes(segment))
    },
    filteredActivities() {
      if (!this.activityFilter) return this.customer.activityLog || []
      return (this.customer.activityLog || []).filter(
        activity => activity.activityType === this.activityFilter
      )
    }
  },
  methods: {
    formatDate(date) {
      if (!date) return ''
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    },
    formatDateTime(date) {
      if (!date) return ''
      return new Date(date).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    formatCurrency(amount) {
      if (amount === undefined || amount === null) return '0.00'
      return parseFloat(amount).toFixed(2)
    },
    calculateAge(birthDate) {
      if (!birthDate) return ''
      const today = new Date()
      const birth = new Date(birthDate)
      let age = today.getFullYear() - birth.getFullYear()
      const m = today.getMonth() - birth.getMonth()
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--
      }
      return age
    },
    formatGender(gender) {
      const genders = {
        male: 'Male',
        female: 'Female',
        other: 'Other',
        'prefer-not-to-say': 'Prefer not to say'
      }
      return genders[gender] || gender
    },
    formatRole(role) {
      const roles = {
        user: 'Customer',
        admin: 'Admin',
        super_admin: 'Super Admin'
      }
      return roles[role] || role
    },
    formatActivityType(type) {
      const types = {
        login: 'Login',
        purchase: 'Purchase',
        contact: 'Contact',
        review: 'Review',
        complaint: 'Complaint',
        refund: 'Refund'
      }
      return types[type] || type
    },
    formatPreferenceKey(key) {
      const keys = {
        email: 'Email',
        sms: 'SMS',
        whatsapp: 'WhatsApp',
        pushNotifications: 'Push'
      }
      return keys[key] || key
    },
    getStatusColor(status) {
      const colors = {
        pending: 'orange',
        approved: 'green',
        denied: 'red'
      }
      return colors[status] || 'primary'
    },
    getStatusIcon(status) {
      const icons = {
        pending: 'mdi-clock',
        approved: 'mdi-check',
        denied: 'mdi-cancel'
      }
      return icons[status] || 'mdi-account'
    },
    getTierColor(tier) {
      const colors = {
        basic: 'grey',
        silver: 'blue-grey',
        gold: 'amber',
        platinum: 'blue'
      }
      return colors[tier] || 'primary'
    },
    getTierIcon(tier) {
      const icons = {
        basic: 'mdi-account',
        silver: 'mdi-account-star',
        gold: 'mdi-account-supervisor',
        platinum: 'mdi-account-tie'
      }
      return icons[tier] || 'mdi-account'
    },
    getRoleColor(role) {
      const colors = {
        user: 'primary',
        admin: 'orange',
        super_admin: 'red'
      }
      return colors[role] || 'primary'
    },
    getRoleIcon(role) {
      const icons = {
        user: 'mdi-account',
        admin: 'mdi-shield-account',
        super_admin: 'mdi-shield-crown'
      }
      return icons[role] || 'mdi-account'
    },
    getOrderStatusColor(status) {
      const colors = {
        pending: 'orange',
        processing: 'blue',
        shipped: 'teal',
        delivered: 'green',
        cancelled: 'red',
        refunded: 'purple'
      }
      return colors[status.toLowerCase()] || 'primary'
    },
    getOrderStatusIcon(status) {
      const icons = {
        pending: 'mdi-clock',
        processing: 'mdi-cog',
        shipped: 'mdi-truck',
        delivered: 'mdi-check',
        cancelled: 'mdi-cancel',
        refunded: 'mdi-cash-refund'
      }
      return icons[status.toLowerCase()] || 'mdi-help'
    },
    getActivityColor(type) {
      const colors = {
        login: 'blue',
        purchase: 'green',
        contact: 'teal',
        review: 'amber',
        complaint: 'orange',
        refund: 'red'
      }
      return colors[type] || 'primary'
    },
    getActivityIcon(type) {
      const icons = {
        login: 'mdi-login',
        purchase: 'mdi-cart',
        contact: 'mdi-email',
        review: 'mdi-star',
        complaint: 'mdi-alert',
        refund: 'mdi-cash-refund'
      }
      return icons[type] || 'mdi-help'
    },
    getTicketStatusColor(status) {
      const colors = {
        open: 'orange',
        'in-progress': 'blue',
        resolved: 'green',
        closed: 'grey'
      }
      return colors[status] || 'primary'
    },
    getTicketStatusIcon(status) {
      const icons = {
        open: 'mdi-alert-circle',
        'in-progress': 'mdi-progress-wrench',
        resolved: 'mdi-check-circle',
        closed: 'mdi-close-circle'
      }
      return icons[status] || 'mdi-help-circle'
    },
    getPriorityColor(priority) {
      const colors = {
        low: 'green',
        medium: 'blue',
        high: 'orange',
        critical: 'red'
      }
      return colors[priority] || 'primary'
    },
    getPriorityIcon(priority) {
      const icons = {
        low: 'mdi-arrow-down',
        medium: 'mdi-equal',
        high: 'mdi-arrow-up',
        critical: 'mdi-alert'
      }
      return icons[priority] || 'mdi-help'
    },
    getTagIcon(tag) {
      const icons = {
        premium: 'mdi-star',
        frequent: 'mdi-repeat',
        new: 'mdi-new-box',
        vip: 'mdi-crown',
        loyal: 'mdi-heart',
        wholesale: 'mdi-account-group',
        business: 'mdi-briefcase'
      }
      return icons[tag] || 'mdi-tag'
    },
    getSegmentIcon(segment) {
      const icons = {
        'high-value': 'mdi-cash-multiple',
        'frequent-buyer': 'mdi-repeat',
        'inactive': 'mdi-clock',
        'new-customer': 'mdi-new-box',
        'abandoned-cart': 'mdi-cart'
      }
      return icons[segment] || 'mdi-segment'
    },
    getNotificationIcon(type) {
      const icons = {
        email: 'mdi-email',
        sms: 'mdi-message-text',
        whatsapp: 'mdi-whatsapp',
        pushNotifications: 'mdi-cellphone'
      }
      return icons[type] || 'mdi-bell'
    },
    getUserName(userId) {
      return 'Admin User'
    },
    copyToClipboard(text) {
      navigator.clipboard.writeText(text)
    },
    loadCities() {
      if (!this.newAddress.province) return
      this.cities = this.cities.filter(city => city.provinceId === this.newAddress.province)
    },
    resetEditForm() {
      this.editForm = {
        firstName: this.customer.firstName,
        lastName: this.customer.lastName,
        email: this.customer.email,
        mobile: this.customer.mobile,
        gender: this.customer.gender,
        birthDate: this.customer.birthDate,
        status: this.customer.status,
        role: this.customer.role,
        customerTier: this.customer.customerTier,
        creditLimit: this.customer.creditLimit,
        isSubscribedToNewsletter: this.customer.isSubscribedToNewsletter,
        communicationPreferences: {
          email: this.customer.communicationPreferences?.email || true,
          sms: this.customer.communicationPreferences?.sms || false,
          whatsapp: this.customer.communicationPreferences?.whatsapp || false,
          pushNotifications: this.customer.communicationPreferences?.pushNotifications || true
        }
      }
    },
    saveProfile() {
      this.savingProfile = true
      setTimeout(() => {
        this.customer = {
          ...this.customer,
          firstName: this.editForm.firstName,
          lastName: this.editForm.lastName,
          fullName: `${this.editForm.firstName} ${this.editForm.lastName}`,
          email: this.editForm.email,
          mobile: this.editForm.mobile,
          gender: this.editForm.gender,
          birthDate: this.editForm.birthDate,
          status: this.editForm.status,
          role: this.editForm.role,
          customerTier: this.editForm.customerTier,
          creditLimit: this.editForm.creditLimit,
          isSubscribedToNewsletter: this.editForm.isSubscribedToNewsletter,
          communicationPreferences: this.editForm.communicationPreferences
        }
        this.editProfileDialog = false
        this.savingProfile = false
      }, 1000)
    },
    createTicket() {
      const newTicket = {
        _id: `ticket${this.customer.supportTickets.length + 1}`,
        ticketId: `TKT-${1000 + this.customer.supportTickets.length + 1}`,
        ...this.newTicket,
        createdAt: new Date().toISOString(),
        status: 'open'
      }
      this.customer.supportTickets.push(newTicket)
      this.newTicketDialog = false
      this.newTicket = {
        title: '',
        issueType: '',
        description: '',
        priority: 'medium',
        attachments: []
      }
    },
    viewTicket(ticket) {
      this.selectedTicket = ticket
      this.ticketStatusUpdate.status = ticket.status
      this.viewTicketDialog = true
    },
    updateTicketStatus() {
      const ticket = this.selectedTicket
      ticket.status = this.ticketStatusUpdate.status
      const index = this.customer.supportTickets.findIndex(t => t._id === ticket._id)
      if (index !== -1) {
        this.customer.supportTickets[index] = ticket
      }
      this.viewTicketDialog = false
    },
    addCreditTransaction() {
      const newTransaction = {
        _id: `credit${this.customer.creditHistory.length + 1}`,
        transactionId: `CRD-${1000 + this.customer.creditHistory.length + 1}`,
        ...this.creditTransaction,
        date: new Date().toISOString(),
        processedBy: 'admin'
      }
      
      if (newTransaction.type === 'credit') {
        this.customer.currentCredit += parseFloat(newTransaction.amount)
      } else {
        this.customer.currentCredit -= parseFloat(newTransaction.amount)
      }
      
      this.customer.creditHistory.push(newTransaction)
      this.creditTransaction = {
        type: 'credit',
        amount: 0,
        description: '',
        reference: ''
      }
    },
    addTags() {
      this.customer.tags = [...new Set([...this.customer.tags, ...this.newTag])]
      this.newTag = []
      this.tagEditMode = false
    },
    removeTag(tag) {
      this.customer.tags = this.customer.tags.filter(t => t !== tag)
    },
    addSegment() {
      const newSegment = {
        name: this.newSegment.name,
        expiresAt: this.newSegment.expiresAt
      }
      this.customer.segments.push(newSegment)
      this.segmentDialog = false
      this.newSegment = {
        name: '',
        expiresAt: null
      }
    },
    removeSegment(segmentName) {
      this.customer.segments = this.customer.segments.filter(s => s.name !== segmentName)
    },
    uploadAvatar() {
      this.uploadingAvatar = true
      setTimeout(() => {
        this.customer.avatar = this.avatarPreview
        this.avatarUploadDialog = false
        this.avatarFile = null
        this.avatarPreview = null
        this.uploadingAvatar = false
      }, 1000)
    },
    saveAddress() {
      this.savingAddress = true
      setTimeout(() => {
        const newAddress = {
          _id: `addr${this.customer.addresses.length + 1}`,
          ...this.newAddress,
          city: { name: this.cities.find(c => c.id === this.newAddress.city)?.name || 'Unknown' },
          province: { name: this.provinces.find(p => p.id === this.newAddress.province)?.name || 'Unknown' }
        }
        
        if (newAddress.isDefault) {
          this.customer.addresses.forEach(addr => {
            addr.isDefault = false
          })
        }
        
        this.customer.addresses.push(newAddress)
        this.addAddressDialog = false
        this.newAddress = {
          province: null,
          city: null,
          street: '',
          postalCode: '',
          isDefault: false
        }
        this.savingAddress = false
      }, 1000)
    },
    setDefaultAddress(address) {
      this.customer.addresses.forEach(addr => {
        addr.isDefault = addr._id === address._id
      })
    },
    deleteAddress(address) {
      this.customer.addresses = this.customer.addresses.filter(addr => addr._id !== address._id)
    },
    denyAccount() {
      this.customer.status = 'denied'
      this.confirmDenyDialog = false
      this.denyReason = ''
    },
    sendWelcomeEmail() {
      this.sendingEmail = true
      setTimeout(() => {
        this.sendingEmail = false
      }, 1500)
    },
    viewOrder(order) {
      this.selectedOrder = order
      this.orderStatusUpdate = order.status
      this.viewOrderDialog = true
    },
    updateOrderStatus() {
      this.selectedOrder.status = this.orderStatusUpdate
      const index = this.customer.orders.findIndex(o => o._id === this.selectedOrder._id)
      if (index !== -1) {
        this.customer.orders[index] = this.selectedOrder
      }
    },
    resendOrderConfirmation() {
      // Simulate sending email
      console.log('Resending confirmation for order:', this.selectedOrder.orderId)
    },
    cancelOrder() {
      this.selectedOrder.status = 'cancelled'
      const index = this.customer.orders.findIndex(o => o._id === this.selectedOrder._id)
      if (index !== -1) {
        this.customer.orders[index] = this.selectedOrder
      }
      this.viewOrderDialog = false
    },
    exportOrders() {
      this.exportingOrders = true
      setTimeout(() => {
        console.log('Exporting orders...')
        this.exportingOrders = false
      }, 1500)
    },
    exportActivity() {
      this.exportingActivity = true
      setTimeout(() => {
        console.log('Exporting activity...')
        this.exportingActivity = false
      }, 1500)
    },
    exportCreditHistory() {
      this.exportingCreditHistory = true
      setTimeout(() => {
        console.log('Exporting credit history...')
        this.exportingCreditHistory = false
      }, 1500)
    },
    printCustomerDetails() {
      window.print()
    },
    printOrder(order) {
      console.log('Printing order:', order.orderId)
    },
    printTicket(ticket) {
      console.log('Printing ticket:', ticket.ticketId)
    }
  },
  created() {
    this.resetEditForm()
  }
}
</script>

<style scoped>
.customer-details-container {
  max-width: 1600px;
}

.profile-card {
  position: relative;
  overflow: visible;
  border-radius: 8px;
}

.profile-header {
  height: 120px;
  background: linear-gradient(135deg, #1976d2 0%, #0d47a1 100%);
  border-radius: 8px 8px 0 0;
}

.avatar-border {
  border: 4px solid white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  position: relative;
  margin-top: -60px;
}

.stats-card {
  border-radius: 8px;
}

.stats-card .stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1976d2;
}

.stats-card .stat-label {
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.6);
}

.v-timeline-item::before {
  flex: 0;
}

.search-field {
  max-width: 300px;
}

.filter-select {
  max-width: 200px;
}

.v-data-table {
  border-radius: 4px;
}

.v-card {
  border-radius: 8px;
}

.v-tab {
  text-transform: none;
  font-weight: 500;
}

.v-expansion-panel-header {
  font-weight: 500;
}

.v-expansion-panel-header .v-icon {
  margin-right: 12px;
}

.v-list-item__icon {
  margin-right: 12px;
}

.v-chip-group {
  padding-top: 4px;
}

@media print {
  .v-navigation-drawer,
  .v-app-bar,
  .v-footer,
  .v-tabs,
  .v-card-actions {
    display: none !important;
  }
  
  .v-container {
    padding: 0 !important;
  }
  
  .v-card {
    box-shadow: none !important;
    border-radius: 0 !important;
  }
  
  .profile-card {
    break-inside: avoid;
  }
  
  .v-col-md-8 {
    break-inside: avoid;
  }
}
</style>