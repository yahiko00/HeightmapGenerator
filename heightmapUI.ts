/// <reference path="heightmap.ts"/>
/// <reference path="Scripts/jquery/jquery.d.ts"/>
/// <reference path="Scripts/three/three.d.ts"/>
/// <reference path="Scripts/three/Detector.d.ts"/>
/// <reference path="Scripts/three/FirstPersonControls.d.ts"/>
/// <reference path="Scripts/three/Stats.d.ts"/>

class HeightmapUI extends Heightmap {
  colors: string;
  view2D: HTMLElement;
  view3D: HTMLElement;
  fullscreen3D: boolean;
  view3DInitWidth: string;
  view3DInitHeight: string;

  constructor(dimX: number, dimY: number, lowValue: number = 0, highValue: number = 255, wrap: boolean = false, algo: string = "diamondSquare", algoOptions = { roughness: 2 }, smooth?: string, smoothOptions?: any, colors: string = "heightmap") {
    super(dimX, dimY, lowValue, highValue, wrap, algo, algoOptions, smooth, smoothOptions);
    this.colors = colors;
    this.fullscreen3D = false;
  } // constructor

  // Draw the map in 2D on a HTML Canvas
  draw2D(event: BaseJQueryEventObject) {
    console.time("draw2D");

    var heightmap = <HeightmapUI>event.data;

    var canvas = document.createElement("canvas");
    canvas.width = heightmap.dimX;
    canvas.height = heightmap.dimY;

    var ctx = canvas.getContext("2d"),
      img = ctx.createImageData(canvas.width, canvas.height),
      r = 0, g = 0, b = 0, gamma = 500,
      colorFill = { r: 0, g: 0, b: 0 };

    // colormap colors
    var waterStart = { r: 10, g: 20, b: 40 },
      waterEnd = { r: 39, g: 50, b: 63 },
      grassStart = { r: 22, g: 38, b: 3 },
      grassEnd = { r: 67, g: 100, b: 18 },
      mtnStart = { r: 67, g: 80, b: 18 },
      mtnEnd = { r: 60, g: 56, b: 31 },
      rocamtStart = { r: 90, g: 90, b: 90 },
      rocamtEnd = { r: 130, g: 130, b: 130 },
      snowStart = { r: 200, g: 200, b: 200 },
      snowEnd = { r: 255, g: 255, b: 255 };

    var pixel = 0;
    for (var y = 0; y < heightmap.dimY; y++) {
      for (var x = 0; x < heightmap.dimX; x++) {
        colorFill = { r: 0, g: 0, b: 0 };

        switch (heightmap.colors) {
          case "colorMap":
            var data = (heightmap.map[x][y] - heightmap.lowValue) / (heightmap.highValue - heightmap.lowValue);
            if (data >= 0 && data <= 0.3) {
              colorFill = fadeColor(waterStart, waterEnd, 30, Math.round(data * 100));
            } else if (data > 0.3 && data <= 0.7) {
              colorFill = fadeColor(grassStart, grassEnd, 40, Math.round(data * 100) - 30);
            } else if (data > 0.7 && data <= 0.95) {
              colorFill = fadeColor(mtnStart, mtnEnd, 25, Math.round(data * 100) - 70);
            } else if (data > 0.95 && data <= 1) {
              colorFill = fadeColor(rocamtStart, rocamtEnd, 5, Math.round(data * 100) - 95);
            }
            break;
          case "heightmap": // Standard Gray Scale
            var standardShade = Math.round(heightmap.map[x][y]);
            colorFill = { r: standardShade, g: standardShade, b: standardShade };
            break;
          case "10ShadesMap": // 10 shades
            var data = (heightmap.map[x][y] - heightmap.lowValue) / (heightmap.highValue - heightmap.lowValue);
            var grayShade = Math.round(~~(data * 100) / 25) * 25;
            colorFill = { r: grayShade, g: grayShade, b: grayShade };
            break;
          case "2ShadesMap": // 2 shades
            var data = heightmap.map[x][y];
            if (data <= heightmap.lowValue + (heightmap.highValue - heightmap.lowValue) / 2) {
              data = 0;
            }
            else {
              data = 220;
            }
            colorFill = { r: data, g: data, b: data };
            break;
          case "plasmaMap": // Plasma
            // Section of code modified from http://www.hyper-metrix.com/processing-js/docs/index.php?page=Plasma%20Fractals
            var data = (heightmap.map[x][y] - heightmap.lowValue) / (heightmap.highValue - heightmap.lowValue);

            if (data < 0.5) {
              r = data * gamma;
            } else {
              r = (1.0 - data) * gamma;
            }

            if (data >= 0.3 && data < 0.8) {
              g = (data - 0.3) * gamma;
            } else if (data < 0.3) {
              g = (0.3 - data) * gamma;
            } else {
              g = (1.3 - data) * gamma;
            }

            if (data >= 0.5) {
              b = (data - 0.5) * gamma;
            } else {
              b = (0.5 - data) * gamma;
            }
            colorFill = { r: ~~r, g: ~~g, b: ~~b };
            break;
        } // case

        img.data[pixel++] = colorFill.r;
        img.data[pixel++] = colorFill.g;
        img.data[pixel++] = colorFill.b;
        img.data[pixel++] = 255; // opaque alpha
      } // for x
    } // for y

    ctx.putImageData(img, 0, 0);

    heightmap.view2D.innerHTML = "";
    heightmap.view2D.appendChild(canvas);

    console.timeEnd("draw2D");
  } // draw2D

