export default (sequelize, DataTypes) => {
  const SubCategory = sequelize.define('SubCategory', {
    name: { type: DataTypes.STRING, allowNull: false },
    slug: { type: DataTypes.STRING, allowNull: false },
  });
  return SubCategory;
};