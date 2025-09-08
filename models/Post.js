// models/Post.js (New Version with Structured Fields)
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
    shortInformation: { // Post ke upar 2-line ki summary
        type: DataTypes.TEXT,
        allowNull: true,
    },
    importantDates: { // Important Dates wala table data
        type: DataTypes.JSONB, // JSON format mein data save karenge
        allowNull: true,
    },
    applicationFee: { // Application Fee wala table data
        type: DataTypes.JSONB,
        allowNull: true,
    },
    vacancyDetails: { // Vacancy Details wala table data
        type: DataTypes.JSONB,
        allowNull: true,
    },
    howToApply: { // How to Apply ke steps
        type: DataTypes.TEXT,
        allowNull: true,
    },
    usefulLinks: { // Apply Online, Notification link etc.
        type: DataTypes.JSONB,
        allowNull: true,
    }
  });
  return Post;
};