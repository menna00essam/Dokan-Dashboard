import { defineStore } from 'pinia'
import axios from 'axios'

// إنشاء Axios instance بـ Base URL الصحيح
export const api = axios.create({
  baseURL: 'http://localhost:5000' // تأكد إن ده هو الـ URL الصحيح للـ Backend بتاعك
})

export const useProductStore = defineStore('product', {
  state: () => ({
    products: [],
    currentPage: 1,
    itemsPerPage: 10, // Should match your default limit
    totalProducts: 0,
    isLoading: false,
    searchQuery: '' // Add search query to state

    // Add other pagination-related state
  }),

  getters: {
    productCount(state) {
      return state.products.length
    }
  },

  actions: {
    async addProduct(newProduct) {
      try {
        const response = await api.post(
          'http://localhost:5000/products',
          newProduct,
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        )
        this.products.push(response.data.data.product)
        console.log('Product added successfully:', response.data)
      } catch (error) {
        console.error('Error adding product:', error)
        if (error.response) {
          console.log('Error Data:', error.response.data)
          console.log('Error Status:', error.response.status)
          console.log('Error Headers:', error.response.headers)
        } else if (error.request) {
          console.log('Request Error:', error.request)
        } else {
          console.log('Other Error:', error.message)
        }
        throw error
      }
    },
    async fetchImageURL(imageId) {
      console.log('Fetching image URL for ID:', imageId) // ضيفي الـ console.log هنا
      try {
        const response = await api.get(`/api/images/${imageId}`) // افترض إن فيه endpoint زي ده بيرجع الـ URL
        return response.data.imageUrl
      } catch (error) {
        console.error('Error fetching image URL:', error)
        return null
      }
    },

    async fetchAll(
      page = this.currentPage,
      limit = this.itemsPerPage,
      search = ''
    ) {
      try {
        this.isLoading = true
        this.searchQuery = search // Store the search query
        const params = {
          page,
          limit,
          search: search.trim()
        }
        const response = await api.get('/products', { params })
        const productsWithImageURLs = await Promise.all(
          response.data.data.products.map(async (product) => {
            let imageUrl = null
            if (
              product.colors &&
              product.colors[0] &&
              product.colors[0].images &&
              product.colors[0].images.length > 0
            ) {
              const firstImageId = product.colors[0].images[0] // هنا بناخد الـ ID على طول كـ String
              if (firstImageId && typeof firstImageId === 'string') {
                // Check إنه String
                console.log('Image ID being fetched:', firstImageId)
                imageUrl = await this.fetchImageURL(firstImageId)
              } else {
                console.warn(
                  'First image ID is not a valid string:',
                  firstImageId
                )
              }
            } else {
              console.warn('Product is missing colors or images:', product)
            }
            return { ...product, imageUrl: imageUrl }
          })
        )
        this.products = productsWithImageURLs
        this.totalProducts = response.data.data.totalProducts
        this.currentPage = page
      } catch (error) {
        console.error('Error fetching products:', error)
      } finally {
        this.isLoading = false
      }
    },

    async deleteProduct(productId) {
      try {
        await api.delete(`/products/${productId}`) // بعد ما الـ API call ينجح، هنفلتر الـ products array ونشيل المنتج اللي الـ _id بتاعه بيساوي الـ productId
        this.products = this.products.filter(
          (product) => product._id !== productId
        )
        console.log(
          'Product soft deleted and removed from frontend:',
          productId
        )
      } catch (error) {
        console.error('Error soft deleting product:', error) // هنا ممكن نعرض رسالة خطأ للمستخدم لو الـ Soft Delete في الـ Backend فشل
      }
    },

    async updateProduct(productId, formData) {
      // هنستقبل الـ productId والـ formData
      console.log('the form data before response', formData)

      try {
        const response = await api.put(`/products/${productId}`, formData, {
          // هنستخدم الـ formData مباشرةً
          headers: {
            'Content-Type': 'multipart/form-data' // مهم لرفع الملفات
          }
        })
        console.log('the loggged response', response.data)
        const index = this.products.findIndex((p) => p._id === productId) // هنستخدم الـ _id للمقارنة
        if (index !== -1) {
          this.products[index] = response.data.data.product
          console.log('Product updated successfully:', response.data)
        }
      } catch (error) {
        console.error('Error updating product:', error)
      }
    }
  }
})
