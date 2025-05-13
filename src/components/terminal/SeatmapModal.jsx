// src/components/terminal/SeatmapModal.jsx
import React, { useState, useEffect } from 'react';
import { FiX, FiUser, FiCheck } from 'react-icons/fi';
import { currentSeatmapRequest } from '../../utils/commandParser/commands/seatmap';
import { getCurrentPNR, setCurrentPNR } from '../../utils/commandParser/commands/pnr/pnrState';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { formatPNRResponse } from '../../utils/commandParser/commands/pnr/pnrUtils';
import { useAuth } from '../../hooks/useAuth';

// Generador de asientos genérico
const generateGenericSeatmap = (rows, seatsPerRow) => {
  // Primera clase - filas 1-2
  const firstClass = Array.from({ length: 2 }, (_, row) => 
    Array.from({ length: 4 }, (_, seat) => ({
      row: row + 1,
      seat: ['A', 'C', 'D', 'F'][seat],
      type: 'first',
      occupied: Math.random() > 0.7, // Aleatoriamente algunos asientos ocupados
      selected: false,
      disabled: false
    }))
  );
  
  // Business - filas 3-6
  const business = Array.from({ length: 4 }, (_, row) => 
    Array.from({ length: 6 }, (_, seat) => ({
      row: row + 3,
      seat: ['A', 'C', 'D', 'E', 'F', 'H'][seat],
      type: 'business',
      occupied: Math.random() > 0.6,
      selected: false,
      disabled: false
    }))
  );
  
  // Economy - resto de filas
  const economy = Array.from({ length: rows - 6 }, (_, row) => 
    Array.from({ length: seatsPerRow }, (_, seat) => ({
      row: row + 7,
      seat: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K'][seat],
      type: 'economy',
      occupied: Math.random() > 0.5,
      selected: false,
      disabled: false
    }))
  );
  
  return [...firstClass, ...business, ...economy];
};

