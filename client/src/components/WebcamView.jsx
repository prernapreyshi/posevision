import { Box, Button, VStack, Text, Badge } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { Holistic } from "@mediapipe/holistic";
import { Camera } from "@mediapipe/camera_utils";

function WebcamView() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraRef = useRef(null);

  const [cameraOn, setCameraOn] = useState(false);
  const [poseName, setPoseName] = useState("Detecting...");
  const [feedback, setFeedback] = useState("");

  // ---------- ANGLE UTILITY ----------
  const calculateAngle = (a, b, c) => {
    const radians =
      Math.atan2(c.y - b.y, c.x - b.x) -
      Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs((radians * 180) / Math.PI);
    if (angle > 180) angle = 360 - angle;
    return angle;
  };

  // ---------- HELPER ----------
  const isLevel = (p1, p2, tol = 0.05) =>
    Math.abs(p1.y - p2.y) < tol;

  // ---------- POSE DETECTION ----------
  const detectTPose = (lm) => {
    return (
      isLevel(lm[11], lm[15]) &&
      isLevel(lm[12], lm[16])
    );
  };

  const detectWarriorII = (lm) => {
    const kneeAngle = calculateAngle(lm[23], lm[25], lm[27]);
    return (
      isLevel(lm[11], lm[15]) &&
      isLevel(lm[12], lm[16]) &&
      kneeAngle > 70 &&
      kneeAngle < 110
    );
  };

  const detectTreePose = (lm) => {
    return Math.abs(lm[27].y - lm[28].y) > 0.15;
  };

  // ---------- MEDIAPIPE INIT ----------
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

      const draw = (landmarks, color, size = 3) => {
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

      draw(results.faceLandmarks, "yellow", 1.5);
      draw(results.leftHandLandmarks, "cyan", 3);
      draw(results.rightHandLandmarks, "cyan", 3);
      draw(results.poseLandmarks, "red", 3);

      // ---------- YOGA LOGIC ----------
      const lm = results.poseLandmarks;
      if (!lm) return;

      if (detectWarriorII(lm)) {
        setPoseName("⚔️ Warrior II");
        setFeedback("Arms strong, front knee bent — great form!");
      } else if (detectTreePose(lm)) {
        setPoseName("🌳 Tree Pose");
        setFeedback("Balance steady — focus on breathing");
      } else if (detectTPose(lm)) {
        setPoseName("🧍 T-Pose");
        setFeedback("Arms level — perfect alignment");
      } else {
        setPoseName("No pose detected");
        setFeedback("Adjust your posture");
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

  // ---------- CAMERA ----------
  const startCamera = () => {
    cameraRef.current.start();
    setCameraOn(true);
  };

  const stopCamera = () => {
    cameraRef.current.stop();
    setCameraOn(false);
    setPoseName("Detecting...");
    setFeedback("");
  };

  // ---------- UI ----------
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

      {!cameraOn ? (
        <Button colorScheme="teal" onClick={startCamera}>
          Start Camera
        </Button>
      ) : (
        <Button colorScheme="red" onClick={stopCamera}>
          Stop Camera
        </Button>
      )}

      <Badge colorScheme="purple" px={4} py={2}>
        {poseName}
      </Badge>

      <Text fontSize="md" color="gray.600">
        {feedback}
      </Text>

      <Text fontSize="sm" color="gray.500">
        AI Yoga Trainer — MediaPipe Holistic + Computer Vision
      </Text>
    </VStack>
  );
}

export default WebcamView;
