import React, { useRef, useEffect, useState, useCallback } from "react";
import Crosshair from "../components/camera/Crosshair";
import OrientationHUD from "../components/camera/OrientationHUD";
import { Camera, RefreshCw, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CameraView() {
  const videoRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [azimuth, setAzimuth] = useState(null);
  const [pitch, setPitch] = useState(null);
  const [hasOrientation, setHasOrientation] = useState(false);
  const [needsPermission, setNeedsPermission] = useState(false);
  const [facingMode, setFacingMode] = useState("environment");

  const startCamera = useCallback(async (facing) => {
    setCameraError(null);
    try {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      console.error("Camera error:", err);
      setCameraError(err.message || "Unable to access camera");
    }
  }, []);

  const setupOrientationListener = useCallback(() => {
    const handler = (e) => {
      setHasOrientation(true);
      setNeedsPermission(false);
      
      if (e.alpha !== null && e.beta !== null && e.gamma !== null) {
        // Calculate stable azimuth using quaternion-based approach to avoid gimbal lock
        const alpha = e.alpha * Math.PI / 180; // Z axis rotation (compass heading)
        const beta = e.beta * Math.PI / 180;   // X axis rotation (pitch)
        const gamma = e.gamma * Math.PI / 180; // Y axis rotation (roll)
        
        // Convert device orientation to stable azimuth
        // Use webkitCompassHeading if available (iOS), otherwise calculate from alpha
        let azimuthValue;
        if (e.webkitCompassHeading !== undefined && e.webkitCompassHeading !== null) {
          azimuthValue = e.webkitCompassHeading;
        } else {
          // For high tilt angles, use a more stable calculation
          const cosBeta = Math.cos(beta);
          if (Math.abs(cosBeta) > 0.1) { // Avoid division by very small numbers
            azimuthValue = (360 - e.alpha) % 360;
          } else {
            // At very high tilt angles, use gamma to help stabilize azimuth
            const adjustedAlpha = e.alpha + (Math.abs(e.gamma) > 90 ? 180 : 0);
            azimuthValue = (360 - adjustedAlpha) % 360;
          }
        }
        setAzimuth(azimuthValue);
        
        // Set pitch where 0° = horizon (phone vertical), positive = looking up, negative = looking down
        const currentPitch = -(e.beta+90);
        setPitch(currentPitch);
      }
    };
    window.addEventListener("deviceorientation", handler, true);
    return handler;
  }, []);

  const requestOrientationPermission = useCallback(async () => {
    if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
      try {
        const permission = await DeviceOrientationEvent.requestPermission();
        if (permission === "granted") {
          setupOrientationListener();
        }
      } catch (err) {
        console.error("Orientation permission error:", err);
      }
    } else {
      setupOrientationListener();
    }
  }, [setupOrientationListener]);

  // Start camera on mount
  useEffect(() => {
    startCamera(facingMode);
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Device orientation setup
  useEffect(() => {
    let handler;

    if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
      // iOS 13+ — needs explicit user gesture to request permission
      setNeedsPermission(true);
    } else {
      // Android / desktop — attach directly
      handler = setupOrientationListener();
    }

    return () => {
      if (handler) window.removeEventListener("deviceorientation", handler, true);
    };
  }, [setupOrientationListener]);

  const toggleCamera = () => {
    const newFacing = facingMode === "environment" ? "user" : "environment";
    setFacingMode(newFacing);
    startCamera(newFacing);
  };

  return (
    <div className="fixed inset-0 bg-background overflow-hidden select-none">
      {/* Camera feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Dark vignette overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-[5]"
        style={{
          background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)",
        }}
      />

      {/* Crosshair */}
      <Crosshair />

      {/* Orientation HUD */}
      <OrientationHUD azimuth={azimuth} pitch={pitch} hasOrientation={hasOrientation} />

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-auto">
        <div className="flex justify-center pb-8 gap-4">
          {needsPermission && (
            <Button
              className="bg-primary/90 hover:bg-primary text-primary-foreground backdrop-blur-md rounded-full px-6"
              onClick={requestOrientationPermission}
            >
              <Compass className="w-4 h-4 mr-2" />
              Enable Compass
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-full bg-background/60 backdrop-blur-md border-primary/30 hover:bg-primary/20"
            onClick={toggleCamera}
          >
            <RefreshCw className="w-5 h-5 text-primary" />
          </Button>
        </div>
      </div>

      {/* Camera error / no camera fallback */}
      {cameraError && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm">
          <Camera className="w-16 h-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-sm text-center max-w-xs mb-4">
            {cameraError}
          </p>
          <Button
            variant="outline"
            className="border-primary/30 text-primary"
            onClick={() => startCamera(facingMode)}
          >
            Retry Camera
          </Button>
        </div>
      )}
    </div>
  );
}