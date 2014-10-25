// ******************
// Box Blur algorithm
// See: http://blog.ivank.net/fastest-gaussian-blur.html
function boxBlur(map, radius) {
    var dimX = map.length;
    var dimY = map[0].length;
    var result = [];
    var line = [];
    for (var i = 0; i < dimX; i++) {
        line = [];
        for (var j = 0; j < dimY; j++) {
            var val = 0;
            for (var iy = j - radius; iy < j + radius + 1; iy++) {
                for (var ix = i - radius; ix < i + radius + 1; ix++) {
                    var x = Math.min(dimX - 1, Math.max(0, ix));
                    var y = Math.min(dimY - 1, Math.max(0, iy));
                    val += map[x][y];
                }
            }
            line.push(val / ((radius + radius + 1) * (radius + radius + 1)));
        }
        result.push(line);
    }
    return result;
} // boxBlur
//# sourceMappingURL=boxblur.js.map