  // Generate the heightmap and draw it on a HTML Canvas
  refresh(event: BaseJQueryEventObject) {
    var heightmap = event.data;

    heightmap.generate();

    heightmap.draw2D(event);
    //heightmap.draw3D(event);
  } // refresh

  // Export the heightmap as a PNG file
  exportAsPNG(event: BaseJQueryEventObject) {
    var heightmap = event.data;

    if (heightmap.canvas) {
      var imgURL = heightmap.canvas.toDataURL("image/png");
      document.write('<img src="' + imgURL + '"/>');
    }
  } // exportAsPNG

  // Draw the map in 3D with WebGL
  draw3D(event: BaseJQueryEventObject) {
    console.time("draw3D");

    var heightmap = <HeightmapUI>event.data;

    // WebGL compatibility check
    if (!Detector.webgl) {
      Detector.addGetWebGLMessage();
      heightmap.view3D.innerHTML = "";
    }

    // Initialization
    var worldWidth = heightmap.dimX;
    var worldDepth = heightmap.dimY;
    var worldHalfWidth = ~~(worldWidth / 2);
    var worldHalfDepth = ~~(worldDepth / 2);
    var clock = new THREE.Clock();
    var scene = new THREE.Scene();

    var data = heightmap.linearMap();

    // Camera
    var camera = new THREE.PerspectiveCamera(60, heightmap.view3D.clientWidth / heightmap.view3D.clientHeight, 1, 20000);
    camera.position.y = data[worldHalfWidth + worldHalfDepth * worldWidth] * 10 + 500;

    // Raw terrain
    var geometry = new THREE.PlaneGeometry(7500, 7500, worldWidth - 1, worldDepth - 1);
    geometry.applyMatrix(new THREE.Matrix4().makeRotationX(- Math.PI / 2));
    for (var i = 0, l = geometry.vertices.length; i < l; i++) {
      geometry.vertices[i].y = data[i] * 10;
    } // for i

    // Texture
    var texture = new THREE.Texture(generateTexture(data, worldWidth, worldDepth),
      new THREE.UVMapping(), THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping);
    texture.needsUpdate = true;

    var mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ map: texture }));
    scene.add(mesh);

    // Renderer
    var renderer = new THREE.WebGLRenderer();
    renderer.setClearColor(0xbfd1e5);
    renderer.setSize(heightmap.view3D.clientWidth, heightmap.view3D.clientHeight);

    // Controller
    var controls = new THREE.FirstPersonControls(camera);
    controls.movementSpeed = 500;
    controls.lookSpeed = 0.1;

    heightmap.view3D.innerHTML = "";
    heightmap.view3D.appendChild(renderer.domElement);
    $(heightmap.view3D).css("visibility", "visible")

    // Statistics
    var stats = new Stats();
    stats.domElement.id = "stats3D";
    heightmap.view3D.appendChild(stats.domElement);

    // Buttons
    $(heightmap.view3D).append("<div id='buttons3D'></div>");

    // Close button
    $("#buttons3D").append("<div id='close3D'></div>");
    $("#close3D").on("click", heightmap, heightmap.close3D);

    // Screensize button
    $("#buttons3D").append("<div id='screensize3D'></div>");
    $("#screensize3D").on("click", heightmap, heightmap.toggleScreensize3D);

    // Help
    $(heightmap.view3D).append("<div id='help3D'>H. Move: W, A, S, D<br />V. Move: R, F<br />Look: arrow keys</div>");

    $(window).on("resize", { map:heightmap, camera: camera }, onWindowResize);

    animate();

    console.timeEnd("draw3D");

    function onWindowResize(event: BaseJQueryEventObject) {
      var heightmap = event.data.map;
      var camera = event.data.camera;

      camera.aspect = heightmap.view3D.clientWidth / heightmap.view3D.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(heightmap.view3D.clientWidth, heightmap.view3D.clientHeight);
      controls.handleResize();
    } // onWindowResize

    function generateTexture(data, width, height) {
      var sun = new THREE.Vector3(1, 1, 1);
      sun.normalize();

      var canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      var context = canvas.getContext("2d");
      context.fillStyle = "#000";
      context.fillRect(0, 0, width, height);

      var image = context.getImageData(0, 0, canvas.width, canvas.height);
      var imageData = image.data;

      var colorFill: RGB;
      // colormap colors
      var waterStart = { r: 10, g: 20, b: 40 },
        waterEnd = { r: 39, g: 50, b: 63 },
        grassStart = { r: 22, g: 38, b: 3 },
        grassEnd = { r: 67, g: 100, b: 18 },
        mtnStart = { r: 67, g: 80, b: 18 },
        mtnEnd = { r: 60, g: 56, b: 31 },
        rocamtStart = { r: 90, g: 90, b: 90 },
        rocamtEnd = { r: 130, g: 130, b: 130 },
        snowStart = { r: 200, g: 200, b: 200 },
        snowEnd = { r: 255, g: 255, b: 255 };

      var level, diff, shade;
      var vector3 = new THREE.Vector3(0, 0, 0);
      for (var i = 0, j = 0, l = imageData.length; i < l; i += 4, j++) {
        vector3.x = data[j - 2] - data[j + 2];
        vector3.y = 2;
        vector3.z = data[j - width * 2] - data[j + width * 2];
        vector3.normalize();

        shade = vector3.dot(sun);

        if (data[j] < 255 * 0.3) { // Water
          colorFill = fadeColor(waterStart, waterEnd, 76, data[j]);
        } else if (data[j] < 255 * 0.7) { // grass
          colorFill = fadeColor(grassStart, grassEnd, 102, data[j] - 76);
        } else if (data[j] < 255 * 0.95) { // mountain
          colorFill = fadeColor(mtnStart, mtnEnd, 64, data[j] - 178);
        } else { // snow
          colorFill = fadeColor(rocamtStart, rocamtEnd, 127, data[j] - 242);
        }

        imageData[i] = (colorFill.r + shade * 128) * (0.5 + data[j] * 0.007);
        imageData[i + 1] = (colorFill.g + shade * 96) * (0.5 + data[j] * 0.007);
        imageData[i + 2] = (colorFill.b + shade * 96) * (0.5 + data[j] * 0.007);
      } // for i

      context.putImageData(image, 0, 0);

      // Scaled 4x
      var canvasScaled = document.createElement("canvas");
      canvasScaled.width = width * 4;
      canvasScaled.height = height * 4;

      context = canvasScaled.getContext("2d");
      context.scale(4, 4);
      context.drawImage(canvas, 0, 0);

      image = context.getImageData(0, 0, canvasScaled.width, canvasScaled.height);
      imageData = image.data;

      for (var i = 0, l = imageData.length; i < l; i += 4) {
        var v = ~~(Math.random() * 5);

        imageData[i] += v;
        imageData[i + 1] += v;
        imageData[i + 2] += v;
      } // for i

      context.putImageData(image, 0, 0);

      return canvasScaled;
    } // generateTexture

    function animate() {
      requestAnimationFrame(animate);

      render();
      stats.update();
    } // animate

    function render() {
      controls.update(clock.getDelta());
      renderer.render(scene, camera);
    } // render
  } // draw3D

  toggleScreensize3D(event: BaseJQueryEventObject) {
    var heightmap = <HeightmapUI>event.data;

    if (heightmap.fullscreen3D) {
      $(heightmap.view2D).css("visibility", "visible");
      $("#parameters").css("visibility", "visible");
      $("#close3D").css("visibility", "visible");
      $(heightmap.view3D).css("width", heightmap.view3DInitWidth);
      $(heightmap.view3D).css("height", heightmap.view3DInitHeight);
    }
    else {
      $(heightmap.view2D).css("visibility", "hidden");
      $("#parameters").css("visibility", "hidden");
      $("#close3D").css("visibility", "hidden");
      $(heightmap.view3D).css("width", "100%");
      $(heightmap.view3D).css("height", "100%");
    }

    heightmap.fullscreen3D = !heightmap.fullscreen3D;
    $(window).trigger("resize");
  } // toggleScreensize3D

  close3D(event: BaseJQueryEventObject) {
    var heightmap = <HeightmapUI>event.data;
    $(heightmap.view3D).css("visibility", "hidden")
    heightmap.view3D.innerHTML = "";
  } // close3D
} // HeightmapUI

