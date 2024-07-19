// Taken from MDN (Cause I'm lazy lol)
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
export function getRandomInt(min: number, max: number) {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled); // The maximum is exclusive and the minimum is inclusive
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

export function encode(s: string) {
  return s.split("").reduce((acc, char) => {
    if (char >= "0" && char <= "9") {
      return acc * BASE + (char.charCodeAt(0) - "0".charCodeAt(0));
    } else if (char >= "a" && char <= "z") {
      return acc * BASE + (char.charCodeAt(0) - "a".charCodeAt(0) + 10);
    } else {
      throw new Error("Invalid character");
    }
  }, 0);
}
