import React, { useState, useRef, useCallback } from "react";
import { calculateHue, useGlobalMouseCallback } from "./utils";
import "./HueSlider.css";

function HueSlider({ onChange = () => {}, onChangeComplete = () => {}, hue }) {
  const ref = useRef(null);
  const [isMousePressed, setIsMousePressed] = useState(false);

  const handleChange = useCallback(
    ({ x }) => {
      if (ref.current) {
        const h = calculateHue(x, ref.current);
        onChange({ h });
      }
    },
    [onChange]
  );

  const handleMouseUp = useCallback(() => {
    setIsMousePressed(false);
    onChangeComplete({ h: hue });
  }, [onChangeComplete, hue]);

  const handleTouch = ({ touches }) => {
    handleChange({ x: touches[0].pageX });
  };

  useGlobalMouseCallback(isMousePressed, handleChange, handleMouseUp);

  const pointerStyles = {
    position: "absolute",
    left: `${(hue * 100) / 360}%`
  };

  return (
    <div className="hue-slider-wrapper">
      <div
        className="hue-slider"
        ref={ref}
        onMouseDown={({ pageX: x }) => {
          setIsMousePressed(true);
          handleChange({ x });
        }}
        onTouchMove={handleTouch}
        onTouchStart={handleTouch}
      >
        <div style={pointerStyles}>
          <div className="hue-slider-knob" />
        </div>
      </div>
    </div>
  );
}

export default HueSlider;
