const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CommentLikes = sequelize.define('CommentLikes', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  // Associations
  CommentLikes.associate = (models) => {
    CommentLikes.belongsTo(models.Comment, {
      foreignKey: 'commentId',
      onDelete: 'CASCADE',
    });
    CommentLikes.belongsTo(models.User, {
      foreignKey: 'userId',
      onDelete: 'CASCADE',
    });
  };

  return CommentLikes;
};
