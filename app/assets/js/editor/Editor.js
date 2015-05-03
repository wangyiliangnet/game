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
    var $container,  
        camera, scene, renderer, controls, ambientLight, directionalLight,
        objects, rollOverCube, cubeGeo, cubeMaterial, plane,
        raycaster, mouse, isShiftDown = false,
        data = [],
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
            },
            {
                color: 'base',
                url: 'cube_base.png',
                isBase: false,
                material: THREE.ImageUtils.loadTexture('texture/cube_base.png')                
            }
        ],
        currMaterial = materials[0];

    var init = function(){
        $(document.body).append('<div id="container"></div>');
        $container = $(document.body).find('#container');

        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.5, 300000);
        camera.position.set( 500, 800, 1300 );
        //camera.lookAt( new THREE.Vector3() );

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

        objects = [];
        cubeGeo = new THREE.BoxGeometry( 50, 50, 50 );
        cubeMaterial = new THREE.MeshLambertMaterial({shading: THREE.FlatShading, map: THREE.ImageUtils.loadTexture("texture/cube_white.png" )});

        document.addEventListener('mousemove', onMouseMove, false);
        document.addEventListener('dblclick', onDoubleClick, false);
        document.addEventListener('keydown', onKeyDown, false);
        document.addEventListener('keyup', onKeyUp, false);

        raycaster = new THREE.Raycaster();
        mouse = new THREE.Vector2();
        menu.init();

        draw();
        animate();

    };

    var draw = function(){
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

            scene.add(line);
        })();

        var drawPlane = (function(){
            var geo = new THREE.PlaneBufferGeometry( 1000, 1000 );
            geo.applyMatrix( new THREE.Matrix4().makeRotationX( - Math.PI / 2 ) );

            plane = new THREE.Mesh(geo);
            plane.visible = false;

            objects.push(plane);
            scene.add(plane);
        })();

        var drawRollOverCube = (function(){
            rollOverCube = new THREE.Mesh(new THREE.BoxGeometry(50, 50, 50), new THREE.MeshBasicMaterial({color: 0xff0000, opacity: 0.5, transparent: true}));
            scene.add(rollOverCube);
        })();
    };

    var render = function(){
        renderer.render(scene, camera);
    };
    
    var animate = function(){
        requestAnimationFrame(animate);
        controls.update();
        render();
    };

    var onMouseMove = function(event){
        event.preventDefault();
        
        mouse.set((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1);

        raycaster.setFromCamera(mouse, camera);

        var intersects = raycaster.intersectObjects(objects);
        
        if(intersects.length) {
            var intersect = intersects[0];
            rollOverCube.position.copy( intersect.point ).add( intersect.face.normal );
            rollOverCube.position.divideScalar( 50 ).floor().multiplyScalar( 50 ).addScalar( 25 );
        }

        render();
    };

    var onDoubleClick = function(event){
        event.preventDefault();

        mouse.set((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1);

        raycaster.setFromCamera(mouse, camera);

        var intersects = raycaster.intersectObjects(objects);

        if(intersects.length) {
            var intersect = intersects[0];
            if(isShiftDown){
                if(intersect.object != plane) {
                    scene.remove(intersect.object);
                    objects.splice(objects.indexOf(intersect.object), 1);             
                }
            } else {
                var cube = new THREE.Mesh(cubeGeo, cubeMaterial);

                cube.position.copy( intersect.point ).add( intersect.face.normal );
                cube.position.divideScalar( 50 ).floor().multiplyScalar( 50 ).addScalar( 25 );
                
                scene.add( cube );
                data.push({
                    position: cube.position,
                    color: currMaterial.color
                });
                objects.push( cube );  
            }
        }
    };

    var onKeyDown = function(event){
        switch(event.keyCode){
            case 16:
                isShiftDown = true;
                break;
        }
    };

    var onKeyUp = function(event){
        switch(event.keyCode){
            case 16:
                isShiftDown = false;
                break;
        }
    };

    var menu = (function(){
        var $Menu, currIndex = 0;
        var init = function(){
            var menuTemplate = '<div id="Menu"><div><img id="currMaterial" src="texture/cube_white.png"><div id="currMaterialName"></div></div><div id="buttons"><a class="btn" id="last" href="javascript:;">Last</a><a class="btn" id="next" href="javascript:;">Next</a><a class="btn" id="export" href="javascript:;">Export</a></div><div><label><input type="checkbox" />IsHouse</label></div></div>';
            $container.append(menuTemplate);
            $Menu = $container.find('#Menu');
            $Menu.css({'position': 'absolute', 'top': 0, 'right': 0});
            $Menu.find('#last').on('click', function(){
                currIndex = (currIndex + materials.length - 1) % materials.length;
                switchTexture();
            });
            $Menu.find('#next').on('click', function(){
                currIndex = (currIndex + 1) % materials.length;
                switchTexture();
            });
            $Menu.find('#export').on('click', function(){
                var urlObject = window.URL || window.webkitURL || window;
                var x = JSON.stringify(data);
                
                var export_blob = new Blob([x]);

                var save_link = document.createElementNS('http://www.w3.org/1999/xhtml', 'a');

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

        var switchTexture = function(){
            currMaterial = materials[currIndex];
            $Menu.find('#currMaterialName').text(currMaterial.color);
            $Menu.find('#currMaterial').attr('src', 'texture/' + currMaterial.url);
            cubeMaterial = new THREE.MeshLambertMaterial({shading: THREE.FlatShading, map: currMaterial.material});
        };
        return {
            init: init
        };
    })();


    return {
        init: init
    };
});