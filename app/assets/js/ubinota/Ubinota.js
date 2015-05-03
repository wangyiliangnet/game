requirejs.config({
  paths: {
    jquery: 'lib/jquery',
    three: 'vendor/three',
    OrbitControls: 'lib/OrbitControls',
    stats: 'lib/stats.min',
    EffectComposer: 'lib/EffectComposer',
    RenderPass: 'lib/RenderPass',
    ShaderPass: 'lib/ShaderPass',
    MaskPass: 'lib/MaskPass',
    TexturePass: 'lib/TexturePass',
    BasicShader: 'shader/BasicShader',
    CopyShader: 'shader/CopyShader',
    Physijs: 'lib/physi',
    OBJLoader: 'lib/OBJLoader',
    MTLLoader: 'lib/MTLLoader',
    OBJMTLLoader: 'lib/OBJMTLLoader'
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
  	},
  	'EffectComposer': {
  		deps: ['three'],
  		exports: 'EffectComposer'	
  	},
  	'RenderPass': {
  		deps: ['three'],
  		exports: 'RenderPass'	
  	},
    'ShaderPass': {
  		deps: ['three'],  		
  		exports: 'ShaderPass'
  	},  	
  	'TexturePass': {
  		deps: ['three'],
  		exports: 'TexturePass'  		  		
  	},  
  	'MaskPass': {
  		deps: ['three'],
  		exports: 'MaskPass'   
  	},
  	'BasicShader': {
  		deps: ['three'],
  		exports: 'BasicShader'    		  		
  	},  	
  	'CopyShader': {
  		deps: ['three'],
  		exports: 'CopyShader'   
  	},
  	'Physijs': {
  		deps: ['three'],
  		exports: 'Physijs'
  	},
  	'OBJLoader': {
  		deps: ['three']	
  	},
  	'MTLLoader': {
  		deps: ['three']
  	},
  	'OBJMTLLoader': {
  		deps: ['three','OBJLoader','MTLLoader'],
  		exports: 'OBJMTLLoader'
  	}
  }
});
define(['jquery', 'three', 'OrbitControls', 'stats', 'EffectComposer', 'RenderPass', 'ShaderPass', 'TexturePass', 'MaskPass', 'BasicShader', 'CopyShader', 'Physijs','OBJMTLLoader'],function($, THREE){
	var conf = {
		INV_MAX_FPS: 1 / 50
	},
		models = {};
	
	var $container,
		scene, camera, renderer, controls, light, stats,
		materials = {
			white: new THREE.MeshLambertMaterial({shading: THREE.FlatShading, map: THREE.ImageUtils.loadTexture('texture/cube_white.png')}),
			yellow: new THREE.MeshLambertMaterial({shading: THREE.FlatShading, map: THREE.ImageUtils.loadTexture('texture/cube_yellow.png')}),
			blue: new THREE.MeshLambertMaterial({shading: THREE.FlatShading, map: THREE.ImageUtils.loadTexture('texture/cube_blue.png')}),
			green: new THREE.MeshLambertMaterial({shading: THREE.FlatShading, map: THREE.ImageUtils.loadTexture('texture/cube_green.png')}),
			red: new THREE.MeshLambertMaterial({shading: THREE.FlatShading, map: THREE.ImageUtils.loadTexture('texture/cube_red.png')}),
			base: new THREE.MeshLambertMaterial({shading: THREE.FlatShading, map: THREE.ImageUtils.loadTexture('texture/cube_base.png')}),
		};


	var init = function() {
		$(document.body).append('<div id="container"></div>');
		$container = $(document.body).find('#container');

		Physijs.scripts.worker = 'js/lib/physijs_worker.js';
		Physijs.scripts.ammo = 'ammo.js';

		scene = new Physijs.Scene();
		scene.setGravity(new THREE.Vector3(0, -50, 0));

		camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.5, 20001);

		var ambient = new THREE.AmbientLight( 0x101030 );
		scene.add( ambient );

		light = new THREE.HemisphereLight(0xffffbb, 0xffffff, 1);
		//light.position.set(-1, 1, -1);

		scene.add(light);

		renderer = new THREE.WebGLRenderer({antialiasing: true});
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

		window.addEventListener( 'resize', onWindowResize, false );

		loadingPgae.init();
		loadingPgae.animate();
	};

	var onWindowResize = function(){
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();

		renderer.setSize(window.innerWidth, window.innerHeight);
	};

	var loadingPgae = (function(){
		var skyboxMap, skybgMap, getSide, loader, loadMap, skyboxShader, skybgShader, skyboxMaterial, skybgMaterial, skybox, skybg, frameDelta, clock, composer;
		var init = function() {
			skyboxMap = new THREE.CubeTexture([]);
			skybgMap = new THREE.CubeTexture([]);

			skyboxMap.flipY = false;
			skybgMap.flipY = false;

			$container.append('<div id="chapitre"><div class="box"><img id="map" src="../image/chapitre.jpg" /><img class="arrow" src="../image/arrow.png" /><img class="point" src="../image/point.png" /></div></div>');
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

			skybox = new THREE.Mesh(new THREE.BoxGeometry(10000, 10000, 10000), skyboxMaterial);
			skybg = new THREE.Mesh(new THREE.BoxGeometry(20000, 20000, 20000), skybgMaterial);

			scene.add(skybox);
			scene.add(skybg);

			composer = new THREE.EffectComposer(renderer);

			var renderPass = new THREE.RenderPass(scene, camera),
				effectCopy = new THREE.ShaderPass(THREE.CopyShader),
				shaderPass = new THREE.ShaderPass(THREE.BasicShader);
			//shaderPass.uniforms.lightDir = 
			effectCopy.renderToScreen = true;
			
			composer.addPass(renderPass);
			//composer.addPass(shaderPass);
			composer.addPass(effectCopy);

			//loadModel('../model/boy.obj', '../model/boy.mtl', 'boy');
			loadCube();
		}

		frameDelta = 0;
		clock = new THREE.Clock();
		var render = function() {
			controls.update();
			//renderer.render(scene, camera);
			composer.render(clock.getDelta());
			scene.simulate();
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

	var loadModel = function(obj, mtl, name){
        var loader = new THREE.OBJMTLLoader();
        var onProgress = function(){},
        	onError = function(){};

        loader.load(obj, mtl, function(object){
           	scene.add(object);
        }, onProgress, onError); 
	};

	var loadCube = function(){
		var loader = new THREE.OBJMTLLoader();
        var onProgress = function(){},
        	onError = function(){};

        loader.load('../model/lucien_dodo.obj', '../model/lucien_dodo.mtl', function(object){
        	object.scale.set(1.12, 1.12, 1.12);

        	$.getJSON('../js/data.json', function(data){
				//var cubeGeo = new THREE.BoxGeometry( 50, 50, 50 );
				for (var i = 0; i < data.length; i++) {
					//var cube = new Physijs.BoxMesh(cubeGeo, materials[data[i].color]);
					//cube.position.set(data[i].position.x, data[i].position.y, data[i].position.z);
					//scene.add(cube);
					var cube = object.clone();
					cube.rotation.y = -Math.PI / 2;
					cube.position.set(data[i].position.x, data[i].position.y, data[i].position.z);
					scene.add(cube);
				};
			});

        }, onProgress, onError);         		
	};

	return {
		init: init
	};
});
