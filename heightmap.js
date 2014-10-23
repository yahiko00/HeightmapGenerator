/// <reference path="Scripts/rng/rng.ts"/>
/// <reference path="Scripts/diamondsquare/diamondsquare.ts"/>
// Generate random heightmaps
// TODO : 
// * 8-bit / 16-bit
// * Export de fichiers (Windows / Mac)
// * Autres algos : Perlin
var Heightmap = (function () {
    function Heightmap(dimX, dimY, lowValue, highValue, wrap, algo, algoOptions, smooth, smoothOptions, seed) {
        if (lowValue === void 0) { lowValue = 0; }
        if (highValue === void 0) { highValue = 255; }
        if (wrap === void 0) { wrap = false; }
        if (algo === void 0) { algo = "diamondSquare"; }
        if (algoOptions === void 0) { algoOptions = { roughness: 2 }; }
        if (seed === void 0) { seed = Date.now(); }
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
    Heightmap.prototype.generate = function () {
        console.time("generate");
        this.rng = new SeededRNG(this.seed, "xorshift");
        this.map = [];
        switch (this.algo) {
            case "diamondSquare":
                var mapSize = Math.pow(2, Math.ceil(Math.log(Math.max(this.dimX - 1, this.dimY - 1)) / Math.LN2));
                var diamondSquare = new DiamondSquare(this.rng);
                var squareMap = diamondSquare.heightmap(mapSize + 1, this.lowValue, this.highValue, this.wrap, this.algoOptions.roughness);
                for (var i = 0; i < this.dimX; i++) {
                    this.map.push(squareMap[i].slice(0, this.dimY));
                }
                break;
            default:
        }
        switch (this.smooth) {
            case "boxBlur":
                this.boxBlur();
                break;
            default:
        }
        console.timeEnd("generate");
        return this.map;
    }; // generate
    // See: http://blog.ivank.net/fastest-gaussian-blur.html
    Heightmap.prototype.boxBlur = function () {
        var radius = this.smoothOptions.radius;
        var result = [];
        var temp = [];
        for (var i = 0; i < this.dimX; i++) {
            temp = [];
            for (var j = 0; j < this.dimY; j++) {
                var val = 0;
                for (var iy = j - radius; iy < j + radius + 1; iy++) {
                    for (var ix = i - radius; ix < i + radius + 1; ix++) {
                        var x = Math.min(this.dimX - 1, Math.max(0, ix));
                        var y = Math.min(this.dimY - 1, Math.max(0, iy));
                        val += this.map[x][y];
                    }
                }
                temp.push(val / ((radius + radius + 1) * (radius + radius + 1)));
            }
            result.push(temp);
        }
        this.map = result;
    }; // boxBlur
    // Return a one-dimension map
    Heightmap.prototype.linearMap = function () {
        var data = [];
        var k = 0;
        for (var i = 0; i < this.dimX; i++) {
            for (var j = 0; j < this.dimY; j++) {
                data[k++] = this.map[i][j];
            }
        }
        return data;
    }; // linearMap
    return Heightmap;
})(); // Heightmap
//# sourceMappingURL=heightmap.js.map