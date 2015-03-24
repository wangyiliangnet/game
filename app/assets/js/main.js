require(['ubinota/Ubinota'], function(Ubinota) {
	var ubinota = new Ubinota();
	ubinota.init();
	console.log(ubinota.loadingPage.skybox);
	function render(){
		ubinota.loadingPage.controls.update();
		ubinota.loadingPage.renderer.render(ubinota.loadingPage.scene, ubinota. loadingPage.camera);
	}
	function animate(){
		requestAnimationFrame(animate);
		ubinota.loadingPage.skybox.rotation.y -= 0.0004;

		ubinota.loadingPage.stats.update();
		render();
	}
	animate();
});
