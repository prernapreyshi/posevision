import { Box, Button, VStack, Text, Badge } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { Holistic } from "@mediapipe/holistic";
import { Camera } from "@mediapipe/camera_utils";

function WebcamView() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraRef = useRef(null);

  const [isCameraOn, setIsCameraOn] = useState(false);
  const [posture, setPosture] = useState("Analyzing...");
  const [score, setScore] = useState(0);
  const [gesture, setGesture] = useState("No hand");

  // ---------------- ANGLE CALCULATION ----------------
  const calculateAngle = (a, b, c) => {
    const radians =
      Math.atan2(c.y - b.y, c.x - b.x) -
      Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs((radians * 180) / Math.PI);
    if (angle > 180) angle = 360 - angle;
    return angle;
  };

  // ---------------- HAND GESTURE ----------------
  const detectGesture = (hand) => {
    if (!hand) return "No hand";

    const wrist = hand[0];
    const thumbTip = hand[4];
    const indexTip = hand[8];
    const middleTip = hand[12];

    if (
      thumbTip.y < wrist.y &&
      indexTip.y > wrist.y &&
      middleTip.y > wrist.y
    ) {
      return "👍 Thumbs Up";
    }

    if (indexTip.y < wrist.y && middleTip.y < wrist.y) {
      return "✋ Open Palm";
    }

    return "Unknown gesture";
  };

  // ---------------- MEDIAPIPE INIT ----------------
  useEffect(() => {
    const holistic = new Holistic({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`,
    });

    holistic.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      refineFaceLandmarks: true,
    });

    holistic.onResults((results) => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const drawPoints = (landmarks, color, size = 2) => {
        if (!landmarks) return;
        landmarks.forEach((p) => {
          ctx.beginPath();
          ctx.arc(
            p.x * canvas.width,
            p.y * canvas.height,
            size,
            0,
            2 * Math.PI
          );
          ctx.fillStyle = color;
          ctx.fill();
        });
      };

      // Draw landmarks
      drawPoints(results.faceLandmarks, "yellow", 1.5);
      drawPoints(results.leftHandLandmarks, "cyan", 3);
      drawPoints(results.rightHandLandmarks, "cyan", 3);
      drawPoints(results.poseLandmarks, "red", 3);

      // -------- POSTURE ANALYSIS --------
      if (results.poseLandmarks) {
        const nose = results.poseLandmarks[0];
        const shoulder = results.poseLandmarks[11];
        const hip = results.poseLandmarks[23];

        const neckAngle = calculateAngle(nose, shoulder, hip);
        const postureScore = Math.min(100, Math.max(0, neckAngle * 2));

        setScore(Math.round(postureScore));

        if (neckAngle < 40) {
          setPosture("❌ Bad posture: straighten your neck");
        } else {
          setPosture("✅ Good posture");
        }
      }

      // -------- HAND GESTURE --------
      if (results.rightHandLandmarks) {
        setGesture(detectGesture(results.rightHandLandmarks));
      } else {
        setGesture("No hand");
      }
    });

    cameraRef.current = new Camera(videoRef.current, {
      onFrame: async () => {
        await holistic.send({ image: videoRef.current });
      },
      width: 640,
      height: 480,
    });
  }, []);

  // ---------------- CAMERA ----------------
  const startCamera = () => {
    cameraRef.current.start();
    setIsCameraOn(true);
  };

  const stopCamera = () => {
    cameraRef.current.stop();
    setIsCameraOn(false);
    setPosture("Analyzing...");
    setScore(0);
    setGesture("No hand");
  };

  // ---------------- UI ----------------
  return (
    <VStack spacing={4}>
      <Box position="relative" w="640px" h="480px">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          style={{
            width: "640px",
            height: "480px",
            position: "absolute",
            transform: "scaleX(-1)",
          }}
        />
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            transform: "scaleX(-1)",
          }}
        />
      </Box>

      {!isCameraOn ? (
        <Button onClick={startCamera} colorScheme="teal">
          Start Camera
        </Button>
      ) : (
        <Button onClick={stopCamera} colorScheme="red">
          Stop Camera
        </Button>
      )}

      <Badge
        colorScheme={posture.includes("Good") ? "green" : "red"}
        px={4}
        py={2}
      >
        {posture}
      </Badge>

      <Text fontWeight="bold">Posture Score: {score}/100</Text>
      <Text fontSize="lg">Gesture: {gesture}</Text>

      <Text fontSize="sm" color="gray.500">
        MediaPipe Holistic — posture + gesture analysis
      </Text>
    </VStack>
  );
}

export default WebcamView;
