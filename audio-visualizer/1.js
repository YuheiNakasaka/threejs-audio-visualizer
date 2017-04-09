window.onload = function() {
  var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  var visualizer;
  var ee = new EventEmitter();
  var Loader = function(url) {
    this.url = url;
  };

  Loader.prototype.playSound = function(buffer) {
    if (visualizer !== undefined) {
      ee.emitEvent('publish')
    } else {
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
          visualizer = new Visualizer(buffer);
        }, function(error) {
          console.log('decodeAudioData error');
        });
      };

      request.onerror = function() {
        console.log('Loader: XHR error');
      };

      request.send();
    }
  };

  var Visualizer = function(buffer) {
    var that = this
    this.sourceNode = audioCtx.createBufferSource();
    this.sourceNode.buffer = buffer;
    this.analyserNode = audioCtx.createAnalyser();
    this.times = new Uint8Array(this.analyserNode.frequencyBinCount);

    if (isSP() === true) {
      console.log('sp');
      document.getElementById('play').setAttribute('style','display: inline-block')
      document.getElementById('loading-img').setAttribute('style','display: none;')
      ee.addListener('publish', function(){
        document.getElementById('info').setAttribute('style','display: none')
        document.getElementById('loading-img').setAttribute('style','display: none;')
        that.sourceNode.connect(that.analyserNode);
        that.analyserNode.connect(audioCtx.destination);
        that.sourceNode.start(0);
        that.render()
      })
    }

    if (isSP() === false) {
      console.log('pc');
      document.getElementById('info').setAttribute('style','display: none')
      document.getElementById('loading-img').setAttribute('style','display: inline-block;')
      this.sourceNode.connect(this.analyserNode);
      this.analyserNode.connect(audioCtx.destination);
      this.sourceNode.start(0);
      this.render()
    }
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

  function isSP () {
    if ((navigator.userAgent.indexOf('iPhone') > 0 &&
         navigator.userAgent.indexOf('iPad') == -1) ||
         navigator.userAgent.indexOf('iPod') > 0 ||
         navigator.userAgent.indexOf('Android') > 0) {
      return true;
    } else {
      return false;
    }
  }

  var init = function() {
    document.getElementById('playback-btn').setAttribute('style','width: '+window.innerWidth+'px')
    var requestAnimationFrame = window.requestAnimationFrame ||
                                window.mozRequestAnimationFrame ||
                                window.webkitRequestAnimationFrame ||
                                window.msRequestAnimationFrame;
    window.requestAnimationFrame = requestAnimationFrame;
  };

  init();

  document.getElementById('play').addEventListener('click', function(){
    document.getElementById('play').setAttribute('style','display: none')
    document.getElementById('loading-img').setAttribute('style','display: inline-block;')
    // sound from https://soundcloud.com/smokezofficial/turn-down-for-what-parisian-version
    var loader = new Loader('./DJSnake-Turn-Down-for-What-(ParisianVersion)-(no-rights-reserved!)-149855329.mp3')
    loader.playSound()
  })
}
