requirejs.config({
  paths: {
    jquery: 'lib/jquery',
    three: 'vendor/three',
    OrbitControls: 'lib/OrbitControls',
    stats: 'lib/stats.min',
    Physijs: 'lib/physi',
    OBJLoader: 'lib/OBJLoader',
    MTLLoader: 'lib/MTLLoader',
    OBJMTLLoader: 'lib/OBJMTLLoader',
    howl: 'lib/howler.min'
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
    'howl': {
        exports: 'Howl'
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
define(['jquery', 'three', 'howl', 'OrbitControls', 'stats', 'Physijs','OBJMTLLoader'],function($, THREE){
    var jqueryMap = {},
        configMap = {
            render_max_fps: 1 / 60
        },
        sceneMap = {},
        statusMap = {simulate: false},
        toolMap = [],
        soundMap = {},
        resourceInfo = {
            maps: [{url: '../js/map1.json'}, {url: '../js/map2.json'}, {url: '../js/map3.json'}, {url: '../js/map4.json'}, {url: '../js/map5.json'}, {url: '../js/map6.json'}, {url: '../js/map7.json'}, {url: '../js/map8.json'}, {url: '../js/map9.json'}],
            images: [{name: 'skybox', url: '../texture/sky.png'}, {name: 'skybg', url: '../texture/skybg.png'}],
            cubes: [{color: 'white', model: '../model/cube.obj', mtl: '../model/whiteCube.mtl'}, {color: 'blue', model: '../model/cube.obj', mtl: '../model/blueCube.mtl'}, {color: 'green', model: '../model/cube.obj', mtl: '../model/greenCube.mtl'}],
            bases: [{color: 'blue', model: '../model/base.obj', mtl: '../model/blueBase.mtl'}, {color: 'green', model: '../model/base.obj', mtl: '../model/greenBase.mtl'}],
            houses: [{color: 'white', model: '../model/house1.obj', mtl: '../model/house1.mtl'}, {color: 'yellow', model: '../model/house2.obj', mtl: '../model/house2.mtl'}],
            mtls: [{color: 'white', url: '../model/whiteCube.mtl'}, {color: 'blue', url: '../model/blueCube.mtl'}, {color: 'green', url: '../model/greenCube.mtl'}]
        },
        resources = {maps: [], images: {}, cubes: {}, bases: {}, houses: {}, mtls: {}},
        currentTool,
        currentMission = 1;

    var initModule = function(){
        var $container, scene, camera, ambientLight, hemisLight, renderer, controls, stats, clock, delta;

        $('body').append('<div id="container"></div>');
        $container = $('body').find('#container');

        Physijs.scripts.worker = 'js/lib/physijs_worker.js';
        Physijs.scripts.ammo = 'ammo.js';

        scene = new Physijs.Scene();
        scene.setGravity(new THREE.Vector3(0, -100, 0));
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
        controls.noPan = true;
        controls.maxDistance = 5000.0;
        controls.maxPolarAngle = Math.PI;
        controls.center.set(0, 200, 0);

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
        initSound();

        loadResources();
    };
    
    var onWindowResize = function(){
        sceneMap.camera.aspect = window.innerWidth / window.innerHeight;
        sceneMap.camera.updateProjectionMatrix();

        sceneMap.renderer.setSize(window.innerWidth, window.innerHeight);

        jqueryMap.$map.find('.box').width(jqueryMap.$map.find('.map').width());
    };

    var loadResources = function(){
        var manager = new THREE.LoadingManager();
        manager.onLoad = onResourcesLoad;
        manager.onProgress = function(item, loaded, total){
            jqueryMap.$loadingInfo.find('.info').text('Loading... ' + loaded + '/' + total);
        };

        for (var i = 0; i < resourceInfo.images.length; i++) {
            var loader = new THREE.ImageLoader(manager);
            (function(i){
                loader.load(resourceInfo.images[i].url, function(image){
                    resources.images[resourceInfo.images[i].name] = image;
                });
            }(i));
        };

        for (var i = 0; i < resourceInfo.cubes.length; i++) {
            var loader = new THREE.OBJMTLLoader(manager);
            (function(i){
                loader.load(resourceInfo.cubes[i].model, resourceInfo.cubes[i].mtl, function(data){    
                    resources.cubes[resourceInfo.cubes[i].color] = data;
                });
            }(i));
        };

        for (var i = 0; i < resourceInfo.bases.length; i++) {
            var loader = new THREE.OBJMTLLoader(manager);
            (function(i){
                loader.load(resourceInfo.bases[i].model, resourceInfo.bases[i].mtl, function(data){    
                    resources.bases[resourceInfo.bases[i].color] = data;
                });
            }(i));            
        };

        for (var i = 0; i < resourceInfo.houses.length; i++) {
            var loader = new THREE.OBJMTLLoader(manager);
            (function(i){
                loader.load(resourceInfo.houses[i].model, resourceInfo.houses[i].mtl, function(data){    
                    resources.houses[resourceInfo.houses[i].color] = data;
                });                
            }(i));                          
        };

        for (var i = 0; i < resourceInfo.maps.length; i++) {
            var loader = new THREE.XHRLoader(manager);
            (function(i){
                loader.load(resourceInfo.maps[i].url, function(data){
                    resources.maps[i] = JSON.parse(data);
                });            
            }(i));              
        };

        for (var i = 0; i < resourceInfo.mtls.length; i++) {
            var loader = new THREE.MTLLoader('../model/', manager);
            (function(i){                
                loader.load(resourceInfo.mtls[i].url, function(data){
                    resources.mtls[resourceInfo.mtls[i].color] = data;
                });        
            }(i));            
        };
    };

    var onResourcesLoad = function(){
        soundMap['loading'].play();
        setTimeout(initStart, 3000);

        initMap();
        initResult();
    };

    var onCanvasClick = function(event){
        event.preventDefault();
        var mouse = new THREE.Vector2(),
            raycaster = new THREE.Raycaster(),
            intersects;

        mouse.set((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1);

        raycaster.setFromCamera(mouse, sceneMap.camera);

        intersects = raycaster.intersectObjects(sceneMap.meshes);

        if(intersects.length) {
            var intersect = intersects[0].object.parent ? intersects[0].object.parent : intersects[0].object;
  
            if(intersect.type == 'cube') {
                if(currentTool.color != intersect.color && currentTool.left) {
                    soundMap['paint'].play();
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
                            if (object.material.name) {
                                var material = resources.mtls[currentTool.color].create(object.material.name);
                                if(material){
                                    object.material = material;
                                }
                            }
                        }
                    });
                    intersect.painted = true;
                    intersect.color = currentTool.color;
                    currentTool.left --;
                    currentTool.$tank.find('.count').text(currentTool.left);
                    currentTool.$tank.find('.left').height((currentTool.left / currentTool.total) * 100 + '%');                                     
                } else {
                    if(intersect.painted){
                        soundMap['clear'].play();
                        intersect.traverse(function(object){
                            if (object instanceof THREE.Mesh) {
                                if (object.material.name) {
                                    var material = resources.mtls[intersect.origin].create(object.material.name);
                                    if (material){
                                        object.material = material;
                                    }
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
        }
    };

    var initSkybox = function(){
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

        loadMap(resources.images['skybox'], skyboxMap);
        loadMap(resources.images['skybg'], skybgMap);

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

    var initCubes = function(){
        var cubeData = resources.maps[currentMission].cubes,
            data,
            children,
            cube,
            weight,
            cubes = [],
            meshes = [];

        for (var i = 0; i < cubeData.length; i++) {
            weight = 1;
            switch(cubeData[i].type){
                case 'base':
                    data = resources.bases[cubeData[i].color].clone();
                    weight = 0;
                    break;
                case 'cube':
                    data = resources.cubes[cubeData[i].color].clone();
                    break;
                case 'house':
                    data = resources.houses[cubeData[i].color].clone();
                    break;
            }

            children = data.children;
            cube = new Physijs.ConvexMesh(children[0].geometry, children[0].material, 0);
            cube.weight = weight;
            meshes.push(cube);
            for (var j = 1; j < children.length; j++) {
                var child = new Physijs.ConvexMesh(children[j].geometry, children[j].material, 0);
                cube.add(child);
                meshes.push(child);
            };

            cube.type = cubeData[i].type;
            cube.painted = false;
            cube.origin = cubeData[i].color;
            cube.color = cubeData[i].color;
            cube.connected = cubeData[i].connected;
            cube.position.set(cubeData[i].position.x, cubeData[i].position.y, cubeData[i].position.z);
            cubes.push(cube);
            sceneMap.scene.add(cube);
        };

        $(sceneMap.renderer.domElement).bind('click', onCanvasClick);
        sceneMap.cubes = cubes;
        sceneMap.meshes = meshes;
    };

    var initLoadingPage = function(){
        jqueryMap.$container.append('<div id="loadingPage"><div id="start">Start</div><div class="infoBox"><div class="loader"><img src="../image/cursor_blue.ico"/></div><div class="info"></div></div></div>');
        var $loadingPage = jqueryMap.$container.find('#loadingPage'),
            $start = $loadingPage.find('#start');
        jqueryMap.$loadingPage = $loadingPage;
        jqueryMap.$start = $start;
        jqueryMap.$loadingInfo = $loadingPage.find('.infoBox');
    };

    var initTools = function(){
        var typeData = resources.maps[currentMission].types,
            tools = [];
        toolMap = [];
        jqueryMap.$container.append('<div id="tanks"></div>');
        jqueryMap.$container.append('<div id="brushes"></div>');

        var $tanks = jqueryMap.$container.find('#tanks'),
            $brushes = jqueryMap.$container.find('#brushes');

        for (var i = 0; i < typeData.length; i++) {
            var tank = '<li class="tank"><div class="count">' + typeData[i].number +  '</div><div class="tube"><img class="full" src="../image/fioleVide.png"/><img class="left" src="../image/paints_' + typeData[i].color + '.png" /><img class="dec" src="../image/dec_' + typeData[i].color + '.png" /></div></li>',
                brush = '<li class="brush"><img src="../image/brush_' + typeData[i].color + '.png" ><img class="hover" src="../image/brush_hover_' + typeData[i].color + '.png" ></li>';
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
            $(sceneMap.renderer.domElement).css('cursor', 'url(../image/cursor_' + currentTool.color + '.ico), default');
            currentTool.$tank.show();
        });

        jqueryMap.$tanks = $tanks;
        jqueryMap.$brushes = $brushes;
    };

    var initButton = function(){
        jqueryMap.$container.append('<div id="button"><img src="../image/button.png"><img class="hover" src="../image/button_hover.png"><img class="clicked" src="../image/button_clicked.png" ></div>');
        var $button = jqueryMap.$container.find('#button');
        $button.find('.hover').on('click', onButtonClick);
        jqueryMap.$button = $button;
    };

    var initStart = function(){
        jqueryMap.$start.fadeIn(1000).on('click', function(){
            jqueryMap.$loadingPage.fadeOut();
        });
    };

    var initResult = function(){
        jqueryMap.$container.append('<div id="result"><div class="defeat"><img src="../image/defeat.png" /><div class="restart"></div><div class="back"></div></div><div class="victory"><img src="../image/victory.png" /><div class="continue"></div><div class="back"></div></div></div>');
        jqueryMap.$result = jqueryMap.$container.find('#result');
        jqueryMap.$defeat = jqueryMap.$result.find('.defeat');
        jqueryMap.$victory = jqueryMap.$result.find('.victory');
        jqueryMap.$result.find('.back').on('click', function(){
            clearMission();
            jqueryMap.$map.fadeIn();
        });
        jqueryMap.$result.find('.restart').on('click', function(){
            clearMission();
            initMission();
        });
        jqueryMap.$result.find('.continue').on('click', function(){
            clearMission();
            currentMission++;
            initMission();
        });        
    }

    var initMap = function(){
        jqueryMap.$container.append('<div id="map"><div class="box"><img class="map" src="../image/map.jpg"/></div></div>');
        var points = [[11, 44], [9, 72], [26, 21] ,[36, 86], [39, 54], [68, 18], [74, 29], [89, 52], [28, 36]],
            arrows = [[11, 32], [9, 60], [26, 9], [36, 74], [39, 42], [68, 6], [74, 17], [89, 40], [28, 24]],
            $map = jqueryMap.$container.find('#map'),
            $box = $map.find('.box');

        for (var i = 0; i < points.length; i++) {
            $box.append('<div class="arrow"><img src="../image/arrow.png" /></div><div class="point" ><img src="../image/point.png" /><img class="hover" src="../image/point_hover.png" /></div>');
            var $point = $box.find('.point').last(),
                $arrow = $box.find('.arrow').last();
            $point.css({'left': points[i][0] + '%', 'top': points[i][1] + '%'});
            $arrow.css({'left': arrows[i][0] + '%', 'top': arrows[i][1] + '%'});
        }

        initSkybox();
        initButton();

        $box.find('.point').on('click', function(){
            soundMap['click'].play();
            currentMission = $(this).index() / 2 - 1;
            initMission();
        });
        jqueryMap.$map = $map;
    };

    var onButtonClick = function(){
        jqueryMap.$button.find('.clicked').show();
        $(sceneMap.renderer.domElement).unbind('click', onCanvasClick);
        var cubes = sceneMap.cubes;
        var checkConnect = function(cube){
            cube.connected.forEach(function(e){
                if(cubes[e].weight && cubes[e].color == cube.color){
                    cubes[e].weight = 0;
                    checkConnect(cubes[e]);
                }
            });
        };
        var checkMass = function(cube){
            if(cube.weight) {
                if(cube.connected) {
                    for (var i = 0; i < cube.connected.length; i++) {
                        if(cubes[cube.connected[i]].position.y == cube.position.y - 50) {
                            return(checkMass(cubes[cube.connected[i]]));
                        }
                    };
                    return false;
                }
            } else {
                return true;
            }
        };
        var checkVictory = function(){
            for (var i = 0; i < cubes.length; i++) {
                if(cubes[i].type == 'house'){
                    if(!checkMass(cubes[i])) {
                        return false;
                    }
                }                
            };
            return true;
        };

        cubes.forEach(function(e){
            if(e.type == 'base'){
                checkConnect(e);
            }
        });
        cubes.forEach(function(e){
            e.mass = e.weight;
        });

        //statusMap.simulate = true;
        //sceneMap.scene.setGravity(new THREE.Vector3(0, -380, 0));
        render();
        startNextMission(checkVictory());
    };

    var initMission = function(){
        jqueryMap.$map.fadeOut();
        initTools();
        initCubes();

        render();
    };

    var initSound = function(){
        var soundInfo = [{name: 'loading', loop: true}, {name: 'paint', loop: false}, {name: 'clear', loop: false}, {name: 'click', loop: false}];
        for (var i = 0; i < soundInfo.length; i++) {
            soundMap[soundInfo[i].name] = new Howl({
              urls: ['../sound/' + soundInfo[i].name + '.ogg'],
              loop: soundInfo[i].loop
            });
        };

    };

    var clearMission = function(){
        sceneMap.cubes.forEach(function(e){
            sceneMap.scene.remove(e);
        });

        jqueryMap.$tanks.remove();
        jqueryMap.$brushes.remove();
        jqueryMap.$button.find('.clicked').hide();
        jqueryMap.$result.hide().children().hide();
    };

    var startNextMission = function(isVictory){
        console.log(isVictory)
        setTimeout(function(){
            //sceneMap.scene.setGravity(new THREE.Vector3(0, 0, 0));
            jqueryMap.$result.show();
            if(isVictory){
                jqueryMap.$victory.css('display','inline-block');
            } else {
                jqueryMap.$defeat.css('display','inline-block');
            }
            render();
        }, 10000);
    };

    var render = function(){
        requestAnimationFrame(render);
        sceneMap.delta += sceneMap.clock.getDelta();

        while(sceneMap.delta >= configMap.render_max_fps){
            sceneMap.skybox.rotation.y -= 0.0005;
            sceneMap.delta -= configMap.render_max_fps;
            sceneMap.scene.simulate();
            sceneMap.controls.update();
            
        }
        sceneMap.stats.update();
        
        sceneMap.renderer.render(sceneMap.scene, sceneMap.camera);
    };

    return {
        init: initModule
    };
});
