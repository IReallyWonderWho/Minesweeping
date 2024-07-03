// Taken from MDN (Cause I'm lazy lol)
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
export function getRandomInt(min: number, max: number) {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled); // The maximum is exclusive and the minimum is inclusive
}

export function getRandomHSL() {
  const H = getRandomInt(1, 360);
  const S = getRandomInt(30, 100);
  // Limit it to between 30%-60% so it doesn't get too bright lol
  const L = getRandomInt(30, 60);

  return `hsl(${H},${S}%,${L}%)`;
}
