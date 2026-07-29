// iOS only looks for a new service worker on a cold start, so an installed
// home-screen app can keep serving a stale build indefinitely. Ask explicitly
// whenever the app comes back to the foreground, and reload once the newer
// worker takes over.
export function watchForUpdates() {
  if (!("serviceWorker" in navigator)) return;

  const hadController = Boolean(navigator.serviceWorker.controller);
  let reloading = false;

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    // On a first install there is nothing stale to replace, so skip the reload.
    if (!hadController || reloading) return;
    reloading = true;
    window.location.reload();
  });

  const checkForUpdate = () => {
    if (document.visibilityState !== "visible") return;
    navigator.serviceWorker.getRegistration().then((reg) => reg?.update());
  };

  document.addEventListener("visibilitychange", checkForUpdate);
  window.addEventListener("focus", checkForUpdate);
  checkForUpdate();
}
