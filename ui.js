// Small UI utilities - define only if not already provided
(function () {
    if (!window.showToast) {
        window.showToast = function (message, type = 'info') {
            const container = document.getElementById('toast-container') || document.body;
            const el = document.createElement('div');
            el.className = `toast ${type}`;
            el.style.padding = '8px 12px';
            el.style.marginTop = '8px';
            el.style.background = type === 'error' ? '#f8d7da' : (type === 'success' ? '#d1e7dd' : '#e2e3e5');
            el.textContent = message;
            container.appendChild(el);
            setTimeout(() => el.remove(), 4000);
        };
    }

    window.ui = {
        showSpinner(container) {
            if (!container) return null;
            const s = document.createElement('div');
            s.className = 'spinner';
            s.textContent = 'Loading...';
            container.appendChild(s);
            return s;
        },
        hideSpinner(spinner) {
            spinner?.remove();
        },
        confirm(message) {
            return confirm(message);
        }
    };
})();