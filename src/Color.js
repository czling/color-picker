import { clamp, startsWith } from "lodash";
import hsluv from "hsluv";

const RGB_REGEX = /rgb(a?)\(([^)]+)\)/;
const HSL_REGEX = /hsl(a?)\(([^)]+)\)/;
const HSV_REGEX = /hsv(a?)\(([^)]+)\)/;
const SIXTH = 1 / 6;
const THIRD = 1 / 3;
const HALF = 1 / 2;
const TWO_THIRDS = 2 / 3;

let cacheKey = "";

class Color {
  static cache = {};

  static get cacheKey() {
    return cacheKey;
  }

  static set cacheKey(key) {
    if (key !== cacheKey) {
      this.reset();
    }
    cacheKey = key;
  }

  static reset() {
    this.cache = {};
  }

  static parseHex(hex) {
    return parseInt(hex, 16);
  }

  static hueToRgb(m1, m2, hue) {
    if (hue < 0) {
      hue++;
    } else if (hue > 1) {
      hue--;
    }
    if (hue < SIXTH) {
      return m1 + (m2 - m1) * 6 * hue;
    }
    if (hue < HALF) {
      return m2;
    }
    if (hue < TWO_THIRDS) {
      return m1 + (m2 - m1) * ((TWO_THIRDS - hue) * 6);
    }
    return m1;
  }

  static colorStringToArray(string, regex) {
    const match = string.match(regex);
    if (!match) {
      return [];
    }
    const [, hasAlpha, contents] = match;
    const split = contents.split(",");
    const len = split.length;
    if ((hasAlpha && len !== 4) || (!hasAlpha && len !== 3)) {
      return [];
    }
    return split.map((val, i) => {
      if (hasAlpha && i === len - 1) {
        return parseFloat(val);
      }
      return parseInt(val, 10);
    });
  }

  static hslStringToRgb(string = "") {
    const key = `hslStringToRgb.${string}`;
    if (!(key in this.cache)) {
      const values = this.colorStringToArray(string, HSL_REGEX);
      if (!values.length) {
        this.cache[key] = [];
      } else {
        let red, green, blue;
        let [hue, saturation, lightness, alpha = 1] = values;
        hue /= 360;
        saturation /= 100;
        lightness /= 100;
        alpha *= 100;
        if (saturation === 0) {
          red = green = blue = lightness;
        } else {
          const m2 =
            lightness < HALF
              ? lightness * (1 + saturation)
              : lightness + saturation - lightness * saturation;
          const m1 = 2 * lightness - m2;
          red = this.hueToRgb(m1, m2, hue + THIRD);
          green = this.hueToRgb(m1, m2, hue);
          blue = this.hueToRgb(m1, m2, hue - THIRD);
        }
        this.cache[key] = [red, green, blue, alpha];
      }
    }
    return this.cache[key];
  }

  static rgbStringToRgb(string = "") {
    const key = `rgbStringToRgb.${string}`;
    if (!(key in this.cache)) {
      const values = this.colorStringToArray(string, RGB_REGEX);
      if (!values.length) {
        this.cache[key] = [];
      } else {
        const [red, green, blue, alpha = 1] = values;
        this.cache[key] = [red / 255, green / 255, blue / 255, alpha * 100];
      }
    }
    return this.cache[key];
  }

  static hexStringToRgb(string = "") {
    if (string.charAt(0) === "#") {
      string = string.substr(1);
    }
    const key = `hexStringToRgb.${string}`;
    if (!(key in this.cache)) {
      const len = string.length;
      let red,
        green,
        blue,
        alpha = 1;
      const shortHand = len === 3 || len === 4;
      const longHand = !shortHand && (len === 6 || len === 8);
      if (shortHand || longHand) {
        if (shortHand) {
          const r = string.charAt(0);
          const g = string.charAt(1);
          const b = string.charAt(2);
          red = r + r;
          green = g + g;
          blue = b + b;
          if (len === 4) {
            const a = string.charAt(3);
            alpha = this.parseHex(a + a);
          }
        } else {
          red = string.substring(0, 2);
          green = string.substring(2, 4);
          blue = string.substring(4, 6);
          if (len === 8) {
            alpha = this.parseHex(string.substring(6, 8));
          }
        }
        this.cache[key] = [
          this.parseHex(red) / 255,
          this.parseHex(green) / 255,
          this.parseHex(blue) / 255,
          alpha * 100
        ];
      } else {
        this.cache[key] = [];
      }
    }
    return this.cache[key];
  }

