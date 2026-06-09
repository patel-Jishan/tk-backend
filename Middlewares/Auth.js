const jwt = require("jsonwebtoken");

function Auth(...roles) {
  return async (req, res, next) => {
    try {

      let accessToken = req.cookies?.accessToken;

      if (!accessToken) {
        throw new Error("NO_ACCESS_TOKEN");
      }

      const decoded = jwt.verify(
        accessToken,
        process.env.ACCESS
      );

      if (!roles.includes(decoded.role)) {
        return res.json({
          success: false,
          message: "Unauthorized User"
        });
      }

      req.id = decoded.id;
      req.role = decoded.role;

      return next();

    } catch (error) {

      // 🔥 Access Token Expired
      if (
        error.name === "TokenExpiredError" ||
        error.message === "NO_ACCESS_TOKEN"
      ) {

        try {

          const refreshToken =
            req.cookies?.refreshToken;

          if (!refreshToken) {
            return res.json({
              success: false,
              message: "Session Expired. Please login again."
            });
          }

          const decoded = jwt.verify(
            refreshToken,
            process.env.REFRESH
          );

          if (!roles.includes(decoded.role)) {
            return res.json({
              success: false,
              message: "Unauthorized User"
            });
          }

          const newAccessToken = jwt.sign(
            {
              id: decoded.id,
              role: decoded.role
            },
            process.env.ACCESS,
            {
              expiresIn: "15m"
            }
          );

          res.cookie(
            "accessToken",
            newAccessToken,
            {
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite:
                process.env.NODE_ENV === "production"
                  ? "none"
                  : "lax",
              maxAge: 15 * 60 * 1000
            }
          );

          req.id = decoded.id;
          req.role = decoded.role;

          return next();

        } catch (refreshError) {

          res.clearCookie("accessToken");
          res.clearCookie("refreshToken");

          return res.json({
            success: false,
            message: "Session Expired. Please login again."
          });
        }
      }

      return res.json({
        success: false,
        message: "Invalid Token"
      });
    }
  };
}

module.exports = { Auth };
