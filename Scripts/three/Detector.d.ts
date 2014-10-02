interface DetectorStatic {
  webgl: boolean;
  getWebGLErrorMessage(): HTMLElement;
  addGetWebGLMessage(parameters?: HTMLElement);
} // DetectorStatic

declare var Detector: DetectorStatic;
