import { Box, HTMLChakraProps } from "@chakra-ui/react";
import "./patterns.css";

type PatternBackgroundProps =  {
  pattern: "isometric"
  children?: React.ReactNode
} & HTMLChakraProps<"div">;

const classNames = {
  isometric: "isometric-background"
}

function PatternBackground({ pattern, children, ...restProps }: PatternBackgroundProps) {

  return (
    <Box position={"relative"} {...restProps}>
      <Box className={classNames[pattern]} position="fixed" top={0} left={0} right={0} bottom={0} zIndex={-20} />
      {children}
    </Box>
  );
}

export default PatternBackground;