import { apiRequest } from '../api/client';

const ENABLED_KEY = 'healthassist_notifications_enabled';
const SENT_KEY = 'healthassist_notification_sent';

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied';
  const permission = await Notification.requestPermission();
  if (permission === 'granted') localStorage.setItem(ENABLED_KEY, 'true');
  return permission;
}

export function notificationsEnabled(): boolean {
  return localStorage.getItem(ENABLED_KEY) === 'true';
}

export function disableNotifications() {
  localStorage.removeItem(ENABLED_KEY);
}

export function sendHealthNotification(title: string, body: string, tag: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const today = new Date().toISOString().slice(0, 10);
  const key = `${today}:${tag}`;
  const sent = JSON.parse(localStorage.getItem(SENT_KEY) || '{}') as Record<string, boolean>;
  if (sent[key]) return;
  new Notification(title, { body, tag: `healthassist-${tag}` });
  sent[key] = true;
  localStorage.setItem(SENT_KEY, JSON.stringify(sent));
}

function timeMatchesNow(value: string, windowMinutes = 1): boolean {
  if (!value) return false;
  const [hour, minute] = value.slice(0, 5).split(':').map(Number);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return false;
  const now = new Date();
  const target = new Date(now);
  target.setHours(hour, minute, 0, 0);
  return Math.abs(now.getTime() - target.getTime()) <= windowMinutes * 60000;
}

export async function checkHealthReminders() {
  if (!notificationsEnabled() || Notification.permission !== 'granted') return;

  try {
    const medications = await apiRequest<any[]>('/medications');
    for (const med of medications || []) {
      if (timeMatchesNow(med.reminder_time)) {
        sendHealthNotification(
          '💊 HealthAssist AI Reminder',
          `${med.name} — ${med.dosage || 'as scheduled'}`,
          `medication-${med.id}-${med.reminder_time}`,
        );
      }
    }
  } catch {}

  try {
    const appointments = await apiRequest<any[]>('/appointments');
    const now = Date.now();
    for (const appointment of appointments || []) {
      if (!appointment.reminder_enabled || !appointment.date_time) continue;
      const minutesAway = (new Date(appointment.date_time).getTime() - now) / 60000;
      if (minutesAway >= 0 && minutesAway <= 1) {
        sendHealthNotification(
          '📅 HealthAssist AI Appointment',
          `${appointment.title} — ${appointment.category || 'Appointment'}`,
          `appointment-${appointment.id}`,
        );
      }
    }
  } catch {}
}

export function startNotificationScheduler() {
  if (!notificationsEnabled()) return () => {};
  checkHealthReminders();
  const timer = window.setInterval(checkHealthReminders, 30000);
  return () => window.clearInterval(timer);
}
