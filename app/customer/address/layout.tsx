import { CustomerDashboardLayout } from "../components/customer-dashboard-layout"

export default function AddressLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <CustomerDashboardLayout>{children}</CustomerDashboardLayout>
}