interface RGB {
  r: number;
  g: number;
  b: number;
} // RGB

function fadeColor(startColor: RGB, endColor: RGB, steps: number, step: number): RGB {
  var scale = step / steps;
  var r = startColor.r + scale * (endColor.r - startColor.r);
  var b = startColor.b + scale * (endColor.b - startColor.b);
  var g = startColor.g + scale * (endColor.g - startColor.g);

  return { r: r, g: g, b: b }
} // fadeColor

window.onload = () => {
  heightmap.view2D = <HTMLElement>document.getElementById("view2D");
  heightmap.view3D = <HTMLElement>document.getElementById("view3D");
  heightmap.view3DInitWidth = $(heightmap.view3D).css("width");
  heightmap.view3DInitHeight = $(heightmap.view3D).css("height");

  // Default value on parameters
  $("#seed").val(heightmap.seed.toString());
  $("#width").val(heightmap.dimX.toString());
  if (heightmap.wrap) $("#wrapYes").attr("checked", "checked");
  else $("#wrapNo").attr("checked", "checked");
  $("#height").val(heightmap.dimY.toString());
  $("#colors").val(heightmap.colors.toString());
  $("#method").val(heightmap.algo);
  if (!heightmap.algoOptions) {
    heightmap.algoOptions = {};
    $("#roughness").val("0");
  }
  else {
    $("#roughness").val(heightmap.algoOptions.roughness ? heightmap.algoOptions.roughness : "0");
  }
  $("#smooth").val(heightmap.smooth ? heightmap.smooth : "none");
  if (!heightmap.smoothOptions) {
    heightmap.smoothOptions = {};
    $("#smoothIter").val("0");
    $("#smoothRadius").val("0");
  }
  else {
    $("#smoothIter").val(heightmap.smoothOptions.iteration ? heightmap.smoothOptions.iteration : "0");
    $("#smoothRadius").val(heightmap.smoothOptions.radius ? heightmap.smoothOptions.radius : "0");
  }

  // Listeners on change
  $("#seed").on("change", heightmap, changeSeed);
  $("#seedTime").on("click", heightmap, setSeed);
  $("#width").on("change", heightmap, changeDimX);
  $("#height").on("change", heightmap, changeDimY);
  $("#roughness").on("change", heightmap, changeRoughness);
  $("#smoothType").on("change", heightmap, changeSmoothType);
  $("#smoothIter").on("change", heightmap, changeSmoothIter);
  $("#smoothRadius").on("change", heightmap, changeSmoothRadius);
  $("#generate").on("click", heightmap, heightmap.refresh);
  $("#seedGenerate").on("click", heightmap, seedGenerate);

  $("#colors").on("change", heightmap, changeMapType);
  $("#applyColors").on("click", heightmap, heightmap.draw2D);

  $("#display3D").on("click", heightmap, heightmap.draw3D);

  $("#generate").trigger("click");
};

