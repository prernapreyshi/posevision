import { Box, Button, VStack, Text, Badge } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { Holistic } from "@mediapipe/holistic";
import { Camera } from "@mediapipe/camera_utils";

function WebcamView() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraRef = useRef(null);

  const [isCameraOn, setIsCameraOn] = useState(false);
  const [status, setStatus] = useState("Waiting...");

  useEffect(() => {
    const holistic = new Holistic({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`,
    });

    holistic.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      refineFaceLandmarks: true,
    });

    holistic.onResults((results) => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const drawPoints = (landmarks, color) => {
        landmarks?.forEach((p) => {
          ctx.beginPath();
          ctx.arc(p.x * canvas.width, p.y * canvas.height, 2, 0, 2 * Math.PI);
          ctx.fillStyle = color;
          ctx.fill();
        });
      };

      drawPoints(results.faceLandmarks, "yellow"); // face (mouth, nose, eyes)
      drawPoints(results.leftHandLandmarks, "cyan"); // left hand
      drawPoints(results.rightHandLandmarks, "cyan"); // right hand
      drawPoints(results.poseLandmarks, "red"); // body

      setStatus("Detecting face, hands & body ✅");
    });

    cameraRef.current = new Camera(videoRef.current, {
      onFrame: async () => {
        await holistic.send({ image: videoRef.current });
      },
      width: 640,
      height: 480,
    });
  }, []);

  const startCamera = () => {
    cameraRef.current.start();
    setIsCameraOn(true);
  };

  const stopCamera = () => {
    cameraRef.current.stop();
    setIsCameraOn(false);
    setStatus("Stopped");
  };

  return (
    <VStack spacing={4}>
      <Box position="relative" w="640px" h="480px">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          style={{ width: "640px", height: "480px" }}
        />
        <canvas
          ref={canvasRef}
          style={{ position: "absolute", top: 0, left: 0 }}
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

      <Badge colorScheme="green" px={4} py={2}>
        {status}
      </Badge>

      <Text fontSize="sm" color="gray.500">
        Face + hand + body landmark detection
      </Text>
    </VStack>
  );
}

export default WebcamView;
