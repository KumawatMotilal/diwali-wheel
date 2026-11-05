import "./globals.css";

export const metadata = {
  title: "Diwali Lucky Wheel",
  description: "Spin the wheel and win a Diwali gift!",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
