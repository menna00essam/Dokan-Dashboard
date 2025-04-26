import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";






// Vuetify 3
import "vuetify/styles";
import "@mdi/font/css/materialdesignicons.css"; // Icons
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";


// Pinia (state management)
import { createPinia } from "pinia";

// Router
import router from "./router";

// Vuetify Theme Configuration
const vuetify = createVuetify({
  components,
  directives,
  icons: {
    defaultSet: "mdi", // Material Design Icons
  },
  theme: {
    defaultTheme: "light",
    themes: {
      light: {
        colors: {
          primary: "#3A5BFF",
          secondary: "#424242",
          error: "#FF5252",
          // ... (other colors)
        },
      },
      dark: {
        colors: {
          primary: "#2E2E48",
          secondary: "#2E2E48",
          background: "#383854",
          error: "#FF5252",
          // ... (other colors)
        },
      },
    },
  },
});

// Create and mount the app
createApp(App).use(router).use(createPinia()).use(vuetify).mount("#app");
