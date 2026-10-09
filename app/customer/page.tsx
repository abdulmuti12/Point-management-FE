import { CustomerDashboardLayout } from "./components/customer-dashboard-layout"

export default function CustomerDashboardPage() {
  return (
    <CustomerDashboardLayout>
      <div className="max-w-3xl">
        <div className="text-4xl mb-4">👋</div>
        <h2 className="text-2xl font-bold mb-2 text-white">Halo!</h2>
        <p className="text-slate-400 text-sm">
          Silakan pilih menu di sidebar untuk mengelola akun, pesanan, reward,
          dan alamat Anda.
        </p>
      </div>
    </CustomerDashboardLayout>
  )
}
