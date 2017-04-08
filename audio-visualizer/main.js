window.onload = function() {
  // var c = document.getElementById('canvas');
  // var cw;
  // var ch;
  // c.width = cw = window.innerWidth;
  // c.height = ch = window.innerHeight;
  // var ctx = c.getContext('2d');

  var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  var Loader = function(url) {
    this.url = url;
  };

  Loader.prototype.loadBuffer = function() {
    var loader, request;
    loader = this;
    request = new XMLHttpRequest();
    request.open('GET', this.url, true);
    request.responseType = 'arraybuffer';

    request.onload = function() {
      audioCtx.decodeAudioData(this.response, function(buffer) {
        if (!buffer) {
          console.log('error');
          return;
        }
        loader.playSound(buffer);
      }, function(error) {
        console.log('decodeAudioData error');
      });
    };

    request.onerror = function() {
      console.log('Loader: XHR error');
    };

    request.send();
  };

  Loader.prototype.playSound = function(buffer) {
    var visualizer = new Visualizer(buffer);
  };

  var Visualizer = function(buffer) {
    this.sourceNode = audioCtx.createBufferSource();
    this.sourceNode.buffer = buffer;
    this.analyserNode = audioCtx.createAnalyser();
    this.times = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.sourceNode.connect(this.analyserNode);
    this.analyserNode.connect(audioCtx.destination);
    // this.sourceNode.start(0);
    // this.draw();
    this.render()
  };

  Visualizer.prototype.draw = function() {
    this.analyserNode.smoothingTimeConstant = 0.5;
    this.analyserNode.fftSize = 2048;
    this.analyserNode.getByteTimeDomainData(this.times);
    var barWidth = cw / this.analyserNode.frequencyBinCount;
    ctx.fillStyle = 'rgba(0, 0, 0, 1)';
    ctx.fillRect(0, 0, cw, ch);
    for (var i = 0; i < this.analyserNode.frequencyBinCount; ++i) {
      var value = this.times[i];
      var percent = value / 255;
      var height = ch * percent;
      var offset = ch - height;
      ctx.fillStyle = '#fff';
      ctx.fillRect(i * barWidth, offset, barWidth, 2);
    }
    window.requestAnimationFrame(this.draw.bind(this));
  };

  Visualizer.prototype.render = function () {
    var scene, camera, renderer
    var geometry, material, mesh
    scene = new THREE.Scene()
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 5000 );
    camera.position.x = 30
    camera.position.y = 30
    camera.position.z = 30
    camera.lookAt(scene.position)

    renderer = new THREE.WebGLRenderer()
    renderer.setClearColor(new THREE.Color(0x000000));
    renderer.setSize(window.innerWidth, window.innerHeight)

    var axes = new THREE.AxisHelper(20)
    scene.add(axes)

    createBox()

    document.getElementById('wrap').appendChild(renderer.domElement)
    renderer.render(scene, camera)

    animate()
    function animate () {
      requestAnimationFrame(animate)
      // mesh.position.x += 0.1
      mesh.rotation.y += 0.1
      renderer.render(scene, camera)
    }

    function createBox () {
      var box = new THREE.BoxGeometry(10, 10, 10)
      var boxMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF })
      mesh = new THREE.Mesh(box, boxMaterial)
      mesh.position.x = 0
      mesh.position.y = 0
      mesh.position.z = 0
      scene.add(mesh)
    }

    function createSphere () {
      var sphere = new THREE.SphereGeometry(10, 10, 10)
      var sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF})
      mesh = new THREE.Mesh(sphere, sphereMaterial)
      mesh.position.x = 0
      mesh.position.y = 0
      mesh.position.z = 0
      scene.add(mesh)
    }
  }

  var setUpRAF = function() {
    var requestAnimationFrame = window.requestAnimationFrame ||
                                window.mozRequestAnimationFrame ||
                                window.webkitRequestAnimationFrame ||
                                window.msRequestAnimationFrame;
    window.requestAnimationFrame = requestAnimationFrame;
  };

  setUpRAF();
  var loader = new Loader('./ME!ME!ME!-184271261.mp3')
  loader.loadBuffer()
}
