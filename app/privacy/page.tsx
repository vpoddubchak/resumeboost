export const metadata = {
  title: "Privacy Policy - ResumeBoost",
  description: "ResumeBoost privacy policy and data handling practices",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>

      <div className="prose prose-gray max-w-none space-y-6">
        <section>
          <h2 className="text-xl font-semibold text-gray-800">1. Data We Collect</h2>
          <p className="text-gray-600">
            We collect the following information when you use ResumeBoost:
          </p>
          <ul className="list-disc pl-6 text-gray-600">
            <li>Account information (email, name)</li>
            <li>Resume files you upload for analysis</li>
            <li>Analysis results and recommendations</li>
            <li>Consultation booking details</li>
            <li>Usage analytics (with your consent)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800">2. How We Use Your Data</h2>
          <p className="text-gray-600">
            Your data is used to provide AI-powered resume analysis, generate improvement
            recommendations, and facilitate expert consultations. We do not sell your personal data.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800">3. Your Rights (GDPR)</h2>
          <p className="text-gray-600">You have the right to:</p>
          <ul className="list-disc pl-6 text-gray-600">
            <li><strong>Access</strong> — Export all your data at any time</li>
            <li><strong>Erasure</strong> — Request permanent deletion of all your data</li>
            <li><strong>Rectification</strong> — Update your personal information</li>
            <li><strong>Portability</strong> — Download your data in a machine-readable format</li>
          </ul>
          <p className="text-gray-600 mt-2">
            To exercise these rights, visit your account settings or contact us.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800">4. Cookies</h2>
          <p className="text-gray-600">
            We use necessary cookies for authentication and site functionality.
            Optional analytics cookies are only set with your explicit consent.
            You can manage your cookie preferences at any time using the cookie settings.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800">5. Data Security</h2>
          <p className="text-gray-600">
            All data is encrypted in transit (TLS) and at rest. Passwords are securely hashed.
            Files are stored in encrypted cloud storage (AWS S3 with server-side encryption).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800">6. Contact</h2>
          <p className="text-gray-600">
            For privacy-related inquiries, please contact us at{" "}
            <a href="mailto:privacy@resumeboost.com" className="text-blue-600 hover:underline">
              privacy@resumeboost.com
            </a>
          </p>
        </section>
      </div>
    </main>
  );
}
