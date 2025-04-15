import { defineStore } from "pinia";
export const useProductStore = defineStore("product", {
  state: () => ({
    products: [, ,],
  }),
  getters: {
    productCount(state) {
      return state.products.length;
    },
  },
  actions: {
    addProduct() {
      this.products.push();
    },
    async fetchAll() {
      const res = await axios.get("/api/products");
      this.products = res.data;
    },
  },
});
