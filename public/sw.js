// Empty service worker to prevent 404 errors from previous service workers on localhost:3000
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => {
    self.registration.unregister();
    self.clients.claim();
});
