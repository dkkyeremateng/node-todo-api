var bcrypt = require('bcrypt');
var _      = require('underscore');
var crypto = require('crypto-js');
var jwt    = require('jsonwebtoken');

module.exports = function (sequelize, DataTypes) {
    var user = sequelize.define('user', {
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true
            }
        },
        salt: {
            type: DataTypes.STRING
        },
        password_hash: {
            type: DataTypes.STRING
        },
        password: {
            type: DataTypes.VIRTUAL,
            allowNull: false,
            validate: {
                len: [7, 100]
            },
            set: function (value) {
                var salt = bcrypt.genSaltSync(10);
                var hashedPassword = bcrypt.hashSync(value, salt);

                this.setDataValue('password', value);
                this.setDataValue('salt', salt);
                this.setDataValue('password_hash', hashedPassword);
            }
        }
    }, {
        hooks: {
            beforeValidate: function (user, options) {
                if (user && typeof user.email  === "string") {
                    user.email = user.email.toLowerCase();
                }
            }
        },
        instanceMethods: {
            toPublicJSON: function () {
                var json = this.toJSON();
                return _.pick(json, "id", "email", "createdAt", "updatedAt");
            },
            generateToken: function (type) {
                if (!_.isString(type)) {
                    return undefined;
                }

                try {
                    var stringData = JSON.stringify({id: this.get("id"), type: type});
                    var encryptedData = crypto.AES.encrypt(stringData, "abc123@").toString();
                    var token = jwt.sign({
                        token: encryptedData
                    }, "whichiswhich");
                    return token;
                } catch (err) {
                    return undefined;
                }
            }
        },
        classMethods: {
            authenticate: function (body) {
                return new Promise(function(resolve, reject) {
                    if (!_.isString(body.email) || !_.isString(body.password) || body.password.trim().length < 7) {
                        return reject();
                    }

                    var where = {};
                    where.email = body.email;

                    user.findOne({where: where}).then(function (user) {
                        if (!user || !bcrypt.compareSync(body.password, user.get("password_hash"))) {
                            return reject();
                        } else {
                            return resolve(user);
                        }
                    }, function (e) {
                        return reject();
                    }).catch(function (err) {
                        return reject();
                    });
                });
            },
            findByToken: function (token) {
                return new Promise(function(resolve, reject) {
                    console.log("findByToken");
                    try {
                        var decodedJWT = jwt.verify(token, "whichiswhich");
                        console.log(decodedJWT);
                        var bytes = crypto.AES.decrypt(decodedJWT.token, "abc123@");
                        var tokenData = JSON.parse(bytes.toString(crypto.enc.Utf8));

                        console.log("Logging");

                        user.findById(tokenData.id).then(function (user) {
                            if (user) {
                                resolve(user);
                            } else {
                                console.log("Second");
                                reject();
                            }
                        }, function () {
                            console.log("Third");
                            reject();
                        });
                    } catch (err) {
                        console.log("Fouth");
                        reject();
                    }
                });
            }
        }
    });
    return user;
};
