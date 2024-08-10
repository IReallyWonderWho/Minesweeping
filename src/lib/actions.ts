export function longpress(node: HTMLElement, threshold = 500) {
  const handle_press = () => {
    const timeout = setTimeout(() => {
      node.dispatchEvent(new CustomEvent("longpress"));
    }, threshold);

    const cancel = () => {
      clearTimeout(timeout);
      node.removeEventListener("touchmove", cancel);
      node.removeEventListener("touchend", cancel);
    };

    node.addEventListener("touchmove", cancel);
    node.addEventListener("touchend", cancel);
  };

  node.addEventListener("touchstart", handle_press);

  return {
    destroy() {
      node.removeEventListener("touchstart", handle_press);
    },
  };
}
