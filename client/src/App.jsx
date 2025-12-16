import { Box } from "@chakra-ui/react";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";

function App() {
  return (
    <Box minH="100vh" bg="gray.50">
      <Navbar />
      <Home />
    </Box>
  );
}

export default App;
