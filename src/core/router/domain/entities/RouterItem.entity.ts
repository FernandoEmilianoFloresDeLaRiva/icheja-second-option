import type { JSX } from "react";

export class RouterItem {
  protected _path: string;
  protected _component: () => JSX.Element;

  constructor(path: string, component: () => JSX.Element) {
    this._path = path;
    this._component = component;
  }

  get path(): string {
    return this._path;
  }
  get component(): () => JSX.Element | undefined {
    return this._component;
  }
}
