<template>
  <v-container class="mb-8 pa-4 rounded-lg elevation-2">
    <v-form ref="form" @submit.prevent="updateProduct">
      <h3 class="text-h6 mb-2" color="secondary">
        {{ t('general_information') }}
      </h3>
      <v-text-field
        v-model="editedProduct.Product"
        :rules="[rules.required]"
        :label="t('product_name')"
      ></v-text-field>

      <v-textarea
        :rules="[rules.required]"
        v-model="editedProduct.Description"
        :label="t('description')"
      ></v-textarea>

      <h3 class="text-h6 mb-2">{{ t('dimensions') }}</h3>
      <v-row>
        <v-col cols="4">
          <v-text-field
            :rules="[rules.required]"
            v-model="editedProduct.dimensions.width"
            type="number"
            :label="t('width')"
          ></v-text-field>
        </v-col>
        <v-col cols="4">
          <v-text-field
            :rules="[rules.required]"
            v-model="editedProduct.dimensions.height"
            :label="t('height')"
            type="number"
          ></v-text-field>
        </v-col>
        <v-col cols="4">
          <v-text-field
            :rules="[rules.required]"
            v-model="editedProduct.dimensions.depth"
            :label="t('depth')"
            type="number"
          ></v-text-field>
        </v-col>
      </v-row>

      <h3 class="text-h6 mb-2">{{ t('category') }}</h3>
      <v-select
        v-model="editedProduct.ProductCategory"
        :items="categoriesList"
        item-value="_id"
        item-title="name"
        :rules="[rules.required]"
        :label="t('product_category')"
      ></v-select>

      <h3 class="text-h6 mb-2">{{ t('pricing') }}</h3>
      <v-row>
        <v-col cols="4">
          <v-text-field
            v-model="editedProduct.BasePrice"
            :rules="[rules.required]"
            :label="t('price')"
            type="number"
          ></v-text-field>
        </v-col>
        <v-col cols="4">
          <v-select
            v-model="editedProduct.DiscountType"
            :items="['Percentage', 'Fixed']"
            :label="t('discount_type')"
          ></v-select>
        </v-col>
        <v-col cols="4">
          <v-text-field
            v-model="editedProduct.DiscountValue"
            :label="t('discount_value')"
            type="number"
          ></v-text-field>
        </v-col>
      </v-row>

      <h3 class="text-h6 mb-2">{{ t('inventory') }}</h3>
      <v-row>
        <v-col cols="12">
          <v-text-field
            v-model="editedProduct.Quantity"
            :rules="[rules.required]"
            :label="t('quantity')"
            type="number"
          ></v-text-field>
        </v-col>
      </v-row>

      <div v-for="(color, index) in editedProduct.colors" :key="index">
        <h3>{{ t('color_n', { n: index + 1 }) }}</h3>
        <v-row>
          <v-col cols="6">
            <v-select
              v-model="color.name"
              :items="colorsList"
              item-value="name"
              item-title="name"
              :label="t('select_color_name')"
              :rules="[rules.required]"
            ></v-select>
          </v-col>
          <v-col cols="6">
            <v-text-field
              v-model="color.hex"
              :label="t('color_hex_value')"
              readonly
            >
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
              :label="t('color_quantity')"
              type="number"
              :rules="[rules.required]"
            ></v-text-field>
          </v-col>
          <v-col cols="6">
            <v-text-field
              v-model="color.sku"
              :label="t('color_sku')"
              :rules="[rules.required]"
            ></v-text-field>
          </v-col>
          <v-col class="d-flex justify-end">
            <v-btn
              v-if="editedProduct.colors.length > 1"
              @click="removeColor(index)"
              color="primary"
              class="my-2 text-error"
            >
              {{ t('remove_color') }}
            </v-btn>
          </v-col>
        </v-row>

        <!-- Existing Images Display -->
        <v-row fluid class="">
          <v-col
            v-for="(image, imgIndex) in color.uploadedImages"
            :key="'img_' + index + '_' + imgIndex"
            cols="12"
            sm="6"
            md="3"
          >
            <v-card
              class="pa-2 d-flex flex-column align-center"
              elevation="1"
              :class="{ 'marked-for-deletion': image._markedForDeletion }"
            >
              <v-img
                :src="image.imageUrl"
                height="100"
                width="100"
                class="rounded mb-2"
                cover
                :style="{ opacity: image._markedForDeletion ? 0.5 : 1 }"
              ></v-img>
              <span
                class="text-caption text-truncate text-center mb-2"
                style="max-width: 100px"
              >
                {{ image.imageUrl.split('/').pop() }}
                <span v-if="image._markedForDeletion" class="text-error"
                  >(Will be deleted)</span
                >
              </span>
              <v-btn
                icon
                size="small"
                color=""
                class="deleteIcon"
                @click="removeColorImage(index, imgIndex)"
              >
                <v-icon>mdi-close</v-icon>
              </v-btn>
            </v-card>
          </v-col>
        </v-row>
        <!-- New Image Upload -->
        <v-col cols="12" class="pa-0 my-3">
          <v-file-upload
            type="file"
            density="comfortable"
            variant="comfortable"
            multiple
            clearable
            class="bg-backgound"
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

        <!-- Upload Progress -->
        <v-alert v-if="uploadError" type="error" class="mt-4">
          {{ uploadError }}
        </v-alert>

        <v-col cols="12" v-if="uploadProgress[index] !== undefined">
          <v-card class="upload-progress-card" elevation="2">
            <v-card-text class="pa-3">
              <div class="d-flex justify-space-between align-center mb-1">
                <span class="text-caption font-weight-bold my-2">
                  {{ t('uploading_images_for_color_n', { n: index + 1 }) }}
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
            class="mt-2 mr-2"
            type="submit"
            color="secondary"
            :loading="isLoading"
            :disabled="isLoading || isUploading"
          >
            <template v-slot:loader>
              <v-progress-circular
                indeterminate
                size="20"
                width="2"
              ></v-progress-circular>
              <span class="ml-2">{{ t('processing') }}</span>
            </template>
            {{ t('update_product') }}
          </v-btn>
          <v-btn class="mt-2" @click="goBack" color="primary">{{
            t('cancel')
          }}</v-btn>
        </v-col>
        <v-col cols="6" class="d-flex justify-end items-end">
          <v-btn @click="addColor" class="mt-2" color="secondary">
            <v-icon start>mdi-plus</v-icon> {{ t('add_color') }}
          </v-btn>
        </v-col>
      </v-row>
      <ConfirmDialog
        ref="confirmDialog"
        type="warning"
        :title="t('confirmDeleteImage')"
        :confirm-text="t('delete')"
        :cancel-text="t('cancel')"
        confirm-color="error"
        @confirm="processImageDeletion"
      />
    </v-form>
  </v-container>
