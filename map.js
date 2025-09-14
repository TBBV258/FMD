// Simple map helper - opens coordinates in Google Maps in a new window/tab
(function () {
    window.mapHelper = {
        open(lat, lng) {
            if (typeof lat !== 'number' || typeof lng !== 'number') {
                console.warn('Invalid coordinates');
                return;
            }
            const url = `https://www.google.com/maps?q=${lat},${lng}`;
            window.open(url, '_blank');
        },

        showCurrentLocation() {
            if (!navigator.geolocation) return alert('Geolocation not supported');
            navigator.geolocation.getCurrentPosition(pos => {
                window.mapHelper.open(pos.coords.latitude, pos.coords.longitude);
            }, err => {
                console.error('Geolocation error', err);
                alert('Unable to get location');
            });
        }
    };
})();