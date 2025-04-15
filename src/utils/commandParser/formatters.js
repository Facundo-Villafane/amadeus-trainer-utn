// src/utils/commandParser/formatters.js
import { calculateDaysLeft, getDestinationInfoFromDB } from './helpers';

// Función para generar la cabecera correcta del comando AN
export async function generateANHeader(destination, origin, dateStr) {
  // Obtener la fecha actual
  const now = new Date();
  
  // Formatear el día de la semana en inglés y obtener las dos primeras letras
  const weekdays = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
  const dayOfWeek = weekdays[now.getDay()];
  
  // Formatear la fecha actual (DDMMM)
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const day = String(now.getDate()).padStart(2, '0');
  const month = months[now.getMonth()];
  const formattedDate = `${day}${month}`;
  
  // Formatear la hora actual (HHMM)
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const formattedTime = `${hours}${minutes}`;
  
  // Calcular días restantes hasta la fecha de viaje
  const daysLeft = calculateDaysLeft(dateStr);
  
  // Obtener información del destino desde la base de datos
  const destinationInfo = await getDestinationInfoFromDB(destination);
  
  // Generar la cabecera
  return `** AMADEUS AVAILABILITY - AN ** ${destination} ${destinationInfo.city}.${destinationInfo.countryCode} ${daysLeft} ${dayOfWeek} ${formattedDate} ${formattedTime}`;
}

// Función para generar la cabecera del comando SN
export async function generateSNHeader(destination, origin, dateStr) {
  // Obtener la fecha actual
  const now = new Date();
  
  // Formatear el día de la semana en inglés y obtener las dos primeras letras
  const weekdays = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
  const dayOfWeek = weekdays[now.getDay()];
  
  // Formatear la fecha actual (DDMMM)
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const day = String(now.getDate()).padStart(2, '0');
  const month = months[now.getMonth()];
  const formattedDate = `${day}${month}`;
  
  // Formatear la hora actual (HHMM)
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const formattedTime = `${hours}${minutes}`;
  
  // Calcular días restantes hasta la fecha de viaje
  const daysLeft = calculateDaysLeft(dateStr);
  
  // Obtener información del destino desde la base de datos
  const destinationInfo = await getDestinationInfoFromDB(destination);
  
  // Generar la cabecera
  return `** AMADEUS SCHEDULES - SN ** ${destination} ${destinationInfo.city}.${destinationInfo.countryCode} ${daysLeft} ${dayOfWeek} ${formattedDate} ${formattedTime}`;
}

// Función para generar la cabecera del comando TN
export async function generateTNHeader(destination, origin, dateStr) {
  // Obtener la fecha actual
  const now = new Date();
  
  // Formatear el día de la semana en inglés y obtener las dos primeras letras
  const weekdays = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
  const dayOfWeek = weekdays[now.getDay()];
  
  // Formatear la fecha actual (DDMMM)
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const day = String(now.getDate()).padStart(2, '0');
  const month = months[now.getMonth()];
  const formattedDate = `${day}${month}`;
  
  // Obtener la fecha una semana después para el encabezado
  const nextWeek = new Date(now);
  nextWeek.setDate(now.getDate() + 7);
  const nextWeekDay = String(nextWeek.getDate()).padStart(2, '0');
  const nextWeekMonth = months[nextWeek.getMonth()];
  const nextWeekYear = nextWeek.getFullYear().toString().substring(2);
  const nextWeekFormatted = `${nextWeekDay}${nextWeekMonth}${nextWeekYear}`;
  
  // Formatear la fecha actual con año (DDMMMYY)
  const currentYear = now.getFullYear().toString().substring(2);
  const currentFormatted = `${day}${month}${currentYear}`;
  
  // Obtener información del destino desde la base de datos
  const destinationInfo = await getDestinationInfoFromDB(destination);
  
  // Generar la cabecera
  return `** AMADEUS TIMETABLE - TN ** ${destination} ${destinationInfo.city}.${destinationInfo.countryCode} ${currentFormatted} ${nextWeekFormatted}`;
}

// Función para generar cabecera basada en el tipo de comando
export async function generateHeader(commandType, destination, origin, dateStr, suffix = '') {
  let header;
  
  switch (commandType) {
    case 'AN':
      header = await generateANHeader(destination, origin, dateStr);
      break;
    case 'SN':
      header = await generateSNHeader(destination, origin, dateStr);
      break;
    case 'TN':
      header = await generateTNHeader(destination, origin, dateStr);
      break;
    default:
      header = `** AMADEUS ${commandType} **`;
  }
  
  // Añadir sufijo si se proporciona (ej: "PÁGINA SIGUIENTE")
  if (suffix) {
    header += ` (${suffix})`;
  }
  
  return header;
}