// src/components/terminal/Terminal.jsx
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { commandParser } from '../../utils/commandParser';
import TerminalLine from './TerminalLine';
import { FiTerminal } from 'react-icons/fi';

export default function Terminal() {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState([]);
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const { currentUser } = useAuth();
  const inputRef = useRef(null);
  const terminalRef = useRef(null);

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
    }
  };

  // Función para ejecutar un comando
  const executeCommand = async (cmd) => {
    // Agregar el comando al historial de la terminal
    addLine(`> ${cmd}`, 'input');
    
    // Agregar el comando al historial de comandos
    setCommandHistory(prev => [cmd, ...prev.slice(0, 19)]);
    setHistoryIndex(-1);
    
    // Procesar el comando y obtener la respuesta
    try {
      const response = await commandParser(cmd);
      
      // Agregar la respuesta al historial de la terminal
      addLine(response, 'output');
      
      // Guardar el comando en Firestore
      await saveCommandToHistory(cmd, response);
    } catch (error) {
      console.error('Error al ejecutar el comando:', error);
      addLine(`Error: ${error.message}`, 'error');
      await saveCommandToHistory(cmd, `Error: ${error.message}`);
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

  return (
    <div className="flex flex-col w-full h-full">
      <div className="bg-amadeus-dark text-white p-2 flex items-center rounded-t-md">
        <FiTerminal className="mr-2" />
        <span>Terminal Amadeus</span>
      </div>
      
      <div 
        ref={terminalRef}
        className="terminal flex-grow overflow-auto"
      >
        {history.length === 0 ? (
          <div className="text-gray-500 italic">
            Bienvenido a Amadeus Terminal. Ingresa comandos para comenzar.
          </div>
        ) : (
          history.map((line, index) => (
            <TerminalLine key={index} line={line} />
          ))
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="flex mt-2">
        <div className="bg-black text-green-400 font-mono px-2 flex items-center">
          {'>'}
        </div>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-grow bg-black text-green-400 font-mono px-2 outline-none"
          placeholder="Ingrese un comando..."
          autoComplete="off"
          spellCheck="false"
        />
        <button 
          type="submit"
          className="bg-amadeus-primary text-white px-3 py-1 rounded-r"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}