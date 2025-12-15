import { useEffect, useState } from "react";
import {
  Box,
  Heading,
  Text,
  Card,
  CardBody,
  VStack,
  Badge,
} from "@chakra-ui/react";

function App() {
  const [backendStatus, setBackendStatus] = useState("Checking...");

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => setBackendStatus(data.status))
      .catch(() => setBackendStatus("Not Connected"));
  }, []);

  return (
    <Box minH="100vh" bg="gray.50" display="flex" alignItems="center" justifyContent="center">
      <Card w="400px" boxShadow="lg" borderRadius="xl">
        <CardBody>
          <VStack spacing={4}>
            <Heading size="lg">PoseVision 🚀</Heading>

            <Text textAlign="center" color="gray.600">
              Real-time posture & pose detection web app
            </Text>

            <Badge
              colorScheme={backendStatus === "ok" ? "green" : "red"}
              fontSize="1em"
              px={4}
              py={1}
              borderRadius="full"
            >
              Backend: {backendStatus}
            </Badge>

            <Text fontSize="sm" color="gray.500">
              Day 1: Chakra UI + React + Express setup
            </Text>
          </VStack>
        </CardBody>
      </Card>
    </Box>
  );
}

export default App;
