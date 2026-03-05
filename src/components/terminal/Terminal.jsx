// src/components/terminal/Terminal.jsx
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../services/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { commandParser } from '../../utils/commandParser';
import TerminalLine from './TerminalLine';
import { FiTerminal } from 'react-icons/fi';
import experienceService from '../../services/experienceService';
import SeatmapModal from './SeatmapModal';
import { currentSeatmapRequest } from '../../utils/commandParser/commands/seatmap';

export default function Terminal() {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState([]);
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [terminalSettings, setTerminalSettings] = useState({
    backgroundColor: '#E1E6FC',
    textColor: '#080286',
    inputTextColor: '#080286',
    outputTextColor: '#000000',
    errorTextColor: '#FF0000'
  });
  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: 'light',
    fontSize: 'normal'
  });
  const [behaviorSettings, setBehaviorSettings] = useState({
    autoFocus: true
  });

  // Nuevo estado para modal de seatmap
  const [showSeatmapModal, setShowSeatmapModal] = useState(false);

  const { currentUser } = useAuth();
  const inputRef = useRef(null);
  const terminalRef = useRef(null);
  const welcomeShownRef = useRef(false);
  const sessionStartedRef = useRef(false);

  // Iniciar la sesión de experiencia cuando el usuario inicia sesión
  useEffect(() => {
    if (currentUser && !sessionStartedRef.current) {
      // Iniciar sesión para registrar logros como Night Owl, Early Bird, etc.
      experienceService.startSession(currentUser.uid)
        .then(() => {
          console.log("Sesión de experiencia iniciada");
          sessionStartedRef.current = true;
        })
        .catch(error => {
          console.error("Error al iniciar sesión de experiencia:", error);
        });
    }
  }, [currentUser]);

  // Nuevo efecto para verificar si se debe mostrar el modal de seatmap
  useEffect(() => {
    const checkSeatmapRequest = () => {
      if (currentSeatmapRequest.showModal) {
        setShowSeatmapModal(true);
        // Resetear la solicitud para evitar mostrar el modal varias veces
        currentSeatmapRequest.showModal = false;
      }
    };

    // Verificar cada 500ms si hay una solicitud de seatmap
    const interval = setInterval(checkSeatmapRequest, 500);

    return () => clearInterval(interval);
  }, []);

  // Cargar historial guardado cuando el componente se monta
  useEffect(() => {
    if (currentUser) {
      const savedHistory = localStorage.getItem(`terminal_history_${currentUser.uid}`);
      const savedCommandHistory = localStorage.getItem(`command_history_${currentUser.uid}`);
      const welcomeShown = localStorage.getItem(`welcome_shown_${currentUser.uid}`);

      if (savedHistory) {
        try {
          const parsedHistory = JSON.parse(savedHistory);
          setHistory(parsedHistory);
        } catch (error) {
          console.error('Error al cargar historial guardado:', error);
        }
      }

      if (savedCommandHistory) {
        try {
          const parsedCommandHistory = JSON.parse(savedCommandHistory);
          setCommandHistory(parsedCommandHistory);
        } catch (error) {
          console.error('Error al cargar historial de comandos guardado:', error);
        }
      }

      // Leer el estado de welcomeShown desde localStorage
      if (welcomeShown === 'true') {
        welcomeShownRef.current = true;
      }
    }
  }, [currentUser]);

  // Guardar historial cuando cambia
  useEffect(() => {
    if (currentUser && history.length > 0) {
      localStorage.setItem(`terminal_history_${currentUser.uid}`, JSON.stringify(history));
    }
  }, [history, currentUser]);

  // Guardar historial de comandos cuando cambia
  useEffect(() => {
    if (currentUser && commandHistory.length > 0) {
      localStorage.setItem(`command_history_${currentUser.uid}`, JSON.stringify(commandHistory));
    }
  }, [commandHistory, currentUser]);

  // Cargar configuración del usuario una vez que se autentica
  useEffect(() => {
    async function loadUserSettings() {
      if (!currentUser) return;

      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();

          if (userData.terminalSettings) {
            console.log('Cargando configuración de terminal:', userData.terminalSettings);
            // Asegurar que todos los valores requeridos estén presentes
            const settings = {
              backgroundColor: userData.terminalSettings.backgroundColor || '#E1E6FC',
              textColor: userData.terminalSettings.textColor || '#080286',
              inputTextColor: userData.terminalSettings.inputTextColor || '#080286',
              outputTextColor: userData.terminalSettings.outputTextColor || '#000000',
              errorTextColor: userData.terminalSettings.errorTextColor || '#FF0000'
            };
            setTerminalSettings(settings);
          }
          if (userData.appearanceSettings) {
            setAppearanceSettings({
              theme: userData.appearanceSettings.theme || 'light',
              fontSize: userData.appearanceSettings.fontSize || 'normal'
            });
          }
          if (userData.behaviorSettings) {
            setBehaviorSettings({
              autoFocus: userData.behaviorSettings.autoFocus !== undefined ? userData.behaviorSettings.autoFocus : true
            });
          }
        }
      } catch (error) {
        console.error('Error al cargar configuración de terminal:', error);
        // Silenciar error - usar los valores por defecto
      }
    }

    loadUserSettings();
  }, [currentUser]);

  // Mostrar mensaje de bienvenida solo una vez
  useEffect(() => {
    if (!welcomeShownRef.current) {
      addLine("Bienvenido a Mozart Terminal. Ingresa 'HELP' o 'HE' para ver los comandos disponibles.", 'output');
      welcomeShownRef.current = true;

      // Guardar en localStorage que se ha mostrado el mensaje de bienvenida
      if (currentUser) {
        localStorage.setItem(`welcome_shown_${currentUser.uid}`, 'true');
      }
    }
  }, [currentUser]);

  // Foco automático en el input cuando el componente se monta
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Scroll hacia abajo cuando se actualiza el historial
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  // Función para añadir una línea al historial
  const addLine = (content, type = 'input') => {
    setHistory(prev => [...prev, { content, type, timestamp: new Date() }]);
  };

  // Función para guardar el comando en Firestore
  const saveCommandToHistory = async (command, response) => {
    try {
      await addDoc(collection(db, 'commandHistory'), {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        command,
        response: response || '',
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error al guardar el comando:', error);
      // No mostramos este error al usuario, solo lo registramos en la consola
    }
  };

  // Modificar la función executeCommand para manejar errores de permisos
  const executeCommand = async (cmd) => {
    // Agregar el comando al historial de la terminal
    addLine(cmd, 'input');

    // Agregar el comando al historial de comandos
    setCommandHistory(prev => [cmd, ...prev.slice(0, 19)]);
    setHistoryIndex(-1);

    // Asegurar que la sesión de experiencia esté iniciada
    if (currentUser && !sessionStartedRef.current) {
      try {
        await experienceService.startSession(currentUser.uid);
        sessionStartedRef.current = true;
      } catch (error) {
        console.error("Error al reiniciar sesión de experiencia:", error);
      }
    }

    // Procesar el comando y obtener la respuesta
    try {
      // Pasar el ID del usuario actual al parser de comandos
      const response = await commandParser(cmd, currentUser?.uid);

      // Agregar la respuesta al historial de la terminal
      addLine(response, 'output');

      // Guardar el comando en Firestore (si falla, ya tenemos un try/catch)
      try {
        if (currentUser) {
          await saveCommandToHistory(cmd, response);
        }
      } catch {
        // Error silencioso - ya lo registramos en saveCommandToHistory
      }
    } catch (error) {
      console.error('Error al ejecutar el comando:', error);

      // Mensaje de error más amigable para el usuario
      let errorMessage = `Error: ${error.message}`;

      // Detectar errores específicos
      if (error.message && error.message.includes("Missing or insufficient permissions")) {
        errorMessage = "Error: No tienes permisos suficientes para ejecutar este comando. Los administradores han sido notificados.";
      } else if (error.message && error.message.includes("Failed to get document")) {
        errorMessage = "Error: No se pudo obtener la información solicitada. Por favor, inténtalo más tarde.";
      }

      addLine(errorMessage, 'error');
      try {
        if (currentUser) {
          await saveCommandToHistory(cmd, errorMessage);
        }
      } catch {
        // Error silencioso
      }
    }
  };

  // Manejar el envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!input.trim()) return;

    executeCommand(input.trim());
    setInput('');
  };

  // Manejar las teclas de flecha arriba y abajo para navegar por el historial de comandos
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
      }
    }
  };

  // Aplicar estilos personalizados
  const terminalStyle = {
    backgroundColor: terminalSettings.backgroundColor,
    color: terminalSettings.textColor
  };

  // Determinar la clase de tamaño de fuente
  let fontSizeClass = "text-sm";
  if (appearanceSettings.fontSize === 'small') fontSizeClass = "text-xs";
  if (appearanceSettings.fontSize === 'large') fontSizeClass = "text-base";

  return (
    <div className="flex flex-col w-full h-full">
      <div className="bg-amadeus-dark text-white p-2 flex items-center rounded-t-md">
        <FiTerminal className="mr-2" />
        <span>Terminal Mozart</span>
      </div>

      <div
        ref={terminalRef}
        className={`flex-grow overflow-auto p-3 font-mono cursor-text ${fontSizeClass}`}
        style={terminalStyle}
        onClick={() => {
          if (behaviorSettings.autoFocus) {
            inputRef.current?.focus();
          }
        }}
      >
        {history.map((line, index) => (
          <TerminalLine
            key={index}
            line={line}
            colors={{
              input: terminalSettings.inputTextColor,
              output: terminalSettings.outputTextColor,
              error: terminalSettings.errorTextColor
            }}
          />
        ))}

        {/* Input integrado en la terminal */}
        <div className="flex items-center mt-1">
          <span className="mr-2" style={{ color: terminalSettings.inputTextColor }}>{'>'}</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSubmit(e);
              } else {
                handleKeyDown(e);
              }
            }}
            className="flex-grow bg-transparent outline-none"
            style={{ color: terminalSettings.inputTextColor }}
            autoComplete="off"
            spellCheck="false"
            autoFocus={behaviorSettings.autoFocus}
            onBlur={() => {
              if (behaviorSettings.autoFocus) {
                // Focus lock for immersive mode, allowing a tiny gap to click other UI elements
                setTimeout(() => {
                  if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'BUTTON') {
                    inputRef.current?.focus();
                  }
                }, 100);
              }
            }}
          />
        </div>
      </div>
      {/* Modal de selección de asientos */}
      <SeatmapModal
        isOpen={showSeatmapModal}
        onClose={() => setShowSeatmapModal(false)}
        addTerminalResponse={addLine}
      />
    </div>
  );
}