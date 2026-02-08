export function friendlyError(code, fallbackMessage) {
  switch (code) {
    case "ALREADY_VOTED":
      return "You already voted. Voting is locked.";
    case "TOKEN_ALREADY_USED":
      return "This voting token was already used. Voting is locked.";
    case "TOKEN_EXPIRED":
      return "Token expired. Please try again.";
    case "INVALID_CREDENTIALS":
      return "Invalid voter ID or password.";
    case "INVALID_OTP":
      return "Invalid OTP code. Please check and try again.";
    case "VOTER_INACTIVE":
      return "Your account is inactive. Please contact support.";
    case "ACCOUNT_LOCKED":
      return "Your account is locked due to multiple failed attempts. Try again later.";
    case "CORS_NOT_ALLOWED":
      return "CORS blocked the request. Make sure backend allows this frontend origin.";
    case "NETWORK_ERROR":
      return "Cannot reach backend. Check backend URL and that it is running.";
    default:
      return fallbackMessage || "Something went wrong.";
  }
}