</template>

<script setup>
  const { t, locale } = useI18n()
  import { useI18n } from 'vue-i18n'
  import { ref, onMounted, watch } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { useProductStore } from '../store/product'
  import axios from 'axios'
  import { api } from '../store/product'
  import ConfirmDialog from '../components/Shared/ConfirmDialog.vue'
  const confirmDialog = ref(null)
  const pendingDeletion = ref({ colorIndex: null, imageIndex: null })
  const router = useRouter()
  const route = useRoute()
  const productStore = useProductStore()
  const form = ref(null)
  const categoriesList = ref([])
  const colorsList = ref([
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

  // Add these refs for upload tracking
  const isLoading = ref(false)
  const uploadError = ref(null)
  const uploadProgress = ref({})
  const isUploading = ref(false)

  const productId = ref(route.params.id)
  const editedProduct = ref({
    Product: '',
    Description: '',
    ProductCategory: [],
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
        uploadedImages: [],
        newlyUploadedImages: []
      }
    ]
  })

  const rules = ref({
    required: (value) => !!value || 'Required.'
  })

  const getUploadStatus = (index) => {
    const progress = uploadProgress[index]
    if (progress === 100) return t('processing')
    if (progress > 75) return t('almost_done')
    if (progress > 50) return t('uploading')
    if (progress > 25) return t('starting')
    return t('preparing')
  }

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories')
      if (response.data?.data?.categories) {
        categoriesList.value = response.data.data.categories
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const loadProductDetails = async () => {
    try {
      const response = await api.get(`/products/${productId.value}`)
      if (response.data?.data?.product) {
        const productData = response.data.data.product

        editedProduct.value = {
          Product: productData.name || '',
          Description: productData.subtitle || '',
          ProductCategory: productData.categories || [],
          BasePrice: productData.price || null,
          DiscountValue: productData.sale || null,
          Quantity: productData.totalQuantity || null,
          dimensions: {
            width: productData.additionalInformation?.dimensions?.width || null,
            height:
              productData.additionalInformation?.dimensions?.height || null,
            depth: productData.additionalInformation?.dimensions?.depth || null
          },
          colors: productData.colors?.map((color) => ({
            name: color.name || '',
            hex: color.hex || '',
            quantity: color.quantity || null,
            sku: color.sku || '',
            images: color.images || [],
            uploadedImages:
              color.images?.map((img) => ({
                imageUrl: img.imageUrl,
                publicId: img.publicId,
                _id: img._id
              })) || [],
            newlyUploadedImages: []
          })) || [
            {
              name: '',
              hex: '',
              quantity: null,
              sku: '',
              images: [],
              uploadedImages: [],
              newlyUploadedImages: []
            }
          ]
        }
      }
    } catch (error) {
      console.error('Error loading product:', error)
      router.push('/products')
    }
  }

  const updateColorHex = (index) => {
    const selectedColor = colorsList.value.find(
      (c) => c.name === editedProduct.value.colors[index].name
    )
    if (selectedColor) {
      editedProduct.value.colors[index].hex = selectedColor.hex
    }
  }

  const addColor = () => {
    editedProduct.value.colors.push({
      name: '',
      hex: '',
      quantity: null,
      sku: '',
      images: [],
      uploadedImages: [],
      newlyUploadedImages: []
    })
  }

  const removeColor = (index) => {
    if (editedProduct.value.colors.length > 1) {
      editedProduct.value.colors.splice(index, 1)
    }
  }

  const removeColorImage = (colorIndex, imageIndex) => {
    // Store the indices of the image to be deleted
    pendingDeletion.value = { colorIndex, imageIndex }

    // Show confirmation dialog
    confirmDialog.value.open({
      message: t('delete_image_warning')
    })
  }

  const processImageDeletion = async () => {
    const { colorIndex, imageIndex } = pendingDeletion.value
    const color = editedProduct.value.colors[colorIndex]
    const image = color.uploadedImages[imageIndex]

    try {
      // If it's a newly uploaded image (not saved to DB yet)
      if (!image._id && image.publicId) {
        // Remove from display immediately
        color.uploadedImages.splice(imageIndex, 1)

        // Remove from newlyUploadedImages if present
        color.newlyUploadedImages = color.newlyUploadedImages.filter(
          (img) => img.public_id !== image.publicId
        )

        // Delete from Cloudinary
        await axios.delete(`http://localhost:5000/api/images/${image.publicId}`)
        return
      }

      // For existing images (saved in DB)
      if (image._id) {
        // Mark for deletion (will be handled in update)
        color.uploadedImages[imageIndex]._delete = true

        // Show visual feedback that image is marked for deletion
        color.uploadedImages[imageIndex]._markedForDeletion = true
      }
    } catch (error) {
      console.error('Error deleting image:', error)

      // Show error notification (you might have your own notification system)
      showErrorNotification(t('delete_image_failed'))
    } finally {
      // Reset pending deletion
      pendingDeletion.value = { colorIndex: null, imageIndex: null }
    }
  }

  const removeFile = (colorIndex, file) => {
    const color = editedProduct.value.colors[colorIndex]
    color.newlyUploadedImages = color.newlyUploadedImages.filter(
      (img) => img.fileName !== file.name
    )
  }

  const handleImageUpload = async (colorIndex, files) => {
    if (!files || files.length === 0) return

    uploadError.value = null
    uploadProgress.value[colorIndex] = 0
    isUploading.value = true

    const formData = new FormData()
    for (let i = 0; i < files.length; i++) {
      formData.append('image', files[i])
    }

    const productNameForFolder = editedProduct.value.Product.replace(
      /\s+/g,
      '-'
    ).toLowerCase()

    try {
      const response = await axios.post(
        `http://localhost:5000/api/${productNameForFolder}`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
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
            // Create the image object in the format you need
            const newImage = {
              public_id: imageData.publicId,
              url: imageData.imageUrl
            }

            // Add to newlyUploadedImages array
            editedProduct.value.colors[colorIndex].newlyUploadedImages.push(
              newImage
            )

            // Add to uploadedImages array for display
            editedProduct.value.colors[colorIndex].uploadedImages.push(
              imageData
            )

            // Add to images array for form submission
            editedProduct.value.colors[colorIndex].images.push({
              public_id: imageData.publicId,
              url: imageData.imageUrl
            })
          }
        })
      }
      console.log('handle upload image', editedProduct.value)
    } catch (error) {
      console.error('Error uploading images:', error)
      uploadError.value = t('upload_failed', { error: error.message })
    } finally {
      uploadProgress.value[colorIndex] = 100
      setTimeout(() => {
        delete uploadProgress.value[colorIndex]
        isUploading.value = Object.keys(uploadProgress.value).length > 0
      }, 1000)
    }
  }

  const updateProduct = async () => {
    const { valid } = await form.value.validate()
    if (!valid) return

    // Check for ongoing uploads
    if (Object.keys(uploadProgress.value).length > 0) {
      uploadError.value = t('please_wait_uploads')
      return
    }

    isLoading.value = true
    uploadError.value = null

    try {
      // Prepare FormData for submission
      const formData = new FormData()

      // Add basic product info
      formData.append('name', editedProduct.value.Product)
      formData.append('subtitle', editedProduct.value.Description || '')
      formData.append('price', editedProduct.value.BasePrice)
      formData.append('discountType', editedProduct.value.DiscountType || '')
      formData.append('discountValue', editedProduct.value.DiscountValue || '')
      formData.append('quantity', editedProduct.value.Quantity)

      // Add categories
      editedProduct.value.ProductCategory.forEach((cat) => {
        formData.append('categories', cat._id || cat)
      })

      // Add dimensions
      formData.append(
        'dimensions',
        JSON.stringify(editedProduct.value.dimensions)
      )

      // Prepare colors data
      const colorsData = editedProduct.value.colors.map((color) => {
        const colorObj = {
          name: color.name,
          hex: color.hex,
          quantity: color.quantity,
          sku: color.sku,
          images: []
        }

        // Add existing images (filter out deleted ones)
        color.uploadedImages
          .filter((img) => !img._delete)
          .forEach((img) => {
            colorObj.images.push({
              _id: img._id,
              public_id: img.publicId,
              url: img.imageUrl
            })
          })

        // Add newly uploaded images
        color.newlyUploadedImages.forEach((img) => {
          colorObj.images.push({
            public_id: img.public_id,
            url: img.url
          })
        })

        return colorObj
      })

      // Add colors to formData
      formData.append('colors', JSON.stringify(colorsData))

      console.log('Submitting product data:', Object.fromEntries(formData))

      // Send the update request
      await productStore.updateProduct(productId.value, formData)
      router.push('/products')
    } catch (error) {
      console.error('Error updating product:', error)
      uploadError.value =
        t('update_failed') +
        ': ' +
        (error.response?.data?.message || error.message)
    } finally {
      isLoading.value = false
    }
  }
  onMounted(async () => {
    await fetchCategories()
    await loadProductDetails()
  })

  watch(
    () => editedProduct.value.colors,
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
  /* Use the same styles as your add page */
  .upload-progress-card {
    border-left: 4px solid rgb(var(--v-theme-primary));
    transition: all 0.3s ease;
    background: rgba(var(--v-theme-primary), 0.05);
  }

  .upload-progress-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(var(--v-theme-primary), 0.15);
  }

  .gradient-progress :deep(.v-progress-linear__determinate) {
    background: rgb(var(--v-theme-primary));
    background: linear-gradient(
      90deg,
      rgba(var(--v-theme-secondary), 0.8) 0%,
      rgba(var(--v-theme-primary), 1) 50%,
      rgba(var(--v-theme-primary), 0.8) 100%
    );
    background-size: 200% 100%;
    animation: gradientAnimation 2s ease infinite;
    border-radius: 4px;
    height: 8px;
  }

  @keyframes gradientAnimation {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }

  .text-primary {
    color: rgb(var(--v-theme-primary)) !important;
    animation: pulse 1.5s ease-in-out infinite;
  }

  @keyframes pulse {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
    100% {
      opacity: 1;
    }
  }

  /* Keep your existing form styles */
  .form-section {
    background-color: #f9f9f9;
    padding: 16px;
    border-radius: 12px;
    margin-bottom: 24px;
    border: 1px solid #eee;
  }

  h3 {
    font-size: 18px;
    font-weight: 600;
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

  @media (max-width: 600px) {
    h3 {
      font-size: 16px;
    }

    .v-btn {
      width: 100%;
      margin-bottom: 8px;
    }
  }
  .marked-for-deletion {
    border: 2px dashed #ff5252;
    background-color: rgba(255, 82, 82, 0.1);
  }
  .deleteIcon {
    position: absolute !important;
    top: 0 !important;
    right: 0 !important;
    color: red;
    box-shadow: none;
    text-align: right !important;
    width: 50px;
  }
</style>
