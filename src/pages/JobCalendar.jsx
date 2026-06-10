import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { sv } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

// ── date-fns localizer with Swedish locale ───────────────────────────────────

const locales = { sv }

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }), // Monday
  getDay,
  locales,
})

// ── Swedish messages ──────────────────────────────────────────────────────────

const messages = {
  allDay: 'Heldag',
  previous: '‹',
  next: '›',
  today: 'Idag',
  month: 'Månad',
  week: 'Vecka',
  day: 'Dag',
  agenda: 'Agenda',
  date: 'Datum',
  time: 'Tid',
  event: 'Händelse',
  showMore: total => `+${total} till`,
  noEventsInRange: 'Inga jobb under denna period.',
}

// ── Swedish day/month names via date-fns ─────────────────────────────────────

const formats = {
  monthHeaderFormat: date => format(date, 'MMMM yyyy', { locale: sv }),
  weekHeaderFormat: ({ start, end }) =>
    `${format(start, 'd MMM', { locale: sv })} – ${format(end, 'd MMM yyyy', { locale: sv })}`,
  dayHeaderFormat: date => format(date, 'EEEE d MMMM', { locale: sv }),
  dayRangeHeaderFormat: ({ start, end }) =>
    `${format(start, 'd', { locale: sv })} – ${format(end, 'd MMMM yyyy', { locale: sv })}`,
  weekdayFormat: date => format(date, 'EEE', { locale: sv }),
  dayFormat: date => format(date, 'd', { locale: sv }),
  timeGutterFormat: date => format(date, 'HH:mm', { locale: sv }),
  eventTimeRangeFormat: ({ start, end }) =>
    `${format(start, 'HH:mm')} – ${format(end, 'HH:mm')}`,
}

// ── status colours ────────────────────────────────────────────────────────────

const STATUS_COLOR = {
  planerad: '#2563EB', // primary blue
  pågående: '#D97706', // warning amber
  avslutad: '#16A34A', // success green
}

// ── helpers ───────────────────────────────────────────────────────────────────

function jobToEvent(job) {
  const dateStr = job.scheduled_date ?? new Date().toISOString().slice(0, 10)
  const timeStr = job.scheduled_time ?? '08:00'

  const start = new Date(`${dateStr}T${timeStr}`)
  const end = new Date(start.getTime() + 60 * 60 * 1000) // +1 hour

  return {
    id: job.id,
    title: [job.title, job.customers?.name].filter(Boolean).join(' · '),
    start,
    end,
    status: job.status ?? 'planerad',
    resource: job,
  }
}

// ── custom event component ────────────────────────────────────────────────────

function EventTile({ event }) {
  return (
    <span className="text-xs font-medium leading-tight truncate block px-0.5">
      {event.title}
    </span>
  )
}

// ── main component ────────────────────────────────────────────────────────────

export default function JobCalendar() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState(typeof window !== 'undefined' && window.innerWidth < 768 ? 'week' : 'month')
  const [date, setDate] = useState(new Date())

  useEffect(() => {
    async function fetchJobs() {
      const { data } = await supabase
        .from('jobs')
        .select('*, customers(name)')
        .eq('user_id', user.id)
        .not('scheduled_date', 'is', null)
      setJobs(data ?? [])
      setLoading(false)
    }
    fetchJobs()
  }, [user.id])

  const events = useMemo(() => jobs.map(jobToEvent), [jobs])

  function eventPropGetter(event) {
    const color = STATUS_COLOR[event.status] ?? STATUS_COLOR.planerad
    return {
      style: {
        backgroundColor: color,
        borderColor: color,
        color: '#fff',
        borderRadius: '6px',
        fontSize: '12px',
        padding: '2px 4px',
      },
    }
  }

  function handleSelectEvent(event) {
    navigate(`/jobs/${event.id}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={() => navigate('/jobs')}
          className="text-gray-500 hover:text-gray-800 transition-colors p-1 -ml-1 rounded-lg"
          aria-label="Tillbaka"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <h1 className="font-bold text-gray-800 text-lg flex-1">Kalender</h1>

        {/* Lista / Kalender toggle */}
        <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
          <button
            onClick={() => navigate('/jobs')}
            className="px-3 py-1.5 rounded-md text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
          >
            Lista
          </button>
          <button
            className="px-3 py-1.5 rounded-md text-xs font-medium bg-white text-gray-800 shadow-sm"
          >
            Kalender
          </button>
        </div>
      </header>

      {/* Rotation tip — only visible on small screens (md:hidden) */}
      <p className="md:hidden text-xs text-gray-400 text-center py-1.5 bg-white border-b border-gray-50">
        Tips: rotera telefonen för bättre vy
      </p>

      {/* Legend */}
      <div className="px-4 py-2 flex items-center gap-4 bg-white border-b border-gray-50">
        {Object.entries(STATUS_COLOR).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-xs text-gray-500 capitalize">{
              status === 'planerad' ? 'Planerad' :
              status === 'pågående' ? 'Pågående' : 'Avslutad'
            }</span>
          </div>
        ))}
      </div>

      {/* Calendar */}
      <div className="flex-1 p-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <svg className="animate-spin w-6 h-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
               style={{ height: 'calc(100vh - 180px)', minHeight: '500px' }}>
            <Calendar
              localizer={localizer}
              events={events}
              view={view}
              onView={setView}
              date={date}
              onNavigate={setDate}
              messages={messages}
              formats={formats}
              culture="sv"
              eventPropGetter={eventPropGetter}
              onSelectEvent={handleSelectEvent}
              components={{ event: EventTile }}
              views={['month', 'week', 'day']}
              popup
              style={{ height: '100%' }}
            />
          </div>
        )}
      </div>

      {/* Override react-big-calendar default styles to match app theme */}
      <style>{`
        .rbc-toolbar button {
          color: #374151;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          padding: 4px 12px;
          font-size: 13px;
          font-weight: 500;
        }
        .rbc-toolbar button:hover {
          background: #F3F4F6;
          color: #111827;
        }
        .rbc-toolbar button.rbc-active {
          background: #2563EB !important;
          color: #fff !important;
          border-color: #2563EB !important;
        }
        .rbc-toolbar button.rbc-active:hover {
          background: #1D4ED8 !important;
        }
        .rbc-header {
          font-size: 12px;
          font-weight: 600;
          color: #6B7280;
          padding: 8px 4px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .rbc-today {
          background-color: #EFF6FF !important;
        }
        .rbc-off-range-bg {
          background: #F9FAFB;
        }
        .rbc-day-bg + .rbc-day-bg {
          border-left: 1px solid #F3F4F6;
        }
        .rbc-month-row + .rbc-month-row {
          border-top: 1px solid #F3F4F6;
        }
        .rbc-month-view {
          border: none;
        }
        .rbc-event:focus {
          outline: none;
        }
        .rbc-show-more {
          color: #2563EB;
          font-size: 11px;
          font-weight: 600;
        }
        .rbc-toolbar .rbc-toolbar-label {
          font-size: 15px;
          font-weight: 700;
          color: #111827;
          text-transform: capitalize;
        }
      `}</style>
    </div>
  )
}
