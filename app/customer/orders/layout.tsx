import { CustomerDashboardLayout } from "../components/customer-dashboard-layout"

export default function OrdersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <CustomerDashboardLayout>{children}</CustomerDashboardLayout>
}