  static hsvStringToRgb(string = "") {
    const key = `hsvStringToRgb.${string}`;
    if (!(key in this.cache)) {
      const values = this.colorStringToArray(string, HSV_REGEX);
      if (!values.length) {
        this.cache[key] = [];
      } else {
        const [hue, saturation, value] = values;
        const [red, green, blue] = Color.hsvToRgb(
          hue,
          saturation / 100,
          value / 100
        );
        this.cache[key] = [red / 255, green / 255, blue / 255, 100];
      }
    }
    return this.cache[key];
  }

  static rgbToHsluv(red, green, blue) {
    const key = `rgbToHsluv.${red}.${green}.${blue}`;
    if (!(key in this.cache)) {
      this.cache[key] = hsluv.rgbToHsluv([red, green, blue]);
    }
    return this.cache[key];
  }

  static rgbToXyz(red, green, blue) {
    const key = `rgbToXyz.${red}.${green}.${blue}`;
    if (!(key in this.cache)) {
      this.cache[key] = hsluv.rgbToXyz([red, green, blue]);
    }
    return this.cache[key];
  }

  static rgbToHsv(red, green, blue) {
    const key = `rgbToHsv.${red}.${green}.${blue}`;
    if (!(key in this.cache)) {
      const cmax = Math.max(red, green, blue);
      const cmin = Math.min(red, green, blue);
      const delta = cmax - cmin;
      let hue,
        saturation,
        value = cmax;

      if (delta === 0) {
        hue = 0;
        saturation = 0;
      } else {
        saturation = delta / cmax;

        if (cmax === red) {
          hue = (60 * (((green - blue) / delta) % 6) + 360) % 360;
        } else if (cmax === green) {
          hue = (60 * ((blue - red) / delta + 2) + 360) % 360;
        } else {
          hue = (60 * ((red - green) / delta + 4) + 360) % 360;
        }
      }
      this.cache[key] = [hue, saturation * 100, value * 100];
    }
    return this.cache[key];
  }

  static hsvToRgb(hue, saturation, value) {
    const key = `hsvToRgb.${hue}.${saturation}.${value}`;
    if (!(key in this.cache)) {
      const c = saturation * value;
      const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
      const m = value - c;

      let red, green, blue;
      if (hue < 60) [red, green, blue] = [c, x, 0];
      else if (hue < 120) [red, green, blue] = [x, c, 0];
      else if (hue < 180) [red, green, blue] = [0, c, x];
      else if (hue < 240) [red, green, blue] = [0, x, c];
      else if (hue < 300) [red, green, blue] = [x, 0, c];
      else [red, green, blue] = [c, 0, x];

      this.cache[key] = [
        Math.round((red + m) * 255),
        Math.round((green + m) * 255),
        Math.round((blue + m) * 255)
      ];
    }
    return this.cache[key];
  }

  static hsluvToHex(hue, saturation, lightness, alpha = false) {
    if (alpha === false) {
      alpha = 100;
    }
    const key = `hsluvToHex.${hue}.${saturation}.${lightness}.${alpha}`;
    if (!(key in this.cache)) {
      let value = hsluv.hsluvToHex([hue, saturation, lightness]).toLowerCase();
      if (alpha < 100) {
        value += ("00" + Math.round((alpha / 100) * 255).toString(16)).substr(
          -2
        );
      }
      this.cache[key] = value;
    }
    return this.cache[key];
  }