var hexDigits = new Array
  ("0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f");

function hex(x) {
  return isNaN(x) ? "00" : hexDigits[(x - x % 16) / 16] + hexDigits[x % 16];
}

function rgb2hex(rgb: string): string {
  var match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  function hex(x) {
    return ("0" + parseInt(x).toString(16)).slice(-2);
  }
  return hex(match[1]) + hex(match[2]) + hex(match[3]);
}

function hex2rgb(hex: string): string {
  var r = parseInt(hex.substr(0, 2), 16);
  var g = parseInt(hex.substr(2, 2), 16);
  var b = parseInt(hex.substr(4, 2), 16);
  return "rgb (" + r + ", " + g + ", " + b + ")";
}

function changeSeed(event: BaseJQueryEventObject) {
  var target = <HTMLInputElement>event.target;
  var value = parseInt(target.value);
  var heightmap = <HeightmapUI>event.data;
  heightmap.seed = value;
}

function setSeed(event: BaseJQueryEventObject) {
  var seedHTML = <HTMLInputElement>document.getElementById("seed");
  seedHTML.value = Date.now().toString();
  event.target = seedHTML;
  changeSeed(event);
}

function changeDimX(event: BaseJQueryEventObject) {
  var target = <HTMLInputElement>event.target;
  var value = parseInt(target.value);
  var heightmap = <HeightmapUI>event.data;
  heightmap.dimX = value;
}

