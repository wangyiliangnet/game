requirejs.config({
  paths: {
    jquery: 'lib/jquery',
    three: 'vendor/three',
    OrbitControls: 'lib/OrbitControls',
    stats: 'lib/stats.min'
  },
  shim: {
  	'three': {
  		exports: 'THREE'
  	},
  	'OrbitControls' : {
  		deps: ['three'],
  		exports: 'THREE.OrbitControls'
  	},
  	'stats': {
  		deps: ['three'],
  		exports: 'Stats'
  	}
  }
});
define(['jquery', 'three', 'OrbitControls', 'stats'],function($, THREE){
	conf = {
		INV_MAX_FPS: 1 / 50,
		menu_cursor: '../image/menu_cursor.ico'
	}
	
	var $container,
		scene, camera, renderer, controls, light, stats;

	var init = function() {
		$(document.body).append('<div id="container"></div>');
		$container = $(document.body).find('#container');

		scene = new THREE.Scene();
		camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.5, 3000000);
		light = new THREE.HemisphereLight(0xffffbb, 0x080820, 1);
		light.position.set(-1, 1, -1);

		scene.add(light);

		renderer = new THREE.WebGLRenderer({antialias: true});
		renderer.setPixelRatio (window.devicePixelRatio);
		renderer.setSize(window.innerWidth, window.innerHeight);

		$container.append(renderer.domElement);

		controls = new THREE.OrbitControls(camera, renderer.domElement);
		controls.userPan = false;
		controls.userPanSpeed = 0.0;
		controls.maxDistance = 5000.0;
		controls.maxPolarAngle = Math.PI * 0.5;
		controls.center.set(0, 100, 0);

		stats = new Stats();
		$(stats.domElement).css({'position': 'absolute', 'top': '0px'});
		$container.append(stats.domElement);

		loadingPgae.init();
		loadingPgae.animate();
	}

	var loadingPgae = (function(){
		var skyboxMap, skybgMap, getSide, loader, loadMap, skyboxShader, skybgShader, skyboxMaterial, skybgMaterial, skybox, skybg, frameDelta, clock;
		var init = function() {
			skyboxMap = new THREE.CubeTexture([]);
			skybgMap = new THREE.CubeTexture([]);

			skyboxMap.flipY = false;
			skybgMap.flipY = false;

			loader = new THREE.ImageLoader();

			getSide = function(x, y, image){
				var size = 1024;
				var canvas = document.createElement('canvas'),
					context = canvas.getContext('2d');
				canvas.width = size;
				canvas.height = size;
				context.drawImage(image, -x * size, -y * size);
				return canvas;
			}

			loadMap = function(textureImage, map){
				map.image[0] = getSide(2, 0, textureImage);
				map.image[1] = getSide(0, 0, textureImage);
				map.image[2] = getSide(1, 1, textureImage);
				map.image[3] = getSide(0, 1, textureImage);
				map.image[4] = getSide(1, 0, textureImage);
				map.image[5] = getSide(2, 1, textureImage);
				map.needsUpdate = true;
			}

			loader.load('../texture/sky.png', function(image){
				loadMap(image, skyboxMap);
			});
			loader.load('../texture/skybg.png', function(image){
				loadMap(image, skybgMap);
			});

			skyboxShader = THREE.ShaderLib['cube'];
			skyboxShader.uniforms['tCube'].value = skyboxMap;
			skyboxMaterial = new THREE.ShaderMaterial({
				fragmentShader: skyboxShader.fragmentShader,
				vertexShader: skyboxShader.vertexShader,
				uniforms: skyboxShader.uniforms,
				depthWrite: false,
				side: THREE.BackSide
			});	
			skyboxMaterial.transparent = true;
			skyboxMaterial.blending = THREE.NormalBlending;

			skybgShader = THREE.ShaderLib['bgcube'];
			skybgShader.uniforms['tCube'].value = skybgMap;
			skybgMaterial = new THREE.ShaderMaterial({
				fragmentShader: skybgShader.fragmentShader,
				vertexShader: skybgShader.vertexShader,
				uniforms: skybgShader.uniforms,
				depthWrite: false,
				side: THREE.BackSide
			});	

			skybox = new THREE.Mesh(new THREE.BoxGeometry(100000, 100000, 100000), skyboxMaterial);
			skybg = new THREE.Mesh(new THREE.BoxGeometry(200000, 200000, 200000), skybgMaterial);

			scene.add(skybox);
			scene.add(skybg);

			$container.css('cursor', 'url(' + conf.menu_cursor + '), default');
		}

		frameDelta = 0;
		clock = new THREE.Clock();
		var render = function() {
			controls.update();
			renderer.render(scene, camera);
		}
		var animate = function(){
			var delta = clock.getDelta();
			frameDelta += delta;
			while(frameDelta >= conf.INV_MAX_FPS){
				skybox.rotation.y -= 0.0005;
				frameDelta -= conf.INV_MAX_FPS;
			}
			requestAnimationFrame(animate);
			
			stats.update();
			render();
		}
		return {
			init: init,
			animate: animate
		}
	})();

	return {
		init: init
	};
});
