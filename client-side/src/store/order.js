import { defineStore } from "pinia";
import axios from "axios";
import { useToast } from "vue-toastification";

export const useOrderStore = defineStore('order', {
    state: () => ({
        orders: [],
        totalOrders: 0,
        loading: false,
        error: null,
        selectedOrder: null,
        selectedStatus: 'All',
        sortBy: 'createdAt',
        sortOrder: 'desc',
        searchQuery: '',
        currentPage: 1,
        itemsPerPage: 10,
        totalPages: 1
    }),
    getters: {
        filteredOrders: (state) => {
            let result = [...state.orders];
            if (state.selectedStatus !== 'All') {
                result = result.filter(order => order.status === state.selectedStatus);
            }

            if (state.searchQuery) {
                const query = state.searchQuery.toLowerCase();
                result = result.filter((order) => {
                    const fullText = `${order.user?.firstName} ${order.user?.lastName} ${order.orderNumber} ${order.status}`.toLowerCase();
                    return fullText.includes(query);
                })
            }
            return result;
        },
        sortedOrders: (state) => {
            let result = [...state.orders];
            if (state.selectedStatus !== 'All') {
                result = result.filter(order => order.status === state.selectedStatus);
            }
            result.sort((a, b) => {
                let comparison = 0;
                switch (state.sortBy) {
                    case 'userName':
                        const nameA = `${a.user?.firstName} ${a.user?.lastName}`.trim().toLowerCase();
                        const nameB = `${b.user?.firstName} ${b.user?.lastName}`.trim().toLowerCase();
                        comparison = nameA.localeCompare(nameB);
                        break;
                    case 'totalPrice':
                        comparison = a.total - b.total;
                        break;
                    case 'createdAt':
                        comparison = new Date(a.createdAt) - new Date(b.createdAt);
                        break;
                }
                return state.sortOrder === 'asc' ? comparison : -comparison;
            });

            return result;
        },
    },
    actions: {
        async getOrders({
            page = this.currentPage,
            limit = this.itemsPerPage,
            search = this.searchQuery,
            status = this.selectedStatus,
            sortBy = this.sortBy,
            sortOrder = this.sortOrder
        } = {}) {
            this.loading = true;
            this.error = null;
            try {
                const res = await axios.get(
                  'https://dokan-dashboard.onrender.com/orders',
                  {
                    params: { page, limit, search, status, sortBy, sortOrder }
                  }
                )
                console.log("Response data:", res.data);
                if (res.data && res.data.data) {
                    this.orders = res.data.data.orders;
                    console.log(this.orders)
                    this.totalOrders = res.data.data.totalOrders || 0;
                    this.totalPages = Math.ceil(this.totalOrders / this.itemsPerPage);
                    this.currentPage = page;
                } else {
                    console.error("Unexpected data format:", res.data);
                }
            } catch (err) {
                // this.error = err.response?.data?.message || "Something went wrong";
                console.log(err);
            } finally {
                this.loading = false;
            }
        },

        async updateOrderStatus(id, status) {
            const toast = useToast();
            try {
                const res = await axios.put(
                  `https://dokan-dashboard.onrender.com/orders/${id}`,
                  { status }
                )
                if (res.status === 200) {
                    toast.success('Order status updated successfully');
                    await this.getOrders();
                } else {
                    toast.error('Failed to update order status');
                    throw new Error('Failed to update order status');
                }
            } catch (err) {
                console.log(err);
            }
        },

        async softDeleteOrder(id) {
            const toast = useToast();
            try {
                await axios.patch(
                  `https://dokan-dashboard.onrender.com/orders/${id}/soft-delete`
                )
                toast.success('Order deleted successfully');
            } catch (err) {
                console.log(err);
                toast.error('Failed to delete order');
            }
        },

        async restoreOrder(id) {
            try {
                await axios.patch(
                  `https://dokan-dashboard.onrender.com/orders/${id}/restore`
                )
                await this.getOrders();
            } catch (err) {
                console.log(err);
            }
        },

        setSelectedOrder(order) {
            this.selectedOrder = order;
        },

        setStatusFilter(status) {
            this.selectedStatus = status;
            this.currentPage = 1;
            const statusParam = status === 'All' ? '' : status;
            this.getOrders({ status: statusParam });
        },

        setSortBy(sortBy) {
            this.sortBy = sortBy;
            this.getOrders();
        },
        resetFilters() {
            this.selectedStatus = 'All';
            this.sortBy = 'createdAt';
            this.sortOrder = 'desc';
            this.getOrders();
        },
        setSearchQuery(query) {
            this.searchQuery = query;
            this.currentPage = 1;
            this.getOrders({ search: query });
        },
        async handlePageChange(newPage) {
            if (newPage === this.currentPage) return;
            this.currentPage = newPage;
            await this.getOrders({
                page: newPage,
                limit: this.itemsPerPage,
                status: this.selectedStatus,
                search: this.searchQuery,
                sortBy: this.sortBy,
                sortOrder: this.sortOrder
            });
        },
        async handleItemsPerPageChange(newSize) {
            this.itemsPerPage = newSize;
            this.currentPage = 1;
            await this.getOrders({
                page: 1,
                limit: newSize,
                status: this.selectedStatus,
                search: this.searchQuery,
                sortBy: this.sortBy,
                sortOrder: this.sortOrder
            });
        }
    }
})
