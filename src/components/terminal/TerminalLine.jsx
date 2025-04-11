// src/components/terminal/TerminalLine.jsx
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

export default function TerminalLine({ line }) {
  const { content, type } = line;
  
  // Determinar las clases CSS según el tipo de línea
  const lineClasses = classNames('whitespace-pre-wrap break-all', {
    'text-green-400': type === 'input',
    'text-white': type === 'output',
    'text-red-400': type === 'error'
  });
  
  return (
    <div className={lineClasses}>
      {type === 'input' ? content : content}
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