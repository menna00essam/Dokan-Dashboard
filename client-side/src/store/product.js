// import { defineStore } from "pinia";

// export const useProductStore = defineStore("product", {
//   state: () => ({
//     products: [
//       { Product: 'Handmade Pouch', sku: '302082', category: 'Bag & Pouch', stock: 10, price: 121.00, status: 'Low Stock', added: '29 Dec 2022', variants: '3', selected: false, image: ['1.png'] }, // image دلوقتي بقت مصفوفة
//       { Product: 'Smartwatch E2', sku: '302011', category: 'Watch', stock: 204, price: 890.00, status: 'Published', added: '24 Dec 2022', variants: '2', selected: false, image: ['1.png'] }, // image دلوقتي بقت مصفوفة
//       { Product: 'Smartwatch E1', sku: '302002', category: 'Watch', stock: 48, price: 125.00, status: 'Draft', added: '12 Dec 2022', variants: '3', selected: false, image: ['1.png'] }, // image دلوقتي بقت مصفوفة
//       { Product: 'Headphone G1 Pro', sku: '301901', category: 'Audio', stock: 401, price: 348.00, status: 'Published', added: '21 Oct 2022', variants: '1', selected: false, image: ['1.png'] }, // image دلوقتي بقت مصفوفة
//       { Product: 'Iphone X', sku: '301900', category: 'Smartphone', stock: 120, price: 607.00, status: 'Published', added: '21 Oct 2022', variants: '4', selected: false, image: ['1.png'] }, // image دلوقتي بقت مصفوفة
//       { Product: 'Puma Shoes', sku: '301881', category: 'Shoes', stock: 432, price: 234.00, status: 'Published', added: '21 Oct 2022', variants: '3', selected: false, image: ['1.png'] }, // image دلوقتي بقت مصفوفة
//     ],
//   }),

//   getters: {
//     productCount(state) {
//       return state.products.length;
//     },
//   },

//   actions: {
//     addProduct(newProduct) {
//       const productToAdd = {
//         Product: newProduct.Product,
//         sku: newProduct.sku, // تأكد إن اسم الـ key مطابق للي جاي من الفورم
//         category: newProduct.category, // تأكد إن اسم الـ key مطابق للي جاي من الفورم
//         stock: newProduct.stock, // تأكد إن اسم الـ key مطابق للي جاي من الفورم
//         price: newProduct.price, // تأكد إن اسم الـ key مطابق للي جاي من الفورم
//         status: newProduct.status, // تأكد إن اسم الـ key مطابق للي جاي من الفورم
//         tags: newProduct.tags, // تأكد إن اسم الـ key مطابق للي جاي من الفورم
//         description: newProduct.description, // تأكد إن اسم الـ key مطابق للي جاي من الفورم
//         image: newProduct.imageFiles ? newProduct.imageFiles.map(file => file.name) : [], // هنخزن أسماء الملفات كمصفوفة
//         // ممكن تضيف هنا أي حقول تانية محتاجها
//       };
//       this.products.push(productToAdd);
//       console.log('Current products array:', this.products);
//     },

//     deleteProduct(sku) {
//       this.products = this.products.filter(product => product.sku !== sku);
//     },

//     updateProduct(updatedProduct) {
//       const productIndex = this.products.findIndex(product => product.sku === updatedProduct.sku);
//       if (productIndex !== -1) {
//         this.products[productIndex] = { ...updatedProduct };
//         console.log('Product updated:', updatedProduct);
//       } else {
//         console.error('Product with SKU not found');
//       }
//     },

//     async fetchAll() {
//       // const res = await axios.get("/api/products");
//       // this.products = res.data;
//       console.log('Fetching all products (API not connected yet)');
//     },
//   },
// });

import { defineStore } from "pinia";
import axios from 'axios';

// إنشاء Axios instance بـ Base URL الصحيح
export const api = axios.create({
  baseURL: 'http://localhost:5000' // تأكد إن ده هو الـ URL الصحيح للـ Backend بتاعك
});

export const useProductStore = defineStore("product", {
  state: () => ({
    products: [],
  }),

  getters: {
    productCount(state) {
      return state.products.length;
    },
  },

  actions: {
    async addProduct(newProduct) {
      try {
        const response = await api.post('http://localhost:5000/products', newProduct, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        this.products.push(response.data.data.product);
        console.log('Product added successfully:', response.data);
      } catch (error) {
        console.error('Error adding product:', error);
        if (error.response) {
          console.log('Error Data:', error.response.data);
          console.log('Error Status:', error.response.status);
          console.log('Error Headers:', error.response.headers);
        } else if (error.request) {
          console.log('Request Error:', error.request);
        } else {
          console.log('Other Error:', error.message);
        }
        throw error;
      }
    },
    async fetchImageURL(imageId) {
      console.log('Fetching image URL for ID:', imageId); // ضيفي الـ console.log هنا
      try {
        const response = await api.get(`/api/images/${imageId}`); // افترض إن فيه endpoint زي ده بيرجع الـ URL
        return response.data.imageUrl; 
      } catch (error) {
        console.error('Error fetching image URL:', error);
        return null;
      }
    },

    async fetchAll() {
      try {
        const response = await api.get('/products');
        const productsWithImageURLs = await Promise.all(
          response.data.data.products.map(async (product) => {
            let imageUrl = null;
            if (product.colors && product.colors[0] && product.colors[0].images && product.colors[0].images.length > 0) {
              const firstImageId = product.colors[0].images[0]; // هنا بناخد الـ ID على طول كـ String
              if (firstImageId && typeof firstImageId === 'string') { // Check إنه String
                console.log('Image ID being fetched:', firstImageId);
                imageUrl = await this.fetchImageURL(firstImageId);
              } else {
                console.warn('First image ID is not a valid string:', firstImageId);
              }
            } else {
              console.warn('Product is missing colors or images:', product);
            }
            return { ...product, imageUrl: imageUrl };
          })
        );
        this.products = productsWithImageURLs;
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    },

    async deleteProduct(productId) {
            try {
              await api.delete(`/products/${productId}`);
              // بعد ما الـ API call ينجح، هنفلتر الـ products array ونشيل المنتج اللي الـ _id بتاعه بيساوي الـ productId
              this.products = this.products.filter(product => product._id !== productId);
              console.log('Product soft deleted and removed from frontend:', productId);
            } catch (error) {
              console.error('Error soft deleting product:', error);
              // هنا ممكن نعرض رسالة خطأ للمستخدم لو الـ Soft Delete في الـ Backend فشل
            }
          },

      async updateProduct(productId, formData) { // هنستقبل الـ productId والـ formData
        try {
          const response = await api.put(`/products/${productId}`, formData, { // هنستخدم الـ formData مباشرةً
            headers: {
              'Content-Type': 'multipart/form-data' // مهم لرفع الملفات
            }
          });
          const index = this.products.findIndex(p => p._id === productId); // هنستخدم الـ _id للمقارنة
          if (index !== -1) {
            this.products[index] = response.data.data.product;
            console.log('Product updated successfully:', response.data);
          }
        } catch (error) {
          console.error('Error updating product:', error);
        }
      },
  },
});