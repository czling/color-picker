import React, { useState, useCallback, useRef } from "react";
import { useGlobalMouseCallback, calculateBrightness } from "./utils";
import "./Saturation.css";

export default function Saturation({ h, s, v, onChange, onChangeComplete }) {
  const ref = useRef(null);
  const [isMousePressed, setIsMousePressed] = useState(false);
  const handleChange = useCallback(
    ({ x, y }) => {
      const b = calculateBrightness(x, y, ref.current);
      onChange({ h, ...b });
    },
    [onChange, h]
  );

  const handleMouseUp = useCallback(
    ({ x, y }) => {
      setIsMousePressed(false);
      const b = calculateBrightness(x, y, ref.current);
      onChangeComplete({ h, ...b });
    },
    [onChangeComplete, h]
  );

  const handleTouch = ({ touches }) => {
    handleChange({ x: touches[0].pageX, y: touches[0].pageY });
  };

  useGlobalMouseCallback(isMousePressed, handleChange, handleMouseUp);

  const styles = {
    color: {
      background: `hsl(${h},100%, 50%)`
    },
    pointer: {
      position: "absolute",
      top: `${-v + 100}%`,
      left: `${s}%`
    }
  };

  return (
    <div className="saturation-container">
      <div
        ref={ref}
        style={styles.color}
        className="position-absolute-spread"
        onMouseDown={({ pageX: x, pageY: y }) => {
          setIsMousePressed(true);
          handleChange({ x, y });
        }}
        onTouchMove={handleTouch}
        onTouchStart={handleTouch}
      >
        <div className="saturation-white position-absolute-spread">
          <div className="saturation-black position-absolute-spread" />
          <div style={styles.pointer}>
            <div className="saturation-knob" />
          </div>
        </div>
      </div>
    </div>
  );
}
