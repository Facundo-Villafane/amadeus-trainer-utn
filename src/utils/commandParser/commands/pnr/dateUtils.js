// src/utils/commandParser/commands/pnr/dateUtils.js

/**
 * Obtiene el día de la semana a partir de una fecha
 * @param {string} dateStr - Cadena de fecha en formato "09SEP" o "D/M/YYYY"
 * @returns {string} Día de la semana (1-7, donde 1=Lunes, 7=Domingo)
 */
export function getDayOfWeek(dateStr) {
  try {
    // Si no hay fecha, devolver lunes por defecto
    if (!dateStr) {
      console.warn('No date string provided, defaulting to Monday (1)');
      return '1'; // Lunes por defecto
    }
    
    // Manejar formato de fecha tipo "09SEP"
    if (/^\d{1,2}[A-Z]{3}$/i.test(dateStr)) {
      const day = parseInt(dateStr.substring(0, dateStr.length - 3), 10);
      const monthStr = dateStr.substring(dateStr.length - 3).toUpperCase();
      
      // Convertir mes abreviado a número (0-11)
      const months = {
        'JAN': 0, 'FEB': 1, 'MAR': 2, 'APR': 3, 'MAY': 4, 'JUN': 5,
        'JUL': 6, 'AUG': 7, 'SEP': 8, 'OCT': 9, 'NOV': 10, 'DEC': 11
      };
      
      // Manejar posibles typos en meses
      let month = months[monthStr];
      
      // Si no encontramos el mes exacto, buscar el más cercano
      if (month === undefined) {
        // Intentar corrección básica de typos comunes
        const corrections = {
          'SEO': 'SEP', 'OCK': 'OCT', 'DEC': 'DEC', 
          'JUL': 'JUL', 'AUG': 'AUG', 'JUN': 'JUN'
        };
        
        const correctedMonth = corrections[monthStr];
        if (correctedMonth) {
          month = months[correctedMonth];
          console.warn(`Corrected month typo: ${monthStr} -> ${correctedMonth}`);
        }
        
        // Si sigue sin encontrarse, usar el actual
        if (month === undefined) {
          console.warn(`Invalid month: ${monthStr}, using current month`);
          month = new Date().getMonth();
        }
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
      try {
        const parts = dateStr.split('/');
        // Asegurarse de que hay suficientes partes
        if (parts.length < 2) {
          throw new Error(`Invalid date format: ${dateStr}`);
        }
        
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Restar 1 porque los meses en JS van de 0-11
        
        // Usar año actual si no se proporciona
        const year = parts.length > 2 ? parseInt(parts[2], 10) : new Date().getFullYear();
        
        // Validar que los valores son razonables
        if (isNaN(day) || day < 1 || day > 31) {
          throw new Error(`Invalid day: ${parts[0]}`);
        }
        
        if (isNaN(month) || month < 0 || month > 11) {
          throw new Error(`Invalid month: ${parts[1]}`);
        }
        
        const date = new Date(year, month, day);
        const dayOfWeek = date.getDay();
        return String(dayOfWeek === 0 ? 7 : dayOfWeek); // 1 = Lunes, 7 = Domingo
      } catch (error) {
        console.error(`Error parsing date with slashes: ${dateStr}`, error);
        return '1'; // Por defecto, Lunes
      }
    }
    
    // Formato no reconocido, intentar parsear como fecha común
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }
      const dayOfWeek = date.getDay();
      return String(dayOfWeek === 0 ? 7 : dayOfWeek); // 1 = Lunes, 7 = Domingo
    } catch (error) {
      console.error(`Unrecognized date format: ${dateStr}`, error);
      return '1'; // Por defecto, Lunes
    }
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
  try {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      console.warn('Invalid date object provided to formatAmadeusDate');
      return '01JAN'; // Valor por defecto
    }
    
    const day = String(date.getDate()).padStart(2, '0');
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const month = months[date.getMonth()];
    return `${day}${month}`;
  } catch (error) {
    console.error('Error formatting Amadeus date:', error);
    return '01JAN'; // En caso de error, devolver un valor válido por defecto
  }
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
    // Validar entrada
    if (!departureDate || !departureTime || durationHours === undefined) {
      console.warn('Missing required parameters for calculateArrivalDate');
      return departureDate || '01JAN'; 
    }
    
    // Si la fecha de salida está en formato "09SEP"
    if (/^\d{1,2}[A-Z]{3}$/i.test(departureDate)) {
      const day = parseInt(departureDate.substring(0, departureDate.length - 3), 10);
      const monthStr = departureDate.substring(departureDate.length - 3).toUpperCase();
      
      // Convertir mes abreviado a número (0-11)
      const months = {
        'JAN': 0, 'FEB': 1, 'MAR': 2, 'APR': 3, 'MAY': 4, 'JUN': 5,
        'JUL': 6, 'AUG': 7, 'SEP': 8, 'OCT': 9, 'NOV': 10, 'DEC': 11
      };
      
      // Manejar posibles typos en meses
      let month = months[monthStr];
      
      // Si no encontramos el mes exacto, buscar el más cercano
      if (month === undefined) {
        // Intentar corrección básica de typos comunes
        const corrections = {
          'SEO': 'SEP', 'OCK': 'OCT', 'DEC': 'DEC',
          'JUL': 'JUL', 'AUG': 'AUG', 'JUN': 'JUN'  
        };
        
        const correctedMonth = corrections[monthStr];
        if (correctedMonth) {
          month = months[correctedMonth];
          console.warn(`Corrected month typo: ${monthStr} -> ${correctedMonth}`);
        }
        
        // Si sigue sin encontrarse, usar el actual
        if (month === undefined) {
          console.warn(`Invalid month: ${monthStr}, using current month`);
          month = new Date().getMonth();
        }
      }
      
      // Determinar el año actual y crear la fecha
      const currentYear = new Date().getFullYear();
      let [hours, minutes] = [0, 0];
      
      try {
        // Parsear hora de salida
        [hours, minutes] = departureTime.split(':').map(num => parseInt(num, 10));
        if (isNaN(hours) || isNaN(minutes)) {
          throw new Error(`Invalid time format: ${departureTime}`);
        }
      } catch (error) {
        console.warn(`Error parsing departure time: ${departureTime}`, error);
        hours = 12;
        minutes = 0;
      }
      
      const departureDateTime = new Date(currentYear, month, day, hours, minutes);
      
      // Validar que la fecha es válida
      if (isNaN(departureDateTime.getTime())) {
        console.warn('Invalid departure date/time, using current date');
        return formatAmadeusDate(new Date());
      }
      
      // Calcular fecha y hora de llegada añadiendo la duración
      const durationMs = durationHours * 60 * 60 * 1000;
      const arrivalDateTime = new Date(departureDateTime.getTime() + durationMs);
      
      // Formatear fecha de llegada al mismo formato que la entrada
      return formatAmadeusDate(arrivalDateTime);
    }
    
    // Si la fecha de salida está en formato "D/M/YYYY"
    if (departureDate.includes('/')) {
      try {
        const parts = departureDate.split('/');
        // Asegurarse de que hay suficientes partes
        if (parts.length < 2) {
          throw new Error(`Invalid date format: ${departureDate}`);
        }
        
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Restar 1 porque los meses en JS van de 0-11
        
        // Usar año actual si no se proporciona
        const year = parts.length > 2 ? parseInt(parts[2], 10) : new Date().getFullYear();
        
        // Parsear hora de salida
        let [hours, minutes] = [0, 0];
        try {
          [hours, minutes] = departureTime.split(':').map(num => parseInt(num, 10));
          if (isNaN(hours) || isNaN(minutes)) {
            throw new Error(`Invalid time format: ${departureTime}`);
          }
        } catch (error) {
          console.warn(`Error parsing departure time: ${departureTime}`, error);
          hours = 12;
          minutes = 0;
        }
        
        const departureDateTime = new Date(year, month, day, hours, minutes);
        
        // Validar que la fecha es válida
        if (isNaN(departureDateTime.getTime())) {
          console.warn('Invalid departure date/time, using current date');
          return departureDate;
        }
        
        // Calcular fecha y hora de llegada añadiendo la duración
        const durationMs = durationHours * 60 * 60 * 1000;
        const arrivalDateTime = new Date(departureDateTime.getTime() + durationMs);
        
        // Formatear fecha de llegada: D/M/YYYY
        return `${arrivalDateTime.getDate()}/${arrivalDateTime.getMonth() + 1}/${arrivalDateTime.getFullYear()}`;
      } catch (error) {
        console.error(`Error calculating arrival for date with slashes: ${departureDate}`, error);
        return departureDate;
      }
    }
    
    // Si no se pudo procesar la fecha, devolver la misma
    return departureDate;
  } catch (error) {
    console.error('Error al calcular fecha de llegada:', error);
    return departureDate; // En caso de error, devolver la misma fecha de salida
  }
}