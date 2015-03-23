requirejs.config({
  paths: {
    jquery: 'lib/jquery',
    three: 'vendor/three',
    OrbitControls: 'lib/OrbitControls'
  },
  shim: {
  	'three': {
  		exports: 'THREE'
  	},
  	'OrbitControls' : {
  		deps: ['three'],
  		exports: 'THREE.OrbitControls'
  	}
  }
});
define(['jquery', 'three', 'OrbitControls'],function($, THREE){
	function Ubinota() {
	}
	Ubinota.prototype = {
		constructor: Ubinota,
		init: function(){
			this.container = document.createElement('div');
			document.body.appendChild(this.container);
			this.scene = this.scene ? this.scene : new THREE.Scene();

			this.camera = this.camera ? this.camera : new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.5, 3000000);
			this.camera.position.set(0, 750, 0);
			this.renderer = this.renderer ? this.renderer : new THREE.WebGLRenderer({antialias: true});
			this.renderer.setPixelRatio (window.devicePixelRatio);
			this.renderer.setSize(window.innerWidth, window.innerHeight);
			//this.renderer.setClearColor(0x69A3CD);
			this.container.appendChild(this.renderer.domElement);
			this.controls = this.controls ? this.controls : new THREE.OrbitControls(this.camera, this.renderer.domElement);
			this.controls.userPan = false;
			this.controls.userPanSpeed = 0.0;
			this.controls.maxDistance = 5000.0;
			this.controls.maxPolarAngle = Math.PI * 0.495;
			this.controls.center.set(0, 500, 0);
			this.light = this.light ? this.light : new THREE.HemisphereLight(0xffffbb, 0x080820, 1);
			this.light.position.set(-1, 1, -1);
			this.scene.add(this.light);
			this.initLoadingPgae();
		},
		initLoadingPgae: function(){
			var skyboxMap = new THREE.CubeTexture([]);
			skyboxMap.flipY = false;

			var loader = new THREE.ImageLoader();
			var container = this.container;
			loader.load('../texture/sky.png', function(image){
				var getSide = function(x, y) {
					var size = 1024;
					var canvas = document.createElement('canvas');
					canvas.width = size;
					canvas.height = size;
					var context = canvas.getContext('2d');
					context.drawImage(image, -x * size, -y * size);
					return canvas;
				}

				skyboxMap.image[0] = getSide(2, 0);
				skyboxMap.image[1] = getSide(0, 0);
				skyboxMap.image[2] = getSide(1, 1);
				skyboxMap.image[3] = getSide(0, 1);
				skyboxMap.image[4] = getSide(1, 0);
				skyboxMap.image[5] = getSide(2, 1);
				skyboxMap.needsUpdate = true;
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
			//make the skybox transparent;

			var skybox = new THREE.Mesh(
				new THREE.BoxGeometry(100000, 100000, 100000),
				skyboxMaterial
				);
			var mat = new THREE.MeshBasicMaterial({color: 0x69a3cd, side: THREE.BackSide});
			var bg = new THREE.Mesh(new THREE.SphereGeometry(1000000, 40, 40),mat);
	
			this.scene.add(bg);
			this.scene.add(skybox);
			this.loadingPage = {
				controls: this.controls,
				renderer: this.renderer,
				scene: this.scene,
				camera: this.camera,
				skybox: skybox
			};
		}
	}
	return Ubinota;
});
