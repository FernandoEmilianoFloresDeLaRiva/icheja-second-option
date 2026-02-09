export class UnitEntity {
  private _id: number;
  private _title: string;
  private _exercisesCount: number;

  constructor(id: number, title: string, exerciseCount: number) {
    this._id = id;
    this._title = title;
    this._exercisesCount = exerciseCount;
  }

  get id(): number {
    return this._id;
  }

  get title(): string {
    return this._title;
  }

  get exerciseCount(): number {
    return this._exercisesCount;
  }
}
