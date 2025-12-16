import { Box, VStack, Heading, Text, Badge } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import WebcamView from "../components/WebcamView";

function Home() {
  const [backendStatus, setBackendStatus] = useState("Checking...");

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => setBackendStatus(data.status))
      .catch(() => setBackendStatus("Not Connected"));
  }, []);

  return (
    <Box p={8}>
      <VStack spacing={6}>
        <Heading>Real-time Pose Detection</Heading>

        <Text color="gray.600">
          Detect human posture using live webcam feed
        </Text>

        <Badge
          colorScheme={backendStatus === "ok" ? "green" : "red"}
          px={4}
          py={1}
          borderRadius="full"
        >
          Backend: {backendStatus}
        </Badge>

        <WebcamView />
      </VStack>
    </Box>
  );
}

export default Home;
