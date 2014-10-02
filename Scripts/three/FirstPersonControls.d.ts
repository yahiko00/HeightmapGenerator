/// <reference path="three.d.ts"/>

declare module THREE {
  export class FirstPersonControls {
    movementSpeed: number;
    lookSpeed: number;
    constructor(object, domElement?);
    handleResize();
    update(delta: number);
  }
}