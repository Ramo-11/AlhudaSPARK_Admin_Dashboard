const AUTH_PASSWORD = 'spark@25';
const COOKIE_NAME = 'admin_auth';
const COOKIE_MAX_AGE = 24 * 60 * 60 * 1000; // 1 day in milliseconds

// Middleware to check if user is authenticated
const requireAuth = (req, res, next) => {
    // Check if authenticated cookie exists and is valid
    if (req.cookies[COOKIE_NAME] === 'authenticated') {
        return next();
    }

    // Not authenticated, redirect to login
    return res.redirect('/login');
};

// Verify password
const verifyPassword = (password) => {
    return password === AUTH_PASSWORD;
};

// Set auth cookie
const setAuthCookie = (res) => {
    res.cookie(COOKIE_NAME, 'authenticated', {
        maxAge: COOKIE_MAX_AGE,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
    });
};

// Clear auth cookie
const clearAuthCookie = (res) => {
    res.clearCookie(COOKIE_NAME);
};

module.exports = {
    requireAuth,
    verifyPassword,
    setAuthCookie,
    clearAuthCookie,
    COOKIE_MAX_AGE,
};
