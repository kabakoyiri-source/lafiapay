// ============================================================================
// LafiaPay — QR Scanner Component
// Real camera-based QR code scanner using html5-qrcode.
// Falls back to "Simulate Scan" button when camera is unavailable.
// ============================================================================

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Camera, CameraOff, Zap } from 'lucide-react';

interface QRScannerProps {
  /** Called when a QR code is successfully decoded */
  onScan: (data: string) => void;
  /** Optional: simulated scan data for demo fallback */
  simulatedData?: string;
  /** Optional: label for the simulate button */
  simulateLabel?: string;
  /** Optional: whether to show the simulate button */
  showSimulate?: boolean;
}

export default function QRScanner({
  onScan,
  simulatedData,
  simulateLabel = 'Simuler un scan QR',
  showSimulate = true,
}: QRScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<any>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const hasScannedRef = useRef(false);

  const stopScanner = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        const state = html5QrCodeRef.current.getState();
        if (state === 2) { // SCANNING
          await html5QrCodeRef.current.stop();
        }
      } catch {
        // ignore cleanup errors
      }
      html5QrCodeRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const startScanner = useCallback(async () => {
    if (isStarting || html5QrCodeRef.current) return;
    setIsStarting(true);
    setCameraError(null);
    hasScannedRef.current = false;

    try {
      // Dynamic import to avoid SSR issues
      const { Html5Qrcode } = await import('html5-qrcode');

      const scannerId = 'lafiapay-qr-scanner';
      
      // Ensure the container element exists
      if (!scannerRef.current) {
        setIsStarting(false);
        return;
      }

      // Create or find the scanner element
      let scannerElement = document.getElementById(scannerId);
      if (!scannerElement) {
        scannerElement = document.createElement('div');
        scannerElement.id = scannerId;
        scannerRef.current.appendChild(scannerElement);
      }

      const html5QrCode = new Html5Qrcode(scannerId);
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 220, height: 220 },
          aspectRatio: 1.0,
        },
        (decodedText: string) => {
          if (!hasScannedRef.current) {
            hasScannedRef.current = true;
            // Vibrate on successful scan
            if (navigator.vibrate) {
              navigator.vibrate(100);
            }
            onScan(decodedText);
            stopScanner();
          }
        },
        () => {
          // QR code not detected — silently ignored
        }
      );

      setCameraActive(true);
    } catch (err: any) {
      console.warn('Camera error:', err);
      setCameraError(
        err?.message?.includes('NotAllowed') || err?.message?.includes('Permission')
          ? 'Accès à la caméra refusé. Autorisez la caméra dans les paramètres de votre navigateur.'
          : 'Caméra non disponible. Utilisez la simulation de scan ci-dessous.'
      );
    } finally {
      setIsStarting(false);
    }
  }, [isStarting, onScan, stopScanner]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  const handleSimulate = () => {
    if (simulatedData) {
      if (navigator.vibrate) navigator.vibrate(100);
      onScan(simulatedData);
    }
  };

  return (
    <div>
      {/* Scanner viewport */}
      <div
        style={{
          background: '#111',
          borderRadius: 'var(--radius-2xl)',
          overflow: 'hidden',
          marginBottom: '1rem',
          position: 'relative',
          minHeight: cameraActive ? 300 : 200,
        }}
      >
        {/* Camera feed container */}
        <div ref={scannerRef} style={{ width: '100%' }}>
          {!cameraActive && !cameraError && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2rem',
              minHeight: 200,
            }}>
              {/* Animated viewfinder */}
              <div className="qr-viewfinder" style={{ margin: '0 auto', position: 'relative' }}>
                <div className="qr-scan-line" />
                <div style={{
                  position: 'absolute', bottom: 0, left: 0,
                  width: 40, height: 40,
                  borderLeft: '3px solid var(--color-primary-500)',
                  borderBottom: '3px solid var(--color-primary-500)',
                  borderBottomLeftRadius: 8,
                }} />
                <div style={{
                  position: 'absolute', bottom: 0, right: 0,
                  width: 40, height: 40,
                  borderRight: '3px solid var(--color-primary-500)',
                  borderBottom: '3px solid var(--color-primary-500)',
                  borderBottomRightRadius: 8,
                }} />
              </div>
              <p style={{
                color: 'rgba(255,255,255,0.6)',
                textAlign: 'center',
                fontSize: '0.8125rem',
                marginTop: '1rem',
              }}>
                Pointez vers un QR code LafiaPay
              </p>
            </div>
          )}
        </div>

        {/* Camera error message */}
        {cameraError && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            minHeight: 200,
          }}>
            <CameraOff size={40} style={{ color: 'rgba(255,255,255,0.3)', marginBottom: '0.75rem' }} />
            <p style={{
              color: 'rgba(255,255,255,0.6)',
              textAlign: 'center',
              fontSize: '0.8125rem',
              maxWidth: '280px',
            }}>
              {cameraError}
            </p>
          </div>
        )}

        {/* Camera active indicator */}
        {cameraActive && (
          <div style={{
            position: 'absolute',
            top: '0.75rem',
            right: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            background: 'rgba(0,0,0,0.6)',
            borderRadius: 'var(--radius-full)',
            padding: '0.375rem 0.75rem',
            zIndex: 10,
          }}>
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#EF4444',
              }}
            />
            <span style={{ color: 'white', fontSize: '0.6875rem', fontWeight: 600 }}>
              Scan actif
            </span>
          </div>
        )}
      </div>

      {/* Camera toggle button */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        className="btn btn-primary btn-lg"
        style={{ width: '100%', marginBottom: '0.75rem' }}
        onClick={cameraActive ? stopScanner : startScanner}
        disabled={isStarting}
      >
        {isStarting ? (
          <span className="animate-pulse-soft">Activation de la caméra...</span>
        ) : cameraActive ? (
          <><CameraOff size={20} /> Arrêter la caméra</>
        ) : (
          <><Camera size={20} /> Activer la caméra pour scanner</>
        )}
      </motion.button>

      {/* Simulate fallback */}
      {showSimulate && simulatedData && (
        <>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '0.75rem',
          }}>
            <div style={{ flex: 1, height: 1, background: 'var(--color-surface-200)' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--color-surface-400)', fontWeight: 600 }}>OU</span>
            <div style={{ flex: 1, height: 1, background: 'var(--color-surface-200)' }} />
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            className="btn btn-secondary btn-lg"
            style={{
              width: '100%',
              border: '1.5px dashed var(--color-accent-400)',
              background: 'var(--color-accent-50)',
              color: 'var(--color-accent-800)',
            }}
            onClick={handleSimulate}
          >
            <Zap size={18} style={{ color: 'var(--color-accent-600)' }} />
            {simulateLabel}
          </motion.button>
        </>
      )}
    </div>
  );
}