  static hsluvToRgb(hue, saturation, lightness, alpha = false) {
    if (alpha === false) {
      alpha = 100;
    }
    const key = `hsluvToRgb.${hue}.${saturation}.${lightness}.${alpha}`;
    if (!(key in this.cache)) {
      let [red, green, blue] = hsluv.hsluvToRgb([hue, saturation, lightness]);
      red = clamp(Math.round(red * 255), 0, 255);
      green = clamp(Math.round(green * 255), 0, 255);
      blue = clamp(Math.round(blue * 255), 0, 255);
      let tag = "rgb";
      let values = `${red}, ${green}, ${blue}`;
      if (alpha < 100) {
        tag += "a";
        values += `, ${alpha / 100}`;
      }
      this.cache[key] = `${tag}(${values})`;
    }
    return this.cache[key];
  }

  static fromRGB(rgb) {
    const parsed = Color.rgbStringToRgb(rgb);
    if (!parsed.length) {
      throw new Error(`Unable to parse RGB '${rgb}'`);
    }
    const [red, green, blue, alpha = 100] = parsed;
    const [hue, saturation, lightness] = Color.rgbToHsluv(red, green, blue);
    return new Color({ hue, saturation, lightness, alpha });
  }

  static fromHex(hex) {
    const parsed = Color.hexStringToRgb(hex);
    if (!parsed.length) {
      throw new Error(`Unable to parse color '${hex}'`);
    }
    const [red, green, blue, alpha = 100] = parsed;
    const [hue, saturation, lightness] = Color.rgbToHsluv(red, green, blue);
    return new Color({ hue, saturation, lightness, alpha });
  }

  static fromHSL(hsl) {
    const parsed = Color.hslStringToRgb(hsl);
    if (!parsed.length) {
      throw new Error(`Unable to parse HSL '${hsl}'`);
    }
    const [red, green, blue, alpha = 100] = parsed;
    const [hue, saturation, lightness] = Color.rgbToHsluv(red, green, blue);
    return new Color({ hue, saturation, lightness, alpha });
  }

  static fromHSV(hsv) {
    const parsed = Color.hsvStringToRgb(hsv);
    if (!parsed.length) {
      throw new Error(`Unable to parse HSV '${hsv}'`);
    }
    const [red, green, blue, alpha = 100] = parsed;
    const [hue, saturation, lightness] = Color.rgbToHsluv(red, green, blue);
    return new Color({ hue, saturation, lightness, alpha });
  }

  static contrastRatio(c1, c2) {
    const l1 = c1.getRelativeLuminance();
    const l2 = c2.getRelativeLuminance();
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);

