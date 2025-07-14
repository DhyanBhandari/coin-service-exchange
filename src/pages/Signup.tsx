import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { useState } from "react";
import { FaUserPlus } from "react-icons/fa6";

const formSchema = z.object({
  name: z.string().min(3, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["user", "org"]).optional(),
});

const Signup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: any) => {
    try {
      setLoading(true);

      // Default role to 'user' if not selected
      if (!data.role) {
        data.role = "user";
      }

      const res = await fetch("http://localhost:5000/api/v1/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (res.ok) {
        toast.success("🎉 Signup successful! Please login.");
        navigate("/login");
      } else {
        toast.error(result?.message || "Signup failed.");
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
          <FaUserPlus className="text-blue-600 text-4xl mx-auto" />
          <h2 className="text-xl font-semibold mt-2">Create your account</h2>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm">Name</label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-md outline-blue-500"
              {...register("name")}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message as string}</p>}
          </div>

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

          <div>
            <label className="block mb-1 text-sm">Select Role</label>
            <select
              className="w-full px-3 py-2 border rounded-md outline-blue-500"
              {...register("role")}
              defaultValue="user"
            >
              <option value="user">User</option>
              <option value="org">Organization</option>
            </select>
            {errors.role && <p className="text-sm text-red-500">{errors.role.message as string}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
          >
            {loading ? "Creating..." : "Sign Up"}
          </button>

          <p className="text-sm text-center mt-2">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-600 hover:underline">
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Signup;
