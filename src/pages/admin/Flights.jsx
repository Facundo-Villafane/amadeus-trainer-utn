// src/pages/admin/Flights.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc,
  query, orderBy, limit, where, serverTimestamp
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../hooks/useAuth';
import DashboardSidebar from '../../components/dashboard/DashboardSidebar';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import ImportFlights from '../../components/admin/ImportFlights';
import FlightScheduleGenerator from '../../components/admin/EnhancedFlightScheduleGenerator';
import FlightFrequencyTable from '../../components/flights/FlightFrequencyTable';
import { calculateArrival } from '../../utils/flightUtils';
import {
  FiPlus, FiEdit2, FiTrash2, FiSearch, FiAirplay,
  FiFilter, FiChevronLeft, FiChevronRight, FiCalendar, FiX, FiSave, FiEye
} from 'react-icons/fi';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────
// FlightModal: alta y edición de vuelo
// ─────────────────────────────────────────────
const EMPTY_FLIGHT = {
  airline_code: '',
  airline_name: '',
  flight_number: '',
  departure_airport_code: '',
  departure_city: '',
  departure_terminal: '',
  arrival_airport_code: '',
  arrival_city: '',
  arrival_terminal: '',
  departure_date: '',
  departure_time: '',
  duration_hours: '',
  arrival_date: '',
  arrival_time: '',
  equipment_code: '',
  status: 'Scheduled',
  class_availability: { Y: 9, B: 9, M: 9 },
  stops: 0,
};

const CLASS_OPTIONS = ['F', 'A', 'J', 'C', 'D', 'I', 'W', 'S', 'Y', 'B', 'M', 'H', 'K', 'L', 'Q', 'T', 'V', 'X'];

