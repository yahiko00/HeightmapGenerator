/// <reference path="Scripts/rng/rng.ts"/>
/// <reference path="Scripts/diamondsquare/diamondsquare.ts"/>

// Generate random heightmaps

// TODO : 
// * Appel à une seed
// * Smooth
// * 8-bit / 16-bit
// * Export de fichiers (Windows / Mac)
// * Autres algos : Perlin

class Heightmap {
  dimX: number;
  dimY: number;
  wrap: boolean;
  lowValue: number;
  highValue: number;
  algo: string;
  algoOptions: any;
  smooth: string;
  smoothOptions: any;
  map: number[][];
  seed: number;

  rng: SeededRNG;

  constructor(dimX: number, dimY: number, lowValue: number = 0, highValue: number = 255, wrap: boolean = false, algo: string = "diamondSquareIter", algoOptions = { roughness: 2 }, smooth?: string, smoothOptions?: any, seed = Date.now()) {
    this.dimX = dimX;
    this.dimY = dimY;
    this.wrap = wrap;
    this.lowValue = lowValue;
    this.highValue = highValue;
    this.algo = algo;
    this.algoOptions = algoOptions;
    this.smooth = smooth;
    this.smoothOptions = smoothOptions;
    this.seed = seed;
  } // constructor

  // Generate a heightmap
  generate(): number[][] {
    console.time("generate");

    this.rng = new SeededRNG(this.seed, 4); // Xorshift
    this.map = [];

    switch (this.algo) {
      case "diamondSquare":
        var mapSize = Math.pow(2, Math.ceil(Math.log(Math.max(this.dimX - 1, this.dimY - 1)) / Math.LN2));
        var diamondSquare = new DiamondSquare(this.rng);
        var squareMap = diamondSquare.heightmap(mapSize + 1, this.lowValue, this.highValue, this.wrap, <number>this.algoOptions.roughness);

        // Reduce the size of the map according to dimX and dimY.
        // The wrap property will be lost if dimX and dimY are not a same value equals to 2^n+1.
        for (var i = 0; i < this.dimX; i++) {
          this.map.push(squareMap[i].slice(0, this.dimY));
        } // for i

        break;
      default:
    } // switch

    switch (this.smooth) {
      case "boxBlur":
        this.boxBlur();
        break;
      default:
    } // switch

    console.timeEnd("generate");

    return this.map
  } // generate

  // See: http://blog.ivank.net/fastest-gaussian-blur.html
  boxBlur() {
    var radius = this.smoothOptions.radius;
    var result: number[][] = [];
    var temp: number[] = [];

    for (var i = 0; i < this.dimX; i++) {
      temp = [];
      for (var j = 0; j < this.dimY; j++) {
        var val = 0;
        for (var iy = j - radius; iy < j + radius + 1; iy++) {
          for (var ix = i - radius; ix < i + radius + 1; ix++) {
            var x = Math.min(this.dimX - 1, Math.max(0, ix));
            var y = Math.min(this.dimY - 1, Math.max(0, iy));
            val += this.map[x][y];
          } // for ix
        } // for iy
        temp.push(val / ((radius + radius + 1) * (radius + radius + 1)));
      } // for j
      result.push(temp);
    } // for i
    this.map = result;
  } // boxBlur

  // Return a one-dimension map
  linearMap(): number[] {
    var data: number[] = [];
    var k = 0;

    for (var i = 0; i < this.dimX; i++) {
      for (var j = 0; j < this.dimY; j++) {
        data[k++] = this.map[i][j];
      } // for j
    } // for i
    return data;
  } // linearMap
} // Heightmap
