import { CustomerDashboardLayout } from "./components/customer-dashboard-layout"

export default function CustomerDashboardPage() {
  return (
    <CustomerDashboardLayout>
      <div className="max-w-3xl">
        <div className="text-4xl mb-4">👋</div>
        <h2 className="text-2xl font-bold mb-2 text-white">Hello!</h2>
        <p className="text-slate-400 text-sm">
          Please select a menu from the sidebar to manage your account, orders, rewards,
          and addresses.
        </p>
      </div>
    </CustomerDashboardLayout>
  )
}
