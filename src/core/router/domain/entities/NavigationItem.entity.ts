import type { JSX } from "react";
import { RouterItem } from "./RouterItem.entity";

export class NavigationItem extends RouterItem {
  private _name: string;
  private _label: string;
  private _isActive: boolean;
  private _icon: string;

  constructor(
    name: string,
    label: string,
    isActive: boolean = false,
    icon: string,
    path: string,
    component: () => JSX.Element
  ) {
    super(path, component);
    this._name = name;
    this._label = label;
    this._isActive = isActive;
    this._icon = icon;
  }

  get name(): string {
    return this._name;
  }
  get label(): string {
    return this._label;
  }
  get isActive(): boolean {
    return this._isActive;
  }
  get icon(): string {
    return this._icon;
  }

  set isActive(value: boolean) {
    this._isActive = value;
  }
}
