const Setting = require("../Models/SettingSchema");

async function UpdateProfit(req, res) {
  try {
    const { profitPercentage } = req.body;

    let setting = await Setting.findOne();

    if (!setting) {
      setting = await Setting.create({
        profitPercentage
      });
    } else {
      setting.profitPercentage = profitPercentage;
      await setting.save();
    }

    res.json({
      success: true,
      setting
    });

  } catch (error) {
    res.json({
      success: false,
      message: error.message
    });
  }
}

async function GetProfit(req, res) {
  try {
    let setting = await Setting.findOne();

    if (!setting) {
      setting = await Setting.create({
        profitPercentage: 25
      });
    }

    res.json({
      success: true,
      setting
    });

  } catch (error) {
    res.json({
      success: false,
      message: error.message
    });
  }
}

module.exports = {
  UpdateProfit,
  GetProfit
};
