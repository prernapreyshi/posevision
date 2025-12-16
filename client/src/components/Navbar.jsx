import { Box, Heading } from "@chakra-ui/react";

function Navbar() {
  return (
    <Box
      bg="teal.500"
      color="white"
      px={6}
      py={4}
      boxShadow="md"
    >
      <Heading size="md">PoseVision</Heading>
    </Box>
  );
}

export default Navbar;
