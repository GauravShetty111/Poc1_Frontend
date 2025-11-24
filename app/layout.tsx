import './globals.css'

export const metadata = {
  title: 'POC1 Dashboard',
  description: 'CSV Data Analysis Dashboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}