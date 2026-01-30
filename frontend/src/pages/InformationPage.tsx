// src/pages/InformationPage.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

type InformationForm = {
  name: string;
  email: string;
  phone: string;
  class_status: string;
  goal: string;
  target_country: string;
};

const initialForm: InformationForm = {
  name: "",
  email: "",
  phone: "",
  class_status: "",
  goal: "",
  target_country: "",
};

export default function InformationPage() {
  const [form, setForm] = useState<InformationForm>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof InformationForm, string>>>({});
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [serverOtp, setServerOtp] = useState("");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  function validate(): boolean {
    const newErrors: Partial<Record<keyof InformationForm, string>> = {};
    if (!form.name.trim()) newErrors.name = "Name is required";
    if (!form.email.trim()) newErrors.email = "Email is required";
    if (!form.phone.trim()) newErrors.phone = "Phone is required";
    if (!form.class_status.trim()) newErrors.class_status = "Please select your class status";
    if (!form.target_country.trim()) newErrors.target_country = "Please enter your target country";
    if (!form.goal.trim()) newErrors.goal = "Please enter your goal";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Step 1: Register and send OTP
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          class_status: form.class_status,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Registration failed");

      console.log("Register response:", data);
      setServerOtp(data.otp); // show OTP for testing
      setUserId(data.userId);
      setOtpSent(true);
    } catch (err: any) {
      console.error("Register error:", err);
      setErrorMessage(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  }

  // Step 2: Verify OTP
  async function handleVerifyOtp() {
    if (!otp.trim()) {
      setErrorMessage("Please enter OTP");
      return;
    }
    setVerifying(true);
    setErrorMessage("");
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, otp }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "OTP verification failed");

      console.log("OTP verified:", data);
      localStorage.setItem("cc_user", JSON.stringify({ userId, name: form.name }));

      // ✅ Once verified, send user goal to backend profile
      await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          profile: {
            endGoal: form.goal, // Mapping form 'goal' (text) to backend 'endGoal' (legacy name preference? or just field name)
            // Correction: backend typically uses 'goal' or 'careerGoal', but plan said 'endGoal'. 
            // Let's stick to 'goal' as per my previous thought, but 'endGoal' was in the plan.
            // Actually, report.js compileProfile checks `user.goal || uProfile.goal`.
            // The file currently has `endGoal: form.goal`. I should probably change it to `goal: form.goal` to match report.js 
            // OR keep `endGoal` and let compileProfile find it? 
            // report.js has: `goal: user.goal || ...` 
            // AND `targetCountry`. 
            // So I will send `goal` and `targetCountry`.
            goal: form.goal,
            targetCountry: form.target_country,
          },
        }),
      });

      // Navigate to psychometric test
      navigate("/psychometric/ria-sec", { state: { userId } });
    } catch (err: any) {
      console.error("Verify OTP error:", err);
      setErrorMessage(err.message || "Failed to verify OTP");
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-lg-6">
          <div className="card shadow-sm p-4">
            <h3 className="text-center mb-3">Student Information</h3>

            {!otpSent ? (
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className={`form-control ${errors.name ? "is-invalid" : ""}`}
                  />
                  {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                </div>

                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className={`form-control ${errors.email ? "is-invalid" : ""}`}
                  />
                  {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                </div>

                <div className="mb-3">
                  <label className="form-label">Phone</label>
                  <input
                    type="text"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className={`form-control ${errors.phone ? "is-invalid" : ""}`}
                  />
                  {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
                </div>

                <div className="mb-3">
                  <label className="form-label">Current Level</label>
                  <select
                    name="class_status"
                    value={form.class_status}
                    onChange={handleChange}
                    className={`form-select ${errors.class_status ? "is-invalid" : ""}`}
                  >
                    <option value="">Select</option>
                    <option value="school">School Student</option>
                    <option value="12th">12th</option>
                    <option value="10th+diploma">10th + Diploma</option>
                    <option value="ug">Undergraduate (UG)</option>
                    <option value="ug+diploma">UG + Diploma</option>
                    <option value="master">Master</option>
                  </select>
                  {errors.class_status && <div className="invalid-feedback">{errors.class_status}</div>}
                </div>

                <div className="mb-3">
                  <label className="form-label">Target Country</label>
                  <input
                    type="text"
                    name="target_country"
                    value={form.target_country}
                    onChange={handleChange}
                    className={`form-control ${errors.target_country ? "is-invalid" : ""}`}
                    placeholder="e.g. USA, UK, India"
                  />
                  {errors.target_country && <div className="invalid-feedback">{errors.target_country}</div>}
                </div>

                <div className="mb-3">
                  <label className="form-label">Your End Goal</label>
                  <input
                    type="text"
                    name="goal"
                    value={form.goal}
                    onChange={handleChange}
                    className={`form-control ${errors.goal ? "is-invalid" : ""}`}
                    placeholder="e.g. Software Engineer, Entrepreneur, Higher Studies"
                  />
                  {errors.goal && <div className="invalid-feedback">{errors.goal}</div>}
                </div>

                {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}

                <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                  {loading ? "Sending OTP..." : "Register & Get OTP"}
                </button>
              </form>
            ) : (
              <div>
                <p className="text-center">
                  OTP has been sent to <strong>{form.phone}</strong>. <br />
                  (For testing: <b>{serverOtp}</b>)
                </p>

                <div className="mb-3">
                  <label className="form-label">Enter OTP</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="form-control"
                    placeholder="Enter the OTP"
                  />
                </div>

                {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}

                <button onClick={handleVerifyOtp} className="btn btn-success w-100" disabled={verifying}>
                  {verifying ? "Verifying..." : "Verify & Continue"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
