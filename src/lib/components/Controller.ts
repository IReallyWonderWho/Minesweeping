export type Input = "rightMouse" | "rightMouse" | "leftMouse" | "leftMouse";

class ControllerClass {
  public keysDown: Map<Input, boolean>;

  constructor() {
    this.keysDown = new Map();
  }

  public getKey(key: Input | Input[]) {
    if (typeof key === "object") {
      const amount = key.length;
      let i = 0;

      for (const a of key) {
        if (this.keysDown.get(a)) {
          i++;
        }
      }

      return i === amount;
    }
    return this.keysDown.get(key);
  }

  public keyPressed(key: Input) {
    this.keysDown.set(key, true);
  }

  public keyReleased(key: Input) {
    this.keysDown.set(key, false);
  }
}

export const Controller = new ControllerClass();
