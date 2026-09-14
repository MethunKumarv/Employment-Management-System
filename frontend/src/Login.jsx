import { useState } from "react";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";


const API_URL = import.meta.env.VITE_API_URL;


function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);


  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const formData = new URLSearchParams();

      formData.append("username", username);
      formData.append("password", password);

      const response = await axios.post(
        `${API_URL}/auth/login`,
        formData,
        {
          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded",
          },
        }
      );

      onLogin(response.data);

    } catch (error) {
      console.error("Login error:", error);

      if (error.response?.status === 401) {
        setError("Incorrect username or password.");
      } else if (error.response?.status === 403) {
        setError(
          error.response.data?.detail ||
          "Your account is inactive."
        );
      } else {
        setError(
          "Unable to connect to the server."
        );
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="login-page">
      <div className="login-card">

        <div className="login-brand">
          <h1>HexaEMS</h1>
          <p>Employee Management Platform</p>
        </div>

        <form onSubmit={handleSubmit}>

          <div className="login-field">
            <label htmlFor="username">
              Username
            </label>

            <input
              id="username"
              type="text"
              value={username}
              onChange={(event) =>
                setUsername(event.target.value)
              }
              placeholder="Enter your username"
              required
            />
          </div>


          <div className="login-field">
            <label>Password</label>

            <div className="password-input-wrapper">
                <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) =>
                    setPassword(event.target.value)
                }
                placeholder="Enter your password"
                required
                />

                <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                        setShowPassword((current) => !current)
                    }
                    aria-label={
                        showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    >
                    {showPassword ? (
                        <EyeOff size={18} />
                    ) : (
                        <Eye size={18} />
                    )}
                    </button>
            </div>
            </div>


          {error && (
            <div className="login-error">
              {error}
            </div>
          )}


          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

        </form>

      </div>
    </div>
  );
}


export default Login;