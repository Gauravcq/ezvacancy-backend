// BACKEND Project -> models/Post.js (FINAL, SAFER VERSION)

export default (sequelize, DataTypes) => {
  const Post = sequelize.define('Post', {
    postType: {
      type: DataTypes.ENUM('notification', 'result', 'admit-card', 'answer-key', 'syllabus'),
      allowNull: false,
    },
    title: { type: DataTypes.STRING, allowNull: false },
    slug: { type: DataTypes.STRING, allowNull: false, unique: true },
    postDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    
    // Yahan humne 'content' ko hata kar naye fields add kiye hain
    shortInformation: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    importantDates: {
        type: DataTypes.JSONB,
        allowNull: false,        // Change 1: Cannot be null
        defaultValue: {}        // Change 2: Default is an empty object
    },
    applicationFee: {
        type: DataTypes.JSONB,
        allowNull: false,        // Change 1
        defaultValue: {}        // Change 2
    },
    vacancyDetails: {
        type: DataTypes.JSONB,
        allowNull: false,        // Change 1
        defaultValue: {}        // Change 2
    },
    howToApply: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    usefulLinks: {
        type: DataTypes.JSONB,
        allowNull: false,        // Change 1
        defaultValue: {}        // Change 2
    }
  });
  return Post;
};