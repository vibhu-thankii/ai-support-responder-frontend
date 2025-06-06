// src/app/dashboard/overview/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MailWarning, MessageSquare, Inbox, CheckCircle2, Users, TrendingUp, AlertCircle, PieChartIcon, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation"; 
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, 
  LineChart, Line, XAxis, YAxis, CartesianGrid, DotProps, TooltipProps
} from 'recharts';
import { useTheme } from "next-themes"; 
import { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent';

interface DashboardStats {
  total_queries: number;
  new_queries: number;
  agent_replied_queries: number;
  customer_reply_queries: number;
  closed_queries: number;
}

interface UserProfile {
  full_name?: string | null;
  organization_id?: string | null;
}

// Interface for individual data points from the backend's query-volume endpoint
interface QueryVolumeDataPoint {
  date: string; // YYYY-MM-DD
  query_count: number;
}

// Interface for the overall response from query-volume endpoint
interface QueryVolumeResponse {
  data: QueryVolumeDataPoint[];
  period_days: number;
}

// Helper to get CSS variable values
const getCssVariable = (variableName: string, defaultValue: string = ''): string => {
  if (typeof window === 'undefined') return defaultValue; // SSR safety
  try {
    const value = getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
    return value || defaultValue; // Return default value if variable not found
  } catch (e) {
    return defaultValue; // In case of any error (e.g. during jest tests)
  }
};


const RADIAN = Math.PI / 180;
interface CustomizedLabelProps {
  cx: number; cy: number; midAngle: number; innerRadius: number; outerRadius: number;
  percent: number; index: number; name: string; value: number; fill: string;
  currentTheme: string | undefined;
}

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, currentTheme }: CustomizedLabelProps) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  let x = cx + radius * Math.cos(-midAngle * RADIAN);
  let y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent * 100 < 6) return null; 

   if (percent * 100 < 15 && outerRadius < 80) { 
      const newRadius = outerRadius + 12;
      x = cx + newRadius * Math.cos(-midAngle * RADIAN);
      y = cy + newRadius * Math.sin(-midAngle * RADIAN);
  }
  
  const textColor = currentTheme === 'dark' ? 'hsl(var(--primary-foreground))' : 'hsl(var(--primary))';

  return (
    <text x={x} y={y} fill={textColor} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="11px" fontWeight="600">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const CustomizedDot = (props: DotProps & {payload?:any, value?:any, strokeColor?: string}) => {
  const { cx, cy, stroke, strokeColor } = props; 
  if (cx === null || cy === null) return null;
  const finalStrokeColor = strokeColor || stroke || getCssVariable("--primary");
  return (
    <g>
      <circle cx={cx} cy={cy} r={5} fill={finalStrokeColor} stroke={getCssVariable("--background")} strokeWidth={2} />
    </g>
  );
};

const CustomTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2.5 rounded-md border bg-popover text-popover-foreground shadow-md">
        <p className="label font-semibold">{`${label}`}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`item-${index}`} style={{ color: entry.color || entry.payload.fill || getCssVariable("--primary") }}>
            {`${entry.name}: ${entry.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};


export default function DashboardOverviewPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const { theme } = useTheme(); 
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [queryVolumeData, setQueryVolumeData] = useState<QueryVolumeDataPoint[]>([]);


  useEffect(() => setMounted(true), []); 

  const currentTheme = mounted ? theme : 'light'; 

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        toast.error("Authentication error. Please log in.");
        router.push("/login");
        return;
      }

      try {
        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("full_name, organization_id")
          .eq("id", session.user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          throw new Error(profileError.message || "Failed to fetch user profile.");
        }
        if (!profileData || !profileData.organization_id) {
          toast.info("Please complete your organization setup.");
          router.push("/onboarding/create-organization");
          setIsLoading(false); // Stop loading as we are redirecting
          return;
        }
        setUserProfile(profileData);

        // Fetch dashboard stats (aggregate counts)
        const statsPromise = async () => {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/dashboard/stats`,
            { headers: { Authorization: `Bearer ${session.access_token}` } }
          );
          if (!res.ok) {
            const err = await res.json();
            return Promise.reject(err);
          }
          return res.json();
        };

        // Fetch query volume (time-series)
        const volumePromise = async () => {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/dashboard/query-volume?days=7`, // Fetch last 7 days
            { headers: { Authorization: `Bearer ${session.access_token}` } }
          );
          if (!res.ok) {
            const err = await res.json();
            return Promise.reject(err);
          }
          return res.json();
        };
        
        // Execute both promises in parallel
        const [statsData, volumeDataResponse] = await Promise.all([statsPromise(), volumePromise()]);
        
        setStats(statsData as DashboardStats);
        
        const volumeDataTyped = volumeDataResponse as QueryVolumeResponse;
        // Format date for chart display (e.g., "Mon", "Tue" or "Jun 05")
        const formattedVolumeData = volumeDataTyped.data.map(item => ({
            ...item,
            // Example: format 'YYYY-MM-DD' to 'Mon', 'Tue', or short date 'Jun 05'
            // Using a simple day of week for this example. For actual date, use a library or more robust parsing.
            name: new Date(item.date + "T00:00:00Z").toLocaleDateString('en-US', { weekday: 'short' }) 
        }));
        setQueryVolumeData(formattedVolumeData);


      } catch (err: any) {
        console.error("Dashboard data fetch error:", err);
        const errorMessage = err.detail || err.message || "An unknown error occurred loading dashboard data.";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    if(mounted) { // Only fetch data once the component is mounted to use theme for colors
        fetchData();
    }
  }, [supabase, router, mounted]); // Rerun if supabase, router, or mounted status changes.


  const pieChartData = useMemo(() => {
    if (!stats || !mounted) return []; 
    
    const isDark = currentTheme === 'dark';
    const defaultColors = [
        getCssVariable('--chart-1') || (isDark ? 'hsl(45, 90%, 70%)' : 'hsl(45, 95%, 55%)'),  
        getCssVariable('--chart-2') || (isDark ? 'hsl(205, 80%, 70%)' : 'hsl(205, 85%, 55%)'), 
        getCssVariable('--chart-3') || (isDark ? 'hsl(150, 70%, 65%)' : 'hsl(150, 75%, 45%)'), 
        getCssVariable('--chart-4') || (isDark ? 'hsl(270, 60%, 70%)' : 'hsl(270, 65%, 60%)'), 
    ];

    return [
        { name: 'New', value: stats.new_queries, fill: defaultColors[0] },
        { name: 'Awaiting Agent', value: stats.customer_reply_queries, fill: defaultColors[1] }, 
        { name: 'Awaiting Customer', value: stats.agent_replied_queries, fill: defaultColors[2] }, 
        { name: 'Closed', value: stats.closed_queries, fill: defaultColors[3] },
      ].filter(entry => entry.value > 0);
  }, [stats, mounted, currentTheme]); 


  if (isLoading || !mounted) { 
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]"> 
        <Loader2 className="h-10 w-10 animate-spin text-primary" /> 
        <p className="ml-3 text-lg text-muted-foreground">Loading Dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] p-4 text-center"> 
        <AlertCircle className="h-12 w-12 text-destructive mb-4" /> 
        <p className="text-xl font-semibold text-destructive">Error loading dashboard</p>
        <p className="text-sm text-muted-foreground mt-1">{error}</p>
        <Button onClick={() => window.location.reload()} className="mt-6">Try Again</Button>
      </div>
    );
  }
  
  const welcomeName = userProfile?.full_name || "User";
  const axisAndLegendColor = mounted ? getCssVariable("--muted-foreground") : 'grey';
  const lineChartPrimaryColor = mounted ? getCssVariable("--primary") : '#3b82f6';
  const gridStrokeColor = mounted ? getCssVariable("--border") : '#e5e7eb';


  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Welcome back, {welcomeName}!</h2>
      </div>

      {stats ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {/* Stat Cards */}
          <Card className="hover:shadow-lg transition-shadow dark:bg-slate-800/70 border-slate-700/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Queries</CardTitle>
              <Inbox className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_queries}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow dark:bg-slate-800/70 border-slate-700/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New</CardTitle>
              <MailWarning className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.new_queries}</div>
              <p className="text-xs text-muted-foreground">Awaiting action</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow dark:bg-slate-800/70 border-slate-700/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Awaiting Agent</CardTitle>
              <Users className="h-5 w-5 text-blue-500 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.customer_reply_queries}</div>
              <p className="text-xs text-muted-foreground">Needs response</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow dark:bg-slate-800/70 border-slate-700/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Awaiting Customer</CardTitle>
              <MessageSquare className="h-5 w-5 text-green-500 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.agent_replied_queries}</div>
              <p className="text-xs text-muted-foreground">Response sent</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow dark:bg-slate-800/70 border-slate-700/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Closed</CardTitle>
              <CheckCircle2 className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.closed_queries}</div>
              <p className="text-xs text-muted-foreground">Resolved</p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <p className="text-muted-foreground">No statistics available yet.</p>
      )}

      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-3 dark:bg-slate-800/70 border dark:border-slate-700/50">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <PieChartIcon className="h-5 w-5 mr-2 text-primary" />
              Query Status Distribution
            </CardTitle>
            <CardDescription>Current breakdown of active query statuses.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] md:h-[350px] flex items-center justify-center p-0 pt-4">
            {pieChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="45%" 
                    labelLine={false}
                    label={(props) => renderCustomizedLabel({...props, currentTheme: currentTheme})}
                    outerRadius={90} 
                    innerRadius={50}  
                    dataKey="value"
                    stroke={getCssVariable("--background", "#ffffff")} 
                    strokeWidth={3}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    iconSize={10} 
                    wrapperStyle={{ fontSize: "12px", paddingTop: "20px", color: axisAndLegendColor }} 
                    formatter={(value, entry: any) => <span style={{ color: entry.color }}>{value}</span>} 
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm p-4 text-center">No active queries to display.</p>
            )}
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-4 dark:bg-slate-800/70 border dark:border-slate-700/50">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <TrendingUp className="h-5 w-5 mr-2 text-primary" />
              Query Volume (Last 7 Days)
            </CardTitle>
            <CardDescription>Number of new queries received per day.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2 pr-4 pb-4 h-[300px] md:h-[350px]">
            {queryVolumeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={queryVolumeData} margin={{ top: 5, right: 20, left: -15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStrokeColor} strokeOpacity={0.6} horizontal={true} vertical={false} />
                  <XAxis dataKey="name" stroke={axisAndLegendColor} fontSize={12} tickLine={false} axisLine={{stroke: axisAndLegendColor, strokeWidth: 0.8}}/>
                  <YAxis stroke={axisAndLegendColor} fontSize={12} allowDecimals={false} tickLine={false} axisLine={{stroke: axisAndLegendColor, strokeWidth: 0.8}}/>
                  <Tooltip content={<CustomTooltip />} cursor={{fill: getCssVariable("--accent"), fillOpacity: 0.2}}/>
                  <Line 
                    type="monotone" 
                    dataKey="query_count" // Updated dataKey
                    name="Queries" // Name for tooltip
                    stroke={lineChartPrimaryColor}
                    strokeWidth={2.5} 
                    dot={<CustomizedDot strokeColor={lineChartPrimaryColor} />}
                    activeDot={{ r: 7, strokeWidth: 2, fill: lineChartPrimaryColor, stroke: getCssVariable("--background") }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
                 <p className="text-muted-foreground text-sm p-4 text-center">No query volume data to display for the last 7 days.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
