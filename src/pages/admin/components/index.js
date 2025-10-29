// src/pages/admin/components/index.js
// Archivo barrel para exportar todos los componentes relacionados con vuelos

// Componentes principales
export { default as FlightTable } from './FlightTable';
export { default as FlightForm } from './FlightForm';
export { default as FlightFilters } from './FlightFilters';
export { default as Pagination } from './Pagination';
export { default as ClassAvailabilityEditor } from './ClassAvailabilityEditor';

// Exportaciones nombradas para mayor flexibilidad
import FlightTable from './FlightTable';
import FlightForm from './FlightForm';
import FlightFilters from './FlightFilters';
import Pagination from './Pagination';
import ClassAvailabilityEditor from './ClassAvailabilityEditor';

// Exportar como objeto para importación por destructuring
export const FlightComponents = {
  FlightTable,
  FlightForm,
  FlightFilters,
  Pagination,
  ClassAvailabilityEditor
};

// Exportación por defecto con todos los componentes
export default {
  FlightTable,
  FlightForm,
  FlightFilters,
  Pagination,
  ClassAvailabilityEditor
};