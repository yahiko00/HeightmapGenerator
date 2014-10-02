declare class Stats {
  public REVISION: number;
  public domElement: HTMLElement;
  constructor();
  setMode(display: number);
  begin();
  end(): number;
  update();
}
