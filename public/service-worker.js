self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    event.waitUntil(
        focusOpenClient('/')
    );
});

async function focusOpenClient(url = '/') {
    const clientList = await clients.matchAll({
        type: 'window',
        includeUncontrolled: true
    });

    for (const client of clientList) {
        if ('focus' in client) {
            return client.focus();
        }
    }

    if (clients.openWindow) {
        return clients.openWindow(url);
    }
}