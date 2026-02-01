"use client"

import { Card, CardContent } from "@/components/ui/card"
import { DollarSign, TrendingUp, AlertCircle, Ban } from "lucide-react"

interface FinanceStatsProps {
  monthlyIncome: number
  expectedIncome: number
  unpaidAmount: number
  cancelledLoss: number
}

export function FinanceStats({ monthlyIncome, expectedIncome, unpaidAmount, cancelledLoss }: FinanceStatsProps) {
  const stats = [
    {
      label: "Monthly Income",
      value: `$${monthlyIncome.toLocaleString()}`,
      icon: DollarSign,
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      label: "Expected Income",
      value: `$${expectedIncome.toLocaleString()}`,
      icon: TrendingUp,
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "Unpaid Balance",
      value: `$${unpaidAmount.toLocaleString()}`,
      icon: AlertCircle,
      color: "text-amber-600 bg-amber-50",
    },
    {
      label: "Cancelled Loss",
      value: `$${cancelledLoss.toLocaleString()}`,
      icon: Ban,
      color: "text-red-600 bg-red-50",
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
