import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import PremiumDownloadsPage from "./PremiumDownloadsPage";
import BasicDownloadsPage from "./BasicDownloadsPage";

export default function DownloadsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const stateUserId = (location.state as any)?.userId as string | undefined;

  // Get User ID
  const saved = typeof window !== "undefined" ? localStorage.getItem("cc_user") : null;
  const savedUser = saved ? JSON.parse(saved) : null;
  const userId = stateUserId ?? savedUser?.userId ?? savedUser?.id;

  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    if (!userId) {
      navigate("/information");
      return;
    }

    // Check plan from URL (for testing: /downloads?plan=premium) or stored user data
    const queryParams = new URLSearchParams(location.search);
    if (queryParams.get("plan") === "premium") {
      setIsPremium(true);
      setLoading(false);
      return;
    }

    // Check user data (assuming 'plan' property exists or similar)
    const hasPremiumFlag = localStorage.getItem(`premium_${userId}`);
    if (hasPremiumFlag || (savedUser?.plan && (savedUser.plan === 'compass' || savedUser.plan === 'clarity'))) {
      setIsPremium(true);
    } else {
      // Default to Basic
      setIsPremium(false);
    }

    setLoading(false);
  }, [userId, navigate, location.search, savedUser]);

  if (!userId) return null;
  if (loading) return <div className="min-vh-100 bg-surface flex-center">Loading...</div>;

  // Render separate page based on plan
  if (isPremium) {
    return <PremiumDownloadsPage userId={userId} />;
  }

  return <BasicDownloadsPage userId={userId} />;
}
