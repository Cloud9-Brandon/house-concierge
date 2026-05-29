import { Resend } from 'resend';

export async function POST(req) {
  try {
    const data = await req.json();
    const { name, phone, zip, appliance, issue, timePreference } = data;

    if (!name || !phone || !zip || !appliance || !issue) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if Austin metro area
    const isAustin = /^(787|786|733)/.test(zip);

    if (!isAustin) {
      return Response.json({
        success: false,
        waitlist: true,
        message: 'Pro matching is currently available in Austin, TX only.',
      });
    }

    // Send email notification
    if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 're_your-key-here') {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: 'House Concierge <onboarding@resend.dev>',
          to: process.env.NOTIFY_EMAIL || 's.brandonxf@gmail.com',
          subject: `🔧 New Pro Request: ${appliance} — ${name}`,
          html: `
            <h2>New Pro Intake Request</h2>
            <table style="border-collapse: collapse; width: 100%;">
              <tr><td style="padding: 8px; font-weight: bold;">Name</td><td style="padding: 8px;">${name}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold;">Phone</td><td style="padding: 8px;"><a href="tel:${phone}">${phone}</a></td></tr>
              <tr><td style="padding: 8px; font-weight: bold;">ZIP Code</td><td style="padding: 8px;">${zip}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold;">Appliance</td><td style="padding: 8px;">${appliance}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold;">Issue</td><td style="padding: 8px;">${issue}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold;">Preferred Time</td><td style="padding: 8px;">${timePreference || 'Any'}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold;">Submitted</td><td style="padding: 8px;">${new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })}</td></tr>
            </table>
            <br/>
            <p><strong>Next steps:</strong> Find a provider on Thumbtack/Yelp, broker the match, text the customer.</p>
          `,
        });
      } catch (emailError) {
        console.error('Email send failed:', emailError);
        // Don't fail the request if email fails — log it
      }
    } else {
      // Log to console if Resend isn't set up yet
      console.log('=== NEW PRO INTAKE ===');
      console.log(JSON.stringify(data, null, 2));
      console.log('======================');
    }

    return Response.json({
      success: true,
      waitlist: false,
      message: 'Request received! We\'ll text you within an hour with a vetted pro.',
    });
  } catch (error) {
    console.error('Intake API error:', error);
    return Response.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
