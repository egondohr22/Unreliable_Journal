const User = require('../models/User');
const { handleError, sendNotFound, sendBadRequest } = require('../helpers/responseHelper');

const getUser = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId).select('-password');

    if (!user) {
      return sendNotFound(res, 'User not found');
    }

    res.json({
      id: user._id,
      email: user.email,
      name: user.name,
      settings: user.settings
    });
  } catch (error) {
    handleError(res, error, 'Failed to fetch user');
  }
};

const updateUser = async (req, res) => {
  try {
    const userId = req.userId;
    const { name, settings } = req.body;

    const updateData = {};

    if (name !== undefined) {
      if (!name || name.trim() === '') {
        return sendBadRequest(res, 'Name cannot be empty');
      }
      updateData.name = name.trim();
    }

    if (settings !== undefined) {
      updateData.settings = {};

      if (settings.theme !== undefined) {
        if (!['light', 'dark'].includes(settings.theme)) {
          return sendBadRequest(res, 'Theme must be either "light" or "dark"');
        }
        updateData['settings.theme'] = settings.theme;
      }

      if (settings.entryChangeRate !== undefined) {
        if (!['low', 'medium', 'high'].includes(settings.entryChangeRate)) {
          return sendBadRequest(res, 'Entry change rate must be "low", "medium", or "high"');
        }
        updateData['settings.entryChangeRate'] = settings.entryChangeRate;
      }

      if (Object.keys(updateData.settings).length === 0) {
        delete updateData.settings;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return sendBadRequest(res, 'No valid fields to update');
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return sendNotFound(res, 'User not found');
    }

    res.json({
      id: user._id,
      email: user.email,
      name: user.name,
      settings: user.settings
    });
  } catch (error) {
    handleError(res, error, 'Failed to update user');
  }
};

const logout = async (req, res) => {
  try {
    //doesn't need to be server side at all
    //right now we only clear session data on phone
    //but in case you might need some server side logic here
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    handleError(res, error, 'Failed to logout');
  }
};

module.exports = {
  getUser,
  updateUser,
  logout
};
