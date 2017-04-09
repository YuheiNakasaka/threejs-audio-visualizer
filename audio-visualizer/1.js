window.onload = function() {
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
    this.sourceNode.start(0);
    this.render()
  };

  Visualizer.prototype.render = function () {
    var scene, camera, renderer
    var geometry, material, mesh
    var orgPosition = []
    scene = new THREE.Scene()
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1000 );
    camera.position.x = 0
    camera.position.y = 0
    camera.position.z = 100
    camera.lookAt(scene.position)

    renderer = new THREE.WebGLRenderer()
    renderer.setClearColor(new THREE.Color(0x000000));
    renderer.setSize(window.innerWidth, window.innerHeight)

    createParticles()

    document.getElementById('wrap').appendChild(renderer.domElement)
    renderer.render(scene, camera)

    var that = this
    animate()
    function animate () {
      that.analyserNode.smoothingTimeConstant = 0.5;
      that.analyserNode.fftSize = 512;
      that.analyserNode.getByteTimeDomainData(that.times);
      for (var i = 0; i < that.analyserNode.frequencyBinCount; ++i) {
        var value = that.times[i];
        var child = scene.children[i]
        if (value > 180) {
          child.material.color.r = 255
          child.material.color.g = 0
          child.material.color.b = 0
          child.scale.x = (value / 255) * 10
          child.scale.y = (value / 255) * 10
          child.scale.z = (value / 255) * 10
        } else if (180 > value && value > 140) {
          child.material.color.r = 0
          child.material.color.g = 255
          child.material.color.b = 0
          child.scale.x = (value / 255) * 3
          child.scale.y = (value / 255) * 3
          child.scale.z = (value / 255) * 3
        } else if (140 > value && value > 100) {
          child.material.color.r = 0
          child.material.color.g = 0
          child.material.color.b = 255
          child.scale.x = (value / 255) * 2
          child.scale.y = (value / 255) * 2
          child.scale.z = (value / 255) * 2
        } else {
          child.material.color.r = 255
          child.material.color.g = 255
          child.material.color.b = 255
        }
        child.position.z = (value-128)
      }
      requestAnimationFrame(animate)
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

    function createParticles () {
      var material = new THREE.SpriteMaterial({color: 0xe0ffff})
      for (var x = -8; x < 8; x++) {
        for (var y = -8; y < 8; y++) {
          var sprite = new THREE.Sprite(material)
          sprite.position.set(x * 10, y * 10, 5)
          scene.add(sprite)
        }
      }
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
  // sound from https://soundcloud.com/smokezofficial/turn-down-for-what-parisian-version
  var loader = new Loader('./DJSnake-Turn-Down-for-What-(Parisian Version)-(no-rights-reserved!)-149855329.mp3')
  loader.loadBuffer()
}