function FlightModal({ flight: initialFlight, onClose, onSaved }) {
  const [form, setForm] = useState(initialFlight ? { ...initialFlight } : { ...EMPTY_FLIGHT });
  const [saving, setSaving] = useState(false);
  const [newClass, setNewClass] = useState('');

  const isEditing = Boolean(initialFlight?.id);

  // Auto-calcular arrival cuando cambian departure_date, departure_time o duration_hours
  useEffect(() => {
    const { departure_date, departure_time, duration_hours } = form;
    if (departure_date && departure_time && duration_hours) {
      const { arrival_date, arrival_time } = calculateArrival(departure_date, departure_time, Number(duration_hours));
      setForm(prev => ({ ...prev, arrival_date, arrival_time }));
    }
  }, [form.departure_date, form.departure_time, form.duration_hours]);

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function addClassEntry() {
    if (!newClass || form.class_availability[newClass] !== undefined) return;
    setForm(prev => ({
      ...prev,
      class_availability: { ...prev.class_availability, [newClass]: 9 }
    }));
    setNewClass('');
  }

  function removeClassEntry(cls) {
    const updated = { ...form.class_availability };
    delete updated[cls];
    setForm(prev => ({ ...prev, class_availability: updated }));
  }

  function updateClassSeats(cls, value) {
    setForm(prev => ({
      ...prev,
      class_availability: { ...prev.class_availability, [cls]: parseInt(value, 10) || 0 }
    }));
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.airline_code || !form.flight_number || !form.departure_airport_code || !form.arrival_airport_code) {
      toast.error('Completa los campos obligatorios');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        duration_hours: Number(form.duration_hours) || 0,
        stops: Number(form.stops) || 0,
        updated_at: serverTimestamp(),
      };
      delete payload.id; // No guardar el id como campo

      if (isEditing) {
        await updateDoc(doc(db, 'flights', initialFlight.id), payload);
        toast.success('Vuelo actualizado');
      } else {
        payload.created_at = serverTimestamp();
        await addDoc(collection(db, 'flights'), payload);
        toast.success('Vuelo creado');
      }

      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar el vuelo');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed z-20 inset-0 overflow-y-auto">
      <div className="flex items-start justify-center min-h-screen pt-6 px-4 pb-20">
        <div className="fixed inset-0 bg-gray-500 opacity-75" onClick={onClose} />
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-3xl z-10">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FiAirplay className="text-blue-600" />
              {isEditing ? 'Editar Vuelo' : 'Nuevo Vuelo'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><FiX size={20} /></button>
          </div>

          <form onSubmit={handleSave} className="px-6 py-4 space-y-6">
            {/* Aerolínea y vuelo */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Aerolínea</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Código <span className="text-red-500">*</span></label>
                  <input
                    type="text" maxLength={2} required
                    value={form.airline_code}
                    onChange={e => set('airline_code', e.target.value.toUpperCase())}
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm font-mono uppercase"
                    placeholder="IB"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Nombre aerolínea</label>
                  <input
                    type="text"
                    value={form.airline_name}
                    onChange={e => set('airline_name', e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                    placeholder="Iberia"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Nro. vuelo <span className="text-red-500">*</span></label>
                  <input
                    type="text" required
                    value={form.flight_number}
                    onChange={e => set('flight_number', e.target.value.toUpperCase())}
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm font-mono"
                    placeholder="1301"
                  />
                </div>
              </div>
            </div>

            {/* Ruta */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Ruta</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Origen IATA <span className="text-red-500">*</span></label>
                  <input
                    type="text" maxLength={3} required
                    value={form.departure_airport_code}
                    onChange={e => set('departure_airport_code', e.target.value.toUpperCase())}
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm font-mono uppercase"
                    placeholder="EZE"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Ciudad origen</label>
                  <input
                    type="text"
                    value={form.departure_city}
                    onChange={e => set('departure_city', e.target.value.toUpperCase())}
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                    placeholder="BUENOS AIRES"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Terminal salida</label>
                  <input
                    type="text" maxLength={3}
                    value={form.departure_terminal}
                    onChange={e => set('departure_terminal', e.target.value.toUpperCase())}
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                    placeholder="B"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Destino IATA <span className="text-red-500">*</span></label>
                  <input
                    type="text" maxLength={3} required
                    value={form.arrival_airport_code}
                    onChange={e => set('arrival_airport_code', e.target.value.toUpperCase())}
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm font-mono uppercase"
                    placeholder="MAD"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Ciudad destino</label>
                  <input
                    type="text"
                    value={form.arrival_city}
                    onChange={e => set('arrival_city', e.target.value.toUpperCase())}
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                    placeholder="MADRID"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Terminal llegada</label>
                  <input
                    type="text" maxLength={3}
                    value={form.arrival_terminal}
                    onChange={e => set('arrival_terminal', e.target.value.toUpperCase())}
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                    placeholder="T4"
                  />
                </div>
              </div>
            </div>

            {/* Horarios */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Horarios</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Fecha salida <span className="text-red-500">*</span></label>
                  <input
                    type="date" required
                    value={form.departure_date}
                    onChange={e => set('departure_date', e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Hora salida <span className="text-red-500">*</span></label>
                  <input
                    type="time" required
                    value={form.departure_time}
                    onChange={e => set('departure_time', e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Duración (horas)</label>
                  <input
                    type="number" min="0" step="0.25"
                    value={form.duration_hours}
                    onChange={e => set('duration_hours', e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                    placeholder="12.5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Aeronave</label>
                  <input
                    type="text" maxLength={5}
                    value={form.equipment_code}
                    onChange={e => set('equipment_code', e.target.value.toUpperCase())}
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm font-mono"
                    placeholder="777"
                  />
                </div>
              </div>

              {/* Llegada (calculada automáticamente) */}
              {form.arrival_date && (
                <div className="mt-3 p-3 bg-blue-50 rounded-md flex items-center gap-4 text-sm">
                  <span className="text-blue-700 font-medium">✈ Llegada calculada:</span>
                  <span className="font-mono text-blue-900">{form.arrival_date} — {form.arrival_time}</span>
                </div>
              )}
            </div>

            {/* Estado */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Estado</h3>
              <select
                value={form.status}
                onChange={e => set('status', e.target.value)}
                className="border border-gray-300 rounded px-3 py-1.5 text-sm"
              >
                <option value="Scheduled">Programado</option>
                <option value="On Time">A tiempo</option>
                <option value="Delayed">Retrasado</option>
                <option value="Cancelled">Cancelado</option>
              </select>
            </div>

            {/* Clases */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Clases disponibles</h3>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-3">
                {Object.entries(form.class_availability).map(([cls, seats]) => (
                  <div key={cls} className="flex items-center gap-1 border rounded p-1.5">
                    <span className="font-mono font-bold text-sm w-5">{cls}</span>
                    <input
                      type="number" min="0" max="9"
                      value={seats}
                      onChange={e => updateClassSeats(cls, e.target.value)}
                      className="w-10 border rounded px-1 py-0.5 text-sm text-center"
                    />
                    <button type="button" onClick={() => removeClassEntry(cls)} className="text-red-400 hover:text-red-600 text-xs">×</button>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={newClass}
                  onChange={e => setNewClass(e.target.value)}
                  className="border rounded px-2 py-1 text-sm"
                >
                  <option value="">Agregar clase...</option>
                  {CLASS_OPTIONS.filter(c => form.class_availability[c] === undefined).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <button
                  type="button" onClick={addClassEntry} disabled={!newClass}
                  className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded text-sm disabled:opacity-50"
                >
                  Agregar
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 pt-2 border-t">
              <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50">
                Cancelar
              </button>
              <button
                type="submit" disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded disabled:opacity-50"
              >
                <FiSave size={14} />
                {saving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear vuelo'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// FlightTable
// ─────────────────────────────────────────────
const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

function getFlightStatus(flight) {
  if (flight.departure_date && flight.departure_date < today) return 'Departed';
  return flight.status;
}

const statusStyles = {
  Scheduled: 'bg-yellow-100 text-yellow-800',
  'On Time': 'bg-green-100 text-green-800',
  Delayed: 'bg-red-100 text-red-800',
  Cancelled: 'bg-red-200 text-red-900',
  Departed: 'bg-gray-200 text-gray-600',
};

const FlightTable = ({ flights, loading, onEdit, onDelete, onSchedule }) => {
  if (loading) {
    return (
      <div className="mt-8 overflow-x-auto">
        <div className="inline-block min-w-full shadow rounded-lg overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                {['Vuelo', 'Origen/Destino', 'Fechas', 'Llegada', 'Estado', 'Acciones'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white">
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                  </div>
                  <p className="mt-2 text-gray-500">Cargando vuelos...</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (!flights || flights.length === 0) {
    return <div className="mt-8 text-center py-8"><p className="text-gray-500">No se encontraron vuelos.</p></div>;
  }

  return (
    <div className="mt-4 overflow-x-auto">
      <div className="inline-block min-w-full shadow rounded-lg overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              {['Vuelo', 'Origen/Destino', 'Salida', 'Llegada', 'Estado', 'Acciones'].map(h => (
                <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {flights.map((flight) => {
              const displayStatus = getFlightStatus(flight);
              const isDeparted = displayStatus === 'Departed';
              return (
                <tr key={flight.id} className={`hover:bg-gray-50 ${isDeparted ? 'opacity-60' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-9 w-9 bg-blue-100 rounded-full flex items-center justify-center">
                        <FiAirplay className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{flight.airline_code} {flight.flight_number}</div>
                        <div className="text-xs text-gray-500">{flight.airline_name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{flight.departure_city} ({flight.departure_airport_code})</div>
                    <div className="text-sm text-gray-500">{flight.arrival_city} ({flight.arrival_airport_code})</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{flight.departure_date}</div>
                    <div className="text-xs text-gray-500">{flight.departure_time} · {flight.duration_hours}h</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{flight.arrival_date || '—'}</div>
                    <div className="text-xs text-gray-500">{flight.arrival_time || '—'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyles[displayStatus] || 'bg-gray-100 text-gray-800'}`}>
                      {displayStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button onClick={() => onEdit(flight)} className="text-indigo-600 hover:text-indigo-900" title="Editar vuelo"><FiEdit2 /></button>
                      <button onClick={() => onDelete(flight.id)} className="text-red-600 hover:text-red-900" title="Eliminar vuelo"><FiTrash2 /></button>
                      {!isDeparted && (
                        <button onClick={() => onSchedule(flight)} className="text-green-600 hover:text-green-900" title="Programar vuelo"><FiCalendar /></button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// FlightFilters
// ─────────────────────────────────────────────
const FlightFilters = ({ filters, setFilters, uniqueAirlines, uniqueOrigins, uniqueDestinations, clearFilters }) => (
  <div className="mt-4 bg-gray-50 p-4 rounded-lg border">
    <h3 className="text-lg font-medium text-gray-900 mb-4">Filtros Avanzados</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Aerolínea</label>
        <select value={filters.airline_code || ''} onChange={e => setFilters(p => ({ ...p, airline_code: e.target.value }))}
          className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm sm:text-sm">
          <option value="">Todas</option>
          {uniqueAirlines.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Origen</label>
        <select value={filters.departure_airport_code || ''} onChange={e => setFilters(p => ({ ...p, departure_airport_code: e.target.value }))}
          className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm sm:text-sm">
          <option value="">Todos</option>
          {uniqueOrigins.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Destino</label>
        <select value={filters.arrival_airport_code || ''} onChange={e => setFilters(p => ({ ...p, arrival_airport_code: e.target.value }))}
          className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm sm:text-sm">
          <option value="">Todos</option>
          {uniqueDestinations.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
        <select value={filters.status || ''} onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}
          className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm sm:text-sm">
          <option value="">Todos</option>
          <option value="Scheduled">Programado</option>
          <option value="On Time">A tiempo</option>
          <option value="Delayed">Retrasado</option>
          <option value="Cancelled">Cancelado</option>
        </select>
      </div>
    </div>
    <div className="mt-4 flex justify-end">
      <button onClick={clearFilters} className="px-4 py-2 border border-gray-300 text-sm rounded text-gray-700 bg-white hover:bg-gray-50">
        Limpiar filtros
      </button>
    </div>
  </div>
);

// ─────────────────────────────────────────────
// Pagination
// ─────────────────────────────────────────────
const Pagination = ({ currentPage, totalItems, itemsPerPage, shownItems, onPreviousPage, onNextPage }) => (
  <div className="mt-4 flex justify-between items-center">
    <div className="text-sm text-gray-700">
      Mostrando <span className="font-medium">{shownItems}</span> de <span className="font-medium">{totalItems}</span> vuelos
    </div>
    <div className="flex space-x-2">
      <button onClick={onPreviousPage} disabled={currentPage === 1}
        className={`inline-flex items-center px-4 py-2 border rounded-md text-sm font-medium ${currentPage === 1 ? 'border-gray-300 text-gray-300 cursor-not-allowed' : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'}`}>
        <FiChevronLeft className="mr-1" /> Anterior
      </button>
      <button onClick={onNextPage} disabled={shownItems < itemsPerPage}
        className={`inline-flex items-center px-4 py-2 border rounded-md text-sm font-medium ${shownItems < itemsPerPage ? 'border-gray-300 text-gray-300 cursor-not-allowed' : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'}`}>
        Siguiente <FiChevronRight className="ml-1" />
      </button>
    </div>
  </div>
);

// ─────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────
export default function AdminFlights() {
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFlight, setEditingFlight] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPast, setShowPast] = useState(false); // toggle vuelos pasados

  const [pageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalFlights, setTotalFlights] = useState(0);
  const [lastVisible, setLastVisible] = useState(null);
  const [firstVisible, setFirstVisible] = useState(null);
  const [pageHistory, setPageHistory] = useState([]);

  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    airline_code: '', departure_airport_code: '', arrival_airport_code: '', status: '',
  });

  const [uniqueAirlines, setUniqueAirlines] = useState([]);
  const [uniqueOrigins, setUniqueOrigins] = useState([]);
  const [uniqueDestinations, setUniqueDestinations] = useState([]);

  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (userRole !== 'admin') navigate('/dashboard');
  }, [userRole, navigate]);

  useEffect(() => { fetchFilterOptions(); }, []);
  useEffect(() => { countTotalFlights(); }, [filters, showPast]);
  useEffect(() => { fetchFlights(); }, [currentPage, pageSize, filters, showPast]);

  async function fetchFilterOptions() {
    try {
      const snap = await getDocs(query(collection(db, 'flights'), orderBy('airline_code')));
      const airlines = new Set(), origins = new Set(), destinations = new Set();
      snap.docs.forEach(d => {
        const f = d.data();
        if (f.airline_code) airlines.add(f.airline_code);
        if (f.departure_airport_code) origins.add(f.departure_airport_code);
        if (f.arrival_airport_code) destinations.add(f.arrival_airport_code);
      });
      setUniqueAirlines([...airlines].sort());
      setUniqueOrigins([...origins].sort());
      setUniqueDestinations([...destinations].sort());
    } catch (error) {
      console.error('Error al obtener opciones de filtro:', error);
    }
  }

  async function countTotalFlights() {
    try {
      let q = query(collection(db, 'flights'));
      if (!showPast) q = query(q, where('departure_date', '>=', today));
      if (filters.airline_code) q = query(q, where('airline_code', '==', filters.airline_code));
      if (filters.departure_airport_code) q = query(q, where('departure_airport_code', '==', filters.departure_airport_code));
      if (filters.arrival_airport_code) q = query(q, where('arrival_airport_code', '==', filters.arrival_airport_code));
      const snap = await getDocs(q);
      setTotalFlights(snap.size);
    } catch (error) {
      console.error('Error al contar vuelos:', error);
    }
  }

  async function fetchFlights() {
    try {
      setLoading(true);
      let q = query(collection(db, 'flights'));

      // Por defecto solo vuelos desde hoy en adelante (ISO permite comparación lexicográfica)
      if (!showPast) q = query(q, where('departure_date', '>=', today));

      if (filters.departure_airport_code) q = query(q, where('departure_airport_code', '==', filters.departure_airport_code));
      if (filters.arrival_airport_code) q = query(q, where('arrival_airport_code', '==', filters.arrival_airport_code));
      if (filters.airline_code) q = query(q, where('airline_code', '==', filters.airline_code));
      if (filters.status) q = query(q, where('status', '==', filters.status));

      q = query(q, orderBy('departure_date'), orderBy('departure_time'), limit(pageSize));

      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      setFlights(data);
      if (snap.docs.length > 0) {
        setLastVisible(snap.docs[snap.docs.length - 1]);
        setFirstVisible(snap.docs[0]);
      } else {
        setLastVisible(null);
        setFirstVisible(null);
      }
    } catch (error) {
      console.error('Error al cargar vuelos:', error);
      toast.error('Error al cargar los vuelos');
    } finally {
      setLoading(false);
    }
  }

  const goToNextPage = () => {
    setPageHistory(prev => [...prev, { page: currentPage, firstVisible, lastVisible }]);
    setCurrentPage(prev => prev + 1);
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      const prev = pageHistory[pageHistory.length - 1];
      setLastVisible(prev.lastVisible);
      setFirstVisible(prev.firstVisible);
      setPageHistory(h => h.slice(0, -1));
      setCurrentPage(p => p - 1);
    }
  };

  const clearFilters = () => {
    setFilters({ airline_code: '', departure_airport_code: '', arrival_airport_code: '', status: '' });
    setCurrentPage(1); setPageHistory([]); setLastVisible(null); setFirstVisible(null);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Está seguro de eliminar este vuelo?')) return;
    try {
      await deleteDoc(doc(db, 'flights', id));
      setFlights(prev => prev.filter(f => f.id !== id));
      toast.success('Vuelo eliminado');
    } catch (error) {
      console.error(error);
      toast.error('Error al eliminar el vuelo');
    }
  };

  const handleEdit = (flight) => { setEditingFlight(flight); setShowModal(true); };
  const handleNew = () => { setEditingFlight(null); setShowModal(true); };

  const filteredFlights = flights.filter(f =>
    f.flight_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.airline_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.departure_city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.arrival_city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.departure_airport_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.arrival_airport_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  async function handleLogout() {
    try { await logout(); navigate('/login'); }
    catch (error) { console.error(error); }
  }

  function onFlightSaved() {
    setCurrentPage(1); setPageHistory([]); setLastVisible(null); setFirstVisible(null);
    fetchFlights(); fetchFilterOptions();
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-0 md:ml-64">
        <DashboardHeader title="Gestión de Vuelos" onLogout={handleLogout} />

        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Vuelos</h1>
              <div className="mt-4 sm:mt-0 flex gap-3">
                <button
                  onClick={() => setShowPast(p => !p)}
                  className={`inline-flex items-center px-4 py-2 border rounded-md text-sm font-medium gap-2 ${showPast ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                >
                  <FiEye size={14} />
                  {showPast ? 'Ocultar pasados' : 'Ver vuelos pasados'}
                </button>
                <button
                  onClick={handleNew}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <FiPlus className="mr-2 h-4 w-4" /> Añadir Vuelo
                </button>
              </div>
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6">
                {/* Búsqueda y filtros */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 mb-4">
                  <div className="w-full lg:w-1/3">
                    <div className="relative">
                      <input
                        type="text" placeholder="Buscar vuelos..."
                        value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiSearch className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setShowFilters(s => !s)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                    <FiFilter className="mr-2 h-4 w-4" />
                    {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
                  </button>
                </div>

                {showFilters && (
                  <FlightFilters
                    filters={filters} setFilters={setFilters}
                    uniqueAirlines={uniqueAirlines} uniqueOrigins={uniqueOrigins}
                    uniqueDestinations={uniqueDestinations} clearFilters={clearFilters}
                  />
                )}

                <FlightTable
                  flights={filteredFlights} loading={loading}
                  onEdit={handleEdit} onDelete={handleDelete}
                  onSchedule={(f) => { setSelectedFlight(f); setShowScheduleModal(true); }}
                />

                <Pagination
                  currentPage={currentPage} totalItems={totalFlights}
                  itemsPerPage={pageSize} shownItems={filteredFlights.length}
                  onPreviousPage={goToPrevPage} onNextPage={goToNextPage}
                />
              </div>
            </div>

            {/* Herramientas adicionales */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-8">
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Frecuencia de Vuelos</h3>
                  <FlightFrequencyTable />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Importar Vuelos (JSON)</h3>
                  </div>
                  <ImportFlights onImportComplete={onFlightSaved} />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modal alta/edición */}
      {showModal && (
        <FlightModal
          flight={editingFlight}
          onClose={() => { setShowModal(false); setEditingFlight(null); }}
          onSaved={onFlightSaved}
        />
      )}

      {/* Modal programación */}
      {showScheduleModal && selectedFlight && (
        <FlightScheduleGenerator
          flight={selectedFlight}
          onClose={() => { setShowScheduleModal(false); setSelectedFlight(null); }}
          onComplete={onFlightSaved}
        />
      )}
    </div>
  );
}