// Add to top of app.js
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Enhanced image upload with validation
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Security checks
    if (!ALLOWED_TYPES.includes(file.type)) {
        showMessage('pickupStatus', 'Invalid file type. Use JPG/PNG/WebP', 'error');
        return;
    }
    if (file.size > MAX_FILE_SIZE) {
        showMessage('pickupStatus', 'File too large (max 5MB)', 'error');
        return;
    }

    // Sanitize filename
    const safeName = sanitizeInput(file.name);

    const reader = new FileReader();
    reader.onload = function (e) {
        // ... rest of your code
    };
    reader.readAsDataURL(file);
}

// Rate limited login
window.handleLogin = () => {
    try {
        const email = sanitizeInput(document.getElementById('loginEmail').value);
        rateLimit(email);
        // ... login logic
    } catch (e) {
        showMessage('loginStatus', e.message, 'error');
    }

    // Track key events
    function trackEvent(category, action, label) {
        if (window.gtag) {
            gtag('event', action, {
                event_category: category,
                event_label: label
            });
        }
        console.log(`GA: ${category}/${action}/${label}`);
    }

    // Usage
    trackEvent('waste', 'classified', currentClassifiedWaste);
    trackEvent('pickup', 'requested', location);
};