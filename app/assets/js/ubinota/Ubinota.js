requirejs.config({
  paths: {
    jquery: 'lib/jquery',
    three: 'vendor/three',
    OrbitControls: 'lib/OrbitControls',
    stats: 'lib/stats.min',
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
define(['jquery', 'three', 'OrbitControls', 'stats', 'Physijs','OBJMTLLoader'],function($, THREE){
    var jqueryMap = {},
        configMap = {
            render_max_fps: 1 / 50
        },
        sceneMap = {},
        toolMap = [],
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
            },
            {
                type: 'mtl',
                name: 'greenMtl',
                mtlUrl: '../model/greenCube.mtl'
            },
            {
            	type: 'mtl',
            	name: 'whiteMtl',
            	mtlUrl: '../model/cube.mtl'
            }
        ],
        resources = {},
        currentTool,
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

        initLoadingPage();
        loadResources();
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
        manager.onProgress = function(item, loaded, total){
        	jqueryMap.$loadingInfo.find('.info').text('Loading... ' + loaded + '/' + total);
        };

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
                            resources[resourceInfo[i].name] = JSON.parse(data);
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
        initTools();
        initButton();
        initCubes();
        setTimeout(function(){jqueryMap.$loadingPage.fadeOut();}, 3000); 
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
        	var intersect = intersects[0].object.parent;
        	if(currentTool.color != intersect.color && currentTool.left){
        		if(intersect.painted) {
	        		for (var i = 0; i < toolMap.length; i++) {
	    				if(toolMap[i].color == intersect.color) {
	    					toolMap[i].left++;
	    					toolMap[i].$tank.find('.count').text(toolMap[i].left);
	    					toolMap[i].$tank.find('.left').height((toolMap[i].left / toolMap[i].total) * 100 + '%');
	    				}
	    			};
        		}

    			intersect.traverse(function(object){
	                if (object instanceof THREE.Mesh) {
	                    if ( object.material.name ) {
	                        var material = resources[currentTool.color + 'Mtl'].create( object.material.name );
	                        if ( material ) object.material = material;
	                    }
	                }
	            });
    			intersect.painted = true;
    			intersect.color = currentTool.color;
    			currentTool.left --;
    			currentTool.$tank.find('.count').text(currentTool.left);
    			currentTool.$tank.find('.left').height((currentTool.left / currentTool.total) * 100 + '%');
        	} else {
        		if(intersect.painted) {
        			intersect.traverse(function(object){
		                if (object instanceof THREE.Mesh) {
		                    if ( object.material.name ) {
		                        var material = resources[intersect.origin + 'Mtl'].create( object.material.name );
		                        if ( material ) object.material = material;
		                    }
		                }
		            });
		            intersect.color = intersect.origin;
        			intersect.painted = false;
        			currentTool.left ++;
        			currentTool.$tank.find('.count').text(currentTool.left);
        			currentTool.$tank.find('.left').height((currentTool.left / currentTool.total) * 100 + '%');
        		}
        	}	        
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
        var cubeData = resources['map'].cubes,
            cube,
            cubes = [];
        for (var i = 0; i < cubeData.length; i++) {
            switch(cubeData[i].color){
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
            
            cube.painted = false;
            cube.origin = cubeData[i].color;
            cube.color = cubeData[i].color;
            cube.position.set(cubeData[i].position.x, cubeData[i].position.y, cubeData[i].position.z);
            sceneMap.scene.add(cube);
            sceneMap.cubes = cubes;
        };
        jqueryMap.$container.on('dblclick', onDoubleClick);
    };

    initLoadingPage = function(){
    	jqueryMap.$container.append('<div id="loadingPage"><div class="infoBox"><div class="loader"><img src="../image/pointer_cursor.ico"/></div><div class="info"></div></div></div>');
    	var $loadingPage = jqueryMap.$container.find('#loadingPage');
    	$loadingPage.css({'position': 'absolute', 'top': 0, 'left': 0, 'width': '100%', 'height': '100%', 'z-index': 10});
    	jqueryMap.$loadingPage = $loadingPage;
    	jqueryMap.$loadingInfo = $loadingPage.find('.infoBox');
    };

    initTools = function(){
    	var typeData = resources['map'].types,
    		tools = [];
    	jqueryMap.$container.append('<div id="tanks"></div>');
    	jqueryMap.$container.append('<div id="brushes"></div>');

    	var $tanks = jqueryMap.$container.find('#tanks'),
    		$brushes = jqueryMap.$container.find('#brushes');

    	for (var i = 0; i < typeData.length; i++) {
    		var tank = '<li class="tank"><div class="count">' + typeData[i].number +  '</div><div class="tube"><img class="full" src="../image/fioleVide.png"/><img class="left" src="../image/paints_' + typeData[i].color + '.png" /><img class="dec" src="../image/dec_' + typeData[i].color + '.png" /></div></li>',
    			brush = '<li class="brush"><img src="../image/brush_' + typeData[i].color + '.png" ></li>';
    		$tanks.append(tank);
    		$brushes.append(brush);

    		var tool = {
    			color: typeData[i].color,
    			total: typeData[i].number,
    			left: typeData[i].number,
    			$tank: $tanks.children().last(),
    			$brush: $brushes.children().last()
    		};
    		toolMap.push(tool);
    	};
    	currentTool = toolMap[0];

    	$tanks.children().first().show();
    	$brushes.children().on('click', function(){
    		jqueryMap.$tanks.children().hide();
    		currentTool = toolMap[$(this).index()];
    		currentTool.$tank.show();
    	});

    	jqueryMap.$tanks = $tanks;
    	jqueryMap.$brushes = $brushes;
    };

    initButton = function(){
    	jqueryMap.$container.append('<div id="button"><img src="../image/button.png"></div>');
    	var $button = jqueryMap.$container.find('#button');
    	jqueryMap.$button = $button;
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
