'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowLeftRight,
  BarChart3,
  Bell,
  Building2,
  ChevronRight,
  ChevronsUpDown,
  CircleHelp,
  Landmark,
  LayoutDashboard,
  MoreHorizontal,
  ReceiptText,
  Search,
  Settings,
  Users,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function VendorProfile() {
  const router = useRouter();
  return (
    <div data-appearance="light">
      <div className="bg-background text-foreground w-full h-fit min-h-screen w-screen min-w-screen max-w-screen overflow-visible">
        <div className="bg-background text-foreground min-h-screen">
          <aside className="bg-sidebar text-sidebar-foreground border-y border-r border-border flex fixed inset-y-0 left-0 px-4 py-5 flex-col w-64">
            <div className="flex px-3 items-center h-8">
              <span className="font-semibold text-foreground text-lg tracking-[0.18em]">
                DIGITAX
              </span>
            </div>
            <button className="text-left rounded-md bg-card text-foreground text-sm border border-border flex mt-6 px-3 justify-between items-center w-full h-11">
              <span className="flex items-center gap-2 min-w-0">
                <Building2 className="text-muted-foreground shrink-0 size-4" />
                <span className="text-ellipsis whitespace-nowrap overflow-hidden">
                  Aster Labs Pvt. Ltd.
                </span>
              </span>
              <ChevronsUpDown className="text-muted-foreground shrink-0 size-4" />
            </button>
            <nav className="flex mt-7 flex-col flex-1 gap-1">
              <a
                href="#"
                className="rounded-md text-muted-foreground text-sm flex px-3 items-center gap-3 h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
              >
                <LayoutDashboard className="size-4" />
                <span>Overview</span>
              </a>
              <a
                href="#"
                className="rounded-md text-muted-foreground text-sm flex px-3 items-center gap-3 h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
              >
                <ArrowLeftRight className="size-4" />
                <span>Transactions</span>
              </a>
              <a
                href="#"
                className="rounded-md text-muted-foreground text-sm flex px-3 items-center gap-3 h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
              >
                <ReceiptText className="size-4" />
                <span>{`GST & Tax`}</span>
              </a>
              <a
                href="#"
                className="rounded-md text-muted-foreground text-sm flex px-3 items-center gap-3 h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
              >
                <Landmark className="size-4" />
                <span>Banking</span>
              </a>
              <a
                href="#"
                className="rounded-md text-muted-foreground text-sm flex px-3 items-center gap-3 h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
              >
                <BarChart3 className="size-4" />
                <span>Reports</span>
              </a>
              <a
                href="#"
                className="font-medium rounded-md bg-primary text-primary-foreground text-sm flex px-3 items-center gap-3 h-10"
              >
                <Users className="size-4" />
                <span>Contacts</span>
              </a>
              <a
                href="#"
                className="rounded-md text-muted-foreground text-sm flex px-3 items-center gap-3 h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
              >
                <Settings className="size-4" />
                <span>Settings</span>
              </a>
            </nav>
            <div className="border-x border-t border-b flex pt-4 flex-col gap-2">
              <a
                href="#"
                className="rounded-md text-muted-foreground text-sm flex px-3 items-center gap-3 h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
              >
                <CircleHelp className="size-4" />
                <span>{`Help & support`}</span>
              </a>
              <button className="text-left rounded-md flex px-3 py-2 items-center gap-3 hover:bg-accent active:bg-muted hover:active:bg-muted">
                <span className="font-medium rounded-full bg-primary text-primary-foreground text-xs flex justify-center items-center shrink-0 size-8">
                  AK
                </span>
                <span className="min-w-0">
                  <span className="font-medium text-ellipsis whitespace-nowrap text-foreground text-sm block overflow-hidden">
                    Ananya Kapoor
                  </span>
                  <span className="text-ellipsis whitespace-nowrap text-muted-foreground text-xs block overflow-hidden">
                    Admin
                  </span>
                </span>
                <MoreHorizontal className="text-muted-foreground ml-auto shrink-0 size-4" />
              </button>
            </div>
          </aside>
          <div className="ml-64 min-h-screen">
            <header className="bg-background border-t border-r border-b border-b-border border-l-border flex fixed z-10 top-0 right-0 left-64 px-8 justify-between items-center h-16">
              <div className="text-sm flex items-center gap-2">
                <span className="text-muted-foreground">DIGITAX</span>
                <ChevronRight className="text-muted-foreground size-4" />
                <span className="text-muted-foreground">Contacts</span>
                <ChevronRight className="text-muted-foreground size-4" />
                <span className="font-medium text-foreground">
                  Tata Communications
                </span>
              </div>
              <div className="flex items-center gap-4">
                <label className="rounded-md bg-card border border-border flex px-3 items-center gap-2 w-64 h-9">
                  <Search className="text-muted-foreground size-4" />
                  <input
                    type="search"
                    placeholder="Search"
                    defaultValue=""
                    className="bg-transparent text-foreground text-sm outline-none w-full placeholder:text-muted-foreground"
                  />
                </label>
                <button
                  aria-label="Notifications"
                  className="rounded-md text-muted-foreground flex justify-center items-center size-9 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
                >
                  <Bell className="size-4" />
                </button>
                <button
                  aria-label="Open profile"
                  className="font-medium rounded-full bg-primary text-primary-foreground text-xs flex justify-center items-center size-8"
                >
                  AK
                </button>
              </div>
            </header>
            <main className="px-8 pt-24 pb-10 min-h-screen">
              <a
                href="#"
                className="text-muted-foreground text-sm flex mb-5 items-center gap-2 hover:text-foreground"
                onClick={() => router.push('/contacts')}
              >
                <ArrowLeft className="size-4" />
                <span>Back to contacts</span>
              </a>
              <Card className="mb-6">
                <CardContent className="flex p-6 justify-between items-center">
                  <div className="flex items-center gap-4">
                    <Avatar className="size-14">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        TC
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                        <h1 className="font-semibold text-2xl">
                          Tata Communications Ltd.
                        </h1>
                        <Badge className="bg-primary/10 text-primary">
                          Active
                        </Badge>
                        <Badge variant="outline">Sample data</Badge>
                      </div>
                      <p className="text-muted-foreground text-sm">
                        GSTIN 27AAACT1234F1Z7
                      </p>
                      <p className="text-muted-foreground text-sm">
                        Vikhroli West, Mumbai, Maharashtra 400079
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button variant="outline">Edit vendor</Button>
                    <Button onClick={() => router.push('/invoice-details')}>
                      Create bill
                    </Button>
                  </div>
                </CardContent>
              </Card>
              <Tabs defaultValue="overview">
                <TabsList className="mb-6">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="transactions">Transactions</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="mb-6">
                  <div className="grid mb-6 gap-4 grid-cols-3">
                    <Card>
                      <CardContent className="p-5">
                        <p className="text-muted-foreground text-sm">
                          Open balance
                        </p>
                        <p className="font-semibold text-2xl mt-2">₹24,380</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-5">
                        <p className="text-muted-foreground text-sm">
                          Total paid
                        </p>
                        <p className="font-semibold text-2xl mt-2">₹4,82,600</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-5">
                        <p className="text-muted-foreground text-sm">
                          Last activity
                        </p>
                        <p className="font-semibold text-2xl mt-2">
                          21 Jun 2024
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="grid mb-6 gap-6 grid-cols-5">
                    <Card className="col-span-3">
                      <CardHeader>
                        <CardTitle>Recent transactions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Description</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell>Dedicated internet line</TableCell>
                              <TableCell>-₹24,366</TableCell>
                              <TableCell>
                                <Badge variant="secondary">Paid</Badge>
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Managed router</TableCell>
                              <TableCell>-₹767</TableCell>
                              <TableCell>
                                <Badge variant="secondary">Paid</Badge>
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Service credit</TableCell>
                              <TableCell className="text-primary">
                                +₹753
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">Applied</Badge>
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                    <Card className="col-span-2">
                      <CardHeader>
                        <CardTitle>Tax details</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex mb-5 justify-between items-center">
                          <span className="text-muted-foreground text-sm">
                            GST treatment
                          </span>
                          <span className="font-medium text-sm">Regular</span>
                        </div>
                        <div className="flex mb-5 justify-between items-center">
                          <span className="text-muted-foreground text-sm">
                            Place of supply
                          </span>
                          <span className="font-medium text-sm">
                            Maharashtra
                          </span>
                        </div>
                        <div className="flex mb-5 justify-between items-center">
                          <span className="text-muted-foreground text-sm">
                            ITC claimed
                          </span>
                          <span className="font-medium text-sm">₹62,480</span>
                        </div>
                        <div className="border-x border-t border-b flex pt-4 justify-between items-center">
                          <Label htmlFor="include-reports">
                            Include in GST reports
                          </Label>
                          <Switch id="include-reports" defaultChecked={true} />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  <Card>
                    <CardHeader>
                      <CardTitle>Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md bg-muted mb-5 p-4">
                        <div className="flex justify-between items-center">
                          <p className="font-medium text-sm">Ananya Kapoor</p>
                          <p className="text-muted-foreground text-xs">
                            14 Jun 2024
                          </p>
                        </div>
                        <p className="text-muted-foreground text-sm mt-2">
                          Vendor account reconciled through June. Internet
                          service renewal is due next month.
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Input placeholder="Add a note..." defaultValue="" />
                        <Button>Save note</Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="transactions" className="mb-6" />
                <TabsContent value="documents" />
              </Tabs>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}

