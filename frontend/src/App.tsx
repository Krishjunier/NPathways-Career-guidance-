// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ChatPage from './pages/ChatPage';
import LandingPage from './pages/LandingPage';
import HowItWorksPage from './pages/HowItWorksPage';
import DashboardPage from './pages/DashboardPage';
import RiaSecPage from './pages/Psychometric/RiaSecPage';
import IntelligencePage from './pages/Psychometric/IntelligencePage';
import AptitudePage from './pages/Psychometric/AptitudePage';
import EmotionalPage from './pages/Psychometric/EmotionalPage';
import BehavioralPage from './pages/Psychometric/BehavioralPage';
import WorkStylePage from './pages/Psychometric/WorkStylePage';
import LearningStylePage from './pages/Psychometric/LearningStylePage';
import LeadershipPage from './pages/Psychometric/LeadershipPage';
import StressPage from './pages/Psychometric/StressPage';
import CreativityPage from './pages/Psychometric/CreativityPage';
import EditProfilePage from './pages/EditProfilePage';
import PortfolioPage from './pages/PortfolioPage';
import DownloadsPage from './pages/DownloadsPage';
import PaymentPage from './pages/PaymentPage';
import ExtrasPage from './pages/ExtrasPage';
import ResearchPage from './pages/ResearchPage';
import CompletionPage from './pages/CompletionPage';
import FreeBundlePage from './pages/FreeBundlePage';
import ClarityBundlePage from './pages/ClarityBundlePage';
import CompassBundlePage from './pages/CompassBundlePage';
import PlanSelectionPage from './pages/PlanSelectionPage';


function App() {
  return (
    <Router>
      <Routes>
        {/* Main Chat/Information Collection Page */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/select-plan" element={<PlanSelectionPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/information" element={<ChatPage />} />

        {/* Bundle Pages */}
        <Route path="/bundle/free" element={<FreeBundlePage />} />
        <Route path="/bundle/clarity" element={<ClarityBundlePage />} />
        <Route path="/bundle/compass" element={<CompassBundlePage />} />

        {/* Psychometric Test Pages - In Order */}
        <Route path="/psychometric/ria-sec" element={<RiaSecPage />} />
        <Route path="/psychometric/aptitude" element={<AptitudePage />} />
        <Route path="/psychometric/intelligence" element={<IntelligencePage />} />
        <Route path="/psychometric/emotional" element={<EmotionalPage />} />
        <Route path="/psychometric/behavioral" element={<BehavioralPage />} />

        {/* Clarity Bundle Extra Tests */}
        <Route path="/psychometric/work-style" element={<WorkStylePage />} />
        <Route path="/psychometric/learning-style" element={<LearningStylePage />} />

        {/* Compass Bundle Extra Tests */}
        <Route path="/psychometric/leadership" element={<LeadershipPage />} />
        <Route path="/psychometric/stress" element={<StressPage />} />
        <Route path="/psychometric/creativity" element={<CreativityPage />} />

        {/* Results and Portfolio Pages */}
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/profile/edit" element={<EditProfilePage />} />
        <Route path="/profile/:userId" element={<PortfolioPage />} />
        <Route path="/portfolio/:userId" element={<PortfolioPage />} />

        {/* Additional Features */}
        <Route path="/downloads" element={<DownloadsPage />} />
        <Route path="/extras" element={<ExtrasPage />} />
        <Route path="/research" element={<ResearchPage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/completion" element={<CompletionPage />} />
      </Routes>
    </Router>
  );
}

export default App;