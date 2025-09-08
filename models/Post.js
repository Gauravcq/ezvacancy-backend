// BACKEND -> models/Post.js (Go back to JSONB with defaults)
export default (sequelize, DataTypes) => {
  const Post = sequelize.define('Post', {
    postType: { type: DataTypes.ENUM('notification', 'result', 'admit-card', 'answer-key', 'syllabus'), allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false },
    slug: { type: DataTypes.STRING, allowNull: false, unique: true },
    postDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    shortInformation: { type: DataTypes.TEXT, allowNull: true },
    importantDates: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    applicationFee: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    ageLimit: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    vacancyDetails: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    howToApply: { type: DataTypes.TEXT, allowNull: true },
    usefulLinks: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} }
  });
  return Post;
};