function changeDimY(event: BaseJQueryEventObject) {
  var target = <HTMLInputElement>event.target;
  var value = parseInt(target.value);
  var heightmap = <HeightmapUI>event.data;
  heightmap.dimY = value;
}

function changeRoughness(event: BaseJQueryEventObject) {
  var target = <HTMLInputElement>event.target;
  var value = parseFloat(target.value);
  var heightmap = <HeightmapUI>event.data;
  heightmap.algoOptions.roughness = value;
}

function changeSmoothType(event: BaseJQueryEventObject) {
  var target = <HTMLSelectElement>event.target;
  var value = target.value;
  var heightmap = <HeightmapUI>event.data;
  heightmap.smooth = value;
}

function changeSmoothIter(event: BaseJQueryEventObject) {
  var target = <HTMLInputElement>event.target;
  var value = parseInt(target.value);
  var heightmap = <HeightmapUI>event.data;
  heightmap.smoothOptions.iteration = value;
}

function changeSmoothRadius(event: BaseJQueryEventObject) {
  var target = <HTMLInputElement>event.target;
  var value = parseInt(target.value);
  var heightmap = <HeightmapUI>event.data;
  heightmap.smoothOptions.radius = value;
}

function changeMapType(event: BaseJQueryEventObject) {
  var target = <HTMLSelectElement>event.target;
  var value = target.value;
  var heightmap = <HeightmapUI>event.data;
  heightmap.colors = value;
}

function seedGenerate(event: BaseJQueryEventObject) {
  setSeed(event);
  heightmap.refresh(event);
}

var heightmap = new HeightmapUI(257, 257, 0, 255, false, "diamondSquare", { roughness: 2 }, null, null, "heightmap");
