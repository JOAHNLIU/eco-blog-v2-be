const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Like extends Model {
    static associate(models) {
      Like.belongsTo(models.Post, { foreignKey: 'postId', as: 'post' });
      Like.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    }
  }

  Like.init(
    {
      postId: { type: DataTypes.INTEGER, allowNull: false },
      userId: { type: DataTypes.STRING, allowNull: false },
    },
    {
      sequelize,
      modelName: 'Like',
    }
  );

  return Like;
};
