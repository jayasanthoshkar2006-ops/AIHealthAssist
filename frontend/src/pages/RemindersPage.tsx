import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { DisclaimerBanner } from '../components/common/DisclaimerBanner';
import { Pill, Calendar, Plus, Clock, AlertCircle, Bell, BellOff, Pencil, X, Save, Trash2 } from 'lucide-react';
import { notificationsEnabled, requestNotificationPermission, disableNotifications } from '../services/notificationService';

export const RemindersPage: React.FC = () => {
  const [medications, setMedications] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [notificationsOn, setNotificationsOn] = useState(notificationsEnabled());
  const [notificationMessage, setNotificationMessage] = useState('');

  // Medication Form
  const [medName, setMedName] = useState('');
  const [dosage, setDosage] = useState('1 tablet');
  const [remTime, setRemTime] = useState('08:00');
  const [editingMedId, setEditingMedId] = useState<number | null>(null);
  const [editingAppointmentId, setEditingAppointmentId] = useState<number | null>(null);

  // Appointment Form
  const [appTitle, setAppTitle] = useState('');
  const [appCategory, setAppCategory] = useState('Doctor');
  const [appTime, setAppTime] = useState(new Date().toISOString().slice(0, 16));

  const formatDateTimeLocal = (value: string) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value?.slice(0, 16) || '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  };

  const fetchData = () => {
    apiRequest('/medications')
      .then((res: any) => setMedications(res))
      .catch((err) => console.error(err));

    apiRequest('/appointments')
      .then((res: any) => setAppointments(res))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const enableNotifications = async () => {
    if (!('Notification' in window)) {
      setNotificationMessage('This browser does not support notifications.');
      return;
    }
    const permission = await requestNotificationPermission();
    if (permission === 'granted') {
      setNotificationsOn(true);
      setNotificationMessage('Notifications enabled. Scheduled reminders are active.');
    } else {
      setNotificationsOn(false);
      setNotificationMessage('Notification permission was not granted. Allow notifications in your browser settings.');
    }
  };

  const turnOffNotifications = () => {
    disableNotifications();
    setNotificationsOn(false);
    setNotificationMessage('Notifications disabled.');
  };


  const startEditMedication = (m: any) => {
    setEditingMedId(m.id);
    setMedName(m.name || '');
    setDosage(m.dosage || '1 tablet');
    setRemTime(m.reminder_time || '08:00');
  };

  const cancelEditMedication = () => {
    setEditingMedId(null);
    setMedName('');
    setDosage('1 tablet');
    setRemTime('08:00');
  };

  const deleteMedication = async (id: number, name: string) => {
    if (!window.confirm('Delete medication reminder for "' + name + '"?')) return;
    try {
      await apiRequest('/medications/' + id, { method: 'DELETE' });
      if (editingMedId === id) cancelEditMedication();
      fetchData();
    } catch (err: any) { alert(err.message || 'Failed to delete medication reminder'); }
  };

  const startEditAppointment = (a: any) => {
    setEditingAppointmentId(a.id); setAppTitle(a.title || ''); setAppCategory(a.category || 'Doctor'); setAppTime(formatDateTimeLocal(a.date_time));
  };
  const cancelEditAppointment = () => {
    setEditingAppointmentId(null); setAppTitle(''); setAppCategory('Doctor'); setAppTime(new Date().toISOString().slice(0, 16));
  };
  const deleteAppointment = async (id: number, title: string) => {
    if (!window.confirm('Delete appointment "' + title + '"?')) return;
    try {
      await apiRequest('/appointments/' + id, { method: 'DELETE' });
      if (editingAppointmentId === id) cancelEditAppointment();
      fetchData();
    } catch (err: any) { alert(err.message || 'Failed to delete appointment'); }
  };

  const handleAddMed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medName.trim()) return;

    try {
      await apiRequest(editingMedId ? `/medications/${editingMedId}` : '/medications', {
        method: editingMedId ? 'PUT' : 'POST',
        body: JSON.stringify({
          name: medName,
          dosage,
          frequency: 'Daily',
          reminder_time: remTime
        })
      });
      cancelEditMedication();
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to add medication');
    }
  };

  const handleAddAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appTitle.trim()) return;

    try {
      await apiRequest(editingAppointmentId ? '/appointments/' + editingAppointmentId : '/appointments', {
        method: editingAppointmentId ? 'PUT' : 'POST',
        body: JSON.stringify({
          title: appTitle,
          category: appCategory,
          date_time: appTime,
          reminder_enabled: true
        })
      });
      cancelEditAppointment();
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to add appointment');
    }
  };

  return (
    <div className="space-y-6">
      <DisclaimerBanner />

      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-2">
        <h2 className="font-extrabold text-lg text-slate-100 flex items-center gap-2">
          <Pill className="w-5 h-5 text-sky-400" /> Medication & Appointment Reminders
        </h2>
        <p className="text-xs text-slate-400">
          User-configured reminder engine for daily medications & upcoming medical/fitness appointments
        </p>
      </div>



      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
            {notificationsOn ? <Bell className="w-4 h-4 text-emerald-400" /> : <BellOff className="w-4 h-4 text-slate-400" />}
            Browser Notifications
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {notificationsOn
              ? 'Working: medication and appointment reminders are checked every 30 seconds while the app is open.'
              : 'Enable notifications to receive HealthAssist AI reminders on this device.'}
          </p>
          {notificationMessage && (
            <p className="text-xs text-sky-300 mt-2">{notificationMessage}</p>
          )}
        </div>
        <button
          type="button"
          onClick={notificationsOn ? turnOffNotifications : enableNotifications}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs ${notificationsOn ? 'bg-slate-800 text-slate-200 border border-slate-700' : 'bg-gradient-to-r from-sky-500 to-emerald-500 text-slate-950'}`}
        >
          {notificationsOn ? 'Disable Notifications' : 'Enable Notifications'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Medication Reminders Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
            <Pill className="w-4 h-4 text-emerald-400" /> Daily Medication Reminders
          </h3>

          <div className="p-3 rounded-2xl bg-amber-950/20 border border-amber-500/20 text-amber-300 text-[11px] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Reminder Tool Only: This feature does not prescribe or recommend changes to prescribed medicines.</span>
          </div>

          <form onSubmit={handleAddMed} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Medication Name</label>
              <input
                type="text"
                value={medName}
                onChange={(e) => setMedName(e.target.value)}
                placeholder="e.g. Multivitamin / Prescribed Supplement"
                required
                className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Dosage</label>
                <input
                  type="text"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Reminder Time</label>
                <input
                  type="time"
                  value={remTime}
                  onChange={(e) => setRemTime(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 font-bold text-slate-950 text-xs shadow-glow flex items-center justify-center gap-1"
            >
              {editingMedId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {editingMedId ? 'Save Medication Changes' : 'Add Medication Reminder'}
            </button>
            {editingMedId && (
              <button
                type="button"
                onClick={cancelEditMedication}
                className="w-full py-2 rounded-xl bg-slate-800 border border-slate-700 font-bold text-slate-300 text-xs flex items-center justify-center gap-1"
              >
                <X className="w-4 h-4" /> Cancel Edit
              </button>
            )}
          </form>

          <div className="space-y-2 text-xs pt-2">
            {medications.map((m) => (
              <div key={m.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-200">{m.name}</p>
                  <p className="text-slate-400 text-[11px]">{m.dosage} • Daily</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sky-400 font-bold">{m.reminder_time}</span>
                  <button
                    type="button"
                    onClick={() => deleteMedication(m.id, m.name)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-400"
                    title="Delete medication reminder"
                    aria-label={'Delete ' + m.name + ' reminder'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => startEditMedication(m)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400"
                    title="Edit medication reminder"
                    aria-label={`Edit ${m.name} reminder`}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Appointments Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-sky-400" /> Upcoming Appointments
          </h3>

          <form onSubmit={handleAddAppointment} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Appointment Title</label>
              <input
                type="text"
                value={appTitle}
                onChange={(e) => setAppTitle(e.target.value)}
                placeholder="e.g. Annual Health Checkup / Fitness Evaluation"
                required
                className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Category</label>
                <select
                  value={appCategory}
                  onChange={(e) => setAppCategory(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                >
                  <option value="Doctor">Doctor Consultation</option>
                  <option value="Fitness">Fitness Assessment</option>
                  <option value="Personal">Personal Wellness</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Date & Time</label>
                <input
                  type="datetime-local"
                  value={appTime}
                  onChange={(e) => setAppTime(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 font-bold text-slate-950 text-xs shadow-glow flex items-center justify-center gap-1"
            >
              {editingAppointmentId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />} {editingAppointmentId ? 'Save Appointment Changes' : 'Add Appointment'}
            </button>
            {editingAppointmentId && (
              <button type="button" onClick={cancelEditAppointment} className="w-full py-2 rounded-xl bg-slate-800 border border-slate-700 font-bold text-slate-300 text-xs flex items-center justify-center gap-1">
                <X className="w-4 h-4" /> Cancel Edit
              </button>
            )}
          </form>

          <div className="space-y-2 text-xs pt-2">
            {appointments.map((a) => (
              <div key={a.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-200">{a.title}</p>
                  <p className="text-slate-400 text-[11px]">{a.category}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-semibold text-[11px] text-right">{new Date(a.date_time).toLocaleString()}</span>
                  <button type="button" onClick={() => startEditAppointment(a)} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400" title="Edit appointment"><Pencil className="w-3.5 h-3.5" /></button>
                  <button type="button" onClick={() => deleteAppointment(a.id, a.title)} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-400" title="Delete appointment"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
