// src/utils/flightDataProcessor.js

/**
 * Procesa los datos de vuelos para completar información faltante
 * @param {Array} flights - Array de objetos de vuelos desde Mockaroo
 * @returns {Array} - Array de vuelos con datos completos
 */
export function processFlightData(flights) {
    return flights.map(flight => {
      // Crear una copia para no modificar el original
      const processedFlight = { ...flight };
      
      // Calcular arrival_date y arrival_time basados en departure y duration
      if (processedFlight.departure_date && processedFlight.departure_time && processedFlight.duration_hours) {
        // Convertir fecha y hora de salida a un objeto Date
        const [day, month, year] = processedFlight.departure_date.split('/').map(num => parseInt(num));
        const [hours, minutes] = processedFlight.departure_time.split(':').map(num => parseInt(num));
        
        const departureDate = new Date(year, month - 1, day, hours, minutes);
        
        // Calcular fecha y hora de llegada añadiendo la duración
        const durationMs = processedFlight.duration_hours * 60 * 60 * 1000;
        const arrivalDate = new Date(departureDate.getTime() + durationMs);
        
        // Formatear fecha de llegada: D/M/YYYY
        processedFlight.arrival_date = `${arrivalDate.getDate()}/${arrivalDate.getMonth() + 1}/${arrivalDate.getFullYear()}`;
        
        // Formatear hora de llegada: HH:MM
        const arrivalHours = arrivalDate.getHours().toString().padStart(2, '0');
        const arrivalMinutes = arrivalDate.getMinutes().toString().padStart(2, '0');
        processedFlight.arrival_time = `${arrivalHours}:${arrivalMinutes}`;
      }
      
      // Procesar class_availability si está como array vacío
      if (Array.isArray(processedFlight.class_availability) && processedFlight.class_availability.length > 0) {
        // Convertir a un objeto más útil
        const classes = ['F', 'J', 'Y', 'W', 'M', 'B', 'K', 'H', 'Q', 'L', 'V'];
        const availability = {};
        
        // Generar disponibilidad aleatoria para cada clase
        classes.forEach(cls => {
          availability[cls] = Math.floor(Math.random() * 10); // 0-9 asientos disponibles
        });
        
        processedFlight.class_availability = availability;
      }
      
      // Procesar available_classes si es un string simple
      if (typeof processedFlight.available_classes === 'string') {
        // Convertir a array de clases disponibles
        const classes = ['F', 'J', 'Y', 'W', 'M', 'B', 'K', 'H', 'Q', 'L', 'V'];
        // Filtrar aleatoriamente algunas clases como disponibles
        processedFlight.available_classes = classes.filter(() => Math.random() > 0.3);
      }
      
      // Procesar connection_airports si está como array de objetos vacíos
      if (Array.isArray(processedFlight.connection_airports)) {
        // Si no hay escalas, debería ser un array vacío
        if (processedFlight.stops === 0) {
          processedFlight.connection_airports = [];
        } else {
          // Aquí podrías añadir aeropuertos de conexión basados en la ruta
          // Por simplicidad, dejamos el array vacío por ahora
          processedFlight.connection_airports = [];
        }
      }
      
      return processedFlight;
    });
  }