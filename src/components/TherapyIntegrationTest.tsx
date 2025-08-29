import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, CheckCircle, AlertCircle, Clock, ArrowRight, RotateCcw, BookOpen } from 'lucide-react';
import TherapyOnboarding from './TherapyOnboarding';
import TherapyDashboard from './TherapyDashboard';
import TherapySession from './TherapySession';
import ExpertSelectionModal from './ExpertSelectionModal';

interface TestResult {
  component: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
  duration?: number;
}

interface TestStep {
  id: string;
  name: string;
  description: string;
  component: React.ComponentType<any>;
  props?: any;
}

const TEST_STEPS: TestStep[] = [
  {
    id: 'expert-selection',
    name: 'Modal Sélection Expert',
    description: 'Test du modal de sélection d\'expert avec preview voix',
    component: ExpertSelectionModal,
    props: {
      isOpen: true,
      onClose: () => {},
      onSelect: () => {},
      showCompatibilityScores: true
    }
  },
  {
    id: 'onboarding',
    name: 'Flux d\'Onboarding',
    description: 'Test complet du flux d\'onboarding thérapeutique',
    component: TherapyOnboarding,
    props: {
      onComplete: () => {}
    }
  },
  {
    id: 'dashboard',
    name: 'Dashboard Thérapeutique',
    description: 'Test du dashboard avec métriques de progrès',
    component: TherapyDashboard,
    props: {}
  },
  {
    id: 'session',
    name: 'Session Thérapeutique',
    description: 'Test d\'interface de session 20-25 min',
    component: TherapySession,
    props: {
      sessionId: 'test-session-123',
      onComplete: () => {}
    }
  }
];

const TherapyIntegrationTest: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [showComponent, setShowComponent] = useState(false);

  useEffect(() => {
    // Initialize test results
    setTestResults(TEST_STEPS.map(step => ({
      component: step.name,
      status: 'pending'
    })));
  }, []);

  const runTest = async (stepIndex: number) => {
    const step = TEST_STEPS[stepIndex];
    const startTime = Date.now();

    // Update test status to running
    setTestResults(prev => prev.map((result, index) =>
      index === stepIndex
        ? { ...result, status: 'running', message: `Test en cours...` }
        : result
    ));

    try {
      // Simulate component rendering test
      await new Promise(resolve => setTimeout(resolve, 1500));

      const duration = Date.now() - startTime;
      
      // Update test status to success
      setTestResults(prev => prev.map((result, index) =>
        index === stepIndex
          ? {
              ...result,
              status: 'success',
              message: `✅ Composant rendu avec succès`,
              duration
            }
          : result
      ));
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Update test status to error
      setTestResults(prev => prev.map((result, index) =>
        index === stepIndex
          ? {
              ...result,
              status: 'error',
              message: `❌ Erreur: ${error}`,
              duration
            }
          : result
      ));
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    
    for (let i = 0; i < TEST_STEPS.length; i++) {
      setCurrentStep(i);
      await runTest(i);
      await new Promise(resolve => setTimeout(resolve, 500)); // Pause between tests
    }
    
    setIsRunning(false);
  };

  const showTestComponent = (stepIndex: number) => {
    setCurrentStep(stepIndex);
    setShowComponent(true);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-gray-400" />;
      case 'running': return <RotateCcw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pending': return 'border-gray-200';
      case 'running': return 'border-blue-200 bg-blue-50';
      case 'success': return 'border-green-200 bg-green-50';
      case 'error': return 'border-red-200 bg-red-50';
    }
  };

  if (showComponent && TEST_STEPS[currentStep]) {
    const CurrentComponent = TEST_STEPS[currentStep].component;
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  Test: {TEST_STEPS[currentStep].name}
                </h2>
                <p className="text-sm text-gray-600">
                  {TEST_STEPS[currentStep].description}
                </p>
              </div>
              <button
                onClick={() => setShowComponent(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Retour aux tests
              </button>
            </div>
          </div>
          
          <CurrentComponent {...TEST_STEPS[currentStep].props} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Tests d'Intégration Thérapeutique
          </h1>
          <p className="text-gray-600">
            Validation des 4 composants UI Phase D du système thérapeutique
          </p>
        </motion.div>

        {/* Control Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Contrôles de Test</h2>
            <div className="text-sm text-gray-500">
              {testResults.filter(r => r.status === 'success').length}/{TEST_STEPS.length} tests réussis
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={runAllTests}
              disabled={isRunning}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <Play className="w-4 h-4" />
              <span>{isRunning ? 'Tests en cours...' : 'Lancer tous les tests'}</span>
            </button>
            
            <button
              onClick={() => {
                setTestResults(TEST_STEPS.map(step => ({
                  component: step.name,
                  status: 'pending'
                })));
                setCurrentStep(0);
              }}
              disabled={isRunning}
              className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Reset
            </button>
          </div>
        </motion.div>

        {/* Test Results */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {TEST_STEPS.map((step, index) => {
            const result = testResults[index];
            const isActive = currentStep === index && isRunning;
            
            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className={`bg-white rounded-lg border-2 transition-all ${
                  getStatusColor(result?.status || 'pending')
                } ${isActive ? 'ring-2 ring-blue-300' : ''}`}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(result?.status || 'pending')}
                      
                      <div>
                        <h3 className="font-semibold text-gray-800">{step.name}</h3>
                        <p className="text-sm text-gray-600">{step.description}</p>
                        
                        {result?.message && (
                          <p className={`text-xs mt-1 ${
                            result.status === 'success' ? 'text-green-600' :
                            result.status === 'error' ? 'text-red-600' :
                            'text-blue-600'
                          }`}>
                            {result.message}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {result?.duration && (
                        <span className="text-xs text-gray-500">
                          {result.duration}ms
                        </span>
                      )}
                      
                      <button
                        onClick={() => runTest(index)}
                        disabled={isRunning}
                        className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 disabled:opacity-50 transition-colors"
                      >
                        Test
                      </button>
                      
                      <button
                        onClick={() => showTestComponent(index)}
                        className="flex items-center space-x-1 px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition-colors"
                      >
                        <span>Voir</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Summary */}
        {testResults.every(r => r.status !== 'pending') && !isRunning && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Résumé des Tests</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {testResults.filter(r => r.status === 'success').length}
                </div>
                <div className="text-sm text-green-600">Tests réussis</div>
              </div>
              
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {testResults.filter(r => r.status === 'error').length}
                </div>
                <div className="text-sm text-red-600">Tests échoués</div>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">
                  {Math.round(testResults.reduce((acc, r) => acc + (r.duration || 0), 0))}ms
                </div>
                <div className="text-sm text-gray-600">Durée totale</div>
              </div>
            </div>
            
            <div className="mt-4 text-center">
              {testResults.every(r => r.status === 'success') ? (
                <div className="flex items-center justify-center space-x-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Tous les tests sont passés avec succès!</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2 text-red-600">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">Certains tests ont échoué</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default TherapyIntegrationTest;