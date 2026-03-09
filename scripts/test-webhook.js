require('dotenv').config({ path: '.env.local' });

async function testWebhook() {
  const webhookUrl = 'http://localhost:3000/api/webhook';
  const webhookSecret = process.env.WEBHOOK_SECRET || 'prj_cOVGwdtToIHK4tgDLnqn3WDHsaOf';

  // Generate a random username for the recipient
  const randomUser = Math.random().toString(36).substring(2, 8);
  const domain = process.env.NEXT_PUBLIC_EMAIL_DOMAIN || 'wibuhub.qzz.io';
  const recipient = `${randomUser}@${domain}`;

  const payload = {
    recipient: recipient,
    sender: 'test@example.com',
    subject: 'Test Email from Webhook Script',
    textBody: 'This is a test email sent from the local development script.\nHello World!',
    htmlBody: '<p>This is a <strong>test email</strong> sent from the local development script.</p><br/><p>Hello World!</p>'
  };

  console.log(`Sending test webhook to: ${webhookUrl}`);
  console.log(`Simulating email to: ${recipient}`);

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${webhookSecret}`
      },
      body: JSON.stringify(payload)
    });

    const responseData = await response.json();

    if (response.ok) {
      console.log('✅ Webhook test successful!');
      console.log('Response:', responseData);
      console.log(`\nYou can now go to http://localhost:3000 and enter the email address: ${recipient}`);
      console.log('to see this test email arrive.');
    } else {
      console.error('❌ Webhook test failed!');
      console.error('Status:', response.status);
      console.error('Response:', responseData);
    }
  } catch (error) {
    console.error('❌ Error testing webhook:', error.message);
    if (error.cause && error.cause.code === 'ECONNREFUSED') {
      console.error('\nTips: Make sure your Next.js development server is running ("npm run dev").');
    }
  }
}

testWebhook();
