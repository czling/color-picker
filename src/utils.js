import { useEffect } from "react";

export function useGlobalMouseCallback(
  isMousePressed,
  handleChange,
  handleMouseUp
) {
  useEffect(() => {
    const bind = () => {
      window.addEventListener("mousemove", handleChange);
      window.addEventListener("mouseup", handleMouseUp);
    };

    const unbind = () => {
      window.removeEventListener("mousemove", handleChange);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    if (isMousePressed) {
      bind();
    } else {
      unbind();
    }
    return unbind;
  }, [isMousePressed, handleChange, handleMouseUp]);
}

export const calculateBrightness = (x, y, el) => {
  const {
    width: containerWidth,
    height: containerHeight
  } = el.getBoundingClientRect();
  let left = x - (el.getBoundingClientRect().left + window.pageXOffset);
  let top = y - (el.getBoundingClientRect().top + window.pageYOffset);

  if (left < 0) {
    left = 0;
  } else if (left > containerWidth) {
    left = containerWidth;
  } else if (top < 0) {
    top = 0;
  } else if (top > containerHeight) {
    top = containerHeight;
  }

  const saturation = (left * 100) / containerWidth;
  const bright = -((top * 100) / containerHeight) + 100;

  return {
    s: saturation,
    v: bright
  };
};

export const calculateHue = (x, el) => {
  const containerWidth = el.clientWidth;
  const left = x - (el.getBoundingClientRect().left + window.pageXOffset);
  const percent = (left * 100) / containerWidth;

  if (left < 0) {
    return 1;
  } else if (left > containerWidth) {
    return 359;
  }
  return Math.round((360 * percent) / 100);
};
