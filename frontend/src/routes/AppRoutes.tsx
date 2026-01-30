import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

const InformationPage = lazy(() => import("../pages/InformationPage"));
const RiaSecPage = lazy(() => import("../pages/Psychometric/RiaSecPage"));
const IntelligencePage = lazy(() => import("../pages/Psychometric/IntelligencePage"));
const EmotionalPage = lazy(() => import("../pages/Psychometric/EmotionalPage"));
const ResearchPage = lazy(() => import("../pages/ResearchPage"));
// ... other lazy imports ...

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div style={{padding:20}}>Loading...</div>}>
        <Routes>
          <Route path="/" element={<Navigate to="/chat" replace />} />
          <Route path="/information" element={<InformationPage />} />
          <Route path="/psychometric/riasec" element={<RiaSecPage />} />
          <Route path="/psychometric/intelligence" element={<IntelligencePage />} />
          <Route path="/psychometric/emotional" element={<EmotionalPage />} />
          <Route path="/research" element={<ResearchPage />} />
          {/* add other routes here */}
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
