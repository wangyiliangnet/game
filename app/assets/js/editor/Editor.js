requirejs.config({
  paths: {
    jquery: 'lib/jquery',
    three: 'vendor/three',
    OrbitControls: 'lib/OrbitControls',
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

define(['jquery', 'three', 'Physijs', 'OrbitControls', 'OBJMTLLoader'],function($, THREE){
    var jqueryMap = {},
        sceneMap = {},
        objects = [],
        materials = [
            {
                color: 'white',
                url: 'cube_white.png',
                isBase: false,
                material: THREE.ImageUtils.loadTexture('texture/cube_white.png')
            },
            {
                color: 'yellow',
                url: 'cube_yellow.png',
                isBase: false,
                material: THREE.ImageUtils.loadTexture('texture/cube_yellow.png')          
            },
            {
                color: 'blue',
                url: 'cube_blue.png',
                isBase: false,
                material: THREE.ImageUtils.loadTexture('texture/cube_blue.png')       
            },
            {
                color: 'green',
                url: 'cube_green.png',
                isBase: false,
                material: THREE.ImageUtils.loadTexture('texture/cube_green.png')          
            },
            {
                color: 'red',
                url: 'cube_red.png',
                isBase: false,
                material: THREE.ImageUtils.loadTexture('texture/cube_red.png')              
            }
        ],
        cubeGeo = new THREE.BoxGeometry( 50, 50, 50 ),
        currentIndex = 0,
        currentType = 'cube',
        cubes = [];


    var initModule = function(){
        var $container, scene, camera, ambientLight, directionalLight, renderer, controls, mouse, raycaster;

        $(document.body).append('<div id="container"></div>');
        $container = $(document.body).find('#container');

        Physijs.scripts.worker = 'js/lib/physijs_worker.js';
        Physijs.scripts.ammo = 'ammo.js';

        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.5, 300000);
        camera.position.set( 500, 800, 1300 );

        ambientLight = new THREE.AmbientLight( 0x606060 );
        scene.add( ambientLight );

        directionalLight = new THREE.DirectionalLight( 0xffffff );
        directionalLight.position.set( 1, 0.75, 0.5 ).normalize();
        scene.add( directionalLight );

        renderer = new THREE.WebGLRenderer({antialias: true});
        renderer.setClearColor( 0xf0f0f0 );
        renderer.setPixelRatio (window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        $container.append(renderer.domElement);

        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.userPan = false;
        controls.userPanSpeed = 0.0;
        controls.maxDistance = 5000.0;
        controls.maxPolarAngle = Math.PI * 0.5;
        controls.center.set(0, 100, 0);

        raycaster = new THREE.Raycaster();
        mouse = new THREE.Vector2();

        jqueryMap.$container = $container;
        sceneMap = {
            scene: scene,
            camera: camera,
            ambientLight: ambientLight,
            directionalLight: directionalLight,
            renderer: renderer,
            controls: controls,
            raycaster: raycaster,
            mouse: mouse
        }; 

        initScene();
        initMenu();
        animate();

        $(window).on('resize', onWindowResize);
        $(window).on('mousemove', onMouseMove);
        $(window).on('dblclick', onDoubleClick);
    };

    var initScene = function(){
        var drawLine = (function(){
            var size = 500, step = 50;

            var geo = new THREE.Geometry();

            for (var i = -size; i <= size; i += step) {
                geo.vertices.push( new THREE.Vector3( - size, 0, i ) );
                geo.vertices.push( new THREE.Vector3(   size, 0, i ) );

                geo.vertices.push( new THREE.Vector3( i, 0, - size ) );
                geo.vertices.push( new THREE.Vector3( i, 0,   size ) );
            };

            var material = new THREE.LineBasicMaterial({color: 0x000000, opacity: 0.2, transparent: true}),
                line = new THREE.Line(geo, material, THREE.LinePieces);

            sceneMap.scene.add(line);
        })();

        var drawPlane = (function(){
            var geo = new THREE.PlaneBufferGeometry( 1000, 1000 );
            geo.applyMatrix( new THREE.Matrix4().makeRotationX( - Math.PI / 2 ) );

            var plane = new THREE.Mesh(geo);
            plane.visible = false;

            objects.push(plane);
            sceneMap.plane = plane;
            sceneMap.scene.add(plane);
        })();

        var drawRollOverCube = (function(){
            var rollOverCube = new THREE.Mesh(new THREE.BoxGeometry(50, 50, 50), new THREE.MeshBasicMaterial({color: 0xff0000, opacity: 0.5, transparent: true})),
                originCube = new THREE.Mesh(new THREE.BoxGeometry(50, 50, 50), new THREE.MeshBasicMaterial({color: 0x00ff00, opacity: 0.3, transparent: true}));
            sceneMap.scene.add(rollOverCube);
            sceneMap.scene.add(originCube);
            sceneMap.rollOverCube = rollOverCube;
        })();
    };

    var initMenu = function(){
        jqueryMap.$container.append('<div id="Menu"><table><tr class="cube"><td>Cube</td></tr><tr class="base"><td>Base</td></tr><tr class="house"><td>house</td></tr></table><div class="export">Export</div></div>');
        var $cube = jqueryMap.$container.find('.cube'),
            $base = jqueryMap.$container.find('.base'),
            $house = jqueryMap.$container.find('.house'),
            $export = jqueryMap.$container.find('.export');

        for (var i = 0; i < materials.length; i++) {
            $cube.append('<td class="matPic"><div><img src="texture/' + materials[i].url + '" /></div></td>'); 
            $base.append('<td class="matPic"><div><img src="texture/' + materials[i].url + '" /></div></td>'); 
            $house.append('<td class="matPic"><div><img src="texture/' + materials[i].url + '" /></div></td>'); 
        };

        $cube.find('.matPic').on('click', function(){
            currentIndex = $(this).index() - 1;
            currentType = 'cube';
        });
        $base.find('.matPic').on('click', function(){
            currentIndex = $(this).index() - 1;
            currentType = 'base';
        });
        $house.find('.matPic').on('click', function(){
            currentIndex = $(this).index() - 1;
            currentType = 'house';
        });
        $export.on('click', function(){
            var data = {types: [], cubes: []},
                number = prompt('颜料数量');
            
            while(number != 0){
                var color = prompt('颜色种类');
                data.types.push({color: color, number: number});
                number = prompt('颜料数量');
            }
            
            for (var j = 0; j < cubes.length; j++) {
                var cube = cubes[j],
                    connected = [];
                for (var i = 0; i < cubes.length; i++) {
                    if (cubes[i].position.x == cube.position.x && cubes[i].position.y == cube.position.y && (cubes[i].position.z == cube.position.z + 50 || cubes[i].position.z == cube.position.z - 50)) {
                        connected.push(i);
                    } else if (cubes[i].position.z == cube.position.z && cubes[i].position.y == cube.position.y && (cubes[i].position.x == cube.position.x + 50 || cubes[i].position.x == cube.position.x - 50)) {
                        connected.push(i);
                    } else if (cubes[i].position.x == cube.position.x && cubes[i].position.z == cube.position.z && (cubes[i].position.y == cube.position.y + 50 || cubes[i].position.y == cube.position.y - 50)) {
                        connected.push(i);
                    }
                };
                data.cubes.push({position: cubes[j].position, type: cubes[j].type, color: cubes[j].color, connected: connected});
            };

            var urlObject = window.URL || window.webkitURL || window,
                export_blob = new Blob([JSON.stringify(data)]),
                save_link = document.createElementNS('http://www.w3.org/1999/xhtml', 'a');

                save_link.href = urlObject.createObjectURL(export_blob);
                save_link.download = 'data.json';

            var ev = document.createEvent("MouseEvents");
            ev.initMouseEvent(
                "click", true, false, window, 0, 0, 0, 0, 0
                , false, false, false, false, 0, null
            );
            save_link.dispatchEvent(ev);
        });
    };

    var render = function(){
        sceneMap.renderer.render(sceneMap.scene, sceneMap.camera);
    };
    
    var animate = function(){
        requestAnimationFrame(animate);
        sceneMap.controls.update();
        render();
    };

    var onMouseMove = function(event){
        event.preventDefault();
        
        sceneMap.mouse.set((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1);

        sceneMap.raycaster.setFromCamera(sceneMap.mouse, sceneMap.camera);

        var intersects = sceneMap.raycaster.intersectObjects(objects);
        
        if(intersects.length) {
            var intersect = intersects[0];

            sceneMap.rollOverCube.position.copy( intersect.point ).add( intersect.face.normal );
            sceneMap.rollOverCube.position.divideScalar( 50 ).floor().multiplyScalar( 50 ).addScalar( 25 );
        }

        render();
    };

    var onDoubleClick = function(event){
        event.preventDefault();
        
        sceneMap.mouse.set((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1);

        sceneMap.raycaster.setFromCamera(sceneMap.mouse, sceneMap.camera);

        var intersects = sceneMap.raycaster.intersectObjects(objects);

        if(intersects.length) {
            var intersect = intersects[0];
            
            if(event.shiftKey) {
                if(intersect.object != sceneMap.plane) {
                    sceneMap.scene.remove(intersect.object);
                    objects.splice(objects.indexOf(intersect.object), 1);
                    cubes.splice(cubes.indexOf(intersect.object), 1);         
                }
            } else {
                var cube = new THREE.Mesh(cubeGeo, new THREE.MeshLambertMaterial({shading: THREE.FlatShading, map: materials[currentIndex].material}));
                if(currentType == 'house'){
                    cube.material.opacity = 0.3;
                    cube.material.transparent = true;
                } else if(currentType == 'base') {
                    cube.material.wireframe = true;
                    cube.material.wireframeLinewidth = 4;
                } 

                cube.position.copy(intersect.point).add(intersect.face.normal);
                cube.position.divideScalar(50).floor().multiplyScalar(50).addScalar(25);
                cube.type = currentType;
                cube.color = materials[currentIndex].color;
                cubes.push(cube);
                sceneMap.scene.add(cube);

                objects.push(cube);
            }
        }
    };

    var onWindowResize = function(){
        sceneMap.camera.aspect = window.innerWidth / window.innerHeight;
        sceneMap.camera.updateProjectionMatrix();

        sceneMap.renderer.setSize(window.innerWidth, window.innerHeight);
    };

    return {
        init: initModule
    };
});