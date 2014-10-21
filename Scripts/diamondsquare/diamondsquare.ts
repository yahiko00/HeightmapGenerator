/// <reference path="../rng/rng.ts"/>

class DiamondSquare {
  rng: SeededRNG;

  constructor(rng: SeededRNG = new SeededRNG()) {
    this.rng = rng;
  }

  // Run an iterative diamond square algorithm
  // See: http://stackoverflow.com/questions/2755750/diamond-square-algorithm
  heightmap(MAP_SIZE, low, high, wrap, roughness): number[][] {
    // MAP_SIZE is the size of grid to generate, note this must be a
    // value (2^n)+1

    var map = [];
    var nw = (wrap ? 0 : 1); // non-wrap flag

    // Create an empty 2D array, size × size,
    for (var i = 0; i < MAP_SIZE; i++) {
      map[i] = [];
    }

    // Initialize the corners of the map
    map[0][0] = low + this.rng.rand() * (high - low); // top left
    map[0][MAP_SIZE - 1] = low + this.rng.rand() * (high - low); // bottom left
    map[MAP_SIZE - 1][0] = low + this.rng.rand() * (high - low); // top right
    map[MAP_SIZE - 1][MAP_SIZE - 1] = low + this.rng.rand() * (high - low); // bottom right

    var h = low + (high - low) / 2; // the range (-h -> +h) for the average offset

    // side length is distance of a single square side
    // or distance of diagonal in diamond
    for (var sideLength = MAP_SIZE - 1;
      // side length must be >= 2 so we always have
      // a new value (if its 1 we overwrite existing values
      // on the last iteration)
      sideLength >= 2;
      // each iteration we are looking at smaller squares
      // diamonds, and we decrease the variation of the offset
      sideLength /= 2, h /= 2.0) {
      // half the length of the side of a square
      // or distance from diamond center to one corner
      // (just to make calcs below a little clearer)
      var halfSide = sideLength / 2;

      // generate the new square values
      for (var x = 0; x < MAP_SIZE - 1; x += sideLength) {
        for (var y = 0; y < MAP_SIZE - 1; y += sideLength) {
          // x, y is upper left corner of square
          // calculate average of existing corners
          var avg = map[x][y] + //top left
            map[x + sideLength][y] + // top right
            map[x][y + sideLength] + // lower left
            map[x + sideLength][y + sideLength]; // lower right
          avg /= 4.0;

          // center is average plus random offset
          map[x + halfSide][y + halfSide] = this.normalize(avg + this.offset(h, roughness), low, high);
        } // for y
      } // for x

      // generate the diamond values
      // since the diamonds are staggered we only move x
      // by half side
      // NOTE: if the map shouldn't wrap then x < MAP_SIZE
      // to generate the far edge values
      for (var x = 0; x < MAP_SIZE - 1 + nw; x += halfSide) {
        // and y is x offset by half a side, but moved by
        // the full side length
        // NOTE: if the map shouldn't wrap then y < MAP_SIZE
        // to generate the far edge values
        for (var y = (x + halfSide) % sideLength; y < MAP_SIZE - 1 + nw; y += sideLength) {
          // x, y is center of diamond
          // note we must use mod  and add MAP_SIZE for subtraction
          // so that we can wrap around the array to find the corners
          var avg =
            map[(x - halfSide + MAP_SIZE - 1) % (MAP_SIZE - 1)][y] + // left of center
            map[(x + halfSide) % (MAP_SIZE - 1)][y] + // right of center
            map[x][(y + halfSide) % (MAP_SIZE - 1)] + // below center
            map[x][(y - halfSide + MAP_SIZE - 1) % (MAP_SIZE - 1)]; // above center

          avg /= 4.0;

          // new value = average plus random offset
          avg = this.normalize(avg + this.offset(h, roughness), low, high);
          // update value for center of diamond
          map[x][y] = avg;

          // wrap values on the edges
          if (wrap) {
            if (x == 0) map[MAP_SIZE - 1][y] = avg;
            if (y == 0) map[x][MAP_SIZE - 1] = avg;
          }
        } // for y
      } // for x
    } // for sideLength

    // return the map
    return map;
  } // heightmap

  // Return a random offset scaled on height
  offset(height, roughness) {
    // We calculate random value in range of 2h
    // and then subtract h so the end value is
    // in the range (-h, +h)
    return (this.rng.rand() * 2 - 1) * height * roughness;
  } // offset

  // Normalize the value to make sure its within bounds
  normalize(value, low, high) {
    return Math.max(Math.min(value, high), low);
  } // normalize
} // DiamondSquare