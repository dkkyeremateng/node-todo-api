module.exports = function (db) {
    return {
        requireAuthentification: function (req, res, next) {
            var token = req.get("Auth");

            db.user.findByToken(token).then(function (user) {
                req.user = user;
                next();
            }, function () {
                console.log("Found err");
                res.status(401).send();
            });
        }
    };
};
