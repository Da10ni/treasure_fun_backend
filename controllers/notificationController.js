import { notificationModal } from "../models/notification.model.js";

const createNotification = async (req, res) => {
  try {
    const { title, description } = req.body;
    const userId = req.userId;

    if (!title || !description) {
      return res.status(400).json({
        message: "Title and description are required!",
        success: false,
      });
    }

    const notification = new notificationModal({
      title,
      description,
      userId,
    });

    await notification.save();

    return res.status(201).json({
      message: "Notification created successfully!",
      success: true,
      data: notification,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

const getNotification = async (req, res) => {
  try {
    const userId = req.userId;

    console.log("Looking for notifications for userId:", userId);

    // Get only the latest notification for the user
    const latestNotification = await notificationModal
      .findOne({ userId })
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    console.log("Found notification:", latestNotification);

    // If no notification found, get the latest notification from any user (for testing)
    if (!latestNotification) {
      console.log(
        "No user-specific notification found, getting latest from all"
      );

      const anyLatestNotification = await notificationModal
        .findOne({})
        .populate("userId", "name email")
        .sort({ createdAt: -1 });

      if (!anyLatestNotification) {
        return res.status(200).json({
          message: "No notifications available in system!",
          success: true,
          data: {
            title: "Welcome to NIMS",
            description:
              "No notifications available at the moment. Please check back later for important updates and announcements.",
          },
        });
      }

      return res.status(200).json({
        message: "Latest notification fetched successfully!",
        success: true,
        data: anyLatestNotification,
      });
    }

    return res.status(200).json({
      message: "Latest notification fetched successfully!",
      success: true,
      data: latestNotification,
    });
  } catch (error) {
    console.error("Error in getNotification:", error);
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

export { createNotification, getNotification };
