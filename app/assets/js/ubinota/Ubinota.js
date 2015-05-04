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
		cubeMaterials = {},
		loaders = {},
		models = {},
		maps = [],
		cubes = [];


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
		var manager = new THREE.LoadingManager();
		loaders['map'] = new THREE.XHRLoader(manager);
		loaders['house1'] = new THREE.OBJMTLLoader(manager);
		loaders['house2'] = new THREE.OBJMTLLoader(manager);
		loaders['whiteCube'] = new THREE.OBJMTLLoader(manager);
		loaders['blueCube'] = new THREE.OBJMTLLoader(manager);
		loaders['baseCube'] = new THREE.OBJMTLLoader(manager);
		loaders['blueCubeMat'] = new THREE.MTLLoader('../model/', manager);

		manager.onLoad = function(){
			for (var i = 0; i < maps[0].length; i++) {
				switch(maps[0][i].color){
					case 'base':
						var cube = models['baseCube'].clone();
						break;
					case 'blue':
						var cube = models['blueCube'].clone();
						for (var j = 0; j < cube.children.length; j++) {
							cubes.push(cube.children[j]);
						};
						break;
					case 'house1':
						var cube = models['house1'].clone();
						break;
					case 'house2':
						var cube = models['house2'].clone();
						break;											
					default:
						var cube = models['whiteCube'].clone();
						for (var j = 0; j < cube.children.length; j++) {
							cubes.push(cube.children[j]);
						};
				}
				cube.position.set(maps[0][i].position.x, maps[0][i].position.y, maps[0][i].position.z);
				scene.add(cube);
			};

		    var onDoubleClick = function(event){
		        event.preventDefault();
		        
		        var mouse = new THREE.Vector2(),
		        	raycaster = new THREE.Raycaster();

		        mouse.set((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1);

		        raycaster.setFromCamera(mouse, camera);

		        var intersects = raycaster.intersectObjects(cubes);

		        if(intersects.length) {
		            var intersect = intersects[0];
		            console.log(intersect.object.parent.position);
		            intersect.object.parent.traverse(function(object){
						if (object instanceof THREE.Mesh) {
							if ( object.material.name ) {
								var material = cubeMaterials['blue'].create( object.material.name );
								if ( material ) object.material = material;
							}
						}

					} );
		        }
		    };

		    document.addEventListener('dblclick', onDoubleClick, false);

		};
        loaders['whiteCube'].load('../model/cube.obj', '../model/cube.mtl', function(object){
        	models['whiteCube'] = object;
        });
        loaders['blueCube'].load('../model/cube.obj', '../model/blueCube.mtl', function(object){
        	models['blueCube'] = object;
        });
        loaders['baseCube'].load('../model/base.obj', '../model/base.mtl', function(object){
        	models['baseCube'] = object;
        });
        loaders['blueCubeMat'].load('../model/blueCube.mtl', function(object){
        	cubeMaterials['blue'] = object;
        });
        loaders['house1'].load('../model/house1.obj', '../model/house1.mtl', function(object){
        	models['house1'] = object;
        });
        loaders['house2'].load('../model/house2.obj', '../model/house2.mtl', function(object){
        	models['house2'] = object;
        });        
        loaders['map'].load('../js/map2.json', function(data) {
			maps[0] = JSON.parse(data);
		});
	};

	return {
		init: init
	};
});
