"use client";

import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Input,
  Button,
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../ui";
import { Bus } from "../../../data/types";
import CreateBusForm from "./CreateBusForm";
import EditBus from "./EditBus";
import ConfirmDeleteDialog from "../../ConfirmDeleteDialog";
import { BusFormData } from "./BusSchema";
import { adminAPI } from "../../../lib/api";

export default function AdminCreateBus() {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [showCreateBus, setShowCreateBus] = useState(false);
  const [editBus, setEditBus] = useState<Bus | null>(null);
  const [busToDelete, setBusToDelete] = useState<Bus | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBusForTrips, setSelectedBusForTrips] = useState<Bus | null>(null);
  const [busTrips, setBusTrips] = useState<any[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [busTripCounts, setBusTripCounts] = useState<{[key: number]: number}>({});

  // Fetch buses from backend on mount
  useEffect(() => {
    const fetchBuses = async () => {
      try {
        setLoading(true);
        const data = await adminAPI.getBuses();

        const mappedBuses: Bus[] = data.map((b: any) => ({
          busID: b.id,
          plate_num: b.plate_num,
          model: b.model,
          manufacturer: b.manufacturer,
          no_seats: b.no_seats,
          status: b.status,
        }));

        setBuses(mappedBuses);
        
        // Load trip counts for each bus
        const counts: {[key: number]: number} = {};
        await Promise.all(
          mappedBuses.map(async (bus) => {
            try {
              const trips = await adminAPI.getBusTrips(bus.busID);
              console.log(`Bus ${bus.busID} (${bus.plate_num}) trips:`, trips);
              counts[bus.busID] = Array.isArray(trips) ? trips.length : 0;
            } catch (err) {
              console.error(`Failed to load trips for bus ${bus.busID}:`, err);
              counts[bus.busID] = 0;
            }
          })
        );
        console.log('Final trip counts:', counts);
        setBusTripCounts(counts);
      } catch (err: any) {
        console.error(err);
        alert(err?.message || "Server error while fetching buses");
      } finally {
        setLoading(false);
      }
    };

    fetchBuses();
  }, []);

  // Add bus
  const handleAddBus = async (data: BusFormData) => {
    try {
      // send only the fields your backend expects
      const payload = {
        plate_num: data.plate_num,
        model: data.model,
        manufacturer: data.manufacturer,
        no_seats: data.no_seats,
        status: data.status,
      };

      const json = await adminAPI.createBus(payload);

      // Add the new bus to the frontend state
      const newBus: Bus = {
        busID: json.bus_id, // id returned from backend
        ...payload,
      };

      setBuses((prev) => [newBus, ...prev]);
      setShowCreateBus(false);
    } catch (err: any) {
      console.error(err);
      alert(
        err?.message || JSON.stringify(err) || "Server error while adding bus"
      );
    }
  };


  // Update bus in state by busID
  const handleSaveEdit = async (busID: number, data: Partial<Bus>) => {
    try {
      await adminAPI.updateBus(busID, data);

      setBuses((prev) =>
        prev.map((b) => (b.busID === busID ? { ...b, ...data } : b))
      );
      setEditBus(null);
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Server error while updating bus");
    }
  };

  const handleDeleteBus = async (busID: number) => {
    try {
      await adminAPI.deleteBus(busID);
      setBuses((prev) => prev.filter((b) => b.busID !== busID));
      setBusToDelete(null);
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Server error while deleting bus");
    }
  };

  const handleViewBusTrips = async (bus: Bus) => {
    setSelectedBusForTrips(bus);
    try {
      setLoadingTrips(true);
      console.log(`Fetching trips for bus ${bus.busID}...`);
      const trips = await adminAPI.getBusTrips(bus.busID);
      console.log('Fetched bus trips:', trips);
      setBusTrips(Array.isArray(trips) ? trips : []);
    } catch (err: any) {
      console.error('Error fetching bus trips:', err);
      alert(err?.message || "Failed to load bus trips");
      setBusTrips([]);
    } finally {
      setLoadingTrips(false);
    }
  };

  const filteredBuses = buses.filter((bus) => {
    const query = searchQuery.toLowerCase();
    return (
      bus.plate_num?.toLowerCase().includes(query) ||
      bus.model?.toLowerCase().includes(query) ||
      bus.manufacturer?.toLowerCase().includes(query) ||
      bus.status?.toLowerCase().includes(query) ||
      bus.no_seats?.toString().includes(query)
    );
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Bus Management</h1>
          <p className="text-muted-foreground">
            Create and manage buses in the shuttle system
          </p>
        </div>

        <Button onClick={() => setShowCreateBus(true)}>
          <Plus className="w-4 h-4 mr-2" /> Add New Bus
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search buses by plate, model, manufacturer, status, or seats..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <Dialog open={showCreateBus} onOpenChange={setShowCreateBus}>
        <CreateBusForm
          onSubmit={handleAddBus} // correct prop name
          onCancel={() => setShowCreateBus(false)}
        />
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Bus List</CardTitle>
          <CardDescription>Manage and monitor registered buses</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plate Number</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Manufacturer</TableHead>
                <TableHead>Seats</TableHead>
                <TableHead>Status</TableHead>                
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredBuses.map((bus) => (
                <TableRow key={bus.busID}>
                  <TableCell>{bus.plate_num}</TableCell>
                  <TableCell>{bus.model}</TableCell>
                  <TableCell>{bus.manufacturer}</TableCell>
                  <TableCell>{bus.no_seats}</TableCell>
                  <TableCell>
                    <Badge
                      variant={bus.status === "Active" ? "default" : "outline"}
                    >
                      {bus.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditBus(bus)}
                    >
                      <Edit className="w-4 h-4 mr-1" /> Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setBusToDelete(bus)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" /> Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {editBus && (
        <EditBus
          bus={editBus}
          open={!!editBus}
          onOpenChange={(open) => !open && setEditBus(null)}
          onSave={handleSaveEdit} // handleSaveEdit(busID, data)
        />
      )}

      {busToDelete && (
        <ConfirmDeleteDialog
          open={!!busToDelete}
          title="Delete Bus"
          message={`Are you sure you want to delete bus "${busToDelete.plate_num}"?`}
          confirmLabel="Delete Bus"
          onConfirm={() => handleDeleteBus(busToDelete.busID)}
          onCancel={() => setBusToDelete(null)}
        />
      )}

      {/* Bus Trips Popup */}
      <Dialog
        open={!!selectedBusForTrips}
        onOpenChange={(open) => !open && setSelectedBusForTrips(null)}
      >
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              Trips for {selectedBusForTrips?.plate_num}
            </DialogTitle>
            <DialogDescription>
              {selectedBusForTrips?.model} • {selectedBusForTrips?.manufacturer} • {selectedBusForTrips?.no_seats} seats
            </DialogDescription>
          </DialogHeader>
          {loadingTrips ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Loading trips...</p>
            </div>
          ) : busTrips.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No trips assigned to this bus yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Semester-wide Trips Section */}
              {busTrips.filter((trip: any) => trip.route).length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <span className="w-1 h-6 bg-primary rounded-full"></span>
                    Semester-Wide Routes
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {busTrips
                      .filter((trip: any) => trip.route)
                      .map((trip: any) => (
                        <Card key={trip.id} className="hover:shadow-lg transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h4 className="font-bold text-base">{trip.route?.name || 'Route'}</h4>
                                <p className="text-sm text-muted-foreground">Trip #{trip.id}</p>
                              </div>
                              <Badge variant={trip.status === "scheduled" || trip.status === "upcoming" ? "default" : "outline"}>
                                {trip.status}
                              </Badge>
                            </div>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Date:</span>
                                <span>{new Date(trip.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                              </div>
                              {trip.route?.start_time && (
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">Time:</span>
                                  <span>{trip.route.start_time} - {trip.route.end_time || 'N/A'}</span>
                                </div>
                              )}
                              {trip.driver && (
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">Driver:</span>
                                  <span>{trip.driver.first_name} {trip.driver.last_name}</span>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </div>
              )}

              {/* Single Trips Section */}
              {busTrips.filter((trip: any) => !trip.route).length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
                    Single Trips
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {busTrips
                      .filter((trip: any) => !trip.route)
                      .map((trip: any) => (
                        <Card key={trip.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h4 className="font-bold text-base">Single Trip</h4>
                                <p className="text-sm text-muted-foreground">Trip #{trip.id}</p>
                              </div>
                              <Badge variant={trip.status === "scheduled" || trip.status === "upcoming" ? "default" : "outline"}>
                                {trip.status}
                              </Badge>
                            </div>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Date:</span>
                                <span>{new Date(trip.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                              </div>
                              {trip.driver && (
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">Driver:</span>
                                  <span>{trip.driver.first_name} {trip.driver.last_name}</span>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
