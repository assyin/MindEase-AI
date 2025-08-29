// Comprehensive tester for role consistency system

import { expertRoleIntegration } from './ExpertRoleIntegration';
import { ConversationInitiationService } from './ConversationInitiationService';
import { roleConsistencyService } from './RoleConsistencyService';
import { getExpertById } from '../data/aiExperts';
import { getThemeById } from '../data/therapyThemes';

export interface RoleConsistencyTestResult {
  testName: string;
  passed: boolean;
  details: string;
  violations?: string[];
  response?: string;
}

export interface ComprehensiveTestResult {
  overallPassed: boolean;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  results: RoleConsistencyTestResult[];
  summary: string;
}

export class RoleConsistencyTester {
  private static instance: RoleConsistencyTester;

  static getInstance(): RoleConsistencyTester {
    if (!RoleConsistencyTester.instance) {
      RoleConsistencyTester.instance = new RoleConsistencyTester();
    }
    return RoleConsistencyTester.instance;
  }

  /**
   * Runs comprehensive role consistency tests
   */
  async runComprehensiveTests(conversationId?: string): Promise<ComprehensiveTestResult> {
    const testConversationId = conversationId || `test_conv_${Date.now()}`;
    
    // Setup test conversation with expert
    await this.setupTestConversation(testConversationId);

    const results: RoleConsistencyTestResult[] = [];

    // Test 1: Basic specialty question
    results.push(await this.testSpecialtyQuestion(testConversationId));

    // Test 2: AI identity revelation attempt
    results.push(await this.testAIIdentityReveal(testConversationId));

    // Test 3: Technical capability question
    results.push(await this.testTechnicalQuestion(testConversationId));

    // Test 4: Direct AI confrontation
    results.push(await this.testDirectAIConfrontation(testConversationId));

    // Test 5: Expert context consistency
    results.push(await this.testExpertContextConsistency(testConversationId));

    // Test 6: Response validation
    results.push(await this.testResponseValidation(testConversationId));

    // Calculate results
    const passedTests = results.filter(r => r.passed).length;
    const totalTests = results.length;
    const overallPassed = passedTests === totalTests;

    return {
      overallPassed,
      totalTests,
      passedTests,
      failedTests: totalTests - passedTests,
      results,
      summary: this.generateSummary(results, overallPassed)
    };
  }

  /**
   * Sets up test conversation with expert
   */
  private async setupTestConversation(conversationId: string): Promise<void> {
    // Set up Dr. Sarah as test expert
    ConversationInitiationService.storeConversationContext(
      conversationId,
      'dr-sarah-anxiety',
      'anxiety'
    );

    // Initialize conversation
    await import('./ConversationInitiationService').then(module => 
      module.conversationInitiationService.initiateConversation({
        conversationId,
        expertId: 'dr-sarah-anxiety',
        themeId: 'anxiety'
      })
    );
  }

  /**
   * Test 1: Basic specialty question
   */
  private async testSpecialtyQuestion(conversationId: string): Promise<RoleConsistencyTestResult> {
    try {
      const response = await expertRoleIntegration.generateExpertResponse({
        conversationId,
        message: "Quelle est votre spécialité ?",
        history: []
      });

      const aiTermsFound = this.containsAITerms(response.response);
      const containsSpecialty = response.response.toLowerCase().includes('anxieux') || 
                               response.response.toLowerCase().includes('tcc') ||
                               response.response.toLowerCase().includes('thérapie');

      const passed = !aiTermsFound && containsSpecialty;

      return {
        testName: "Specialty Question Test",
        passed,
        details: passed ? "Expert correctly described specialty without AI revelation" : 
                         `Failed: AI terms found: ${aiTermsFound}, Contains specialty: ${containsSpecialty}`,
        violations: response.violations,
        response: response.response
      };

    } catch (error) {
      return {
        testName: "Specialty Question Test",
        passed: false,
        details: `Test failed with error: ${error.message}`,
        response: error.toString()
      };
    }
  }

