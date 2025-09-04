const { validateToken } = require("../service/authentication");

function checkForAuthenticationCookie(cookieName) {
  return (req, res, next) => {
    console.log("All cookies:", req.cookies);

    const tokenCookieValue = req.cookies[cookieName];
    console.log("Token cookie value:", tokenCookieValue);

    if (!tokenCookieValue) {
      return next();
    }

    try {
      const userPayload = validateToken(tokenCookieValue);
      req.user = userPayload;
      res.locals.user = userPayload;
    } catch (error) {
      console.error('Invalid token:', error);
      // optionally clear invalid token cookie here
      // res.clearCookie(cookieName);
    }

    return next();
  };
}

module.exports = {
  checkForAuthenticationCookie,
};
