<template>
  <v-container class="mb-8 pa-4 rounded-lg elevation-2">
    <v-form ref="form" @submit.prevent="addProduct">
      <h3 class="text-h6 mb-2">General information</h3>
      <v-text-field
        v-model="newProduct.Product"
        :rules="[rules.required]"
        label="Product Name"
      ></v-text-field>
      <!-- Description -->
      <v-textarea
        :rules="[rules.required]"
        v-model="newProduct.Description"
        label="Description"
      ></v-textarea>
      <h3 class="text-h6 mb-2">Dimensions</h3>
      <!-- width -->
      <v-row>
        <v-col cols="4">
          <v-text-field
            :rules="[rules.required]"
            v-model="newProduct.dimensions.width"
            type="number"
            label="Width"
          ></v-text-field>
        </v-col>
        <!-- height -->
        <v-col cols="4">
          <v-text-field
            :rules="[rules.required]"
            v-model="newProduct.dimensions.height"
            label="Height"
            type="number"
          ></v-text-field>
        </v-col>
        <!-- Deppth -->
        <v-col cols="4">
          <v-text-field
            :rules="[rules.required]"
            v-model="newProduct.dimensions.depth"
            label="Depth"
            type="number"
          ></v-text-field>
        </v-col>
      </v-row>

      <h3 class="text-h6 mb-2">Categorey</h3>

      <v-select
        v-model="newProduct.ProductCategory"
        :items="categoriesList"
        item-value="_id"
        item-title="name"
        :rules="[rules.required]"
        label="Product Category"
      ></v-select>

      <!-- <v-text-field
        v-model="newProduct.ProductTags"
        label="Product Tags (comma-separated)"
      ></v-text-field> -->
      <h3 class="text-h6 mb-2">Pricing</h3>

      <v-row>
        <v-col cols="4">
          <v-text-field
            v-model="newProduct.BasePrice"
            :rules="[rules.required]"
            label="Base Price"
            type="number"
          ></v-text-field>
        </v-col>
        <v-col cols="4">
          <v-select
            v-model="newProduct.DiscountType"
            :items="['Percentage', 'Fixed']"
            label="Discount Type"
          ></v-select>
        </v-col>
        <v-col cols="4">
          <v-text-field
            v-model="newProduct.DiscountValue"
            label="Discount Value"
            type="number"
          ></v-text-field>
        </v-col>
      </v-row>
      <h3 class="text-h6 mb-2">Inventory</h3>
      <v-row>
        <v-col cols="12">
          <v-text-field
            v-model="newProduct.Quantity"
            :rules="[rules.required]"
            label="Quantity"
            type="number"
          ></v-text-field>
        </v-col>
      </v-row>

      <div v-for="(color, index) in newProduct.colors" :key="index">
        <h3>Color {{ index + 1 }}</h3>
        <v-row>
          <v-col cols="6">
            <v-select
              v-model="color.name"
              :items="colorsList"
              item-value="name"
              item-title="name"
              label="Select Color Name"
              :rules="[rules.required]"
            ></v-select>
          </v-col>
          <v-col cols="6">
            <v-text-field v-model="color.hex" label="Color Hex Value" readonly>
              <template v-slot:append-inner>
                <div
                  :style="{
                    width: '30px',
                    height: '30px',
                    borderRadius: '4px',
                    backgroundColor: color.hex,
                    border: '1px solid #ccc',
                    marginRight: '8px'
                  }"
                ></div>
              </template>
            </v-text-field>
          </v-col>
          <v-col cols="6">
            <v-text-field
              v-model="color.quantity"
              label="Color Quantity"
              type="number"
              :rules="[rules.required]"
            ></v-text-field>
          </v-col>
          <v-col cols="6">
            <v-text-field
              v-model="color.sku"
              label="Color SKU"
              :rules="[rules.required]"
            ></v-text-field>
          </v-col>
          <v-col class="d-flex justify-end">
            <v-btn
              v-if="newProduct.colors.length > 1"
              @click="removeColor(index)"
              color="primary"
              class="my-2 text-error"

              >Remove Color
            </v-btn>
          </v-col>
        </v-row>
        <v-col cols="12">
          <v-file-upload
            type="file"
            density="comfortable"
            variant="comfortable"
            multiple
            clearable
            @change="handleImageUpload(index, $event.target.files)"
          >
            <template #default="{ files }">
              <v-chip
                v-for="file in files"
                :key="file.name"
                class="ma-1"
                closable
                @click:close="removeFile(index, file)"
              >
                {{ file.name }}
              </v-chip>
            </template>
          </v-file-upload>
        </v-col>
        <!-- Show progress for each color upload -->
        <v-alert v-if="uploadError" type="error" class="mt-4">
          {{ uploadError }}
        </v-alert>

        <v-col cols="12" v-if="uploadProgress[index] !== undefined">
          <v-card class="upload-progress-card" elevation="2">
            <v-card-text class="pa-3">
              <div class="d-flex justify-space-between align-center mb-1">
                <span class="text-caption font-weight-medium">
                  Uploading images for Color {{ index + 1 }}
                </span>
                <span class="text-caption text-primary">
                  {{ uploadProgress[index] }}%
                </span>
              </div>
              <v-progress-linear
                :model-value="uploadProgress[index]"
                height="8"
                rounded
                class="gradient-progress"
              ></v-progress-linear>
              <div class="d-flex justify-end mt-1">
                <v-chip
                  small
                  color="primary"
                  variant="outlined"
                  class="text-caption"
                >
                  {{ getUploadStatus(index) }}
                </v-chip>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </div>
      <v-row>
        <v-col cols="6">
          <v-btn
            class="mt-2"
            type="submit"
            color="secondary"
            :loading="isLoading"
            :disabled="isLoading"
          >
            <template v-slot:loader>
              <v-progress-circular
                indeterminate
                size="20"
                width="2"
              ></v-progress-circular>
              <span class="ml-2">Processing...</span>
            </template>
            Add Product
          </v-btn>
          <v-btn class="mt-2" @click="goBack" color="primary">Cancel</v-btn>
        </v-col>
        <v-col cols="6" class="d-flex justify-end items-end">
          <v-btn @click="addColor" class="mt-2" color="secondary">
            <v-icon start>mdi-plus</v-icon> Add Color</v-btn
          >
        </v-col>
      </v-row>
    </v-form>
  </v-container>
