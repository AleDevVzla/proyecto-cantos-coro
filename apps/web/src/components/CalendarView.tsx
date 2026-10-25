import React, { useState } from 'react';
import {
  CALENDAR_EVENT_TYPES,
  type CalendarEventType,
} from '@cantos/shared';
import {
  api,
  type CalendarEventDTO,
  type MassScheduleDTO,
  type RehearsalScheduleDTO,
} from '../lib/api';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  MapPin,
  Clock,
  BookOpen,
  ClipboardList,
  Trash2,
  GripHorizontal,
  ArrowLeft,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface CalendarViewProps {
  events: CalendarEventDTO[];
  massSchedules: MassScheduleDTO[];
  rehearsalSchedules: RehearsalScheduleDTO[];
  isDirector: boolean;
  onRefresh: () => Promise<void>;
  onOpenMassSchedule: (id: string) => void;
  onOpenRehearsalSchedule: (id: string) => void;
}

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  massSchedules,
  rehearsalSchedules,
  isDirector,
  onRefresh,
  onOpenMassSchedule,
  onOpenRehearsalSchedule,
}) => {
  const [currentMonth, setCurrentMonth] = useState(() => new Date(2026, 9, 1)); // Octubre 2026
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventDTO | null>(
    events[0] || null
  );
  const [draggedEventId, setDraggedEventId] = useState<string | null>(null);

  // Modal de creación de evento
  const [showNewModal, setShowNewModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('Templo Parroquial');
  const [dateStr, setDateStr] = useState('2026-10-26');
  const [timeStr, setTimeStr] = useState('18:00');
  const [type, setType] = useState<CalendarEventType>('IMPORTANT_EVENT');
  const [massScheduleId, setMassScheduleId] = useState('');
  const [rehearsalScheduleId, setRehearsalScheduleId] = useState('');
  const [saving, setSaving] = useState(false);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  // Lunes = 0 ... Domingo = 6
  const startDayOffset = (firstDayOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < startDayOffset; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);

  const getEventsForDay = (day: number) => {
    return events.filter((ev) => {
      const d = new Date(ev.startAt);
      return (
        d.getUTCFullYear() === year &&
        d.getUTCMonth() === month &&
        d.getUTCDate() === day
      );
    });
  };

  const handleDropOnDay = async (day: number) => {
    if (!isDirector || !draggedEventId) return;
    const ev = events.find((e) => e.id === draggedEventId);
    setDraggedEventId(null);
    if (!ev) return;

    const oldDate = new Date(ev.startAt);
    const newDate = new Date(
      Date.UTC(
        year,
        month,
        day,
        oldDate.getUTCHours(),
        oldDate.getUTCMinutes(),
        0
      )
    );

    await api.moveCalendarEvent(ev.id, newDate.toISOString());
    await onRefresh();
  };

  const handleShiftEventDays = async (ev: CalendarEventDTO, deltaDays: number) => {
    if (!isDirector) return;
    const d = new Date(ev.startAt);
    d.setUTCDate(d.getUTCDate() + deltaDays);
    const res = await api.moveCalendarEvent(ev.id, d.toISOString());
    setSelectedEvent(res.event);
    await onRefresh();
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const startAtIso = `${dateStr}T${timeStr}:00.000Z`;
      const res = await api.createCalendarEvent({
        title,
        description,
        location,
        startAt: startAtIso,
        type,
        massScheduleId: type === 'MASS' && massScheduleId ? massScheduleId : undefined,
        rehearsalScheduleId:
          type === 'REHEARSAL' && rehearsalScheduleId
            ? rehearsalScheduleId
            : undefined,
      });
      setSelectedEvent(res.event);
      setShowNewModal(false);
      setTitle('');
      setDescription('');
      await onRefresh();
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!window.confirm('¿Eliminar este evento del calendario del coro?')) return;
    await api.deleteCalendarEvent(id);
    setSelectedEvent(null);
    await onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Cabecera del Calendario Manipulable */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-700 flex items-center justify-center">
            <CalendarIcon className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-stone-900">
              Calendario Manipulable del Coro
            </h2>
            <p className="text-xs text-stone-500">
              {isDirector
                ? 'Haz clic en cualquier día para agendar o arrastra (Drag & Drop) los eventos para reprogramarlos.'
                : 'Consulta las fechas de Misas, Ensayos y Eventos Importantes del coro.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Selector de Mes */}
          <div className="flex items-center rounded-2xl border border-stone-200 bg-stone-50 p-1">
            <button
              type="button"
              onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
              className="rounded-xl p-2 text-stone-600 hover:bg-white hover:shadow-sm"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-[140px] text-center text-sm font-bold text-stone-800 px-3">
              {MONTH_NAMES[month]} {year}
            </span>
            <button
              type="button"
              onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
              className="rounded-xl p-2 text-stone-600 hover:bg-white hover:shadow-sm"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {isDirector && (
            <button
              type="button"
              onClick={() => setShowNewModal(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white px-4 py-2.5 text-xs sm:text-sm font-bold shadow-sm transition"
            >
              <Plus className="h-4 w-4 text-amber-400" />
              Agregar Evento
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cuadrícula Mensual Interactiva (Drag & Drop) */}
        <div className="lg:col-span-8 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="grid grid-cols-7 gap-2 mb-2">
            {WEEKDAYS.map((wd) => (
              <div
                key={wd}
                className="text-center text-xs font-bold uppercase tracking-wider text-stone-400 py-1"
              >
                {wd}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {calendarCells.map((day, idx) => {
              if (day === null) {
                return (
                  <div
                    key={`empty-${idx}`}
                    className="min-h-[104px] rounded-2xl bg-stone-50/60 border border-stone-100"
                  />
                );
              }

              const dayEvents = getEventsForDay(day);
              const isToday = year === 2026 && month === 9 && day === 24;

              return (
                <div
                  key={day}
                  onDragOver={(e) => {
                    if (isDirector) e.preventDefault();
                  }}
                  onDrop={() => handleDropOnDay(day)}
                  onClick={() => {
                    if (isDirector && dayEvents.length === 0) {
                      const mm = String(month + 1).padStart(2, '0');
                      const dd = String(day).padStart(2, '0');
                      setDateStr(`${year}-${mm}-${dd}`);
                      setShowNewModal(true);
                    }
                  }}
                  className={`min-h-[108px] rounded-2xl border p-2 flex flex-col justify-between transition ${
                    isToday
                      ? 'border-amber-500 bg-amber-50/30 ring-2 ring-amber-500/20'
                      : 'border-stone-200 bg-white hover:border-stone-300'
                  } ${isDirector ? 'cursor-pointer' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                        isToday
                          ? 'bg-amber-600 text-white'
                          : 'text-stone-700'
                      }`}
                    >
                      {day}
                    </span>
                    {isToday && (
                      <span className="text-[10px] font-bold text-amber-700">
                        Hoy
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 mt-1.5">
                    {dayEvents.map((ev) => {
                      const typeMeta =
                        CALENDAR_EVENT_TYPES.find((t) => t.id === ev.type) ||
                        CALENDAR_EVENT_TYPES[2];
                      const isSelected = selectedEvent?.id === ev.id;

                      return (
                        <div
                          key={ev.id}
                          draggable={isDirector}
                          onDragStart={() => setDraggedEventId(ev.id)}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(ev);
                          }}
                          className={`group rounded-lg border px-2 py-1 text-[11px] font-bold truncate cursor-pointer transition flex items-center gap-1 ${
                            typeMeta.badgeClass
                          } ${
                            isSelected ? 'ring-2 ring-stone-900' : ''
                          }`}
                          title={`${ev.title} (Arrastrar para cambiar de fecha)`}
                        >
                          {isDirector && (
                            <GripHorizontal className="h-3 w-3 shrink-0 opacity-50 group-hover:opacity-100" />
                          )}
                          <span className="truncate">{ev.title}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel Derecho: Detalle del Evento Seleccionado y Agenda */}
        <div className="lg:col-span-4 space-y-4">
          {selectedEvent ? (
            <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span
                    className={`inline-block rounded-lg border px-2.5 py-0.5 text-xs font-bold ${
                      CALENDAR_EVENT_TYPES.find(
                        (t) => t.id === selectedEvent.type
                      )?.badgeClass
                    }`}
                  >
                    {
                      CALENDAR_EVENT_TYPES.find(
                        (t) => t.id === selectedEvent.type
                      )?.label
                    }
                  </span>
                  <h3 className="text-lg font-bold text-stone-900 mt-2">
                    {selectedEvent.title}
                  </h3>
                </div>

                {isDirector && (
                  <button
                    type="button"
                    onClick={() => handleDeleteEvent(selectedEvent.id)}
                    className="rounded-xl border border-rose-200 bg-rose-50 p-2 text-rose-700 hover:bg-rose-100"
                    title="Eliminar evento"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="space-y-2 text-xs text-stone-600 border-y border-stone-100 py-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <span className="font-semibold text-stone-800">
                    {new Date(selectedEvent.startAt).toLocaleDateString(
                      'es-ES',
                      {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        timeZone: 'UTC',
                      }
                    )}{' '}
                    •{' '}
                    {new Date(selectedEvent.startAt).toLocaleTimeString(
                      'es-ES',
                      {
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: 'UTC',
                      }
                    )}
                  </span>
                </div>
                {selectedEvent.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-amber-600" />
                    <span>{selectedEvent.location}</span>
                  </div>
                )}
              </div>

              {selectedEvent.description && (
                <p className="text-sm text-stone-700 leading-relaxed">
                  {selectedEvent.description}
                </p>
              )}

              {/* Controles de Reprogramación Rápida para el Director */}
              {isDirector && (
                <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3 space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                    Mover Fecha Rápidamente
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleShiftEventDays(selectedEvent, -1)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-stone-300 bg-white py-1.5 text-xs font-bold text-stone-700 hover:bg-stone-100"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" /> -1 Día
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShiftEventDays(selectedEvent, 1)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-stone-300 bg-white py-1.5 text-xs font-bold text-stone-700 hover:bg-stone-100"
                    >
                      +1 Día <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Acceso directo al Cronograma de Misa o Cronograma de Ensayo vinculado */}
              {selectedEvent.massScheduleId && (
                <button
                  type="button"
                  onClick={() =>
                    onOpenMassSchedule(selectedEvent.massScheduleId!)
                  }
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white py-3 px-4 text-xs font-bold shadow-md transition"
                >
                  <BookOpen className="h-4 w-4" />
                  Ver Cronograma de Misa (Orden, Letra y Acordes)
                </button>
              )}

              {selectedEvent.rehearsalScheduleId && (
                <button
                  type="button"
                  onClick={() =>
                    onOpenRehearsalSchedule(selectedEvent.rehearsalScheduleId!)
                  }
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 text-xs font-bold shadow-md transition"
                >
                  <ClipboardList className="h-4 w-4" />
                  Ver Cronograma Detallado del Ensayo
                </button>
              )}
            </div>
          ) : (
            <div className="rounded-3xl border border-stone-200 bg-white p-6 text-center text-sm text-stone-500">
              Selecciona un evento del calendario para ver sus detalles.
            </div>
          )}

          {/* Lista de Próximos Eventos en Agenda */}
          <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Agenda de Eventos del Coro ({events.length})
            </h4>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {events.map((ev) => (
                <button
                  key={ev.id}
                  type="button"
                  onClick={() => setSelectedEvent(ev)}
                  className={`w-full text-left rounded-2xl border p-3 transition ${
                    selectedEvent?.id === ev.id
                      ? 'border-amber-600 bg-amber-50/40'
                      : 'border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <div className="text-xs font-bold text-stone-900">
                    {ev.title}
                  </div>
                  <div className="text-[11px] text-stone-500 mt-0.5">
                    {new Date(ev.startAt).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      timeZone: 'UTC',
                    })}{' '}
                    • {ev.location || 'Parroquia'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal para Crear Evento en el Calendario */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-stone-200 space-y-4">
            <h3 className="text-lg font-bold text-stone-900">
              Agendar Evento en el Calendario
            </h3>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase text-stone-600">
                  Tipo de Evento
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {CALENDAR_EVENT_TYPES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setType(t.id)}
                      className={`rounded-xl border p-2.5 text-xs font-bold transition ${
                        type === t.id
                          ? `${t.badgeClass} ring-2 ring-stone-900/10`
                          : 'border-stone-200 text-stone-600'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase text-stone-600">
                  Título del Evento *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej. Solemnidad de Cristo Rey / Concierto Coral"
                  className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase text-stone-600">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    required
                    value={dateStr}
                    onChange={(e) => setDateStr(e.target.value)}
                    className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase text-stone-600">
                    Hora *
                  </label>
                  <input
                    type="time"
                    required
                    value={timeStr}
                    onChange={(e) => setTimeStr(e.target.value)}
                    className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase text-stone-600">
                  Lugar
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm"
                />
              </div>

              {type === 'MASS' && massSchedules.length > 0 && (
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase text-stone-600">
                    Vincular a Cronograma de Misa (Opcional)
                  </label>
                  <select
                    value={massScheduleId}
                    onChange={(e) => setMassScheduleId(e.target.value)}
                    className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="">-- Sin vincular --</option>
                    {massSchedules.map((ms) => (
                      <option key={ms.id} value={ms.id}>
                        {ms.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {type === 'REHEARSAL' && rehearsalSchedules.length > 0 && (
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase text-stone-600">
                    Vincular a Cronograma de Ensayo (Opcional)
                  </label>
                  <select
                    value={rehearsalScheduleId}
                    onChange={(e) => setRehearsalScheduleId(e.target.value)}
                    className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="">-- Sin vincular --</option>
                    {rehearsalSchedules.map((rs) => (
                      <option key={rs.id} value={rs.id}>
                        {rs.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase text-stone-600">
                  Descripción / Indicaciones
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Indicaciones de vestimenta, puntualidad o notas importantes..."
                  className="w-full rounded-xl border border-stone-300 p-3 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="rounded-xl border border-stone-300 px-4 py-2 text-xs font-bold text-stone-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 text-xs font-bold shadow"
                >
                  {saving ? 'Guardando...' : 'Guardar en Calendario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
