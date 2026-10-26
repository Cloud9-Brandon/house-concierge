import { Resend } from 'resend';

const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export async function POST(req) {
  try {
    const data = await req.json();
    const { name, phone, zip, appliance, issue, timePreference, handoff } = data;
    for (const v of [name, phone, zip, appliance, issue, timePreference, handoff]) {
      if (v != null && (typeof v !== 'string' || v.length > 1000)) {
        return Response.json({ error: 'Invalid input' }, { status: 400 });
      }
    }

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
    if (process.env.RESEND_API_KEY && process.env.NOTIFY_EMAIL && process.env.RESEND_API_KEY !== 're_your-key-here') {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: 'House Concierge <onboarding@resend.dev>',
          to: process.env.NOTIFY_EMAIL,
          subject: `🔧 New Pro Request: ${esc(appliance)} — ${esc(name)}`,
          html: `
            <h2>New Pro Intake Request</h2>
            <table style="border-collapse: collapse; width: 100%;">
              <tr><td style="padding: 8px; font-weight: bold;">Name</td><td style="padding: 8px;">${esc(name)}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold;">Phone</td><td style="padding: 8px;"><a href="tel:${esc(phone)}">${esc(phone)}</a></td></tr>
              <tr><td style="padding: 8px; font-weight: bold;">ZIP Code</td><td style="padding: 8px;">${esc(zip)}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold;">Appliance</td><td style="padding: 8px;">${esc(appliance)}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold;">Issue</td><td style="padding: 8px;">${esc(issue)}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold;">AI diagnosis summary</td><td style="padding: 8px;">${esc(handoff || 'n/a')}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold;">Preferred Time</td><td style="padding: 8px;">${esc(timePreference || 'Any')}</td></tr>
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
