// composables/useThemeToggle.js
import { useTheme } from "vuetify";
import { ref, onMounted } from "vue";

export default function useThemeToggle() {
  const theme = useTheme();
  const isDark = ref(theme.global.name.value === "dark");

  const toggleTheme = () => {
    theme.global.name.value = isDark.value ? "light" : "dark";
    isDark.value = !isDark.value;
    localStorage.setItem("darkTheme", isDark.value);
  };

  onMounted(() => {
    const savedPreference = localStorage.getItem("darkTheme");
    if (savedPreference !== null) {
      isDark.value = savedPreference === "true";
      theme.global.name.value = isDark.value ? "dark" : "light";
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      isDark.value = true;
      theme.global.name.value = "dark";
    }
  });

  return { isDark, toggleTheme };
}
