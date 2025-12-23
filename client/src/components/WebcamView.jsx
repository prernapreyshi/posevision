import { Box, Button, VStack, Text, Badge, Progress } from "@chakra-ui/react";
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
  const [accuracy, setAccuracy] = useState(0);

  // ---------- ANGLE UTILITY ----------
  const calculateAngle = (a, b, c) => {
    const radians =
      Math.atan2(c.y - b.y, c.x - b.x) -
      Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs((radians * 180) / Math.PI);
    if (angle > 180) angle = 360 - angle;
    return angle;
  };

  const isLevel = (p1, p2, tol = 0.05) =>
    Math.abs(p1.y - p2.y) < tol;

  // ---------- ACCURACY HELPERS ----------
  const angleAccuracy = (current, ideal) =>
    Math.max(0, 100 - Math.abs(current - ideal) * 2);

  // ---------- POSE DETECTORS ----------
  const detectTPose = (lm) => {
    const leftArm = calculateAngle(lm[11], lm[13], lm[15]);
    const rightArm = calculateAngle(lm[12], lm[14], lm[16]);

    const acc =
      (angleAccuracy(leftArm, 180) +
        angleAccuracy(rightArm, 180)) /
      2;

    if (acc > 70 && isLevel(lm[11], lm[15]) && isLevel(lm[12], lm[16])) {
      setAccuracy(Math.round(acc));
      setPoseName("🧍 T-Pose");
      setFeedback("Arms straight and level");
      return true;
    }
    return false;
  };

  const detectWarriorII = (lm) => {
    const kneeAngle = calculateAngle(lm[23], lm[25], lm[27]);
    const kneeAcc = angleAccuracy(kneeAngle, 90);

    if (
      kneeAcc > 60 &&
      isLevel(lm[11], lm[15]) &&
      isLevel(lm[12], lm[16])
    ) {
      setAccuracy(Math.round(kneeAcc));
      setPoseName("⚔️ Warrior II");
      setFeedback("Strong stance — bend front knee near 90°");
      return true;
    }
    return false;
  };

  const detectTreePose = (lm) => {
    const standingLeg = calculateAngle(lm[23], lm[25], lm[27]);
    const acc = angleAccuracy(standingLeg, 170);

    if (Math.abs(lm[27].y - lm[28].y) > 0.15 && acc > 60) {
      setAccuracy(Math.round(acc));
      setPoseName("🌳 Tree Pose");
      setFeedback("Balance steady — focus ahead");
      return true;
    }
    return false;
  };

  // ---------- MEDIAPIPE ----------
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

      const draw = (lm, color, size = 3) => {
        if (!lm) return;
        lm.forEach((p) => {
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

      draw(results.poseLandmarks, "red");
      draw(results.leftHandLandmarks, "cyan");
      draw(results.rightHandLandmarks, "cyan");
      draw(results.faceLandmarks, "yellow", 1.5);

      const lm = results.poseLandmarks;
      if (!lm) return;

      setAccuracy(0);

      if (
        detectWarriorII(lm) ||
        detectTreePose(lm) ||
        detectTPose(lm)
      )
        return;

      setPoseName("No pose detected");
      setFeedback("Adjust your posture");
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
    setAccuracy(0);
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

      <Text>{feedback}</Text>

      <Box w="300px">
        <Text fontWeight="bold">Pose Accuracy: {accuracy}%</Text>
        <Progress
          value={accuracy}
          colorScheme={accuracy > 80 ? "green" : "yellow"}
          borderRadius="md"
        />
      </Box>

      <Text fontSize="sm" color="gray.500">
        AI Yoga Trainer — Accuracy based on joint angles
      </Text>
    </VStack>
  );
}

export default WebcamView;
