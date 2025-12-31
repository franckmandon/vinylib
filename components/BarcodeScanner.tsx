"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface BarcodeScannerProps {
  onScanSuccess: (ean: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({
  onScanSuccess,
  onClose,
}: BarcodeScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [cameraId, setCameraId] = useState<string | null>(null);

  useEffect(() => {
    // Wait for DOM to be ready before starting scanner
    const timer = setTimeout(() => {
      // Double check that element exists
      const element = document.getElementById("barcode-scanner");
      if (element) {
        startScanning();
      } else {
        console.error("Barcode scanner element not found in DOM");
        setError("Erreur: élément scanner introuvable. Veuillez réessayer.");
      }
    }, 300); // Increased delay to ensure DOM is ready
    
    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .then(() => {
            scannerRef.current?.clear();
          })
          .catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startScanning = async () => {
    try {
      setError(null);
      
      // Check if we're on HTTPS or localhost (required for camera access on iOS)
      const isSecureContext = window.isSecureContext || window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      if (!isSecureContext) {
        setError("⚠️ HTTPS requis pour la caméra sur iOS. La caméra ne fonctionne qu'en HTTPS. Pour tester depuis votre iPhone, utilisez un service de tunnel HTTPS (comme ngrok) ou accédez via localhost sur votre ordinateur.");
        return;
      }
      
      // Check if the element exists
      const element = document.getElementById("barcode-scanner");
      if (!element) {
        setError("Scanner element not found. Please try again.");
        return;
      }

      const scanner = new Html5Qrcode("barcode-scanner");
      scannerRef.current = scanner;

      // Get available cameras
      let devices;
      try {
        devices = await Html5Qrcode.getCameras();
      } catch (err: any) {
        console.error("Error getting cameras:", err);
        const errorMessage = err.message || err.toString();
        
        // Messages d'erreur spécifiques en français
        if (errorMessage.includes("NotAllowedError") || errorMessage.includes("permission")) {
          setError("❌ Permission caméra refusée. Veuillez autoriser l'accès à la caméra dans les paramètres de Safari et réessayer.");
        } else if (errorMessage.includes("NotFoundError") || errorMessage.includes("no camera")) {
          setError("❌ Aucune caméra trouvée. Assurez-vous que votre appareil possède une caméra.");
        } else if (errorMessage.includes("NotReadableError") || errorMessage.includes("already in use")) {
          setError("❌ La caméra est déjà utilisée par une autre application. Fermez les autres apps utilisant la caméra.");
        } else if (!isSecureContext) {
          setError("⚠️ HTTPS requis. Les navigateurs mobiles nécessitent une connexion sécurisée (HTTPS) pour accéder à la caméra.");
        } else {
          setError(`❌ Échec d'accès à la caméra: ${errorMessage}. Vérifiez les permissions et réessayez.`);
        }
        return;
      }

      if (devices.length === 0) {
        setError("No cameras found. Please ensure your device has a camera.");
        return;
      }

      // Use the first available camera (or prefer back camera on mobile)
      const preferredCamera = devices.find((d) => d.label.toLowerCase().includes("back")) || devices[0];
      setCameraId(preferredCamera.id);

      await scanner.start(
        preferredCamera.id,
        {
          fps: 10,
          qrbox: function(viewfinderWidth, viewfinderHeight) {
            // Rectangle horizontal pour codes-barres (plus large que haut)
            const minEdgePercentage = 0.7; // 70% de la largeur
            const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
            const qrboxSize = Math.floor(minEdgeSize * minEdgePercentage);
            const width = qrboxSize;
            const height = Math.floor(qrboxSize * 0.6); // Ratio 5:3 pour codes-barres
            return {
              width: width,
              height: height
            };
          },
          // Configuration optimisée pour iOS et codes EAN-13
          aspectRatio: 1.777778, // 16:9 pour mieux voir les codes-barres horizontaux
          disableFlip: false,
        },
        (decodedText) => {
          // Successfully scanned a barcode
          console.log("Barcode scanned:", decodedText);
          scanner.stop().then(() => {
            scanner.clear();
            scannerRef.current = null;
            setScanning(false);
            onScanSuccess(decodedText);
          }).catch((err) => {
            console.error("Error stopping scanner:", err);
            scannerRef.current = null;
            setScanning(false);
            onScanSuccess(decodedText);
          });
        },
        (errorMessage) => {
          // Log all errors for debugging
          // Ignore "NotFoundException" which is normal while scanning
          if (!errorMessage.includes("NotFoundException") && !errorMessage.includes("No MultiFormat Readers")) {
            console.debug("Scanning error:", errorMessage);
          }
        }
      );

      setScanning(true);
    } catch (err: any) {
      console.error("Error starting scanner:", err);
      setError(err.message || "Failed to start camera. Please check permissions.");
      setScanning(false);
      
      // Clean up on error
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
        } catch (clearErr) {
          console.error("Error clearing scanner:", clearErr);
        }
        scannerRef.current = null;
      }
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        scannerRef.current = null;
        setScanning(false);
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
  };

  const handleClose = async () => {
    await stopScanning();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-[100]">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Scan Barcode
            </h2>
            <button
              onClick={handleClose}
              className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="mb-4 relative">
            <div
              id="barcode-scanner"
              className="w-full rounded-lg overflow-hidden bg-slate-900"
              style={{ minHeight: "300px", width: "100%" }}
            />
            {scanning && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-2 border-blue-500 rounded-lg" style={{ width: "250px", height: "250px" }}>
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-blue-500"></div>
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-blue-500"></div>
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-blue-500"></div>
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-blue-500"></div>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 rounded text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            {!scanning ? (
              <button
                onClick={startScanning}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Start Scanning
              </button>
            ) : (
              <button
                onClick={stopScanning}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Stop Scanning
              </button>
            )}
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500 text-slate-900 dark:text-slate-100 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>

          <p className="mt-4 text-xs text-slate-600 dark:text-slate-400 text-center">
            Positionnez le code-barres dans le cadre. Le scanner détectera automatiquement les codes EAN-13, EAN-8, UPC-A et UPC-E.
          </p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-500 text-center">
            💡 Astuce: Assurez-vous d&apos;avoir un bon éclairage et maintenez le code-barres stable.
          </p>
          {!window.isSecureContext && window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && (
            <div className="mt-2 p-2 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-700 rounded text-yellow-700 dark:text-yellow-300 text-xs text-center">
              ⚠️ La caméra ne fonctionne pas en HTTP. Utilisez HTTPS ou localhost pour accéder à la caméra depuis votre iPhone.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

