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
    var jqueryMap = {},
        configMap = {
            render_max_fps: 1 / 50
        },
        sceneMap = {},
        resourceInfo = [
            {
                type: 'image',
                name: 'skybox',
                imageUrl: '../texture/sky.png'
            },
            {
                type: 'image',
                name: 'skybg',
                imageUrl: '../texture/skybg.png'                
            },
            {
                type: 'json',
                name: 'map',
                jsonUrl: '../js/map1.json'
            },
            {
                type: 'model',
                name: 'whiteCube',
                modelUrl: '../model/cube.obj',
                mtlUrl: '../model/cube.mtl'
            },
            {
                type: 'model',
                name: 'blueCube',
                modelUrl: '../model/cube.obj',
                mtlUrl: '../model/blueCube.mtl'
            },
            {
                type: 'model',
                name: 'baseCube',
                modelUrl: '../model/base.obj',
                mtlUrl: '../model/base.mtl'
            },            
            {
                type: 'model',
                name: 'house1',
                modelUrl: '../model/house1.obj',
                mtlUrl: '../model/house1.mtl'
            },
            {
                type: 'model',
                name: 'house2',
                modelUrl: '../model/house2.obj',
                mtlUrl: '../model/house2.mtl'
            },
            {
                type: 'mtl',
                name: 'blueMtl',
                mtlUrl: '../model/blueCube.mtl'
            }
        ],
        resources = {},
        initModule,
        initSkybox,
        initCubes,
        onWindowResize,
        onDoubleClick,
        render;

    initModule = function(){
        var $container, scene, camera, ambientLight, hemisLight, renderer, controls, stats, clock, delta;

        $('body').append('<div id="container"></div>');
        $container = $('body').find('#container');

        Physijs.scripts.worker = 'js/lib/physijs_worker.js';
        Physijs.scripts.ammo = 'ammo.js';

        scene = new Physijs.Scene();
        scene.setGravity(new THREE.Vector3(0, -50, 0));

        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.5, 20001);
        ambientLight = new THREE.AmbientLight( 0x101030 );
        hemisLight = new THREE.HemisphereLight(0xffffff, 0xfefefe, 1);

        scene.add(ambientLight);
        scene.add(hemisLight);

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

        clock = new THREE.Clock();
        delta = 0;

        stats = new Stats();
        $(stats.domElement).css({'position': 'absolute', 'top': '0px'});
        $container.append(stats.domElement);

        $(window).on('resize', onWindowResize);
        loadResources();

        jqueryMap.$container = $container;
        sceneMap = {
            scene: scene,
            camera: camera,
            ambientLight: ambientLight,
            hemisLight: hemisLight,
            renderer: renderer,
            controls: controls,
            stats: stats,
            clock: clock,
            delta: delta
        };        
    };
	
    onWindowResize = function(){
        sceneMap.camera.aspect = window.innerWidth / window.innerHeight;
        sceneMap.camera.updateProjectionMatrix();

        sceneMap.renderer.setSize(window.innerWidth, window.innerHeight);
    };

    loadResources = function(){
        var manager = new THREE.LoadingManager(),
            loaders = {};
        manager.onLoad = onResourcesLoad;

        for (var i = 0; i < resourceInfo.length; i++) {
            switch(resourceInfo[i].type){
                case 'image':
                    (function(i){
                        loaders[resourceInfo[i].name] = new THREE.ImageLoader(manager);
                        loaders[resourceInfo[i].name].load(resourceInfo[i].imageUrl, function(image){
                            resources[resourceInfo[i].name] = image;
                        });
                    }(i));
                    break;              
                case 'json':
                    (function(i){                
                        loaders[resourceInfo[i].name] = new THREE.XHRLoader(manager);
                        loaders[resourceInfo[i].name].load(resourceInfo[i].jsonUrl, function(data){
                            resources[resourceInfo[i].name] = data;
                        });
                    }(i));
                    break;
                case 'model':
                    (function(i){                
                        loaders[resourceInfo[i].name] = new THREE.OBJMTLLoader(manager);
                        loaders[resourceInfo[i].name].load(resourceInfo[i].modelUrl, resourceInfo[i].mtlUrl, function(data){
                            resources[resourceInfo[i].name] = data;
                        });        
                    }(i));
                    break;
                case 'mtl':
                    (function(i){                
                        loaders[resourceInfo[i].name] = new THREE.MTLLoader('../model/', manager);
                        loaders[resourceInfo[i].name].load(resourceInfo[i].mtlUrl, function(data){
                            resources[resourceInfo[i].name] = data;
                        });        
                    }(i));
                    break;
            } 
        };
    };

    onResourcesLoad = function(){
        initSkybox();
        initCubes();
        render();
    };

    onDoubleClick = function(event){
        event.preventDefault();

        var mouse = new THREE.Vector2(),
            raycaster = new THREE.Raycaster(),
            intersects;

            mouse.set((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1);

            raycaster.setFromCamera(mouse, sceneMap.camera);

            intersects = raycaster.intersectObjects(sceneMap.cubes);

            if(intersects.length) {
                var intersect = intersects[0];
                intersect.object.parent.traverse(function(object){
                    if (object instanceof THREE.Mesh) {
                        if ( object.material.name ) {
                            var material = resources['blueMtl'].create( object.material.name );
                            if ( material ) object.material = material;
                        }
                    }

                } );
            }
    };

    initSkybox = function(){
        var skyboxMap, skybgMap, getSide, loader, loadMap, skyboxShader, skybgShader, skyboxMaterial, skybgMaterial, skybox, skybg;

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

        skyboxMap = new THREE.CubeTexture([]);
        skybgMap = new THREE.CubeTexture([]);

        skyboxMap.flipY = false;
        skybgMap.flipY = false;

        loadMap(resources['skybox'], skyboxMap);
        loadMap(resources['skybg'], skybgMap);

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

        sceneMap.scene.add(skybox);
        sceneMap.scene.add(skybg);

        sceneMap.skybox = skybox;
        sceneMap.skybg = skybg;
    };

    initCubes = function(){
        var map = JSON.parse(resources['map']),
            cube,
            cubes = [];
        for (var i = 0; i < map.length; i++) {
            switch(map[i].color){
                case 'base':
                    cube = resources['baseCube'].clone();
                    break;
                case 'blue':
                    cube = resources['blueCube'].clone();
                    for (var j = 0; j < cube.children.length; j++) {
                        cubes.push(cube.children[j]);
                    };
                    break;
                case 'house1':
                    cube = resources['house1'].clone();
                    break;
                case 'house2':
                    cube = resources['house2'].clone();
                    break;                                          
                default:
                    cube = resources['whiteCube'].clone();
                    for (var j = 0; j < cube.children.length; j++) {
                        cubes.push(cube.children[j]);
                    };
            }
            cube.position.set(map[i].position.x, map[i].position.y, map[i].position.z);
            sceneMap.scene.add(cube);
            sceneMap.cubes = cubes;

            jqueryMap.$container.on('dblclick', onDoubleClick);
        };
    };

    render = function(){
        requestAnimationFrame(render);
        sceneMap.delta += sceneMap.clock.getDelta();

        while(sceneMap.delta >= configMap.render_max_fps){
            sceneMap.skybox.rotation.y -= 0.0005;
            sceneMap.delta -= configMap.render_max_fps;
        }

        sceneMap.stats.update();
        sceneMap.controls.update();
        sceneMap.renderer.render(sceneMap.scene, sceneMap.camera);
    };

	return {
		init: initModule
	};
});
