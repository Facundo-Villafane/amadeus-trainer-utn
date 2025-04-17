// src/utils/commandParser/commands/pnr/dateUtils.js

/**
 * Obtiene el día de la semana a partir de una fecha
 * @param {string} dateStr - Cadena de fecha en formato "09SEP" o "D/M/YYYY"
 * @returns {string} Día de la semana (1-7, donde 1=Lunes, 7=Domingo)
 */
export function getDayOfWeek(dateStr) {
    try {
      // Manejar formato de fecha tipo "09SEP"
      if (/^\d{1,2}[A-Z]{3}$/.test(dateStr)) {
        const day = parseInt(dateStr.substring(0, dateStr.length - 3), 10);
        const monthStr = dateStr.substring(dateStr.length - 3).toUpperCase();
        
        // Convertir mes abreviado a número (0-11)
        const months = {
          'JAN': 0, 'FEB': 1, 'MAR': 2, 'APR': 3, 'MAY': 4, 'JUN': 5,
          'JUL': 6, 'AUG': 7, 'SEP': 8, 'OCT': 9, 'NOV': 10, 'DEC': 11
        };
        
        const month = months[monthStr];
        if (month === undefined) {
          throw new Error(`Mes inválido: ${monthStr}`);
        }
        
        // Determinar el año actual y crear la fecha
        const currentYear = new Date().getFullYear();
        const date = new Date(currentYear, month, day);
        
        // Ajustar al próximo año si la fecha ya pasó
        if (date < new Date() && month < 6) {
          date.setFullYear(currentYear + 1);
        }
        
        const dayOfWeek = date.getDay();
        return String(dayOfWeek === 0 ? 7 : dayOfWeek); // 1 = Lunes, 7 = Domingo
      }
      
      // Manejar formato de fecha tipo "D/M/YYYY"
      if (dateStr.includes('/')) {
        const [day, month, year] = dateStr.split('/').map(num => parseInt(num, 10));
        const date = new Date(year, month - 1, day);
        const dayOfWeek = date.getDay();
        return String(dayOfWeek === 0 ? 7 : dayOfWeek); // 1 = Lunes, 7 = Domingo
      }
      
      // Formato no reconocido
      throw new Error(`Formato de fecha no reconocido: ${dateStr}`);
    } catch (error) {
      console.error('Error al obtener día de la semana:', error);
      return '1'; // Por defecto, Lunes
    }
  }
  
  /**
   * Formatea una fecha al estilo Amadeus (DDMMM)
   * @param {Date} date - Objeto fecha
   * @returns {string} Fecha formateada (ej: "09SEP")
   */
  export function formatAmadeusDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const month = months[date.getMonth()];
    return `${day}${month}`;
  }
  
  /**
   * Calcula la fecha de llegada basada en fecha/hora de salida y duración
   * @param {string} departureDate - Fecha de salida
   * @param {string} departureTime - Hora de salida
   * @param {number} durationHours - Duración en horas
   * @returns {string} Fecha de llegada
   */
  export function calculateArrivalDate(departureDate, departureTime, durationHours) {
    try {
      // Si la fecha de salida está en formato "09SEP"
      if (/^\d{1,2}[A-Z]{3}$/.test(departureDate)) {
        const day = parseInt(departureDate.substring(0, departureDate.length - 3), 10);
        const monthStr = departureDate.substring(departureDate.length - 3).toUpperCase();
        
        // Convertir mes abreviado a número (0-11)
        const months = {
          'JAN': 0, 'FEB': 1, 'MAR': 2, 'APR': 3, 'MAY': 4, 'JUN': 5,
          'JUL': 6, 'AUG': 7, 'SEP': 8, 'OCT': 9, 'NOV': 10, 'DEC': 11
        };
        
        const month = months[monthStr];
        if (month === undefined) {
          throw new Error(`Mes inválido: ${monthStr}`);
        }
        
        // Determinar el año actual y crear la fecha
        const currentYear = new Date().getFullYear();
        const [hours, minutes] = departureTime.split(':').map(num => parseInt(num, 10));
        
        const departureDateTime = new Date(currentYear, month, day, hours, minutes);
        
        // Calcular fecha y hora de llegada añadiendo la duración
        const durationMs = durationHours * 60 * 60 * 1000;
        const arrivalDateTime = new Date(departureDateTime.getTime() + durationMs);
        
        // Formatear fecha de llegada al mismo formato que la entrada
        return formatAmadeusDate(arrivalDateTime);
      }
      
      // Si la fecha de salida está en formato "D/M/YYYY"
      if (departureDate.includes('/')) {
        const [day, month, year] = departureDate.split('/').map(num => parseInt(num, 10));
        const [hours, minutes] = departureTime.split(':').map(num => parseInt(num, 10));
        
        const departureDateTime = new Date(year, month - 1, day, hours, minutes);
        
        // Calcular fecha y hora de llegada añadiendo la duración
        const durationMs = durationHours * 60 * 60 * 1000;
        const arrivalDateTime = new Date(departureDateTime.getTime() + durationMs);
        
        // Formatear fecha de llegada: D/M/YYYY
        return `${arrivalDateTime.getDate()}/${arrivalDateTime.getMonth() + 1}/${arrivalDateTime.getFullYear()}`;
      }
      
      // Si no se pudo procesar la fecha, devolver la misma
      return departureDate;
    } catch (error) {
      console.error('Error al calcular fecha de llegada:', error);
      return departureDate; // En caso de error, devolver la misma fecha de salida
    }
  }