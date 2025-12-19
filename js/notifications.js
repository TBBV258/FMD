// notifications.js
// Notificações inteligentes e push
export function sendNotification(title, options) {
  if (Notification.permission === 'granted') {
    new Notification(title, options);
  }
}
