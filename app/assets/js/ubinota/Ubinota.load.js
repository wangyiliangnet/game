require(['ubinota/Ubinota'], function(Ubinota) {
	Ubinota.loadModule = (function(){
		var manager = new THREE.LoadingManager(),
			loaders = {},
			resources = {},
            load;

        load = function(reourceInfo, onLoad){
            for (var i = 0; i < resourceInfo.length; i++) {
                switch(resourceInfo[i].type){
                    case 'map':
                        loaders[resourceInfo[i].name] = new THREE.XHRLoader(manager);
                        loaders[resourceInfo[i].name].load(resourceInfo[i].mapUrl, function(data){
                            resources[resourceInfo[i].name] = data;
                        });
                        break;
                    case 'model':
                        loaders[resourceInfo[i].name] = new THREE.OBJMTLLoader(manager);
                        loaders[resourceInfo[i].name].load(resourceInfo[i].modelUrl, resourceInfo[i].mtlUrl, function(data){
                            resources[resourceInfo[i].name] = data;
                        });                    
                        break;
                    case 'mtl':
                        loaders[resourceInfo[i].name] = new THREE.MTLLoader('../model/', manager);
                        loaders[resourceInfo[i].name].load(resourceInfo[i].mtlUrl, function(data){
                            resources[resourceInfo[i].name] = data;
                        });                    
                        break;
                } 
            };
            manager.onLoad = onLoad;
        };

        return {load: load};
	})();
});