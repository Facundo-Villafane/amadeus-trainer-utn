// src/components/terminal/TerminalLine.jsx
import React from 'react';
import PropTypes from 'prop-types';

export default function TerminalLine({ line, colors }) {
  const { content, type } = line;
  
  // Colores predeterminados si no se proporcionan
  const defaultColors = {
    input: '#080286',    // Azul
    output: '#000000',   // Negro
    error: '#FF0000'     // Rojo
  };
  
  // Combinar colores proporcionados con predeterminados
  const finalColors = { ...defaultColors, ...colors };
  
  // Determinar el color según el tipo de línea
  const getColor = () => {
    switch (type) {
      case 'input':
        return finalColors.input;
      case 'output':
        return finalColors.output;
      case 'error':
        return finalColors.error;
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
  }).isRequired,
  colors: PropTypes.shape({
    input: PropTypes.string,
    output: PropTypes.string,
    error: PropTypes.string
  })
};

TerminalLine.defaultProps = {
  colors: {
    input: '#080286',    // Azul
    output: '#000000',   // Negro
    error: '#FF0000'     // Rojo
  }
};