export default function SeatmapModal({ isOpen, onClose, addTerminalResponse }) {
  const { currentUser } = useAuth();
  const [seatmap, setSeatmap] = useState([]);
  const [selectedPassenger, setSelectedPassenger] = useState(0);
  const [pnr, setPnr] = useState(null);
  const [segment, setSegment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeats, setSelectedSeats] = useState({});
  
  // Generar un seatmap genérico cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      const currentPNR = getCurrentPNR();
      const { segmentIndex } = currentSeatmapRequest;
      
      if (currentPNR && currentPNR.segments && segmentIndex !== null) {
        setPnr(currentPNR);
        setSegment(currentPNR.segments[segmentIndex]);
        
        // Generar seatmap genérico
        const genericSeatmap = generateGenericSeatmap(30, 10); // 30 filas, 10 asientos por fila (3-4-3)
        setSeatmap(genericSeatmap);
        
        // Inicializar selectedSeats con asientos ya reservados
        const initialSelectedSeats = {};
        if (currentPNR.ssrElements) {
          const rqstElements = currentPNR.ssrElements.filter(ssr => 
            ssr.code === 'RQST' && ssr.segmentIndex === segmentIndex
          );
          
          if (rqstElements.length > 0 && rqstElements[0].seatInfo) {
            Object.entries(rqstElements[0].seatInfo).forEach(([passenger, seat]) => {
              const passengerIndex = parseInt(passenger.substring(1), 10) - 1;
              initialSelectedSeats[passengerIndex] = seat;
            });
          }
        }
        setSelectedSeats(initialSelectedSeats);
      }
      
      setLoading(false);
    }
  }, [isOpen]);
  
  // Si no está abierto, no renderizar
  if (!isOpen) return null;
  
  // Si está cargando, mostrar indicador
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-4 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-auto">
          <div className="flex justify-center items-center h-64">
            <p className="text-lg">Cargando mapa de asientos...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Si no hay PNR o segmento, mostrar error
  if (!pnr || !segment) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-4 rounded-lg w-full max-w-4xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Error</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <FiX size={24} />
            </button>
          </div>
          <p>No se pudo cargar el mapa de asientos. Verifique que haya un PNR activo con segmentos.</p>
          <div className="mt-4 flex justify-end">
            <button 
              onClick={onClose}
              className="bg-amadeus-primary text-white px-4 py-2 rounded"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Manejar clic en asiento
  const handleSeatClick = (row, seatLetter) => {
    const seat = `${row}${seatLetter}`;
    
    // Verificar si el asiento está ocupado
    const seatObj = seatmap
      .flat()
      .find(s => s.row === row && s.seat === seatLetter);
    
    if (seatObj && (seatObj.occupied || seatObj.disabled)) {
      return; // No permitir seleccionar asientos ocupados
    }
    
    // Actualizar asientos seleccionados
    setSelectedSeats(prev => ({
      ...prev,
      [selectedPassenger]: seat
    }));
  };
  
  // Guardar los asientos seleccionados
  const handleSaveSeats = async () => {
    try {
      // Verificar que se han seleccionado asientos
      if (Object.keys(selectedSeats).length === 0) {
        alert("No se han seleccionado asientos.");
        return;
      }
      
      const segmentIndex = currentSeatmapRequest.segmentIndex;
      const currentPNR = getCurrentPNR();
      
      if (!currentPNR || !currentPNR.segments || segmentIndex === null) {
        alert("No se puede guardar los asientos. PNR o segmento no válido.");
        return;
      }
      
      // Obtener el segmento seleccionado
      const segment = currentPNR.segments[segmentIndex];
      const segmentNumber = segmentIndex + 1; // Índice real en el PNR (base 1)
      const routeCode = `${segment.origin}${segment.destination}`;
      
      // Crear o actualizar SSR RQST
      if (!currentPNR.ssrElements) {
        currentPNR.ssrElements = [];
      }
      
      // Verificar si ya existe un SSR RQST para este segmento
      const existingRqstIndex = currentPNR.ssrElements.findIndex(ssr => 
        ssr.code === 'RQST' && ssr.segmentIndex === segmentIndex
      );
      
      // Crear objeto seatInfo a partir de selectedSeats
      const seatInfo = {};
      Object.entries(selectedSeats).forEach(([passengerIndex, seat]) => {
        const passengerNumber = parseInt(passengerIndex, 10) + 1;
        seatInfo[`P${passengerNumber}`] = seat;
      });
      
      // Crear mensaje para el SSR
      const seatAssignments = Object.entries(seatInfo)
        .map(([passenger, seatNumber]) => `${seatNumber},${passenger}`)
        .join('/');
      
      if (existingRqstIndex >= 0) {
        // Actualizar SSR existente
        currentPNR.ssrElements[existingRqstIndex].message = `${routeCode}/${seatAssignments}`;
        currentPNR.ssrElements[existingRqstIndex].seatInfo = seatInfo;
      } else {
        // Crear nuevo SSR RQST
        const newSsrElement = {
          type: 'SSR',
          code: 'RQST',
          airlineCode: segment.airline_code,
          status: 'HK1',
          message: `${routeCode}/${seatAssignments}`,
          segmentNumber: segmentNumber,
          segmentIndex: segmentIndex,
          seatInfo: seatInfo,
          addedAt: new Date()
        };
        
        currentPNR.ssrElements.push(newSsrElement);
      }
      
      // Actualizar la referencia global
      setCurrentPNR(currentPNR);
      
      // Guardar el PNR actualizado en Firestore
      if (currentPNR.id && currentUser) {
        await updateDoc(doc(db, 'pnrs', currentPNR.id), {
          ssrElements: currentPNR.ssrElements,
          updatedAt: serverTimestamp(),
          [`history.${Date.now()}`]: {
            command: 'SM',
            result: 'Asientos seleccionados via SM',
            timestamp: new Date().toISOString()
          }
        });
      }
      
      // Mostrar respuesta en la terminal
      const response = formatPNRResponse(currentPNR);
      if (addTerminalResponse) {
        addTerminalResponse(response, 'output');
      }
      
      // Cerrar el modal
      onClose();
    } catch (error) {
      console.error('Error al guardar los asientos:', error);
      alert(`Error al guardar los asientos: ${error.message}`);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            Selección de Asientos - {segment.airline_code} {segment.flight_number} - {segment.origin} a {segment.destination}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FiX size={24} />
          </button>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4">
          {/* Panel de pasajeros */}
          <div className="md:w-1/4 p-2 border rounded">
            <h3 className="font-medium mb-2">Pasajeros</h3>
            <ul className="space-y-2">
              {pnr.passengers.map((passenger, index) => (
                <li 
                  key={index}
                  onClick={() => setSelectedPassenger(index)}
                  className={`p-2 rounded cursor-pointer flex items-center ${
                    selectedPassenger === index ? 'bg-amadeus-light text-amadeus-primary' : 'hover:bg-gray-100'
                  }`}
                >
                  <FiUser className="mr-2" />
                  <div>
                    <div>{passenger.lastName}/{passenger.firstName}</div>
                    {selectedSeats[index] && (
                      <div className="text-sm text-amadeus-primary">
                        Asiento: {selectedSeats[index]}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Mapa de asientos */}
          <div className="md:w-3/4">
            <div className="mb-4 text-center font-medium">
              <p>Asientos disponibles para {segment.airline_code} {segment.flight_number}</p>
              <p className="text-sm text-gray-500">
                * Los asientos mostrados son genéricos y pueden no reflejar la configuración real de la aeronave
              </p>
            </div>
            
            <div className="flex justify-center mb-4">
              <div className="p-2 bg-gray-200 rounded text-center w-24">FRENTE</div>
            </div>
            
            <div className="flex justify-center">
              <div className="inline-block">
                {seatmap.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex mb-2">
                    {row.map((seat) => {
                      // Determinar estado del asiento
                      const isSelected = Object.values(selectedSeats).includes(`${seat.row}${seat.seat}`);
                      const isCurrentPassengerSeat = selectedSeats[selectedPassenger] === `${seat.row}${seat.seat}`;
                      
                      // Determinar clase de estilo
                      let seatClass = 'w-8 h-8 flex items-center justify-center m-1 rounded cursor-pointer text-xs';
                      
                      if (seat.type === 'first') {
                        seatClass += ' border-2 border-yellow-500';
                      } else if (seat.type === 'business') {
                        seatClass += ' border-2 border-blue-500';
                      } else {
                        seatClass += ' border border-gray-300';
                      }
                      
                      if (seat.occupied) {
                        seatClass += ' bg-gray-400 text-white cursor-not-allowed';
                      } else if (isCurrentPassengerSeat) {
                        seatClass += ' bg-amadeus-primary text-white';
                      } else if (isSelected) {
                        seatClass += ' bg-green-500 text-white cursor-not-allowed';
                      } else {
                        seatClass += ' hover:bg-amadeus-light';
                      }
                      
                      // Espacio en el pasillo
                      const isAisle = ['C', 'G'].includes(seat.seat); // Asientos junto al pasillo
                      
                      return (
                        <React.Fragment key={`${seat.row}${seat.seat}`}>
                          <div
                            className={seatClass}
                            onClick={() => !seat.occupied && !isSelected && handleSeatClick(seat.row, seat.seat)}
                          >
                            {`${seat.row}${seat.seat}`}
                          </div>
                          {isAisle && <div className="w-4"></div>}
                        </React.Fragment>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Leyenda */}
            <div className="mt-4 flex flex-wrap justify-center gap-4">
              <div className="flex items-center">
                <div className="w-4 h-4 border border-gray-300 mr-2"></div>
                <span className="text-sm">Disponible</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-amadeus-primary mr-2"></div>
                <span className="text-sm">Seleccionado (tú)</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-500 mr-2"></div>
                <span className="text-sm">Seleccionado (otro pasajero)</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-gray-400 mr-2"></div>
                <span className="text-sm">Ocupado</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 border-2 border-yellow-500 mr-2"></div>
                <span className="text-sm">Primera Clase</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 border-2 border-blue-500 mr-2"></div>
                <span className="text-sm">Business</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded mr-2"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSaveSeats}
            className="bg-amadeus-primary text-white px-4 py-2 rounded flex items-center"
          >
            <FiCheck className="mr-2" />
            Guardar selección
          </button>
        </div>
      </div>
    </div>
  );
}