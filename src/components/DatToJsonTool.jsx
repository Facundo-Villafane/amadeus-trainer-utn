import React, { useState, useEffect } from 'react';
import { convertDatToJson } from '../utils/datToJsonConverter';

const DatToJsonTool = () => {
  const [datFile, setDatFile] = useState(null);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionResult, setConversionResult] = useState(null);
  const [error, setError] = useState(null);
  const [isSaved, setIsSaved] = useState(false);

  // Process the uploaded DAT file
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setDatFile(file);
      setError(null);
      setConversionResult(null);
      setIsSaved(false);
    }
  };

  // Convert the DAT file to JSON
  const handleConvert = async () => {
    if (!datFile) {
      setError('Please select a DAT file first.');
      return;
    }

    setIsConverting(true);
    setError(null);
    
    try {
      // Read the file as text
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target.result;
          const data = convertDatToJson(content);
          setConversionResult(data);
          setIsConverting(false);
        } catch (err) {
          setError(`Error converting data: ${err.message}`);
          setIsConverting(false);
        }
      };
      reader.onerror = () => {
        setError('Error reading file');
        setIsConverting(false);
      };
      reader.readAsText(datFile);
    } catch (err) {
      setError(`Error processing file: ${err.message}`);
      setIsConverting(false);
    }
  };

  // Save the converted data to localStorage
  const handleSave = () => {
    if (!conversionResult) return;
    
    try {
      // Store the full data
      localStorage.setItem('airportsData', JSON.stringify(conversionResult));
      
      // Also store a smaller airports-only version if needed
      localStorage.setItem('airportsOnly', JSON.stringify({
        airports: conversionResult.airports,
        count: conversionResult.airports.length
      }));
      
      setIsSaved(true);
      console.log('Airport data saved to localStorage');
    } catch (err) {
      setError(`Error saving to localStorage: ${err.message}`);
    }
  };

  // Download the JSON as a file
  const handleDownload = () => {
    if (!conversionResult) return;
    
    const jsonString = JSON.stringify(conversionResult, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'airports-data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">DAT to JSON Converter</h2>
      
      <div className="mb-6">
        <label className="block text-gray-700 mb-2">Select your airports.dat file:</label>
        <input
          type="file"
          accept=".dat,.txt,.csv"
          onChange={handleFileChange}
          className="w-full p-2 border border-gray-300 rounded"
        />
      </div>
      
      <div className="flex gap-4 mb-6">
        <button
          onClick={handleConvert}
          disabled={!datFile || isConverting}
          className={`px-4 py-2 rounded font-semibold text-white ${
            !datFile || isConverting 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isConverting ? 'Converting...' : 'Convert to JSON'}
        </button>
        
        {conversionResult && (
          <>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded"
            >
              Save to LocalStorage
            </button>
            
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded"
            >
              Download JSON
            </button>
          </>
        )}
      </div>
      
      {error && (
        <div className="p-3 mb-4 bg-red-100 text-red-700 rounded-md border border-red-300">
          {error}
        </div>
      )}
      
      {isSaved && (
        <div className="p-3 mb-4 bg-green-100 text-green-700 rounded-md border border-green-300">
          Successfully saved to localStorage! The data will be available to the application now.
        </div>
      )}
      
      {conversionResult && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2 text-gray-700">Conversion Results:</h3>
          <div className="bg-gray-100 p-3 rounded-md">
            <div className="mb-1">Total Airports: <span className="font-semibold">{conversionResult.airports?.length || 0}</span></div>
            <div className="mb-1">Total Cities: <span className="font-semibold">{conversionResult.cities?.length || 0}</span></div>
            <div>File Size: <span className="font-semibold">{Math.round(JSON.stringify(conversionResult).length / 1024)} KB</span></div>
          </div>
        </div>
      )}
      
      {conversionResult && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2 text-gray-700">Sample Data:</h3>
          <div className="bg-gray-100 p-3 rounded-md overflow-auto max-h-80">
            <pre className="text-xs">{JSON.stringify(
              {
                metadata: conversionResult.metadata,
                sampleAirports: conversionResult.airports.slice(0, 3),
                sampleCities: conversionResult.cities?.slice(0, 3) || []
              }, 
              null, 2
            )}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatToJsonTool;