'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('DataSets', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        allowNull: false,
        type: Sequelize.STRING
      },
      table_name: {
        allowNull: false,
        unique: true,
        type: Sequelize.STRING
      },
      title: {
        allowNull: false,
        type: Sequelize.STRING
      },
      pluralTitle: {
        allowNull: false,
        type: Sequelize.STRING
      },
      settings: {
        type: Sequelize.JSON
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('DataSets');
  }
};
