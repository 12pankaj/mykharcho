(async () => {
    try {
        const { Vibrant } = await import('node-vibrant/node');
        const v = new Vibrant('d:\\expence\\shared\\logo.jpeg');
        const palette = await v.getPalette();
        console.log("Vibrant (Primary):", palette.Vibrant.hex);
        console.log("DarkVibrant (Primary Dark):", palette.DarkVibrant.hex);
        console.log("LightVibrant (Primary Light):", palette.LightVibrant.hex);
        console.log("Muted (Secondary):", palette.Muted.hex);
        console.log("DarkMuted (Background):", palette.DarkMuted.hex);
        console.log("LightMuted (Surface/Text):", palette.LightMuted.hex);
    } catch (e) {
        console.error(e);
    }
})();
