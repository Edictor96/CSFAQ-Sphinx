const axios = require('axios');

const SAMPLE_FAQS = [
  {
    category: 'getting-started',
    order: 1,
    question: 'What is Samagama and how does it work?',
    answer: 'Samagama is an integrated learning and engagement platform designed to help users access educational content, track progress, and interact with instructors. It provides a seamless experience for both learners and administrators.',
    tags: ['samagama', 'platform', 'overview', 'about'],
  },
  {
    category: 'getting-started',
    order: 2,
    question: 'How do I create an account on Samagama?',
    answer: 'To create an account, click on the "Sign Up" button on the homepage. Fill in your name, email address, and create a strong password. You can also sign up using your Google account for quicker access.',
    tags: ['account', 'signup', 'registration', 'create'],
  },
  {
    category: 'getting-started',
    order: 3,
    question: 'Is Samagama free to use?',
    answer: 'Samagama offers both free and premium content. Free users can access a limited set of courses and features. Premium subscribers get unlimited access to all courses, certifications, and priority support.',
    tags: ['pricing', 'free', 'premium', 'subscription'],
  },
  {
    category: 'account-management',
    order: 1,
    question: 'How can I reset my password?',
    answer: 'Go to the login page and click on "Forgot Password". Enter your registered email address, and we will send you a password reset link. Click the link and follow the instructions to set a new password.',
    tags: ['password', 'reset', 'forgot', 'login'],
  },
  {
    category: 'account-management',
    order: 2,
    question: 'How do I update my profile information?',
    answer: 'Log into your account and navigate to "Profile Settings" from the user menu. You can edit your name, profile picture, bio, and contact information. Click "Save Changes" to update.',
    tags: ['profile', 'settings', 'update', 'edit'],
  },
  {
    category: 'account-management',
    order: 3,
    question: 'Can I delete my account permanently?',
    answer: 'Yes, you can request account deletion from your profile settings. Go to Settings > Account > Delete Account. Please note that this action is irreversible and all your data will be permanently removed within 30 days.',
    tags: ['delete', 'account', 'remove', 'permanent'],
  },
  {
    category: 'course-enrollment',
    order: 1,
    question: 'How do I enroll in a course?',
    answer: 'Browse the course catalog and click on any course to view details. If you have the required access level, click the "Enroll Now" button. The course will be added to your learning dashboard instantly.',
    tags: ['enroll', 'course', 'join', 'register'],
  },
  {
    category: 'course-enrollment',
    order: 2,
    question: 'What happens after I complete a course?',
    answer: 'Upon completing all modules and assessments, you will receive a certificate of completion. The certificate is available for download from your dashboard and can be shared on LinkedIn or other platforms.',
    tags: ['complete', 'certificate', 'finish', 'graduate'],
  },
  {
    category: 'course-enrollment',
    order: 3,
    question: 'Can I access course materials offline?',
    answer: 'Yes, our mobile app allows you to download course materials including videos, readings, and resources for offline access. Simply tap the download icon next to the content you wish to save.',
    tags: ['offline', 'download', 'mobile', 'access'],
  },
  {
    category: 'payments-billing',
    order: 1,
    question: 'What payment methods are accepted?',
    answer: 'We accept all major credit and debit cards (Visa, Mastercard, American Express), net banking, UPI, and popular digital wallets. Enterprise customers can also request invoice-based payments.',
    tags: ['payment', 'methods', 'cards', 'billing'],
  },
  {
    category: 'payments-billing',
    order: 2,
    question: 'How do I get a refund?',
    answer: 'We offer a 14-day money-back guarantee on all premium plans. To request a refund, go to Billing > Payment History > Request Refund. Refunds are processed within 5-7 business days.',
    tags: ['refund', 'money-back', 'cancellation', 'billing'],
  },
  {
    category: 'payments-billing',
    order: 3,
    question: 'How do I upgrade or downgrade my subscription?',
    answer: 'Go to Settings > Subscription to view your current plan. Select "Upgrade" or "Downgrade" to choose a different plan. Changes take effect immediately and pricing will be prorated for the current billing cycle.',
    tags: ['upgrade', 'downgrade', 'subscription', 'plan'],
  },
  {
    category: 'technical-support',
    order: 1,
    question: 'The video player is not working. What should I do?',
    answer: 'Try clearing your browser cache and cookies first. Ensure you are using the latest version of Chrome, Firefox, or Edge. If the issue persists, disable browser extensions that might interfere with video playback.',
    tags: ['video', 'player', 'not working', 'buffering'],
  },
  {
    category: 'technical-support',
    order: 2,
    question: 'Why is the page loading slowly?',
    answer: 'Slow loading can be caused by poor internet connectivity, browser cache issues, or high server traffic. Try refreshing the page, switching to a wired connection, or accessing during non-peak hours.',
    tags: ['slow', 'loading', 'performance', 'speed'],
  },
  {
    category: 'technical-support',
    order: 3,
    question: 'I am unable to log in to my account.',
    answer: 'First, verify that you are using the correct email and password. Use the "Forgot Password" option to reset if needed. Clear your browser cache and cookies, or try logging in from an incognito window.',
    tags: ['login', 'issue', 'unable', 'access'],
  },
  {
    category: 'certifications',
    order: 1,
    question: 'How do I get my course certificate?',
    answer: 'Certificates are automatically generated upon course completion with a passing score of 80% or above. You can download it from your Dashboard > Certificates section in PDF format.',
    tags: ['certificate', 'download', 'pdf', 'completion'],
  },
  {
    category: 'certifications',
    order: 2,
    question: 'Are the certificates recognized by employers?',
    answer: 'Our certificates are accredited by industry partners and recognized by many employers. Each certificate includes a unique verification code that employers can use to validate authenticity.',
    tags: ['recognition', 'employer', 'accreditation', 'value'],
  },
  {
    category: 'privacy-security',
    order: 1,
    question: 'How is my personal data protected?',
    answer: 'We use industry-standard encryption (SSL/TLS) for all data transmission. Your personal information is stored securely and never shared with third parties without your explicit consent. We are GDPR and CCPA compliant.',
    tags: ['privacy', 'data', 'security', 'encryption'],
  },
  {
    category: 'privacy-security',
    order: 2,
    question: 'Can I change my email address?',
    answer: 'Yes, go to Settings > Profile > Email. You will need to verify the new email address by clicking on a confirmation link sent to it. Your account will use the new email for all communications.',
    tags: ['email', 'change', 'update', 'settings'],
  },
];