</template>

<script setup>
  import { ref, onMounted, watch } from 'vue'
  import { useRouter } from 'vue-router'
  import { useProductStore } from '../store/product'
  import axios from 'axios'
  import { api } from '../store/product'

  const router = useRouter()
  const productStore = useProductStore()
  const form = ref(null)
  const categoriesList = ref([])
  const colorsList = ref([
    //
    { name: 'Black', hex: '#000000' },
    { name: 'Gray', hex: '#808080' },
    { name: 'Green', hex: '#008000' },
    { name: 'Cream', hex: '#FFFDD0' },
    { name: 'Lavender', hex: '#E6E6FA' },
    { name: 'walnut', hex: '#8B4513' },
    { name: 'Olive', hex: '#808000' },
    { name: 'Dark Brown', hex: '#5C4033' },
    { name: 'Light Blue', hex: '#ADD8E6' },
    { name: 'Dark Blue', hex: '#00008B' },
    { name: 'Graphite Black', hex: '#1C1C1C' },
    { name: 'Navy Blue', hex: '#000080' },
    { name: 'Light Gray', hex: '#D3D3D3' },
    { name: 'Dark Gray', hex: '#A9A9A9' },
    { name: 'Red', hex: '#FF0000' },
    { name: 'Pink', hex: '#FFC0CB' },
    { name: 'Green', hex: '#008000' },
    { name: 'Yellow', hex: '#FFFF00' },
    { name: 'Purple', hex: '#800080' },
    { name: 'Orange', hex: '#FFA500' },
    { name: 'Turquoise', hex: '#40E0D0' },
    { name: 'Light Green', hex: '#90EE90' },
    { name: 'Dark Green', hex: '#006400' },
    { name: 'Light Grey', hex: '#D3D3D3' },
    { name: 'Dark Grey', hex: '#A9A9A9' },
    { name: 'Ivory', hex: '#FFFFF0' },
    { name: 'Cream', hex: '#FFFDD0' },
    { name: 'Burgundy', hex: '#800020' },
    { name: 'Olive', hex: '#808000' },
    { name: 'Mustard', hex: '#FFDB58' },
    { name: 'Coral', hex: '#FF7F50' },
    { name: 'Salmon', hex: '#FA8072' },
    { name: 'Lavender', hex: '#E6E6FA' },
    { name: 'Peach', hex: '#FFDAB9' },
    { name: 'walnut', hex: '#8B4513' },
    { name: 'White Stained', hex: '#F5F5F5' },
    { name: 'Pine', hex: '#F0E68C' },
    { name: 'Oak', hex: '#8B4513' }
  ])

  const newProduct = ref({
    Product: '',
    Description: '',
    ProductCategory: [],
    ProductTags: '',
    BasePrice: null,
    DiscountType: null,
    DiscountValue: null,
    Quantity: null,
    dimensions: {
      width: null,
      height: null,
      depth: null
    },
    colors: [
      {
        name: '',
        hex: '',
        quantity: null,
        sku: '',
        images: [],
        uploadedImages: []
      }
    ]
  })

  const rules = ref({
    required: (value) => !!value || 'Required.'
  })
  const getUploadStatus = (index) => {
    const progress = uploadProgress[index]
    if (progress === 100) return 'Processing...'
    if (progress > 75) return 'Almost done'
    if (progress > 50) return 'Uploading'
    if (progress > 25) return 'Starting'
    return 'Preparing'
  }
  const addColor = () => {
    newProduct.value.colors.push({
      name: '',
      hex: '',
      quantity: null,
      sku: '',
      images: [],
      uploadedImages: []
    })
  }
  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories')
      if (
        response.data &&
        response.data.data &&
        Array.isArray(response.data.data.categories)
      ) {
        categoriesList.value = response.data.data.categories
        console.log('Categories fetched:', categoriesList.value)
      } else {
        console.error(
          'Error: Categories data is not in the expected format:',
          response.data
        )
        categoriesList.value = []
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      categoriesList.value = []
    }
  }
  onMounted(fetchCategories)

  // Add these new refs at the top with your other refs
  const isLoading = ref(false)
  const uploadError = ref(null)
  const uploadProgress = ref({}) // Track progress per color index
  const removeFile = (colorIndex, file) => {
    const color = newProduct.value.colors[colorIndex]
    // Remove from the component's internal state (UI)
    const input = document.querySelector(
      `input[type="file"][data-color-index="${colorIndex}"]`
    )
    if (input) {
      const dataTransfer = new DataTransfer()
      Array.from(input.files)
        .filter((f) => f.name !== file.name)
        .forEach((f) => dataTransfer.items.add(f))
      input.files = dataTransfer.files
    }

    // Remove from our local state if already uploaded
    color.uploadedImages = color.uploadedImages.filter(
      (img) => img.imageUrl !== file.name && img.publicId !== file.name
    )
  }
  const handleImageUpload = async (colorIndex, files) => {
    if (!files || files.length === 0) return

    console.log('--- Start handleImageUpload ---')
    uploadError.value = null
    uploadProgress.value[colorIndex] = 0

    const formData = new FormData()
    for (let i = 0; i < files.length; i++) {
      formData.append('image', files[i])
    }

    const productNameForFolder = newProduct.value.Product.replace(
      /\s+/g,
      '-'
    ).toLowerCase()

    try {
      const response = await axios.post(
        `http://localhost:5000/api/${productNameForFolder}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              uploadProgress.value[colorIndex] = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              )
            }
          }
        }
      )

      if (response.data.data && Array.isArray(response.data.data)) {
        response.data.data.forEach((imageData) => {
          if (imageData.publicId && imageData.imageUrl) {
            newProduct.value.colors[colorIndex].images.push({
              public_id: imageData.publicId,
              url: imageData.imageUrl
            })
            newProduct.value.colors[colorIndex].uploadedImages.push(imageData)
          }
        })
      }
    } catch (error) {
      console.error('Error uploading image to gallery:', error)
      uploadError.value = `Failed to upload images for color ${colorIndex + 1}: ${error.message}`
      throw error // Re-throw to handle in addProduct
    } finally {
      delete uploadProgress.value[colorIndex]
    }
  }
  const addProduct = async () => {
    const { valid } = await form.value.validate()
    if (!valid) return

    isLoading.value = true
    uploadError.value = null

    try {
      // First upload all images
      const uploadPromises = []
      newProduct.value.colors.forEach((color, index) => {
        if (color.files) {
          // Assuming you store files in color.files
          uploadPromises.push(handleImageUpload(index, color.files))
        }
      })

      await Promise.all(uploadPromises)

      // Then submit the product data
      const productToAdd = {
        name: newProduct.value.Product,
        subtitle: newProduct.value.Description,
        categories: newProduct.value.ProductCategory || [],
        additionalInformation: {
          dimensions: {
            width: newProduct.value.dimensions.width,
            height: newProduct.value.dimensions.height,
            depth: newProduct.value.dimensions.depth
          }
        },
        colors: newProduct.value.colors.map((color) => ({
          name: color.name,
          hex: color.hex,
          quantity: color.quantity,
          sku: color.sku,
          images: color.images
        })),
        price: newProduct.value.BasePrice,
        quantity: newProduct.value.Quantity
      }

      await productStore.addProduct(productToAdd)
      router.push('/products')
    } catch (error) {
      console.error('Error adding product:', error)
      uploadError.value =
        uploadError.value || 'Failed to add product. Please try again.'
    } finally {
      isLoading.value = false
    }
  }

  watch(
    () => newProduct.value.colors,
    (newColors) => {
      newColors.forEach((color) => {
        const selectedColor = colorsList.value.find(
          (c) => c.name === color.name
        )
        if (selectedColor) {
          color.hex = selectedColor.hex
        } else if (!color.name) {
          color.hex = ''
        }
      })
    },
    { deep: true }
  )

  const goBack = () => {
    router.go(-1)
  }
</script>

<style scoped>
  .upload-progress-card {
    border-left: 4px solid rgb(var(--v-theme-primary));
    transition: all 0.3s ease;
  }

  .upload-progress-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  .gradient-progress .v-progress-linear__bar {
    background: linear-gradient(to right, #2196f3, #21cbf3);
  }

  /* Keep all your existing styles */
  .form-section {
    background-color: #f9f9f9;
    padding: 16px;
    border-radius: 12px;
    margin-bottom: 24px;
    border: 1px solid #eee;
  }
  .gradient-progress .v-progress-linear__bar {
    transition: width 0.3s ease;
  }

  h3 {
    font-size: 18px;
    font-weight: 600;
    color: #333;
    border-bottom: 1px solid #e0e0e0;
    padding-bottom: 6px;
    margin-bottom: 16px;
  }

  .v-text-field,
  .v-select,
  .v-textarea,
  .v-file-input {
    margin-bottom: 16px;
  }

  .v-btn {
    border-radius: 8px;
    text-transform: none;
    font-weight: 500;
    padding: 10px 20px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  }

  .v-btn + .v-btn {
    margin-left: 12px;
  }

  @media (max-width: 600px) {
    h3 {
      font-size: 16px;
    }

    .v-btn {
      width: 100%;
      margin-bottom: 8px;
    }

    .v-btn + .v-btn {
      margin-left: 0;
    }
  }
</style>
