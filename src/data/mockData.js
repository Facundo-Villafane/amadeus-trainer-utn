// src/utils/mockData.js

// Datos de ciudades y aeropuertos para cuando la conexión a Firebase falla
export const mockCities = [
  {
    code: 'BUE',
    name: 'BUENOS AIRES',
    name_uppercase: 'BUENOS AIRES',
    country_code: 'AR',
    airports: [
      { code: 'EZE', name: 'EZEIZA INTL', distance: '22K' },
      { code: 'AEP', name: 'AEROPARQUE', distance: '2K' }
    ]
  },
  {
    code: 'MAD',
    name: 'MADRID',
    name_uppercase: 'MADRID',
    country_code: 'ES',
    airports: [
      { code: 'MAD', name: 'BARAJAS INTL', distance: '12K' }
    ]
  },
  {
    code: 'BCN',
    name: 'BARCELONA',
    name_uppercase: 'BARCELONA',
    country_code: 'ES',
    airports: [
      { code: 'BCN', name: 'EL PRAT', distance: '12K' }
    ]
  },
  {
    code: 'LON',
    name: 'LONDON',
    name_uppercase: 'LONDON',
    country_code: 'GB',
    airports: [
      { code: 'LHR', name: 'HEATHROW', distance: '15K' },
      { code: 'LGW', name: 'GATWICK', distance: '30K' },
      { code: 'STN', name: 'STANSTED', distance: '40K' }
    ]
  },
  {
    code: 'PAR',
    name: 'PARIS',
    name_uppercase: 'PARIS',
    country_code: 'FR',
    airports: [
      { code: 'CDG', name: 'CHARLES DE GAULLE', distance: '22K' },
      { code: 'ORY', name: 'ORLY', distance: '14K' }
    ]
  }
];

export const mockAirports = [
  {
    code: 'EZE',
    name: 'MINISTRO PISTARINI INTL',
    city_code: 'BUE',
    city_name: 'BUENOS AIRES',
    country_code: 'AR'
  },
  {
    code: 'AEP',
    name: 'JORGE NEWBERY AEROPARQUE',
    city_code: 'BUE',
    city_name: 'BUENOS AIRES',
    country_code: 'AR'
  },
  {
    code: 'MAD',
    name: 'ADOLFO SUAREZ BARAJAS',
    city_code: 'MAD',
    city_name: 'MADRID',
    country_code: 'ES'
  },
  {
    code: 'BCN',
    name: 'EL PRAT',
    city_code: 'BCN',
    city_name: 'BARCELONA',
    country_code: 'ES'
  },
  {
    code: 'LHR',
    name: 'HEATHROW',
    city_code: 'LON',
    city_name: 'LONDON',
    country_code: 'GB'
  },
  {
    code: 'CDG',
    name: 'CHARLES DE GAULLE',
    city_code: 'PAR',
    city_name: 'PARIS',
    country_code: 'FR'
  },
  {
    code: 'MIA',
    name: 'MIAMI INTERNATIONAL',
    city_code: 'MIA',
    city_name: 'MIAMI',
    country_code: 'US'
  },
  {
    code: 'JFK',
    name: 'JOHN F. KENNEDY INTL',
    city_code: 'NYC',
    city_name: 'NEW YORK',
    country_code: 'US'
  },
  {
    code: 'FCO',
    name: 'LEONARDO DA VINCI',
    city_code: 'ROM',
    city_name: 'ROME',
    country_code: 'IT'
  },
  {
    code: 'GRU',
    name: 'GUARULHOS INTL',
    city_code: 'SAO',
    city_name: 'SAO PAULO',
    country_code: 'BR'
  }
];

export const mockAirlines = [
  {
    code: 'IB',
    name: 'IBERIA',
    name_uppercase: 'IBERIA',
    country: 'SPAIN'
  },
  {
    code: 'BA',
    name: 'BRITISH AIRWAYS',
    name_uppercase: 'BRITISH AIRWAYS',
    country: 'UNITED KINGDOM'
  },
  {
    code: 'AF',
    name: 'AIR FRANCE',
    name_uppercase: 'AIR FRANCE',
    country: 'FRANCE'
  },
  {
    code: 'LH',
    name: 'LUFTHANSA',
    name_uppercase: 'LUFTHANSA',
    country: 'GERMANY'
  },
  {
    code: 'AR',
    name: 'AEROLINEAS ARGENTINAS',
    name_uppercase: 'AEROLINEAS ARGENTINAS',
    country: 'ARGENTINA'
  },
  {
    code: 'LA',
    name: 'LATAM',
    name_uppercase: 'LATAM',
    country: 'CHILE'
  },
  {
    code: 'AA',
    name: 'AMERICAN AIRLINES',
    name_uppercase: 'AMERICAN AIRLINES',
    country: 'UNITED STATES'
  },
  {
    code: 'DL',
    name: 'DELTA AIR LINES',
    name_uppercase: 'DELTA AIR LINES',
    country: 'UNITED STATES'
  },
  {
    code: 'UA',
    name: 'UNITED AIRLINES',
    name_uppercase: 'UNITED AIRLINES',
    country: 'UNITED STATES'
  }
];
  