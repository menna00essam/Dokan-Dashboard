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
        <v-col cols="4">
          <v-text-field
            v-model="newProduct.SKU"
            :rules="[rules.required]"
            label="SKU"
          ></v-text-field>
        </v-col>
        <v-col cols="4">
          <v-text-field
            v-model="newProduct.Quantity"
            :rules="[rules.required]"
            label="Quantity"
            type="number"
          ></v-text-field>
        </v-col>
        <v-col cols="4">
          <v-select
            v-model="newProduct.ProductStatus"
            :items="['Draft', 'Published']"
            label="Product Status"
          ></v-select>
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
        </v-row>
        <input
          type="file"
          multiple
          @change="handleImageUpload(index, $event.target.files)"
        />
        <div v-if="color.uploadedImages.length > 0">
          <p>Uploaded Images for Color {{ index + 1 }}:</p>
          <ul>
            <li v-for="img in color.uploadedImages" :key="img.publicId">
              {{ img.publicId }} - {{ img.imageUrl }}
            </li>
          </ul>
        </div>
        <v-btn
          v-if="newProduct.colors.length > 1"
          @click="removeColor(index)"
          class="mt-2"
          >Remove Color</v-btn
        >
        <hr class="my-4" />
      </div>
      <v-btn @click="addColor">Add Color</v-btn>

      <v-btn class="mt-4" type="submit" color="primary">Add Product</v-btn>
      <v-btn class="mt-4 ml-2" @click="goBack">Cancel</v-btn>
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
    { name: 'Olive', hex: '#808000' }
  ])

  const newProduct = ref({
    Product: '',
    Description: '',
    ProductCategory: [],
    ProductTags: '',
    ProductStatus: 'Draft',
    BasePrice: null,
    DiscountType: null,
    DiscountValue: null,
    SKU: '',
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

  const handleImageUpload = async (colorIndex, files) => {
    console.log('--- Start handleImageUpload ---')
    console.log('colorIndex:', colorIndex)
    console.log('files:', files)
    const formData = new FormData()
    for (let i = 0; i < files.length; i++) {
      formData.append('image', files[i])
      console.log(`formData appended file ${i}:`, files[i].name)
    }

    const productNameForFolder = newProduct.value.Product.replace(
      /\s+/g,
      '-'
    ).toLowerCase()
    console.log('productNameForFolder:', productNameForFolder)
    const uploadUrl = `http://localhost:5000/api/${productNameForFolder}`
    console.log('uploadUrl:', uploadUrl)

    try {
      const response = await axios.post(
        `http://localhost:5000/api/${productNameForFolder}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      )
      console.log('--- After axios.post ---')
      console.log('response:', response)
      if (response.data.data && Array.isArray(response.data.data)) {
        response.data.data.forEach((imageData) => {
          if (imageData.publicId && imageData.imageUrl) {
            newProduct.value.colors[colorIndex].images.push({
              public_id: imageData.publicId,
              url: imageData.imageUrl
            })
            newProduct.value.colors[colorIndex].uploadedImages.push(imageData)
            console.log('Image uploaded to gallery:', imageData)
          } else {
            console.error(
              'Error uploading image - no publicId in image data:',
              imageData
            )
          }
        })
        console.log(
          'newProduct.value.colors after upload:',
          newProduct.value.colors
        )
      } else {
        console.error(
          'Error uploading image - unexpected response data:',
          response.data
        )
      }
    } catch (error) {
      console.error('Error uploading image to gallery:', error)
    }
  }

  const addProduct = async () => {
    const { valid } = await form.value.validate()
    if (valid) {
      try {
        console.log('قيم newProduct قبل الإرسال:', newProduct.value) // هنا
        const productToAdd = {
          name: newProduct.value.Product,
          subtitle: newProduct.value.Description,
          categories: newProduct.value.ProductCategory || [],
          additionalInformation: {
            // إضافة additionalInformation هنا
            dimensions: {
              // وإضافة dimensions جواه
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
        console.log('الـ productToAdd object اللي هيتبعت:', productToAdd) // هنا
        await productStore.addProduct(productToAdd)
        router.push('/products')
      } catch (error) {
        console.error('Error adding product:', error)
      }
    }
  }
  // Watch عشان نراقب تغيير اسم اللون ونحدث الـ Hex
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
