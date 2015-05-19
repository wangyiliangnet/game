requirejs.config({
	waitSeconds: 100,
});
require(['ubinota/Ubinota'], function(Ubinota) {

	Ubinota.init();

});
