import React, { useState, useEffect, useCallback } from "react";
import { render } from "react-dom";
import HueSlider from "./HueSlider";
import Saturation from "./Saturation";
import Color from "./Color";

function hsvToRgbString({ h, s, v }) {
  return `rgb(${Color.hsvToRgb(h, s / 100, v / 100).join()})`;
}

const ColorPicker = ({ color: c, onChange, onChangeComplete }) => {
  const [hsv, setHsv] = useState({ h: 0, s: 100, v: 50 });

  useEffect(() => {
    const [h, s, v] = new Color(c).toHsv();
    setHsv({ h, s, v });
  }, [c]);

  const handleChange = useCallback(
    newHsv => {
      if (onChange) {
        onChange(hsvToRgbString({ ...hsv, ...newHsv }));
      } else {
        setHsv({ ...hsv, ...newHsv });
      }
    },
    [hsv, onChange]
  );

  const handleChangeComplete = useCallback(
    newHsv => {
      if (onChangeComplete) {
        onChangeComplete(hsvToRgbString({ ...hsv, ...newHsv }));
      }
    },
    [hsv, onChangeComplete]
  );

  return (
    <div className="wsb-color-picker">
      <Saturation
        h={hsv.h}
        s={hsv.s}
        v={hsv.v}
        onChange={handleChange}
        onChangeComplete={handleChangeComplete}
      />
      <HueSlider
        hue={hsv.h}
        onChange={handleChange}
        onChangeComplete={handleChangeComplete}
      />
    </div>
  );
};

function App() {
  const [color, setColor] = useState("#d64400");
  return (
    <div>
      <ColorPicker
        color={color}
        onChange={setColor}
        onChangeComplete={setColor}
      />
      <div
        style={{ width: "100px", height: "100px", backgroundColor: color }}
      />
    </div>
  );
}

render(<App />, document.getElementById("root"));
