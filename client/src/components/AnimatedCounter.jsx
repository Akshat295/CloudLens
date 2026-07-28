import { useEffect, useRef } from "react";
import { motion, useMotionValue, animate } from "framer-motion";

// Animates a numeric value from its previous displayed value to the new one,
// writing directly to the DOM node on each tick (via Framer Motion's
// onUpdate) instead of triggering a React re-render per frame.
const AnimatedCounter = ({
  value = 0,
  format = (v) => Math.round(v).toLocaleString(),
  duration = 1,
  className,
}) => {
  const motionValue = useMotionValue(0);
  const spanRef = useRef(null);

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration,
      ease: "easeOut",
      onUpdate: (latest) => {
        if (spanRef.current) spanRef.current.textContent = format(latest);
      },
    });

    return controls.stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <motion.span ref={spanRef} className={className}>
      {format(0)}
    </motion.span>
  );
};

export default AnimatedCounter;
