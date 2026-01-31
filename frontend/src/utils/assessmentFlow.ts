
export const TEST_DETAILS = {
    riasec: {
        id: 'riasec',
        name: 'Interest Test (RIASEC)',
        description: 'Discover your career interests across 6 dimensions',
        duration: '15-20 min',
        route: '/psychometric/ria-sec'
    },
    aptitude: {
        id: 'aptitude',
        name: 'Aptitude Assessment',
        description: 'Measure your cognitive abilities and strengths',
        duration: '20-25 min',
        route: '/psychometric/aptitude'
    },
    intelligence: { // Personality test in code often maps to intelligence route in some places or vice versa, based on file names.
        // Checking file names: IntelligencePage uses /api/test/questions?type=intelligence.
        // ProfilePage shows "Personality" but Dashboard uses calculateScore('personality') with minId 401.
        // Wait, IntelligencePage.tsx uses type=intelligence.
        // Let's stick to the route names.
        id: 'intelligence', // This seems to be the "Personality" one based on previous context or just Intelligence.
        // Actually, looking at CompassBundlePage:
        // "Personality Test" -> route: '/psychometric/intelligence'
        name: 'Personality Test',
        description: 'Understand your personality traits and behavioral patterns',
        duration: '15-20 min',
        route: '/psychometric/intelligence'
    },
    workstyle: {
        id: 'workstyle',
        name: 'Work Style Assessment',
        description: 'Understand your preferred working environment',
        duration: '15-20 min',
        route: '/psychometric/work-style'
    },
    learning: {
        id: 'learning',
        name: 'Learning Style Assessment',
        description: 'Optimize your learning strategies',
        duration: '15-20 min',
        route: '/psychometric/learning-style'
    },
    emotional: {
        id: 'emotional',
        name: 'Emotional Intelligence (EQ)',
        description: 'Evaluate your emotional intelligence and social skills',
        duration: '20 min',
        route: '/psychometric/emotional'
    },
    behavioral: {
        id: 'behavioral',
        name: 'Behavioral Assessment',
        description: 'Analyze your workplace behavior patterns',
        duration: '20 min',
        route: '/psychometric/behavioral'
    },
    leadership: {
        id: 'leadership',
        name: 'Leadership Potential',
        description: 'Discover your leadership style and strengths',
        duration: '20 min',
        route: '/psychometric/leadership'
    },
    stress: {
        id: 'stress',
        name: 'Stress Management',
        description: 'Understand how you handle pressure',
        duration: '15 min',
        route: '/psychometric/stress'
    },
    creativity: {
        id: 'creativity',
        name: 'Creativity Assessment',
        description: 'Measure your innovation and problem-solving',
        duration: '20 min',
        route: '/psychometric/creativity'
    }
};

export const ASSESSMENT_FLOWS = {
    free: ['riasec', 'aptitude', 'intelligence'],
    clarity: ['riasec', 'aptitude', 'intelligence', 'workstyle', 'learning'],
    compass: ['riasec', 'aptitude', 'intelligence', 'workstyle', 'learning', 'emotional', 'behavioral', 'leadership', 'stress', 'creativity']
};

export const getNextAssessment = (plan: string, completedTestId: string | null) => {
    const flow = ASSESSMENT_FLOWS[plan as keyof typeof ASSESSMENT_FLOWS] || ASSESSMENT_FLOWS['free'];

    if (!completedTestId) return TEST_DETAILS[flow[0] as keyof typeof TEST_DETAILS];

    const currentIndex = flow.indexOf(completedTestId);
    if (currentIndex === -1 || currentIndex === flow.length - 1) {
        return null; // Finished or unknown test
    }

    const nextId = flow[currentIndex + 1];
    return TEST_DETAILS[nextId as keyof typeof TEST_DETAILS];
};

export const getFirstIncompleteAssessment = (plan: string, completedTestsStr: string[]) => {
    const flow = ASSESSMENT_FLOWS[plan as keyof typeof ASSESSMENT_FLOWS] || ASSESSMENT_FLOWS['free'];
    // This requires knowing which tests are completed.
    // We will pass an array of completed IDs.
    for (const testId of flow) {
        if (!completedTestsStr.includes(testId)) {
            return TEST_DETAILS[testId as keyof typeof TEST_DETAILS];
        }
    }
    return null; // All done
};
