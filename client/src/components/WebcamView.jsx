import { Box, Button, VStack, Text } from "@chakra-ui/react";
import { useRef, useState } from "react";

function WebcamView() {
  const videoRef = useRef(null);
  const [isCameraOn, setIsCameraOn] = useState(false);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      setIsCameraOn(true);
    } catch (err) {
      alert("Camera permission denied");
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current.srcObject;
    stream.getTracks().forEach(track => track.stop());
    videoRef.current.srcObject = null;
    setIsCameraOn(false);
  };

  return (
    <VStack spacing={4}>
      <Box
        w="640px"
        h="480px"
        bg="black"
        borderRadius="lg"
        overflow="hidden"
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          style={{ width: "100%", height: "100%" }}
        />
      </Box>

      {!isCameraOn ? (
        <Button colorScheme="teal" onClick={startCamera}>
          Start Camera
        </Button>
      ) : (
        <Button colorScheme="red" onClick={stopCamera}>
          Stop Camera
        </Button>
      )}

      <Text fontSize="sm" color="gray.500">
        Allow camera access to begin pose detection
      </Text>
    </VStack>
  );
}

export default WebcamView;
