// Run independently of the React bundle so a failed download is never a blank page.
(() => {
  const screen = document.getElementById("app-startup");
  const title = document.getElementById("startup-title");
  const message = document.getElementById("startup-message");
  const retry = document.getElementById("startup-retry");
  const showRecovery = () => {
    if (!screen?.isConnected) return;
    title.textContent = "Let's reconnect your workspace.";
    message.textContent = "The app couldn't finish loading. Check your connection and try again.";
    retry.hidden = false;
  };
  const timeout = window.setTimeout(showRecovery, 15000);
  const observer = new MutationObserver(() => {
    if (!screen?.isConnected) {
      window.clearTimeout(timeout);
      observer.disconnect();
      window.removeEventListener("error", showRecovery, true);
      window.removeEventListener("vite:preloadError", showRecovery);
    }
  });
  observer.observe(document.getElementById("root"), { childList: true });
  window.addEventListener("error", showRecovery, true);
  window.addEventListener("vite:preloadError", showRecovery);
  retry?.addEventListener("click", () => {
    // A unique navigation also escapes the legacy worker's cache-first HTML.
    const url = new URL(window.location.href);
    url.searchParams.set("_cf_reload", String(Date.now()));
    window.location.replace(url.href);
  });
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).catch(() => {
      // Loading the online app never depends on permission to use offline storage.
    });
  }
})();