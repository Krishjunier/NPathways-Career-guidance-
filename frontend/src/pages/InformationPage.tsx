import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Mail, Phone, GraduationCap, Globe, Target, ArrowRight, Loader2, CheckCircle, Smartphone } from "lucide-react";
import { motion } from "framer-motion";

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

// UI Helper Component defined outside to prevent re-mount/focus loss
const InputGroup = ({
  label,
  name,
  value,
  onChange,
  error,
  icon: Icon,
  type = "text",
  placeholder,
  options
}: {
  label: string,
  name: keyof InformationForm,
  value: string,
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void,
  error?: string,
  icon: any,
  type?: string,
  placeholder?: string,
  options?: { val: string, label: string }[]
}) => (
  <div className="mb-4">
    <label htmlFor={name} className="form-label small fw-bold text-secondary mb-2">{label}</label>
    <div className="position-relative">
      <Icon className="position-absolute top-50 translate-middle-y text-secondary opacity-50" style={{ left: '16px' }} size={18} />
      {options ? (
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          className={`modern-input ${error ? "is-invalid border-danger" : ""}`}
          style={{ paddingLeft: '48px', appearance: 'none' }}
        >
          <option value="">{placeholder || "Select an option"}</option>
          {options.map(opt => <option key={opt.val} value={opt.val}>{opt.label}</option>)}
        </select>
      ) : (
        <input
          id={name}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          className={`modern-input ${error ? "is-invalid border-danger" : ""}`}
          placeholder={placeholder}
          style={{ paddingLeft: '48px' }}
        />
      )}
    </div>
    {error && <div className="text-danger small mt-1 ms-1">{error}</div>}
  </div>
);

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
    // Clear error when user types
    if (errors[name as keyof InformationForm]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
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
      setServerOtp(data.otp);
      setUserId(data.userId);

      // Trigger Email Sending from Frontend (Bypassing Render SMTP block)
      try {
        await fetch("/.netlify/functions/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: form.email,
            subject: "Your Login OTP - Career Counselling",
            html: `
              <div style="font-family: sans-serif; padding: 20px;">
                  <h2>Hello ${form.name},</h2>
                  <p>Your OTP is:</p>
                  <h1 style="color: #4F46E5;">${data.otp}</h1>
                  <p><small>Sent via Netlify Function</small></p>
              </div>
            `
          })
        });
        console.log("Email sent via Netlify Function");
      } catch (emailErr) {
        console.error("Failed to trigger email from frontend:", emailErr);
      }

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

      await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          profile: {
            goal: form.goal,
            targetCountry: form.target_country,
            endGoal: form.goal,
          },
        }),
      });

      navigate("/psychometric/ria-sec", { state: { userId } });
    } catch (err: any) {
      console.error("Verify OTP error:", err);
      setErrorMessage(err.message || "Failed to verify OTP");
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="modern-container d-flex flex-column justify-content-center align-items-center py-5 px-3">

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card w-100 position-relative overflow-hidden"
        style={{ maxWidth: '550px', padding: '0' }}
      >
        <div className="position-absolute top-0 start-0 w-100" style={{ height: '4px', background: '#f3f4f6' }}>
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: otpSent ? '100%' : '50%' }}
            className="h-100 bg-primary"
          />
        </div>

        <div className="p-4 p-md-5">
          <div className="text-center mb-5">
            <h1 className="h3 fw-bold mb-2 font-heading">{otpSent ? "Verify Mobile" : "Student Profile"}</h1>
            <p className="text-secondary small">
              {otpSent
                ? "Enter the code sent to your phone"
                : "Help us personalize your career roadmap"}
            </p>
          </div>

          {!otpSent ? (
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onSubmit={handleSubmit}
            >
              <div className="row g-2">
                <div className="col-12">
                  <InputGroup
                    label="Full Name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    error={errors.name}
                    icon={User}
                    placeholder="John Doe"
                  />
                </div>

                <div className="col-12 col-md-6">
                  <InputGroup
                    label="Email Address"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    error={errors.email}
                    icon={Mail}
                    type="email"
                    placeholder="john@example.com"
                  />
                </div>
                <div className="col-12 col-md-6">
                  <InputGroup
                    label="Phone Number"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    error={errors.phone}
                    icon={Phone}
                    placeholder="+91 99999 99999"
                  />
                </div>

                <div className="col-12">
                  <InputGroup
                    label="Current Education Level"
                    name="class_status"
                    value={form.class_status}
                    onChange={handleChange}
                    error={errors.class_status}
                    icon={GraduationCap}
                    options={[
                      { val: "school", label: "School Student" },
                      { val: "12th", label: "Class 12th" },
                      { val: "10th+diploma", label: "10th + Diploma" },
                      { val: "ug", label: "Undergraduate (UG)" },
                      { val: "ug+diploma", label: "UG + Diploma" },
                      { val: "master", label: "Masters / Postgrad" },
                    ]}
                  />
                </div>

                <div className="col-12 col-md-6">
                  <InputGroup
                    label="Target Country"
                    name="target_country"
                    value={form.target_country}
                    onChange={handleChange}
                    error={errors.target_country}
                    icon={Globe}
                    placeholder="e.g. USA, UK, India"
                  />
                </div>
                <div className="col-12 col-md-6">
                  <InputGroup
                    label="Dream Career Goal"
                    name="goal"
                    value={form.goal}
                    onChange={handleChange}
                    error={errors.goal}
                    icon={Target}
                    placeholder="e.g. Data Scientist"
                  />
                </div>
              </div>

              {errorMessage && (
                <div className="alert alert-danger bg-danger bg-opacity-10 border-danger border-opacity-25 text-danger font-sm rounded-3 py-2 px-3 mb-4">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                className="btn-primary w-100 py-3 d-flex align-items-center justify-content-center gap-2 mt-2"
                disabled={loading}
              >
                {loading ? <Loader2 className="spin" size={20} /> : <>Next Step <ArrowRight size={20} /></>}
              </button>
            </motion.form>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-center"
            >
              <div className="mb-4 d-inline-flex justify-content-center align-items-center bg-primary bg-opacity-10 rounded-circle text-primary" style={{ width: '80px', height: '80px' }}>
                <Smartphone size={32} />
              </div>

              <div className="mb-4">
                <p className="mb-2 text-secondary">
                  We sent a verification code to <br />
                  <span className="fw-bold text-dark">{form.phone}</span>
                </p>
                {serverOtp && <span className="badge bg-secondary bg-opacity-10 text-secondary border">Dev Mode: {serverOtp}</span>}
              </div>

              <div className="mb-4 text-start">
                <label className="form-label small fw-bold text-secondary text-center w-100">One-Time Password</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="modern-input text-center fw-bold fs-4 letter-spacing-2"
                  style={{ letterSpacing: '0.5rem' }}
                  placeholder="• • • • • •"
                  maxLength={6}
                  autoFocus
                />
              </div>

              {errorMessage && (
                <div className="alert alert-danger bg-danger bg-opacity-10 border-danger border-opacity-25 text-danger font-sm rounded-3 py-2 px-3 mb-4">
                  {errorMessage}
                </div>
              )}

              <button
                onClick={handleVerifyOtp}
                className="btn-primary w-100 py-3 d-flex align-items-center justify-content-center gap-2"
                disabled={verifying}
              >
                {verifying ? <Loader2 className="spin" size={20} /> : <>Verify & Start Test <CheckCircle size={20} /></>}
              </button>

              <button
                onClick={() => setOtpSent(false)}
                className="btn-ghost mt-3 text-secondary small w-100"
              >
                Edit Phone Number
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
