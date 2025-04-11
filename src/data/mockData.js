// src/data/mockData.js

const mockData = {
    // Ciudades y aeropuertos
    cities: [
      {
        code: 'BUE',
        name: 'Buenos Aires',
        country: 'AR',
        airports: [
          { code: 'EZE', name: 'Ministro Pistarini International Airport', distance: '22' },
          { code: 'AEP', name: 'Jorge Newbery Airpark', distance: '2' }
        ]
      },
      {
        code: 'MAD',
        name: 'Madrid',
        country: 'ES',
        airports: [
          { code: 'MAD', name: 'Adolfo Suárez Madrid–Barajas Airport', distance: '13' }
        ]
      },
      {
        code: 'BCN',
        name: 'Barcelona',
        country: 'ES',
        airports: [
          { code: 'BCN', name: 'Barcelona–El Prat Airport', distance: '12' }
        ]
      },
      {
        code: 'MIA',
        name: 'Miami',
        country: 'US',
        airports: [
          { code: 'MIA', name: 'Miami International Airport', distance: '8' }
        ]
      },
      {
        code: 'NYC',
        name: 'New York',
        country: 'US',
        airports: [
          { code: 'JFK', name: 'John F. Kennedy International Airport', distance: '12' },
          { code: 'LGA', name: 'LaGuardia Airport', distance: '8' },
          { code: 'EWR', name: 'Newark Liberty International Airport', distance: '15' }
        ]
      },
      {
        code: 'LON',
        name: 'London',
        country: 'GB',
        airports: [
          { code: 'LHR', name: 'London Heathrow Airport', distance: '24' },
          { code: 'LGW', name: 'London Gatwick Airport', distance: '45' },
          { code: 'STN', name: 'London Stansted Airport', distance: '68' },
          { code: 'LCY', name: 'London City Airport', distance: '10' }
        ]
      },
      {
        code: 'PAR',
        name: 'Paris',
        country: 'FR',
        airports: [
          { code: 'CDG', name: 'Charles de Gaulle Airport', distance: '23' },
          { code: 'ORY', name: 'Orly Airport', distance: '13' }
        ]
      },
      {
        code: 'COR',
        name: 'Cordoba',
        country: 'AR',
        airports: [
          { code: 'COR', name: 'Ingeniero Ambrosio Taravella Airport', distance: '9' }
        ]
      },
      {
        code: 'ROS',
        name: 'Rosario',
        country: 'AR',
        airports: [
          { code: 'ROS', name: 'Rosario – Islas Malvinas International Airport', distance: '13' }
        ]
      },
      {
        code: 'MDZ',
        name: 'Mendoza',
        country: 'AR',
        airports: [
          { code: 'MDZ', name: 'Governor Francisco Gabrielli International Airport', distance: '10' }
        ]
      },
      {
        code: 'SCL',
        name: 'Santiago de Chile',
        country: 'CL',
        airports: [
          { code: 'SCL', name: 'Arturo Merino Benítez International Airport', distance: '20' }
        ]
      },
      {
        code: 'LIM',
        name: 'Lima',
        country: 'PE',
        airports: [
          { code: 'LIM', name: 'Jorge Chávez International Airport', distance: '12' }
        ]
      },
      {
        code: 'BOG',
        name: 'Bogotá',
        country: 'CO',
        airports: [
          { code: 'BOG', name: 'El Dorado International Airport', distance: '15' }
        ]
      }
    ],
  
    // PNRs predefinidos para recuperación (RT)
    pnrs: [
      {
        recordLocator: 'ABC123',
        passengers: [
          { lastName: 'PEREZ', firstName: 'JUAN', title: 'MR' }
        ],
        segments: [
          {
            airline: 'AR',
            flightNumber: '1132',
            class: 'Y',
            departureDate: '10JUN',
            origin: 'EZE',
            destination: 'MAD',
            status: 'HK',
            quantity: 1,
            departureTime: '2350',
            arrivalTime: '1605+1',
            aircraft: '332'
          },
          {
            airline: 'AR',
            flightNumber: '1133',
            class: 'Y',
            departureDate: '20JUN',
            origin: 'MAD',
            destination: 'EZE',
            status: 'HK',
            quantity: 1,
            departureTime: '2210',
            arrivalTime: '0610+1',
            aircraft: '332'
          }
        ],
        contacts: [
          { city: 'BUE', phone: '1122334455', type: 'M' }
        ],
        ticketTimeLimit: '05JUN/1200',
        agentSignature: 'AGENTE',
        creationDate: '01JUN/1000Z'
      },
      {
        recordLocator: 'XYZ789',
        passengers: [
          { lastName: 'GONZALEZ', firstName: 'MARIA', title: 'MRS' },
          { lastName: 'GONZALEZ', firstName: 'PEDRO', title: 'MR' }
        ],
        segments: [
          {
            airline: 'IB',
            flightNumber: '6841',
            class: 'J',
            departureDate: '15JUL',
            origin: 'EZE',
            destination: 'MAD',
            status: 'HK',
            quantity: 2,
            departureTime: '1310',
            arrivalTime: '0530+1',
            aircraft: '346'
          }
        ],
        contacts: [
          { city: 'BUE', phone: '1177889900', type: 'M' },
          { email: 'maria@email.com' }
        ],
        ticketTimeLimit: '10JUL/1600',
        agentSignature: 'AGENTE',
        creationDate: '01JUL/1500Z'
      }
    ]
  };
  
  export default mockData;
  