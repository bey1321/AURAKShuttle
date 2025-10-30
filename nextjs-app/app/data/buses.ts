import {Bus} from "../data/database"

export const buses: Bus[] = [
  {
    busID: 1,
    plateNumber: "RAK-1001",
    numberOfSeats: 40,
    model: "Sprinter 2023",
    manufacturer: "Mercedes-Benz",
    year: 2023,
    fuelType: "Diesel",
    status: "Active",
    assignment: "Assigned",
  },
  {
    busID: 2,
    plateNumber: "RAK-1002",
    numberOfSeats: 30,
    model: "E-Transit",
    manufacturer: "Ford",
    year: 2024,
    fuelType: "Electric",
    status: "UnderMaintenance",
    assignment: "Unassigned",
  },
];