const SOURCE_URLS = {
  faq: 'https://samagama.in/faq',
  overview: 'https://samagama.in/overview',
};

async function fetchFromSource(url) {
  try {
    const { data } = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Accept: 'text/html,application/json',
      },
    });
    return data;
  } catch {
    return null;
  }
}

function parseHtmlToFaqs(html) {
  const cheerio = require('cheerio');
  const faqs = [];
  try {
    const $ = cheerio.load(html);
    $('.faq-item, [class*="faq"], .accordion-item, .qa-item').each((_, el) => {
      const question = $(el).find('.question, h3, h4, [class*="question"]').text().trim();
      const answer = $(el).find('.answer, p, [class*="answer"]').text().trim();
      if (question && answer) {
        faqs.push({ question, answer });
      }
    });
  } catch {
    // cheerio parse failed
  }
  return faqs;
}

async function fetchFAQs() {
  // Try samagama.in/faq first
  const faqHtml = await fetchFromSource(SOURCE_URLS.faq);
  if (faqHtml && faqHtml.length > 50 && !faqHtml.includes('Chat Engine')) {
    const parsed = parseHtmlToFaqs(faqHtml);
    if (parsed.length > 0) return parsed;
  }

  // Try samagama.in/overview
  const overviewHtml = await fetchFromSource(SOURCE_URLS.overview);
  if (overviewHtml && overviewHtml.length > 50 && !overviewHtml.includes('Chat Engine')) {
    const parsed = parseHtmlToFaqs(overviewHtml);
    if (parsed.length > 0) return parsed;
  }

  return null;
}

function getSampleFAQs() {
  return SAMPLE_FAQS;
}

module.exports = { fetchFAQs, getSampleFAQs, SAMPLE_FAQS };
