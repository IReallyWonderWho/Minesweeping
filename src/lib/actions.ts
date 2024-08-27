export function longpress(node: HTMLElement, threshold = 250) {
  const handle_press = () => {
    const timeout = setTimeout(() => {
      node.dispatchEvent(new CustomEvent("longpress"));
    }, threshold);

    const cancel = () => {
      clearTimeout(timeout);
      node.removeEventListener("touchmove", cancel);
      node.removeEventListener("touchend", cancel);
    };

    node.addEventListener("touchmove", cancel, { passive: true });
    node.addEventListener("touchend", cancel, { passive: true });
  };

  node.addEventListener("touchstart", handle_press, { passive: true });

  return {
    destroy() {
      node.removeEventListener("touchstart", handle_press);
    },
  };
}
