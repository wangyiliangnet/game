require(['ubinota/Ubinota'], function(Ubinota) {
	var ubinota = new Ubinota();
	ubinota.init();
	function render(){
		ubinota.loadingPage.controls.update();
		ubinota.loadingPage.renderer.render(ubinota.loadingPage.scene, ubinota. loadingPage.camera);
	}
	function animate(){
		requestAnimationFrame(animate);
		//ubinota.loadingPage.skybox.rotation.y += 0.01;
		//console.log(ubinota.loadingPage.skybox.rotation.y);
		render();
	}
	animate();
});
