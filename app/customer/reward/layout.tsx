import { CustomerDashboardLayout } from "../components/customer-dashboard-layout"

export default function RewardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <CustomerDashboardLayout>{children}</CustomerDashboardLayout>
}
