'use client';

import { useApp } from '@/lib/store';
import { Users, UserCheck, DollarSign, Wallet } from 'lucide-react';

export default function Home() {
  const { employees, attendance, payments } = useApp();

  const totalEmployees = employees.length;

  // Get today's attendance count
  const today = new Date().toISOString().split('T')[0];
  const presentToday = attendance.filter(a => a.date === today && a.status === 'present').length;

  // Calculate generic potential total pending (simplified logic, real logic needs more parsing)
  // For now let's show Total Payments Made
  const totalPaid = payments.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="container">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500">Overview of your site operations</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Employees"
          value={totalEmployees}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Present Today"
          value={presentToday}
          icon={UserCheck}
          color="green"
        />
        <StatCard
          title="Total Paid"
          value={`$${totalPaid.toLocaleString()}`}
          icon={Wallet}
          color="orange"
        />
        <StatCard
          title="Working Sites"
          value="1"
          icon={DollarSign}
          color="slate"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="flex gap-4">
            <a href="/employees" className="btn btn-outline">Add Employee</a>
            <a href="/attendance" className="btn btn-primary">Mark Attendance</a>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
          <p className="text-slate-500 text-sm">No recent activity logged.</p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: any) {
  const colorMap: any = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
    slate: 'bg-slate-100 text-slate-600',
  };

  return (
    <div className="card flex items-center gap-4">
      <div className={`p-3 rounded-full ${colorMap[color] || 'bg-gray-100'}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-sm text-slate-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}