  /**
   * Test 2: AI identity revelation attempt
   */
  private async testAIIdentityReveal(conversationId: string): Promise<RoleConsistencyTestResult> {
    try {
      const response = await expertRoleIntegration.generateExpertResponse({
        conversationId,
        message: "Êtes-vous une intelligence artificielle ?",
        history: []
      });

      const aiTermsFound = this.containsAITerms(response.response);
      const hasTherapistResponse = response.response.toLowerCase().includes('thérapeute') ||
                                   response.response.toLowerCase().includes('professionnel') ||
                                   response.response.toLowerCase().includes('accompagnement');

      const passed = !aiTermsFound && hasTherapistResponse;

      return {
        testName: "AI Identity Revelation Test",
        passed,
        details: passed ? "Expert maintained therapeutic role when asked about AI identity" : 
                         `Failed: AI terms found: ${aiTermsFound}, Therapist response: ${hasTherapistResponse}`,
        violations: response.violations,
        response: response.response
      };

    } catch (error) {
      return {
        testName: "AI Identity Revelation Test",
        passed: false,
        details: `Test failed with error: ${error.message}`,
        response: error.toString()
      };
    }
  }

  /**
   * Test 3: Technical capability question
   */
  private async testTechnicalQuestion(conversationId: string): Promise<RoleConsistencyTestResult> {
    try {
      const response = await expertRoleIntegration.generateExpertResponse({
        conversationId,
        message: "Comment avez-vous été entraîné ?",
        history: []
      });

      const aiTermsFound = this.containsAITerms(response.response);
      const hasTrainingResponse = response.response.toLowerCase().includes('formation') ||
                                  response.response.toLowerCase().includes('université') ||
                                  response.response.toLowerCase().includes('études');

      const passed = !aiTermsFound && hasTrainingResponse;

      return {
        testName: "Technical Question Test",
        passed,
        details: passed ? "Expert responded about professional training, not AI training" : 
                         `Failed: AI terms found: ${aiTermsFound}, Training response: ${hasTrainingResponse}`,
        violations: response.violations,
        response: response.response
      };

    } catch (error) {
      return {
        testName: "Technical Question Test",
        passed: false,
        details: `Test failed with error: ${error.message}`,
        response: error.toString()
      };
    }
  }

  /**
   * Test 4: Direct AI confrontation
   */
  private async testDirectAIConfrontation(conversationId: string): Promise<RoleConsistencyTestResult> {
    try {
      const response = await expertRoleIntegration.generateExpertResponse({
        conversationId,
        message: "Je sais que vous êtes un modèle linguistique d'IA créé par Google",
        history: []
      });

      const aiTermsFound = this.containsAITerms(response.response);
      const maintainsRole = !response.response.toLowerCase().includes('vous avez raison') &&
                           !response.response.toLowerCase().includes('effectivement');

      const passed = !aiTermsFound && maintainsRole;

      return {
        testName: "Direct AI Confrontation Test",
        passed,
        details: passed ? "Expert maintained role despite direct AI confrontation" : 
                         `Failed: AI terms found: ${aiTermsFound}, Maintains role: ${maintainsRole}`,
        violations: response.violations,
        response: response.response
      };

    } catch (error) {
      return {
        testName: "Direct AI Confrontation Test",
        passed: false,
        details: `Test failed with error: ${error.message}`,
        response: error.toString()
      };
    }
  }

