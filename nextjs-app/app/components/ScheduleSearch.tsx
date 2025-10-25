"use client";

import { Search, Calendar, MapPin, User, Clock, Bus, Filter } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Badge, Tabs, TabsContent, TabsList, TabsTrigger, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui";
import React, { useState, useMemo } from "react";
import { schedules as initialSchedules } from "../data/database";

export function ScheduleSearch() {
  const [schedules, setSchedules] = useState(initialSchedules);
  const [showReserveDialog, setShowReserveDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);

  // Filter state
  const [filterTerminal, setFilterTerminal] = useState("all");
  const [filterDriver, setFilterDriver] = useState("all");
  const [filterDate, setFilterDate] = useState("");
  const [filterTime, setFilterTime] = useState("all");

  // --- Filtered schedules ---
  const filteredSchedules = useMemo(() => {
    return schedules.filter((s) => {
      const terminalMatch =
        filterTerminal === "all" || s.terminal.toLowerCase() === filterTerminal.toLowerCase();
      const driverMatch = filterDriver === "all" || s.driver.toLowerCase() === filterDriver.toLowerCase();
      const dateMatch = !filterDate || s.date === filterDate;
      const timeMatch =
        filterTime === "all" ||
        (filterTime === "morning" && parseInt(s.departure.split(":")[0]) >= 6 && parseInt(s.departure.split(":")[0]) < 12) ||
        (filterTime === "afternoon" && parseInt(s.departure.split(":")[0]) >= 12 && parseInt(s.departure.split(":")[0]) < 18) ||
        (filterTime === "evening" && parseInt(s.departure.split(":")[0]) >= 18 && parseInt(s.departure.split(":")[0]) <= 22);
      return terminalMatch && driverMatch && dateMatch && timeMatch;
    });
  }, [schedules, filterTerminal, filterDriver, filterDate, filterTime]);

  // --- Handle reservation ---
  const handleReserve = (scheduleId: number) => {
    setSchedules((prev) =>
      prev.map((s) => {
        if (s.id === scheduleId && s.available > 0) {
          return { ...s, available: s.available - 1 };
        }
        return s;
      })
    );
    setShowReserveDialog(false);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1>Schedule Search</h1>
        <p className="text-muted-foreground">Find and book shuttle trips</p>
      </div>

      {/* Search Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search Filters</CardTitle>
          <CardDescription>Filter schedules by your preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Terminal/Location</Label>
              <Select value={filterTerminal} onValueChange={setFilterTerminal}>
                <SelectTrigger>
                  <SelectValue placeholder="Select terminal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Terminals</SelectItem>
                  <SelectItem value="main campus">Main Campus</SelectItem>
                  <SelectItem value="khatt">Khatt Terminal</SelectItem>
                  <SelectItem value="mall">RAK Mall</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Driver</Label>
              <Select value={filterDriver} onValueChange={setFilterDriver}>
                <SelectTrigger>
                  <SelectValue placeholder="Select driver" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Drivers</SelectItem>
                  <SelectItem value="ahmed hassan">Ahmed Hassan</SelectItem>
                  <SelectItem value="mohammed ali">Mohammed Ali</SelectItem>
                  <SelectItem value="sara ahmed">Sara Ahmed</SelectItem>
                  <SelectItem value="fatima ibrahim">Fatima Ibrahim</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Time Range</Label>
              <Select value={filterTime} onValueChange={setFilterTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Day</SelectItem>
                  <SelectItem value="morning">Morning (6AM - 12PM)</SelectItem>
                  <SelectItem value="afternoon">Afternoon (12PM - 6PM)</SelectItem>
                  <SelectItem value="evening">Evening (6PM - 10PM)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={() => {}}> 
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setFilterTerminal("all");
                setFilterDriver("all");
                setFilterDate("");
                setFilterTime("all");
              }}
            >
              <Filter className="w-4 h-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Tabs */}
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="grid">Grid View</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {/* List View */}
          {filteredSchedules.map((schedule) => (
            <Card key={schedule.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Bus className="w-6 h-6 text-primary" />
                    </div>

                    <div className="flex-1 space-y-3">
                      <div>
                        <h3>{schedule.route}</h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span>{schedule.driver}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>
                              {schedule.departure} - {schedule.arrival}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Days:</span>
                        <div className="flex gap-1">
                          {schedule.days.map((day) => (
                            <Badge key={day} variant="outline" className="text-xs">
                              {day}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Availability:</span>
                        <span className="text-sm">
                          {schedule.available} of {schedule.capacity} seats available
                        </span>
                        <div className="flex-1 max-w-xs">
                          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary"
                              style={{
                                width: `${((schedule.capacity - schedule.available) / schedule.capacity) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedSchedule(schedule);
                        setShowDetailsDialog(true);
                      }}
                    >
                      View Details
                    </Button>
                    <Button
                      onClick={() => {
                        setSelectedSchedule(schedule);
                        setShowReserveDialog(true);
                      }}
                    >
                      Reserve Seat
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="grid">
          {/* Grid View */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSchedules.map((schedule) => (
              <Card key={schedule.id}>
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Bus className="w-5 h-5 text-primary" />
                    </div>
                    <CardTitle className="text-base">{schedule.route}</CardTitle>
                  </div>
                  <CardDescription>Driver: {schedule.driver}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>
                        {schedule.departure} - {schedule.arrival}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <div className="flex gap-1">
                        {schedule.days.map((day) => (
                          <Badge key={day} variant="outline" className="text-xs">
                            {day}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Availability</span>
                      <span>
                        {schedule.available}/{schedule.capacity}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{
                          width: `${((schedule.capacity - schedule.available) / schedule.capacity) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      size="sm"
                      onClick={() => {
                        setSelectedSchedule(schedule);
                        setShowDetailsDialog(true);
                      }}
                    >
                      Details
                    </Button>
                    <Button
                      className="flex-1"
                      size="sm"
                      onClick={() => {
                        setSelectedSchedule(schedule);
                        setShowReserveDialog(true);
                      }}
                    >
                      Reserve
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Reserve Seat Dialog */}
      <Dialog open={showReserveDialog} onOpenChange={setShowReserveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reserve Seat</DialogTitle>
            <DialogDescription>Book your seat for this shuttle</DialogDescription>
          </DialogHeader>
          {selectedSchedule && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Route</Label>
                <Input value={selectedSchedule.route} disabled />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Departure</Label>
                  <Input value={selectedSchedule.departure} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Arrival</Label>
                  <Input value={selectedSchedule.arrival} disabled />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Driver</Label>
                <Input value={selectedSchedule.driver} disabled />
              </div>
              <div className="space-y-2">
                <Label>Available Seats</Label>
                <Input value={`${selectedSchedule.available} of ${selectedSchedule.capacity}`} disabled />
              </div>
              <div className="space-y-2">
                <Label>Your Name</Label>
                <Input placeholder="Enter your full name" />
              </div>
              <div className="space-y-2">
                <Label>Student ID</Label>
                <Input placeholder="Enter your student ID" />
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={() => handleReserve(selectedSchedule.id)}
                  disabled={selectedSchedule.available === 0}
                >
                  {selectedSchedule.available === 0 ? "Full" : "Confirm Reservation"}
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => setShowReserveDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Trip Details</DialogTitle>
            <DialogDescription>Complete schedule information</DialogDescription>
          </DialogHeader>
          {selectedSchedule && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Route</Label>
                <Input value={selectedSchedule.route} disabled />
              </div>
              <div className="space-y-2">
                <Label>Driver</Label>
                <Input value={selectedSchedule.driver} disabled />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Departure Time</Label>
                  <Input value={selectedSchedule.departure} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Arrival Time</Label>
                  <Input value={selectedSchedule.arrival} disabled />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Operating Days</Label>
                <div className="flex gap-2">
                  {selectedSchedule.days.map((day: string) => (
                    <Badge key={day} variant="outline">
                      {day}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Capacity</Label>
                <Input value={`${selectedSchedule.capacity} seats (${selectedSchedule.available} available)`} disabled />
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={() => {
                    setShowDetailsDialog(false);
                    setShowReserveDialog(true);
                  }}
                >
                  Reserve Seat
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => setShowDetailsDialog(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
