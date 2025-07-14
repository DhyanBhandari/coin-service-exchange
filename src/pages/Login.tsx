import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { useState } from "react";
import { FaSignInAlt } from "react-icons/fa";

const formSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/api/v1/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (res.ok) {
        const { token, role } = result.data;

        localStorage.setItem(
          "auth",
          JSON.stringify({ token, role })
        );

        toast.success("🎉 Login successful!");

        // 🔁 Role-based redirect
        if (role === "user") {
          navigate("/dashboard/user");
        } else if (role === "admin") {
          navigate("/dashboard/admin");
        } else if (role === "org") {
          navigate("/dashboard/org");
        } else {
          navigate("/"); // fallback
        }
      } else {
        toast.error(result?.message || "Login failed.");
      }
    } catch (err) {
      toast.error("Something went wrong!");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-blue-50 to-white">
      <div className="bg-white shadow-xl rounded-xl p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <FaSignInAlt className="text-blue-600 text-4xl mx-auto" />
          <h2 className="text-xl font-semibold mt-2">Welcome back!</h2>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm">Email</label>
            <input
              type="email"
              className="w-full px-3 py-2 border rounded-md outline-blue-500"
              {...register("email")}
            />
            {errors.email && <p className="text-sm text-red-500">{errors.email.message as string}</p>}
          </div>
          <div>
            <label className="block mb-1 text-sm">Password</label>
            <input
              type="password"
              className="w-full px-3 py-2 border rounded-md outline-blue-500"
              {...register("password")}
            />
            {errors.password && <p className="text-sm text-red-500">{errors.password.message as string}</p>}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
          <p className="text-sm text-center mt-2">
            Don't have an account?{" "}
            <Link to="/signup" className="text-blue-600 hover:underline">
              Sign up
            </Link>
          </p>
          <p className="text-sm text-center mt-2">
  <Link to="/forgot-password" className="text-blue-600 hover:underline">
    Forgot Password?
  </Link>
</p>

        </form>
      </div>
    </div>
  );
};

export default Login;
