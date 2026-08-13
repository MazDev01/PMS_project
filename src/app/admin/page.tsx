import Link from "next/link";
import {
  Users,
  UserCog,
  HardHat,
  CircleCheck,
  Wifi,
  ShieldAlert,
  Database,
  ArrowRight,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Alert } from "@/components/ui/alert";
import {
  TableWrap,
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
} from "@/components/ui/table";
import { DonutChart } from "@/components/charts/charts";
import { users, logs, userCounts, ROLE_LABEL } from "@/lib/admin";
import { formatThaiDateTime } from "@/lib/utils";

const c = userCounts();

const STATS = [
  { label: "ผู้ใช้ทั้งหมด", value: c.total, icon: Users, tone: "info" as const },
  {
    label: "ผู้ประสานงาน",
    value: c.coordinator,
    icon: UserCog,
    tone: "secondary" as const,
  },
  {
    label: "ทีมช่าง / ผู้รับเหมา",
    value: c.contractor,
    icon: HardHat,
    tone: "secondary" as const,
  },
  {
    label: "ใช้งานอยู่",
    value: c.active,
    icon: CircleCheck,
    tone: "success" as const,
  },
];

const donut = [
  { label: "ผู้ประสานงาน", value: c.coordinator, color: "var(--chart-1)" },
  { label: "ทีมช่าง/ผู้รับเหมา", value: c.contractor, color: "var(--chart-3)" },
  { label: "ผู้ดูแลระบบ", value: c.admin, color: "var(--chart-5)" },
];

export default function AdminDashboard() {
  const recent = [...users]
    .sort((a, b) => b.lastActive.localeCompare(a.lastActive))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STATS.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardContent className="flex items-center justify-between">
                <div>
                  <div className="text-[0.8rem] text-muted-foreground">
                    {s.label}
                  </div>
                  <div className="mt-1 text-2xl font-bold">{s.value}</div>
                </div>
                <div className="grid size-10 place-items-center rounded-lg bg-accent text-primary">
                  <Icon className="size-5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Role donut */}
        <Card>
          <CardHeader>
            <CardTitle>สัดส่วนบัญชีตามบทบาท</CardTitle>
            <CardDescription>RBAC · แยกตาม Role</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <DonutChart
              data={donut}
              centerValue={String(c.total)}
              centerLabel="บัญชี"
            />
          </CardContent>
        </Card>

        {/* Mango status + alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="size-4 text-primary" />
              สถานะเชื่อมต่อ Mango
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 rounded-lg border border-success/40 bg-success/8 p-3">
              <span className="size-2.5 rounded-full bg-success" />
              <div>
                <div className="text-sm font-semibold text-success-foreground">
                  Connected
                </div>
                <div className="text-[0.72rem] text-muted-foreground">
                  ตรวจสอบล่าสุด 14:20 น. · latency 128ms
                </div>
              </div>
              <Link
                href="/admin/mango"
                className="ml-auto text-[0.78rem] font-medium text-primary hover:underline"
              >
                ตั้งค่า
              </Link>
            </div>
            <div className="rounded-lg bg-muted p-3 text-[0.82rem]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">การซิงค์วันนี้</span>
                <span className="font-medium">
                  <span className="text-success-foreground">3 สำเร็จ</span> ·{" "}
                  <span className="text-warning-foreground">1 รอ</span> ·{" "}
                  <span className="text-destructive">1 ล้มเหลว</span>
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="size-4 text-primary" />
              แจ้งเตือนความปลอดภัย
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Alert tone="warning" title="พื้นที่ Log ใกล้เต็ม (82%)">
              ควรสำรองและล้าง Log เก่า
            </Alert>
            <Alert tone="error" title="ซิงค์ INV-0143 ล้มเหลว">
              ต้องส่งข้อมูลใหม่ไปยัง Mango
            </Alert>
          </CardContent>
        </Card>
      </div>

      {/* Recent logins */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle>การเข้าใช้ระบบล่าสุด</CardTitle>
            <CardDescription>ประวัติกิจกรรมของบัญชีผู้ใช้</CardDescription>
          </div>
          <Link
            href="/admin/logs"
            className="flex items-center gap-1 text-[0.82rem] font-medium text-primary hover:underline"
          >
            ดูทั้งหมด <ArrowRight className="size-3.5" />
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <TableWrap className="rounded-none border-0">
            <Table>
              <THead>
                <TR>
                  <TH>ผู้ใช้</TH>
                  <TH>บทบาท</TH>
                  <TH>สถานะ</TH>
                  <TH>ใช้งานล่าสุด</TH>
                </TR>
              </THead>
              <TBody>
                {recent.map((u) => (
                  <TR key={u.id}>
                    <TD>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={u.name} size="sm" color={u.avatarColor} />
                        <div>
                          <div className="text-[0.85rem] font-medium">
                            {u.name}
                          </div>
                          <div className="text-[0.72rem] text-muted-foreground">
                            @{u.username}
                          </div>
                        </div>
                      </div>
                    </TD>
                    <TD>
                      <Badge tone="secondary">{ROLE_LABEL[u.role]}</Badge>
                    </TD>
                    <TD>
                      {u.active ? (
                        <Badge tone="success">ใช้งาน</Badge>
                      ) : (
                        <Badge tone="ghost">ปิดใช้งาน</Badge>
                      )}
                    </TD>
                    <TD className="text-[0.8rem] text-muted-foreground">
                      {formatThaiDateTime(u.lastActive)}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </TableWrap>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/master-data"
          className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium transition-colors hover:border-primary hover:bg-accent"
        >
          <Database className="size-4 text-primary" />
          จัดการข้อมูลหลัก (Master Data)
          <ArrowRight className="size-4 text-muted-foreground" />
        </Link>
      </div>
    </div>
  );
}
