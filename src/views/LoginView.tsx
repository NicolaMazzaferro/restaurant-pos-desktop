import { useState } from "react";
import { api } from "../api/client";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "../store/authStore";

export default function LoginView() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  const { setAuth } = useAuthStore();

  const validate = () => {
    const newErrors: typeof fieldErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) newErrors.email = "L'email è obbligatoria.";
    else if (!emailRegex.test(email)) newErrors.email = "Inserisci un'email valida.";

    if (!password.trim()) newErrors.password = "La password è obbligatoria.";

    setFieldErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    if (!validate()) return;

    setLoading(true);

    try {
      // 🔹 Esegui la chiamata API
      const res = await api.post("auth/login", { email, password });
      const { token, user } = res.data;

      if (token && user) {
        // Salva nello store globale
        setAuth({
          token,
          name: user.name ?? "Operatore",
          role: user.role ?? "cashier",
        });

        // Vai alla home
        window.location.href = "/";
      } else {
        setError("Risposta non valida dal server.");
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      setError("Credenziali errate o server non raggiungibile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg rounded-lg p-8 w-96 space-y-4"
      >
        <h2 className="text-2xl font-bold text-center text-blue-700 mb-4">
          A Villetta Login
        </h2>

        {error && (
          <div className="bg-red-100 text-red-700 p-2 rounded text-sm">
            {error}
          </div>
        )}

        {/* EMAIL */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="text"
            value={email}
            disabled={loading}
            onChange={(e) => setEmail(e.target.value)}
            className={`mt-1 w-full border rounded-md p-2 ${
              loading ? "bg-gray-100 cursor-not-allowed" : ""
            } ${fieldErrors.email ? "border-red-500" : "border-gray-300"}`}
          />
          {fieldErrors.email && (
            <p className="text-red-600 text-sm mt-1">{fieldErrors.email}</p>
          )}
        </div>

        {/* PASSWORD */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            type="password"
            value={password}
            disabled={loading}
            onChange={(e) => setPassword(e.target.value)}
            className={`mt-1 w-full border rounded-md p-2 ${
              loading ? "bg-gray-100 cursor-not-allowed" : ""
            } ${fieldErrors.password ? "border-red-500" : "border-gray-300"}`}
          />
          {fieldErrors.password && (
            <p className="text-red-600 text-sm mt-1">{fieldErrors.password}</p>
          )}
        </div>

        {/* BOTTONE LOGIN */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full flex justify-center items-center gap-2 bg-blue-700 text-white py-2 rounded-md hover:bg-blue-800 transition ${
            loading ? "opacity-70 cursor-not-allowed" : ""
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin w-5 h-5" />
              <span>Accesso in corso...</span>
            </>
          ) : (
            "Accedi"
          )}
        </button>
      </form>
    </div>
  );
}
