// src/components/profile/GravatarEditor.jsx
import { useState, useEffect, useCallback } from 'react';
import { FiEdit, FiExternalLink } from 'react-icons/fi';
import md5 from 'blueimp-md5';
import toast from 'react-hot-toast';

/**
 * GravatarEditor Component
 * Renders an editable Gravatar image with fallback to direct Gravatar link
 * 
 * @param {Object} props
 * @param {Object} props.user - User object with email
 * @param {number} props.size - Size of the Gravatar image
 * @param {Function} props.onUpdate - Callback when Gravatar is updated
 */
export default function GravatarEditor({ user, size = 128, onUpdate }) {
  const [showModal, setShowModal] = useState(false);
  const [scriptLoadAttempted, setScriptLoadAttempted] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  
  // Generate user email hash for Gravatar
  const emailHash = user?.email ? md5(user.email.trim().toLowerCase()) : '0';
  
  // Function to load Gravatar Quick Editor script
  const loadGravatarScript = useCallback(() => {
    // Check if script is already loaded
    if (document.querySelector('script[src*="gravatar.com/js/quick-editor.js"]')) {
      setScriptLoaded(true);
      return true;
    }
    
    if (scriptLoadAttempted) {
      return false;
    }
    
    try {
      const script = document.createElement('script');
      script.src = "https://gravatar.com/js/quick-editor.js";
      script.async = true;
      script.id = "gravatar-quick-editor-script";
      
      // Handle script loading events
      script.onload = () => {
        setScriptLoaded(true);
        console.log("Gravatar Quick Editor loaded successfully");
      };
      
      script.onerror = (error) => {
        console.error("Failed to load Gravatar Quick Editor", error);
        setScriptLoaded(false);
      };
      
      document.body.appendChild(script);
      setScriptLoadAttempted(true);
      return true;
    } catch (error) {
      console.error("Error loading Gravatar script:", error);
      setScriptLoadAttempted(true);
      return false;
    }
    }, [scriptLoadAttempted]);
  
  // Initialize Gravatar Quick Editor when showing the modal
  useEffect(() => {
    if (showModal && !scriptLoaded && user?.email) {
      // Try to load the script
      const scriptLoaded = loadGravatarScript();
      
      // Set up callback if the script loaded successfully
      if (scriptLoaded && window.gravatarQuickEditor) {
        window.gravatarQuickEditor.onSuccess = () => {
          console.log("Gravatar updated successfully!");
          setShowModal(false);
          
          // Force refresh the gravatar image
          if (onUpdate && typeof onUpdate === 'function') {
            onUpdate();
          }
        };
      }
    }
    
    // Cleanup function
    return () => {
      // Reset global callback if component unmounts
      if (window.gravatarQuickEditor) {
        window.gravatarQuickEditor.onSuccess = null;
      }
    };
  }, [showModal, scriptLoaded, scriptLoadAttempted, user, onUpdate, loadGravatarScript]);
  
  // Generate Gravatar URL with cache busting
  const gravatarUrl = `https://www.gravatar.com/avatar/${emailHash}?d=identicon&s=${size}`;
  
  // Open Gravatar profile directly
  const openGravatarProfile = () => {
    const gravatarProfileUrl = `https://gravatar.com/${emailHash}`;
    window.open(gravatarProfileUrl, '_blank', 'noopener,noreferrer');
    toast.success('Abriendo Gravatar en una nueva pestaña');
  };
  
  // Toggle modal
  const handleEdit = () => {
    if (scriptLoaded || !scriptLoadAttempted) {
      setShowModal(!showModal);
    } else {
      // If script failed to load, open Gravatar profile directly
      openGravatarProfile();
    }
  };
  
  return (
    <div className="gravatar-container relative">
      {/* Display current Gravatar */}
      <img
        src={gravatarUrl}
        alt="User avatar"
        className="h-24 w-24 rounded-full border-2 border-amadeus-primary shadow"
      />
      
      {/* Edit button overlay */}
      <button
        className="absolute bottom-0 right-0 bg-amadeus-primary text-white p-1 rounded-full shadow hover:bg-amadeus-secondary"
        onClick={handleEdit}
        title="Edit your Gravatar"
      >
        <FiEdit size={16} />
      </button>
      
      {/* Gravatar Quick Editor modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg max-w-xl w-full">
            <h3 className="text-lg font-medium mb-4">Edit your Gravatar</h3>
            
            {scriptLoaded ? (
              // Gravatar Editor container
              <div 
                className="gravatar-editor" 
                data-gravatar-email={user?.email}
                data-gravatar-size="200"
                data-gravatar-rating="g"
                data-gravatar-default="identicon"
              ></div>
            ) : (
              // Fallback if script failed to load
              <div className="text-center py-6">
                <p className="text-gray-600 mb-4">
                  Si el editor no aparece, puedes editar tu Gravatar directamente en el sitio web oficial de Gravatar.
                </p>
                <button
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={openGravatarProfile}
                >
                  <FiExternalLink className="mr-2" />
                  Abrir Gravatar en una nueva pestaña
                </button>
              </div>
            )}
            
            <div className="mt-4 text-center">
              <button
                className="mx-auto bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
                onClick={() => setShowModal(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}