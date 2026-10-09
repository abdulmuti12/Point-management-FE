import { CustomerDashboardLayout } from "../components/customer-dashboard-layout"

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <CustomerDashboardLayout>{children}</CustomerDashboardLayout>
}
