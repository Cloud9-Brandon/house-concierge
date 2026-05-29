import './globals.css';

export const metadata = {
  title: 'House Concierge — Fix It or Find a Pro',
  description: 'AI-powered appliance diagnosis. Get a step-by-step fix or a vetted local pro in minutes.',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-900 min-h-screen">
        {children}
      </body>
    </html>
  );
}
