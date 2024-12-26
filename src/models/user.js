const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.Post, { foreignKey: 'authorId', as: 'posts' });
      User.hasMany(models.Like, { foreignKey: 'userId', as: 'likes' });
      User.hasMany(models.Comment, { foreignKey: 'authorId', as: 'comments' });
    }
  }

  User.init(
    {
      id: { type: DataTypes.STRING, primaryKey: true },
      name: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING },
      lastLoginAt: { type: DataTypes.DATE, allowNull: false },
    },
    {
      sequelize,
      modelName: 'User',
    }
  );

  return User;
};
