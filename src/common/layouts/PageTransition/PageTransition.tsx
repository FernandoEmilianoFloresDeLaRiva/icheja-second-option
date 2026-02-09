import { motion, type EasingDefinition } from "framer-motion";
import type { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
  ease: EasingDefinition;
}

export default function PageTransition({
  children,
  ease,
}: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: ease }}
    >
      {children}
    </motion.div>
  );
}
