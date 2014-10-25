// ******************
// Box Blur algorithm
// See: http://blog.ivank.net/fastest-gaussian-blur.html
function boxBlur(map: number[][], radius: number): number[][]{
  var dimX = map.length;
  var dimY = map[0].length;
  var result: number[][] = [];
  var line: number[] = [];

  for (var i = 0; i < dimX; i++) {
    line = [];
    for (var j = 0; j < dimY; j++) {
      var val = 0;
      for (var iy = j - radius; iy < j + radius + 1; iy++) {
        for (var ix = i - radius; ix < i + radius + 1; ix++) {
          var x = Math.min(dimX - 1, Math.max(0, ix));
          var y = Math.min(dimY - 1, Math.max(0, iy));
          val += map[x][y];
        } // for ix
      } // for iy
      line.push(val / ((radius + radius + 1) * (radius + radius + 1)));
    } // for j
    result.push(line);
  } // for i

  return result;
} // boxBlur
 