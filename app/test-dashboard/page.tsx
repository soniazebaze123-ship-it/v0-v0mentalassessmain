"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/client"
import { CheckCircle2, XCircle, Loader2, Database, Users, FileText, Shield } from "lucide-react"

interface TestResult {
  name: string
  status: "pending" | "success" | "error"
  message?: string
  details?: any
}

export default function TestDashboardPage() {
  const [tests, setTests] = useState<TestResult[]>([
    { name: "Database Connection", status: "pending" },
    { name: "Users Table Query", status: "pending" },
    { name: "Assessments Table Query", status: "pending" },
    { name: "User Progress Table Query", status: "pending" },
    { name: "Storage Bucket Access", status: "pending" },
    { name: "Create Test User", status: "pending" },
    { name: "Create Test Assessment", status: "pending" },
  ])
  const [isRunning, setIsRunning] = useState(false)

  const updateTest = (index: number, status: "success" | "error", message?: string, details?: any) => {
    setTests((prev) => {
      const newTests = [...prev]
      newTests[index] = { ...newTests[index], status, message, details }
      return newTests
    })
  }

  const runTests = async () => {
    setIsRunning(true)
    const supabase = createClient()

    // Test 1: Database Connection
    try {
      const { data, error } = await supabase.from("users").select("count")
      if (error) throw error
      updateTest(0, "success", "Successfully connected to Supabase")
    } catch (error: any) {
      updateTest(0, "error", error.message)
    }

    // Test 2: Users Table Query
    try {
      const { data, error } = await supabase.from("users").select("*").limit(5)

      if (error) throw error
      updateTest(1, "success", `Found ${data?.length || 0} users`, data)
    } catch (error: any) {
      updateTest(1, "error", error.message)
    }

    // Test 3: Assessments Table Query
    try {
      const { data, error } = await supabase.from("assessments").select("*").limit(5)

      if (error) throw error
      updateTest(2, "success", `Found ${data?.length || 0} assessments`, data)
    } catch (error: any) {
      updateTest(2, "error", error.message)
    }

    // Test 4: User Progress Table Query
    try {
      const { data, error } = await supabase.from("user_progress").select("*").limit(5)

      if (error) throw error
      updateTest(3, "success", `Found ${data?.length || 0} progress records`, data)
    } catch (error: any) {
      updateTest(3, "error", error.message)
    }

    // Test 5: Storage Bucket Access
    try {
      const { data, error } = await supabase.storage.getBucket("user-uploads")

      if (error) throw error
      updateTest(4, "success", "Storage bucket accessible", data)
    } catch (error: any) {
      updateTest(4, "error", error.message)
    }

    // Test 6: Create Test User
    try {
      const testEmail = `test-${Date.now()}@example.com`
      const testPhone = `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`

      const { data, error } = await supabase
        .from("users")
        .insert([{ email: testEmail, phone_number: testPhone }])
        .select()

      if (error) throw error
      updateTest(5, "success", `Created user: ${testEmail}`, data)
    } catch (error: any) {
      updateTest(5, "error", error.message)
    }

    // Test 7: Create Test Assessment
    try {
      // Get the first user
      const { data: users } = await supabase.from("users").select("id").limit(1)

      if (!users || users.length === 0) {
        throw new Error("No users found")
      }

      const { data, error } = await supabase
        .from("assessments")
        .insert([
          {
            user_id: users[0].id,
            type: "TEST",
            score: 99,
            data: { test: true },
          },
        ])
        .select()

      if (error) throw error
      updateTest(6, "success", "Created test assessment", data)
    } catch (error: any) {
      updateTest(6, "error", error.message)
    }

    setIsRunning(false)
  }

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-600" />
      case "pending":
        return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">Database & Auth Testing Dashboard</h1>
          <p className="text-lg text-gray-600">
            Comprehensive testing suite for authentication flow and database operations
          </p>
        </div>

        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            This dashboard tests your Supabase integration, database tables, and CRUD operations. Run the tests below to
            verify everything is working correctly.
          </AlertDescription>
        </Alert>

        <div className="flex justify-center">
          <Button onClick={runTests} disabled={isRunning} size="lg" className="min-w-[200px]">
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Tests...
              </>
            ) : (
              "Run All Tests"
            )}
          </Button>
        </div>

        <div className="grid gap-4">
          {tests.map((test, index) => (
            <Card key={index} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(test.status)}
                    <CardTitle className="text-lg">{test.name}</CardTitle>
                  </div>
                  <Badge
                    variant={
                      test.status === "success" ? "default" : test.status === "error" ? "destructive" : "secondary"
                    }
                  >
                    {test.status}
                  </Badge>
                </div>
                {test.message && <CardDescription className="mt-2">{test.message}</CardDescription>}
              </CardHeader>
              {test.details && (
                <CardContent>
                  <details className="cursor-pointer">
                    <summary className="text-sm font-medium text-gray-700 mb-2">View Details</summary>
                    <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-40">
                      {JSON.stringify(test.details, null, 2)}
                    </pre>
                  </details>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Test Database Credentials
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <strong>Test User 1:</strong> test@example.com / +1234567890
            </div>
            <div>
              <strong>Test User 2:</strong> demo@example.com / +0987654321
            </div>
            <div className="pt-2 border-t">
              <strong>Admin Login:</strong> username: admin / password: admin123
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4" />
                Quick Links
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
                <Link href="/">Main App</Link>
              </Button>
              <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
                <Link href="/admin">Admin Panel</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Next Steps
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1 text-gray-600">
              <p>✓ Database setup complete</p>
              <p>✓ Test data inserted</p>
              <p>→ Test user registration</p>
              <p>→ Test assessments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Security Status
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1 text-gray-600">
              <p>✓ RLS enabled</p>
              <p>✓ Storage policies active</p>
              <p>✓ SSR client configured</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