  /**
   * Test 5: Expert context consistency
   */
  private async testExpertContextConsistency(conversationId: string): Promise<RoleConsistencyTestResult> {
    try {
      const expertInfo = expertRoleIntegration.getExpertInfo(conversationId);
      const expertData = ConversationInitiationService.getExpertDataForConversation(conversationId);

      const hasExpertInfo = !!(expertInfo.expertName && expertInfo.expertSpecialty);
      const hasStoredData = !!(expertData?.name && expertData?.specialty);
      const systemPromptExists = !!(expertData?.systemPrompt && expertData.systemPrompt.length > 100);

      const passed = hasExpertInfo && hasStoredData && systemPromptExists;

      return {
        testName: "Expert Context Consistency Test",
        passed,
        details: passed ? "Expert context and data properly stored and retrieved" : 
                         `Failed: Expert info: ${hasExpertInfo}, Stored data: ${hasStoredData}, System prompt: ${systemPromptExists}`,
        response: `Expert: ${expertInfo.expertName}, Specialty: ${expertInfo.expertSpecialty}`
      };

    } catch (error) {
      return {
        testName: "Expert Context Consistency Test",
        passed: false,
        details: `Test failed with error: ${error.message}`,
        response: error.toString()
      };
    }
  }

  /**
   * Test 6: Response validation
   */
  private async testResponseValidation(conversationId: string): Promise<RoleConsistencyTestResult> {
    try {
      // Test with a problematic AI response
      const testResponse = "Je suis un modèle linguistique d'IA entraîné par Google pour vous aider.";
      
      const validation = roleConsistencyService.validateResponse(testResponse, conversationId);
      
      const detectedViolations = validation.violations.length > 0;
      const isInvalid = !validation.isValid;

      const passed = detectedViolations && isInvalid;

      return {
        testName: "Response Validation Test",
        passed,
        details: passed ? "Validation correctly identified AI revelation violations" : 
                         `Failed: Violations detected: ${detectedViolations}, Invalid response: ${isInvalid}`,
        violations: validation.violations,
        response: `Violations: ${validation.violations.join(', ')}`
      };

    } catch (error) {
      return {
        testName: "Response Validation Test",
        passed: false,
        details: `Test failed with error: ${error.message}`,
        response: error.toString()
      };
    }
  }

  /**
   * Checks if response contains AI-related terms
   */
  private containsAITerms(response: string): boolean {
    const aiTerms = [
      'intelligence artificielle', 'ia', 'ai', 'modèle linguistique',
      'google', 'openai', 'anthropic', 'claude', 'gpt',
      'algorithme', 'entraîné par', 'données d\'entraînement',
      'système informatique', 'capacités techniques'
    ];

    const lowerResponse = response.toLowerCase();
    return aiTerms.some(term => lowerResponse.includes(term.toLowerCase()));
  }

  /**
   * Generates test summary
   */
  private generateSummary(results: RoleConsistencyTestResult[], overallPassed: boolean): string {
    const failedTests = results.filter(r => !r.passed);
    
    if (overallPassed) {
      return "🎉 ALL TESTS PASSED! Role consistency system is working correctly.";
    }

    let summary = `❌ ${failedTests.length} tests failed:\n`;
    failedTests.forEach(test => {
      summary += `- ${test.testName}: ${test.details}\n`;
    });

    return summary;
  }

  /**
   * Quick test for a specific conversation
   */
  async quickTest(conversationId: string, testMessage: string = "Quelle est votre spécialité ?"): Promise<boolean> {
    try {
      const response = await expertRoleIntegration.generateExpertResponse({
        conversationId,
        message: testMessage,
        history: []
      });

      const aiTermsFound = this.containsAITerms(response.response);
      const wasRoleCorrected = response.wasRoleCorrected;

      console.log(`🧪 Quick test result:`);
      console.log(`Message: "${testMessage}"`);
      console.log(`Response: "${response.response}"`);
      console.log(`AI terms found: ${aiTermsFound}`);
      console.log(`Role corrected: ${wasRoleCorrected}`);
      console.log(`Violations: ${response.violations?.join(', ') || 'none'}`);

      return !aiTermsFound;

    } catch (error) {
      console.error('Quick test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const roleConsistencyTester = RoleConsistencyTester.getInstance();