    return (lighter + 0.05) / (darker + 0.05);
  }

  static rgbaToRgb(rgbaColor, backgroundColor) {
    const [
      sourceRed,
      sourceGreen,
      sourceBlue,
      sourceAlpha
    ] = Color.rgbStringToRgb(rgbaColor.toRgb());
    const [bgRed, bgGreen, bgBlue] = Color.rgbStringToRgb(
      backgroundColor.toRgb()
    );

    const alpha = sourceAlpha / 100;
    const red = Math.round(
      (1 - alpha) * (bgRed * 255) + alpha * (sourceRed * 255)
    );
    const green = Math.round(
      (1 - alpha) * (bgGreen * 255) + alpha * (sourceGreen * 255)
    );
    const blue = Math.round(
      (1 - alpha) * (bgBlue * 255) + alpha * (sourceBlue * 255)
    );

    return Color.fromRGB(`rgb(${red},${green},${blue})`);
  }

  constructor(color) {
    if (typeof color === "string") {
      if (startsWith(color, "rgb")) {
        return Color.fromRGB(color);
      }
      if (startsWith(color, "hsl")) {
        return Color.fromHSL(color);
      }
      return Color.fromHex(color);
    }
    const { hue = 0, saturation = 0, lightness = 0, alpha = 100 } = color || {};
    this.hue = hue;
    this.saturation = saturation;
    this.lightness = lightness;
    this.alpha = alpha;
  }

  toHex(alpha = false) {
    return Color.hsluvToHex(
      this.hue,
      this.saturation,
      this.lightness,
      alpha && this.alpha
    );
  }

  toRgb(alpha = true) {
    return Color.hsluvToRgb(
      this.hue,
      this.saturation,
      this.lightness,
      alpha && this.alpha
    );
  }

  toHsv() {
    const [red, green, blue] = Color.rgbStringToRgb(this.toRgb());
    return Color.rgbToHsv(red, green, blue);
  }

  toString(alpha = true) {
    return this.toRgb(alpha);
  }

  setHue(hue) {
    return this.clone({
      hue: Math.abs(hue + 360) % 360
    });
  }

  setSaturation(saturation) {
    return this.clone({
      saturation: clamp(saturation, 0, 100)
    });
  }

  setLightness(lightness) {
    return this.clone({
      lightness: clamp(lightness, 0, 100)
    });
  }

  setAlpha(alpha) {
    return this.clone({
      alpha: clamp(alpha, 0, 100)
    });
  }

  getRelativeLuminance() {
    const [red, green, blue] = Color.rgbStringToRgb(this.toRgb());
    const [, luminance] = Color.rgbToXyz(red, green, blue);
    return luminance;
  }

  clone({
    hue = this.hue,
    saturation = this.saturation,
    lightness = this.lightness,
    alpha = this.alpha
  } = {}) {
    return new Color({ hue, saturation, lightness, alpha });
  }

  spin(angle) {
    return this.setHue(this.hue + angle);
  }

  saturate(amount) {
    return this.setSaturation(this.saturation + amount);
  }

  saturateByRatio(ratio) {
    const amount = (100 - this.saturation) * ratio;
    return this.saturate(amount);
  }

  desaturate(amount) {
    return this.setSaturation(this.saturation - amount);
  }

  desaturateByRatio(ratio) {
    const amount = this.saturation * ratio;
    return this.desaturate(amount);
  }

  lighten(amount) {
    return this.setLightness(this.lightness + amount);
  }

  lightenByRatio(ratio) {
    return this.lighten(this.lightness * ratio);
  }

  darken(amount) {
    return this.setLightness(this.lightness - amount);
  }

  darkenByRatio(ratio) {
    return this.darken(this.lightness * ratio);
  }

  tint(amount) {
    const desaturateRatio = amount / (100 - this.lightness);
    return this.lighten(amount).desaturateByRatio(desaturateRatio);
  }

  tintByRatio(ratio) {
    const amount = (100 - this.lightness) * ratio;
    return this.tint(amount);
  }

  shade(amount) {
    const desaturateRatio = amount / this.lightness;
    return this.darken(amount).desaturateByRatio(desaturateRatio);
  }

  shadeByRatio(ratio) {
    const amount = this.lightness * ratio;
    return this.shade(amount);
  }

  contrast(difference, keepSaturation, threshold) {
    let method;
    if (this.isLight(threshold)) {
      method = keepSaturation ? "darken" : "shade";
    } else {
      method = keepSaturation ? "lighten" : "tint";
    }
    return this[method](difference);
  }

  contrastWith(color, difference, keepSaturation, threshold) {
    if (Math.abs(this.lightness - color.lightness) >= difference) {
      return this;
    }
    let method;
    let relativeDifference;
    if (color.isLight(threshold)) {
      method = keepSaturation ? "darken" : "shade";
      relativeDifference = difference - color.lightness + this.lightness;
    } else {
      method = keepSaturation ? "lighten" : "tint";
      relativeDifference = color.lightness + difference - this.lightness;
    }
    return this[method](relativeDifference);
  }

  isLight(threshold = 60) {
    return this.lightness >= threshold;
  }

  isDark(threshold) {
    return !this.isLight(threshold);
  }

  fadeIn(amount) {
    return this.setAlpha(this.alpha + amount);
  }

  fadeOut(amount) {
    return this.setAlpha(this.alpha - amount);
  }

  fadeByRatio(ratio) {
    const amount = this.alpha * ratio;
    return this.setAlpha(amount);
  }
}

export default Color;
