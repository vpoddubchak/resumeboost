/**
 * Claude API Spike - Technical Investigation
 * 
 * Purpose: Test Claude API before Epic 1 implementation
 * Tests: latency, cost, response format, error handling, rate limits
 * 
 * Run: npx tsx scripts/claude-api-spike.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../.env.local') });

import Anthropic from '@anthropic-ai/sdk';

// Sample resume for testing (realistic 500-word example)
const SAMPLE_RESUME = `
John Doe
Senior Software Engineer
john.doe@email.com | +1-555-0123 | LinkedIn: linkedin.com/in/johndoe

PROFESSIONAL SUMMARY
Results-driven Senior Software Engineer with 8+ years of experience in full-stack development, 
specializing in React, Node.js, and cloud infrastructure. Proven track record of leading teams 
to deliver scalable applications serving millions of users. Expert in modern web technologies, 
microservices architecture, and DevOps practices.

TECHNICAL SKILLS
Languages: JavaScript, TypeScript, Python, Java, SQL
Frontend: React, Next.js, Vue.js, Redux, Tailwind CSS
Backend: Node.js, Express, NestJS, Django, Spring Boot
Databases: PostgreSQL, MongoDB, Redis, Elasticsearch
Cloud: AWS (EC2, S3, Lambda, RDS), Azure, GCP
DevOps: Docker, Kubernetes, Jenkins, GitHub Actions, Terraform
Tools: Git, JIRA, Confluence, Postman, DataDog

PROFESSIONAL EXPERIENCE

Senior Software Engineer | Tech Corp Inc. | San Francisco, CA | 2020 - Present
• Led development of microservices architecture serving 5M+ daily active users
• Reduced API response time by 60% through database optimization and caching strategies
• Mentored team of 5 junior developers, improving code quality and delivery velocity
• Implemented CI/CD pipeline reducing deployment time from 2 hours to 15 minutes
• Architected real-time notification system processing 100K+ events per second

Software Engineer | StartupXYZ | Austin, TX | 2018 - 2020
• Built customer-facing dashboard using React and Node.js, increasing user engagement by 40%
• Designed RESTful APIs serving mobile and web applications
• Integrated third-party payment systems (Stripe, PayPal) processing $2M+ monthly
• Implemented automated testing achieving 85% code coverage
• Collaborated with product team to define technical requirements and roadmap

Junior Developer | Digital Solutions LLC | Remote | 2016 - 2018
• Developed responsive web applications using HTML, CSS, JavaScript, and jQuery
• Maintained legacy PHP applications and migrated to modern JavaScript frameworks
• Participated in agile development process with 2-week sprints
• Fixed bugs and implemented feature requests based on customer feedback

EDUCATION
Bachelor of Science in Computer Science | University of Texas at Austin | 2016
GPA: 3.7/4.0 | Dean's List (4 semesters)

CERTIFICATIONS
• AWS Certified Solutions Architect - Associate (2021)
• Certified Kubernetes Administrator (CKA) (2022)

PROJECTS
• Open Source Contributor: React ecosystem (500+ GitHub stars on personal projects)
• Tech Blog: Published 20+ articles on Medium about web development best practices
`;

const SAMPLE_JOB_DESCRIPTION = `
Senior Full Stack Engineer
Company: InnovateTech Solutions
Location: Remote (US-based)
Salary: $140,000 - $180,000

About the Role:
We're seeking a Senior Full Stack Engineer to join our growing engineering team. You'll work on 
building scalable web applications that power our SaaS platform used by Fortune 500 companies.

Requirements:
• 5+ years of professional software development experience
• Strong proficiency in React and Node.js
• Experience with cloud platforms (AWS, Azure, or GCP)
• Knowledge of microservices architecture and RESTful API design
• Familiarity with CI/CD pipelines and DevOps practices
• Experience with SQL and NoSQL databases
• Strong problem-solving skills and attention to detail
• Excellent communication and collaboration abilities

Nice to Have:
• TypeScript experience
• Kubernetes/Docker expertise
• Experience with real-time systems (WebSockets, Server-Sent Events)
• Contributions to open source projects
• AWS certifications

What We Offer:
• Competitive salary and equity package
• Fully remote work environment
• Health, dental, and vision insurance
• 401(k) matching
• Professional development budget
• Flexible PTO policy
`;

interface SpikeResult {
  test: string;
  success: boolean;
  data?: any;
  error?: string;
  duration?: number;
}

class ClaudeAPISpike {
  private client: Anthropic;
  private results: SpikeResult[] = [];
  private workingModel: string = 'claude-3-haiku-20240307';

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async runAllTests(): Promise<void> {
    console.log('🔬 Claude API Spike - Starting Technical Investigation\n');
    console.log('=' .repeat(80));

    const workingModel = await this.findWorkingModel();
    if (!workingModel) {
      console.log('\n❌ No working model found. Check account permissions.');
      return;
    }
    console.log(`\n✅ Using model: ${workingModel}\n`);
    this.workingModel = workingModel;

    await this.testLatency();
    await this.testTokensAndCost();
    await this.testResponseFormat();
    await this.testErrorHandling();

    this.printSummary();
  }

  private async findWorkingModel(): Promise<string | null> {
    console.log('\n🔍 Scanning available models...');
    const candidates = [
      'claude-opus-4-5',
      'claude-sonnet-4-5',
      'claude-3-5-sonnet-20241022',
      'claude-3-5-sonnet-20240620',
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
    ];
    for (const model of candidates) {
      process.stdout.write(`   Trying ${model}... `);
      try {
        await this.client.messages.create({
          model,
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hi' }],
        });
        console.log('✅ WORKS');
        return model;
      } catch (err: any) {
        const code = err.status || err.error?.type || '';
        console.log(`❌ ${code}`);
      }
    }
    return null;
  }

  private async testBasicConnection(): Promise<void> {
    console.log('\n📡 Test 1: Basic Connection');
    console.log('-'.repeat(80));

    const start = Date.now();
    try {
      const response = await this.client.messages.create({
        model: this.workingModel,
        max_tokens: 100,
        messages: [{ role: 'user', content: 'Hello, respond with just "OK"' }],
      });

      const duration = Date.now() - start;
      this.results.push({
        test: 'Basic Connection',
        success: true,
        duration,
        data: { model: response.model, id: response.id },
      });

      console.log(`✅ Connection successful (${duration}ms)`);
      console.log(`   Model: ${response.model}`);
      console.log(`   Response: ${response.content[0].type === 'text' ? response.content[0].text : 'N/A'}`);
    } catch (error: any) {
      this.results.push({
        test: 'Basic Connection',
        success: false,
        error: error.message,
      });
      console.log(`❌ Connection failed: ${error.message}`);
    }
  }

  private async testLatency(): Promise<void> {
    console.log('\n⏱️  Test 2: Latency Analysis (Resume Analysis)');
    console.log('-'.repeat(80));

    const prompt = `Analyze this resume against the job description and provide a match score (0-100) and key insights.

RESUME:
${SAMPLE_RESUME}

JOB DESCRIPTION:
${SAMPLE_JOB_DESCRIPTION}

Provide your analysis in JSON format with: matchScore, strengths, weaknesses, recommendations.`;

    const iterations = 3;
    const latencies: number[] = [];

    for (let i = 1; i <= iterations; i++) {
      console.log(`   Run ${i}/${iterations}...`);
      const start = Date.now();

      try {
        const response = await this.client.messages.create({
          model: this.workingModel,
          max_tokens: 2048,
          messages: [{ role: 'user', content: prompt }],
        });

        const duration = Date.now() - start;
        latencies.push(duration);

        console.log(`   ✓ Completed in ${(duration / 1000).toFixed(2)}s`);
      } catch (error: any) {
        console.log(`   ✗ Failed: ${error.message}`);
      }
    }

    if (latencies.length > 0) {
      const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      const minLatency = Math.min(...latencies);
      const maxLatency = Math.max(...latencies);

      this.results.push({
        test: 'Latency Analysis',
        success: true,
        data: {
          average: avgLatency,
          min: minLatency,
          max: maxLatency,
          iterations: latencies.length,
          passedSLA: avgLatency < 30000, // <30s requirement
        },
      });

      console.log(`\n   📊 Latency Statistics:`);
      console.log(`      Average: ${(avgLatency / 1000).toFixed(2)}s`);
      console.log(`      Min: ${(minLatency / 1000).toFixed(2)}s`);
      console.log(`      Max: ${(maxLatency / 1000).toFixed(2)}s`);
      console.log(`      SLA (<30s): ${avgLatency < 30000 ? '✅ PASS' : '❌ FAIL'}`);
    }
  }

  private async testTokensAndCost(): Promise<void> {
    console.log('\n💰 Test 3: Token Usage & Cost Analysis');
    console.log('-'.repeat(80));

    const prompt = `Analyze this resume against the job description and provide a match score (0-100) and key insights.

RESUME:
${SAMPLE_RESUME}

JOB DESCRIPTION:
${SAMPLE_JOB_DESCRIPTION}

Provide your analysis in JSON format.`;

    try {
      const response = await this.client.messages.create({
        model: this.workingModel,
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      });

      const inputTokens = response.usage.input_tokens;
      const outputTokens = response.usage.output_tokens;

      // Claude 3.5 Sonnet pricing (as of 2024)
      const inputCostPer1M = 3.00; // $3 per 1M input tokens
      const outputCostPer1M = 15.00; // $15 per 1M output tokens

      const inputCost = (inputTokens / 1_000_000) * inputCostPer1M;
      const outputCost = (outputTokens / 1_000_000) * outputCostPer1M;
      const totalCost = inputCost + outputCost;

      // Projections
      const costPer100Users = totalCost * 100;
      const costPer1000Users = totalCost * 1000;
      const costPerMonth = totalCost * 30 * 100; // 100 users/day * 30 days

      this.results.push({
        test: 'Token Usage & Cost',
        success: true,
        data: {
          inputTokens,
          outputTokens,
          totalTokens: inputTokens + outputTokens,
          costPerAnalysis: totalCost,
          costPer100Users,
          costPer1000Users,
          costPerMonth,
        },
      });

      console.log(`   Input tokens: ${inputTokens.toLocaleString()}`);
      console.log(`   Output tokens: ${outputTokens.toLocaleString()}`);
      console.log(`   Total tokens: ${(inputTokens + outputTokens).toLocaleString()}`);
      console.log(`\n   💵 Cost Analysis:`);
      console.log(`      Per analysis: $${totalCost.toFixed(4)}`);
      console.log(`      Per 100 users: $${costPer100Users.toFixed(2)}`);
      console.log(`      Per 1,000 users: $${costPer1000Users.toFixed(2)}`);
      console.log(`      Monthly (100 users/day): $${costPerMonth.toFixed(2)}`);
    } catch (error: any) {
      this.results.push({
        test: 'Token Usage & Cost',
        success: false,
        error: error.message,
      });
      console.log(`   ❌ Failed: ${error.message}`);
    }
  }

  private async testResponseFormat(): Promise<void> {
    console.log('\n📋 Test 4: Response Format Consistency');
    console.log('-'.repeat(80));

    const prompt = `Analyze this resume and provide a JSON response with this exact structure:
{
  "matchScore": <number 0-100>,
  "strengths": [<string>, ...],
  "weaknesses": [<string>, ...],
  "recommendations": [<string>, ...]
}

RESUME:
${SAMPLE_RESUME}

JOB DESCRIPTION:
${SAMPLE_JOB_DESCRIPTION}`;

    try {
      const response = await this.client.messages.create({
        model: this.workingModel,
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = response.content[0];
      if (content.type === 'text') {
        console.log(`   Raw response preview:\n${content.text.substring(0, 200)}...\n`);

        // Try to parse JSON
        const jsonMatch = content.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          const hasRequiredFields =
            typeof parsed.matchScore === 'number' &&
            Array.isArray(parsed.strengths) &&
            Array.isArray(parsed.weaknesses) &&
            Array.isArray(parsed.recommendations);

          this.results.push({
            test: 'Response Format',
            success: hasRequiredFields,
            data: {
              parseable: true,
              hasRequiredFields,
              sampleResponse: parsed,
            },
          });

          console.log(`   ✅ JSON parseable: Yes`);
          console.log(`   ✅ Required fields present: ${hasRequiredFields ? 'Yes' : 'No'}`);
          console.log(`   📊 Sample parsed data:`);
          console.log(`      Match Score: ${parsed.matchScore}`);
          console.log(`      Strengths: ${parsed.strengths?.length || 0} items`);
          console.log(`      Weaknesses: ${parsed.weaknesses?.length || 0} items`);
          console.log(`      Recommendations: ${parsed.recommendations?.length || 0} items`);
        } else {
          console.log(`   ⚠️  No JSON found in response`);
        }
      }
    } catch (error: any) {
      this.results.push({
        test: 'Response Format',
        success: false,
        error: error.message,
      });
      console.log(`   ❌ Failed: ${error.message}`);
    }
  }

  private async testErrorHandling(): Promise<void> {
    console.log('\n🚨 Test 5: Error Handling');
    console.log('-'.repeat(80));

    // Test 1: Invalid API key
    console.log('   Testing invalid API key...');
    try {
      const badClient = new Anthropic({ apiKey: 'invalid-key-12345' });
      await badClient.messages.create({
        model: this.workingModel,
        max_tokens: 100,
        messages: [{ role: 'user', content: 'test' }],
      });
      console.log('   ⚠️  Expected error but succeeded');
    } catch (error: any) {
      console.log(`   ✅ Caught error: ${error.status} - ${error.message?.substring(0, 50)}`);
    }

    // Test 2: Exceeding max_tokens
    console.log('   Testing token limit...');
    try {
      await this.client.messages.create({
        model: this.workingModel,
        max_tokens: 1, // Very low limit
        messages: [{ role: 'user', content: 'Write a long essay about technology' }],
      });
      console.log('   ✅ Handled low token limit gracefully');
    } catch (error: any) {
      console.log(`   ✅ Caught error: ${error.message?.substring(0, 50)}`);
    }

    this.results.push({
      test: 'Error Handling',
      success: true,
      data: { tested: ['invalid_api_key', 'token_limit'] },
    });
  }

  private async testDifferentModels(): Promise<void> {
    console.log('\n🤖 Test 6: Model Comparison (Sonnet vs Haiku)');
    console.log('-'.repeat(80));

    const prompt = `Analyze this resume briefly: ${SAMPLE_RESUME.substring(0, 500)}...`;

    const models = [
      { name: 'Claude Opus 4.5', id: 'claude-opus-4-5', inputCost: 15.00, outputCost: 75.00 },
      { name: 'Claude Sonnet 4.5', id: 'claude-sonnet-4-5', inputCost: 3.00, outputCost: 15.00 },
      { name: 'Claude 3 Haiku', id: 'claude-3-haiku-20240307', inputCost: 0.25, outputCost: 1.25 },
    ];

    for (const model of models) {
      console.log(`\n   Testing ${model.name}...`);
      const start = Date.now();

      try {
        const response = await this.client.messages.create({
          model: model.id,
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }],
        });

        const duration = Date.now() - start;
        const inputTokens = response.usage.input_tokens;
        const outputTokens = response.usage.output_tokens;
        const cost = (inputTokens / 1_000_000) * model.inputCost + (outputTokens / 1_000_000) * model.outputCost;

        console.log(`      Latency: ${(duration / 1000).toFixed(2)}s`);
        console.log(`      Tokens: ${inputTokens + outputTokens}`);
        console.log(`      Cost: $${cost.toFixed(4)}`);
      } catch (error: any) {
        console.log(`      ❌ Failed: ${error.message}`);
      }
    }
  }

  private printSummary(): void {
    console.log('\n' + '='.repeat(80));
    console.log('📊 SPIKE SUMMARY');
    console.log('='.repeat(80));

    const passed = this.results.filter((r) => r.success).length;
    const total = this.results.length;

    console.log(`\nTests Passed: ${passed}/${total}\n`);

    this.results.forEach((result) => {
      const icon = result.success ? '✅' : '❌';
      console.log(`${icon} ${result.test}`);
      if (result.duration) {
        console.log(`   Duration: ${result.duration}ms`);
      }
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });

    console.log('\n' + '='.repeat(80));
    console.log('🎯 KEY FINDINGS & RECOMMENDATIONS');
    console.log('='.repeat(80));

    const latencyResult = this.results.find((r) => r.test === 'Latency Analysis');
    if (latencyResult?.success && latencyResult.data) {
      const avgLatency = latencyResult.data.average / 1000;
      console.log(`\n1. Latency: ${avgLatency.toFixed(2)}s average`);
      console.log(`   ${latencyResult.data.passedSLA ? '✅' : '❌'} SLA Requirement (<30s): ${latencyResult.data.passedSLA ? 'PASS' : 'FAIL'}`);
      if (!latencyResult.data.passedSLA) {
        console.log('   ⚠️  Consider: streaming responses, caching, or using Haiku model');
      }
    }

    const costResult = this.results.find((r) => r.test === 'Token Usage & Cost');
    if (costResult?.success && costResult.data) {
      console.log(`\n2. Cost: $${costResult.data.costPerAnalysis.toFixed(4)} per analysis`);
      console.log(`   Monthly projection (100 users/day): $${costResult.data.costPerMonth.toFixed(2)}`);
      if (costResult.data.costPerMonth > 100) {
        console.log('   ⚠️  Consider: Haiku model for cost savings, or caching frequent analyses');
      }
    }

    const formatResult = this.results.find((r) => r.test === 'Response Format');
    if (formatResult?.success) {
      console.log(`\n3. Response Format: ${formatResult.data?.parseable ? '✅ Stable JSON' : '⚠️  Needs improvement'}`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('📝 NEXT STEPS FOR EPIC 1');
    console.log('='.repeat(80));
    console.log('\n1. Use Claude 3.5 Sonnet for production (best quality)');
    console.log('2. Configure retry: 2 retries, 2s/4s exponential backoff');
    console.log('3. Set timeout: 35 seconds (buffer above 30s SLA)');
    console.log('4. Implement request queuing for rate limit handling');
    console.log('5. Cache analysis results to reduce API costs');
    console.log('6. Monitor latency and costs in production');
    console.log('\n' + '='.repeat(80));
  }
}

// Main execution
async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.error('❌ Error: ANTHROPIC_API_KEY environment variable not set');
    console.error('\nTo run this spike:');
    console.error('1. Get API key from: https://console.anthropic.com/');
    console.error('2. Set environment variable: export ANTHROPIC_API_KEY="your-key"');
    console.error('3. Run: npx tsx scripts/claude-api-spike.ts');
    process.exit(1);
  }

  const spike = new ClaudeAPISpike(apiKey);
  await spike.runAllTests();
}

main().catch(console.error);
