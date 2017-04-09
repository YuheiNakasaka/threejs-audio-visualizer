window.onload = function() {
  var CLIENT_ID = '8c84b738e4c67d1a091e59acf04b90be'
  var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  var ee = new EventEmitter();
  var loader, timer;
  var scene, camera, renderer;

  /******* audio manager *******/
  var Loader = function() {};

  Loader.prototype.playSound = function(buffer) {
    var visualizer = new Visualizer(buffer);
  };

  Loader.prototype.fetchTrack = function() {
    var tracklists = ["anime", 'Alternative Rock', 'Ambient', 'Classical', 'Country', 'Dance & EDM', 'Dancehall', 'Deep House', 'Disco', 'Drum & Bass', 'Dubstep', 'Electronic', 'Folk & Singer-Songwriter', 'Hip-hop & Rap', 'House', 'Indie', 'Jazz & Blues', 'Latin', 'Metal', 'Piano', 'Pop', 'R&B & Soul', 'Reggae', 'Reggaeton', 'Rock', 'Soundtrack', 'Techno', 'Trance', 'Trap', 'Triphop', 'World'];
    var genre = tracklists[ Math.floor( Math.random() * (tracklists.length - 1) ) ];

    SC.initialize({
      client_id: CLIENT_ID
    });

    SC.get('/tracks', {
      genres: genre,
      license: 'cc-by-sa'
    }).then(function(tracks) {
      console.log(tracks);
      console.log(Math.floor(Math.random()*(tracks.length-1)))
      var track = tracks[Math.floor(Math.random()*(tracks.length-1))]
      ee.emitEvent('completeSearchTrack', [track])
    });
  }

  ee.addListener('setupTrackInfo', function(track) {
    document.getElementById('track-name').innerText = track.title + ' - ' + track.user.username
    document.getElementById('track-link').setAttribute('href', track.permalink_url)
  })

  ee.addListener('completeSearchTrack', function(track){
    console.log('complete')
    var url = new URL(track.stream_url + '?client_id=' + CLIENT_ID);
    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.responseType = 'arraybuffer';
    request.onload = function() {
      audioCtx.decodeAudioData(this.response, function(buffer) {
        if (!buffer) {
          console.log('error');
          return;
        }
        ee.emitEvent('setupTrackInfo', [track]);
        loader.playSound(buffer);
      }, function(error) {
        console.log('decodeAudioData error');
        ee.emitEvent('setupTrackInfo', [{title: 'Error', user: {username: 'please reload!'}}])
        loader.fetchTrack()
      });
    };
    request.onerror = function() {
      console.log('Loader: XHR error');
      ee.emitEvent('setupTrackInfo', [{title: 'Error', user: {username: 'please reload!'}}])
      loader.fetchTrack()
    };
    request.send();
  })

  /******* rendering manager *******/
  var Visualizer = function(buffer) {
    var visualizer = this
    this.sourceNode = audioCtx.createBufferSource();
    this.sourceNode.buffer = buffer;
    this.analyserNode = audioCtx.createAnalyser();
    this.times = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.sourceNode.connect(this.analyserNode);
    this.analyserNode.connect(audioCtx.destination);
    this.sourceNode.start(0);
    this.render()

    this.sourceNode.onended = function() {
      console.log('ended');
      visualizer.sourceNode.stop();
      cancelAnimationFrame(timer);
      document.getElementById('track-name').innerHTML = '<img src="loading.svg">'
      setTimeout(function(){
        loader.fetchTrack()
      }, 2000)
    }
  };

  Visualizer.prototype.render = function () {
    var that = this
    if (!scene) {
      scene = new THREE.Scene()
    }
    if (!camera) {
      camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1000 );
      camera.position.x = 0
      camera.position.y = 0
      camera.position.z = 100
      camera.lookAt(scene.position)
    }
    if (!renderer) {
      renderer = new THREE.WebGLRenderer()
      renderer.setClearColor(new THREE.Color(0x000000));
      renderer.setSize(window.innerWidth, window.innerHeight)
    }

    createParticles()

    document.getElementById('wrap').appendChild(renderer.domElement)
    renderer.render(scene, camera)

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
        } else if (180 > value && value > 140) {
          child.material.color.r = 0
          child.material.color.g = 255
          child.material.color.b = 0
        } else if (140 > value && value > 100) {
          child.material.color.r = 0
          child.material.color.g = 0
          child.material.color.b = 255
        } else {
          child.material.color.r = 255
          child.material.color.g = 255
          child.material.color.b = 255
        }
        child.position.z = (value-128)
      }
      timer = requestAnimationFrame(animate)
      renderer.render(scene, camera)
    }

    function createParticles () {
      if (scene.children.length === 0) {
        var material = new THREE.SpriteMaterial({color: 0xe0ffff})
        for (var i = 0; i < 2; i++) {
          for (var j = -64; j < 64; j++) {
            var sprite = new THREE.Sprite(material)
            sprite.position.set(j, [-1,1][i]*30, 0)
            scene.add(sprite)
          }
        }
      }
    }
  }

  /******* setup before starting *******/
  var init = function() {
    var requestAnimationFrame = window.requestAnimationFrame ||
                                window.mozRequestAnimationFrame ||
                                window.webkitRequestAnimationFrame ||
                                window.msRequestAnimationFrame;
    window.requestAnimationFrame = requestAnimationFrame;

    var cancelAnimationFrame = window.cancelAnimationFrame ||
                               window.mozCancelAnimationFrame ||
                               window.webkitCancelAnimationFrame ||
                               window.msCancelAnimationFrame;
    window.cancelAnimationFrame = cancelAnimationFrame;
  };

  init();
  document.getElementById('play').addEventListener('click', function(){
    document.getElementById('header-wrap').setAttribute('style', 'display:none;')
    document.getElementById('footer').setAttribute('style', 'display:none;')
    document.getElementById('play').innerHTML = '<img src="loading.svg">'
    loader = new Loader()
    loader.fetchTrack()
  })
}
