import { Badge } from "@chakra-ui/react";

function StatusBadge({ status }) {
  return (
    <Badge
      colorScheme={status === "ok" ? "green" : "red"}
      px={4}
      py={1}
      borderRadius="full"
      fontSize="0.9em"
    >
      Backend: {status}
    </Badge>
  );
}

export default StatusBadge;
