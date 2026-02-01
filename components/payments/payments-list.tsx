"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Payment, Student } from "@/lib/types"

interface PaymentsListProps {
  payments: Payment[]
  students: Student[]
}

export function PaymentsList({ payments, students }: PaymentsListProps) {
  const getStudentName = (studentId: string) => {
    return students.find((s) => s.id === studentId)?.fullName || "Unknown"
  }

  const methodColors: Record<string, string> = {
    cash: "bg-green-100 text-green-700",
    transfer: "bg-blue-100 text-blue-700",
    card: "bg-purple-100 text-purple-700",
    other: "bg-gray-100 text-gray-700",
  }

  const sortedPayments = [...payments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Payments</CardTitle>
      </CardHeader>
      <CardContent>
        {sortedPayments.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">No payments recorded yet</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="text-muted-foreground">{new Date(payment.date).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium">{getStudentName(payment.studentId)}</TableCell>
                  <TableCell className="font-semibold text-emerald-600">${payment.amount}</TableCell>
                  <TableCell>
                    <Badge className={methodColors[payment.method]}>{payment.method}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-[200px] truncate">{payment.notes || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
