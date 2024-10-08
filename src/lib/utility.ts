// Taken from MDN (Cause I'm lazy lol)
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
export function getRandomInt(min: number, max: number) {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled); // The maximum is exclusive and the minimum is inclusive
}

/**
 * Adds a space after every third character
 * @param string
 * @returns string
 */
export function addSpace(string: string) {
  return string.replace(/(.{3})/, "$1 ").trim();
}

export function getRandomColor() {
  const H = getRandomInt(1, 360);
  const S = getRandomInt(0, 100);
  const L = getRandomInt(50, 100);

  return `hsl(${H},${S}%,${L}%)`;
}

export function getRandom(min: number, max: number) {
  return Math.random() * (max - min + 1) + min;
}

export function clamp(num: number, min: number, max: number) {
  return Math.min(Math.max(num, min), max);
}

export function getRandomHSL() {
  const H = getRandomInt(1, 360);
  const S = getRandomInt(30, 100);
  // Limit it to between 30%-60% so it doesn't get too bright lol
  const L = getRandomInt(30, 60);

  return `hsl(${H},${S}%,${L}%)`;
}

const BASE = 36;

/**
 * Converts a 6 letter string into a corresponding numerical value that can later be decoded
 * @param string
 * @returns number
 */
export function encode(s: string) {
  return s
    .toLowerCase()
    .split("")
    .reduce((acc, char) => {
      if (char >= "0" && char <= "9") {
        return acc * BASE + (char.charCodeAt(0) - "0".charCodeAt(0));
      } else if (char >= "a" && char <= "z") {
        return acc * BASE + (char.charCodeAt(0) - "a".charCodeAt(0) + 10);
      } else {
        throw new Error("Invalid character");
      }
    }, 0);
}

/**
 * Converts a numberical value created from the encode function back into the original string
 * @param number
 * @returns string
 */
export function decode(n: number): string {
  if (n < 0) throw new Error("Invalid input: number must be non-negative");

  if (n === 0) return "0";

  let result = "";

  while (n > 0) {
    const remainder = n % BASE;
    if (remainder < 10) {
      result = String.fromCharCode("0".charCodeAt(0) + remainder) + result;
    } else {
      result = String.fromCharCode("a".charCodeAt(0) + remainder - 10) + result;
    }
    n = Math.floor(n / BASE);
  }

  return result.toUpperCase();
}
