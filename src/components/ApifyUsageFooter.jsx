import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import api from "../services/api"
import { Card, CardContent } from "../components/ui/card"
import { Progress } from "../components/ui/progress"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { Zap, Calendar, ChevronDown, ChevronUp } from "lucide-react"

function ApifyUsageFooter() {
  const { userId } = useParams()
  const [balance, setBalance] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isMinimized, setIsMinimized] = useState(false)

  useEffect(() => {
    if (userId) {
      loadBalance()
    }
  }, [userId])

  const loadBalance = async () => {
    try {
      setLoading(true)
      setError(null)
      const balanceData = await api.getApifyBalance(userId)
      console.log("balanceData", balanceData)
      setBalance(balanceData)
    } catch (err) {
      setError(err.message)
      console.error("Failed to load Apify balance:", err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="fixed bottom-4 left-4 z-50">
        <Card className="w-64">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm text-gray-600">Loading usage...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !balance) {
    return null // Don't show footer if there's an error
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const usage = balance.monthlyUsage || 0
  const limit = 5.0
  const remaining = Math.max(0, limit - usage)
  const usagePercentage = (usage / limit) * 100

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <Card className="w-64 backdrop-blur-md bg-white/80 border shadow-lg">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-600" />
                <span className="font-semibold text-sm">Apify Usage</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-6 w-6 p-0"
              >
                {isMinimized ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </Button>
            </div>

            {!isMinimized && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">
                    ${usage.toFixed(2)} / ${limit.toFixed(2)}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {usagePercentage.toFixed(0)}%
                  </Badge>
                </div>

                <Progress value={usagePercentage} className="h-2" />

                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <Calendar className="h-3 w-3" />
                  <span>Resets on {formatDate(balance.resetsAt)}</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ApifyUsageFooter
