// src/components/terminal/TerminalLine.jsx
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useAuth } from '../../contexts/AuthContext';

export default function TerminalLine({ line }) {
  const { content, type } = line;
  const { currentUser } = useAuth();
  
  // Colores predeterminados
  const defaultColors = {
    input: '#080286',    // Azul
    output: '#000000',   // Negro
    error: '#FF0000'     // Rojo
  };
  
  // Obtener los colores personalizados del usuario si existen
  const userSettings = currentUser?.terminalSettings || {};
  
  // Determinar el color según el tipo de línea y las preferencias del usuario
  const getColor = () => {
    switch (type) {
      case 'input':
        return userSettings.inputTextColor || defaultColors.input;
      case 'output':
        return userSettings.outputTextColor || defaultColors.output;
      case 'error':
        return userSettings.errorTextColor || defaultColors.error;
      default:
        return 'white';
    }
  };
  
  // Estilo inline para el color del texto
  const lineStyle = {
    color: getColor(),
  };
  
  return (
    <div className="whitespace-pre-wrap break-all" style={lineStyle}>
      {type === 'input' ? `> ${content}` : content}
    </div>
  );
}

TerminalLine.propTypes = {
  line: PropTypes.shape({
    content: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['input', 'output', 'error']).isRequired,
    timestamp: PropTypes.instanceOf(Date)
  }).isRequired
};