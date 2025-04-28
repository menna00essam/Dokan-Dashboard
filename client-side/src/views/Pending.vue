<script setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../store/auth";
import axios from "axios";

const router = useRouter();
const authStore = useAuthStore();

const checking = ref(false);
const error = ref("");

async function checkApproval() {
    try {
        checking.value = true;

        const response = await axios.get(`http://localhost:3000/api/check-approval`, {
            params: {
                email: authStore.pendingEmail,
            },
        });

        if (response.data.isApproved) {
            authStore.clearPendingEmail();
            router.push("/login");
        }
    } catch (err) {
        console.error("Error checking approval:", err.response?.data || err.message);
        error.value = "Error checking approval.";
    } finally {
        checking.value = false;
    }
}

onMounted(() => {
    checkApproval();

    setInterval(() => {
        checkApproval();
    }, 10000); 
});
</script>

<template>
    <v-container fluid class="d-flex flex-column align-center justify-center" style="height: 100vh;">
        <v-card class="pa-5 text-center" elevation="2">
            <h2 class="text-blue  m-4">Pending Approval</h2>
            <p>Please wait while the super admin approves your account.</p>
            <!-- <v-progress-circular v-if="checking" indeterminate color="primary" class="mt-4" /> -->
            <p v-if="error" class="text-red mt-4">{{ error }}</p>
        </v-card>
    </v-container>
</template>
