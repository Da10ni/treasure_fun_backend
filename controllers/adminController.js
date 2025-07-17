const signup = async (req, res) => {
  try {
    const { username, email, password, confirmPassword, verificationCode } =
      req.body;

    if (
      !username ||
      !email ||
      !password ||
      !confirmPassword ||
      !verificationCode
    ) {
      return res.status(404).json({
        message: "all fields are required!",
        success: false,
      });
    }

    

  } catch (error) {
    res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

const login = async (req, res) => {
  try {
  } catch (error) {
    res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};
