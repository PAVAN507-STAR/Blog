import User from '../Schema/User.js';

// Middleware to check if user has required permissions
export const checkUserType = (allowedTypes) => {
  return async (req, res, next) => {
    try {
      const clerkId = req.auth.userId;
      
      if (!clerkId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const user = await User.findOne({ clerk_id: clerkId });
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Check if user type is in the allowed types
      if (!allowedTypes.includes(user.user_type)) {
        return res.status(403).json({ 
          error: "Permission denied", 
          message: "Your account doesn't have permission to perform this action" 
        });
      }
      
      // Add user to request for later use
      req.user = user;
      next();
    } catch (error) {
      console.error("User type check middleware error:", error);
      res.status(500).json({ error: "Server error" });
    }
  };
};
