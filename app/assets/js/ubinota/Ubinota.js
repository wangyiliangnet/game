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
	function Ubinota() {
	}
	Ubinota.prototype = {
		constructor: Ubinota,
		init: function(){
			this.container = document.createElement('div');
			document.body.appendChild(this.container);
			this.scene = this.scene ? this.scene : new THREE.Scene();
			this.camera = this.camera ? this.camera : new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.5, 3000000);
			//this.camera.position.set(0, 0, 0);
			//this.camera.lookAt(new THREE.Vector3(1,1,1));
			this.renderer = this.renderer ? this.renderer : new THREE.WebGLRenderer({antialias: true});
			this.renderer.setPixelRatio (window.devicePixelRatio);
			this.renderer.setSize(window.innerWidth, window.innerHeight);
			//this.renderer.setClearColor(0x69A3CD);
			this.container.appendChild(this.renderer.domElement);
			this.controls = this.controls ? this.controls : new THREE.OrbitControls(this.camera, this.renderer.domElement);
			this.controls.userPan = false;
			this.controls.userPanSpeed = 0.0;
			this.controls.maxDistance = 5000.0;
			this.controls.maxPolarAngle = Math.PI * 0.5;
			this.controls.center.set(0, 100, 0);
			this.light = this.light ? this.light : new THREE.HemisphereLight(0xffffbb, 0x080820, 1);
			this.light.position.set(-1, 1, -1);
			this.stats = new Stats();
			this.stats.domElement.style.position = 'absolute';
			this.stats.domElement.style.top = '0px';
			this.container.appendChild(this.stats.domElement);
			this.scene.add(this.light);
			this.initLoadingPgae();
		},
		initLoadingPgae: function(){
			var skyboxMap = new THREE.CubeTexture([]),
				skybgMap = new THREE.CubeTexture([]);
			skyboxMap.flipY = false;
			skybgMap.flipY = false;

			var loader = new THREE.ImageLoader();
			var getSide = function(x, y, image) {
				var size = 1024;
				var canvas = document.createElement('canvas');
				canvas.width = size;
				canvas.height = size;
				var context = canvas.getContext('2d');
				context.drawImage(image, -x * size, -y * size);
				return canvas;
			}
			loader.load('../texture/sky.png', function(image){
				skyboxMap.image[0] = getSide(2, 0, image);
				skyboxMap.image[1] = getSide(0, 0, image);
				skyboxMap.image[2] = getSide(1, 1, image);
				skyboxMap.image[3] = getSide(0, 1, image);
				skyboxMap.image[4] = getSide(1, 0, image);
				skyboxMap.image[5] = getSide(2, 1, image);
				skyboxMap.needsUpdate = true;
			});
			loader.load('../texture/skybg.png', function(image){
				skybgMap.image[0] = getSide(2, 0, image);
				skybgMap.image[1] = getSide(0, 0, image);
				skybgMap.image[2] = getSide(1, 1, image);
				skybgMap.image[3] = getSide(0, 1, image);
				skybgMap.image[4] = getSide(1, 0, image);
				skybgMap.image[5] = getSide(2, 1, image);
				skybgMap.needsUpdate = true;
			});			
			var bgShader = THREE.ShaderLib['bgcube'];
			bgShader.uniforms['tCube'].value = skybgMap;
			var skybgMaterial = new THREE.ShaderMaterial({
				fragmentShader: bgShader.fragmentShader,
				vertexShader: bgShader.vertexShader,
				uniforms: bgShader.uniforms,
				depthWrite: false,
				side: THREE.BackSide
			});	
			

			var cubeShader = THREE.ShaderLib['cube'];
			cubeShader.uniforms['tCube'].value = skyboxMap;
			var skyboxMaterial = new THREE.ShaderMaterial({
				fragmentShader: cubeShader.fragmentShader,
				vertexShader: cubeShader.vertexShader,
				uniforms: cubeShader.uniforms,
				depthWrite: false,
				side: THREE.BackSide
			});

			skyboxMaterial.transparent = true;
			skyboxMaterial.blending = THREE.NormalBlending;
			//skyboxMaterial.anisotropy = this.renderer.getMaxAnisotropy();
			//make the skybox transparent;

			var skybox = new THREE.Mesh(
				new THREE.BoxGeometry(100000, 100000, 100000),
				skyboxMaterial
				);

			
			var skybg = new THREE.Mesh(
				new THREE.BoxGeometry(200000, 200000, 200000),
				skybgMaterial
				);
			
			
			this.scene.add(skybox);
			this.scene.add(skybg);

			this.loadingPage = {
				controls: this.controls,
				renderer: this.renderer,
				scene: this.scene,
				camera: this.camera,
				skybox: skybox,
				skybg: skybg,
				stats: this.stats
			};
		}
	}
	return Ubinota;
});
