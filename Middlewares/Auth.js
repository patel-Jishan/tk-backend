let jwt = require('jsonwebtoken');

function Auth(...roles) {
    return (req, res, next) => {
        try {
            let token = req.cookies?.accessToken;
            if (!token) return res.json({ success: false, message: "Token not provided" });

            let decoded = jwt.verify(token, process.env.ACCESS);

            if (roles.includes(decoded.role)) {
                req.id = decoded.id;
                req.role = decoded.role;
                next();
            } else {
                return res.json({ success: false, message: "Unauthorized User" });
            }

        } catch (error) {
            try {
                if (error.message === "jwt expired") {
                    let refresh = req.cookies?.refreshToken;
                    if (!refresh) return res.json({ success: false, message: "Refresh token not provided" });

                    let decoded = jwt.verify(refresh, process.env.REFRESH);

                    let newAccessToken = jwt.sign(
                        { id: decoded.id, role: decoded.role },
                        process.env.ACCESS,
                        { expiresIn: "15m" }
                    );

                    res.cookie("accessToken", newAccessToken, {
                        httpOnly: true,
                        secure: false,
                        sameSite: "lax",
                        maxAge: 15 * 60 * 1000, // 15 minutes
                    });

                    req.id = decoded.id;
                    req.role = decoded.role;
                    next();
                }
            } catch (err) {
                return res.json({ success: false, message: "Refresh token invalid" });
            }
        }
    };
}

module.exports = { Auth };
