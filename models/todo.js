module.exports = function (sequelize, DataTypes) {
    return sequelize.define('todo', {
        description: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                len: [5, 250]
            }
        },
        completed: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        }
    });
};
