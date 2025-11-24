"use client";

import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { adminAPI } from "../../../lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Input,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "../../ui";
import AddUser from "./AddUser";
import EditUser from "./EditUser";
import { UserFormData } from "./UserSchema";
import ConfirmDeleteDialog from "../../ConfirmDeleteDialog"; // ✅ import dialog

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  UserSchoolID: string;
  role: string;
}

export function AdminManageUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");

  const [showAddUser, setShowAddUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);

  const [userToDelete, setUserToDelete] = useState<User | null>(null); // ✅ new state

  // Fetch users from backend
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const backendUsers = await adminAPI.getUsers();
      // Map backend format to frontend format
      const mappedUsers: User[] = backendUsers.map((user: any) => ({
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        UserSchoolID: user.id.toString(), // Use id as UserSchoolID for display
        role: user.role,
      }));
      setUsers(mappedUsers);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      alert("Failed to fetch users. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (data: UserFormData) => {
    try {
      // Convert frontend format to backend format
      const backendData = {
        email: data.email,
        password: "TempPassword123!", // Default password - you might want to add password field to form
        first_name: data.firstName,
        last_name: data.lastName,
        role: data.role,
      };

      const response = await adminAPI.createUser(backendData);

      // Refresh users list
      await fetchUsers();
      setShowAddUser(false);
    } catch (error: any) {
      console.error("Failed to add user:", error);
      alert(error?.message || "Failed to add user. Please try again.");
    }
  };

  const handleDeleteUser = async (id: number) => {
    try {
      await adminAPI.deleteUser(id);
      // Refresh users list
      await fetchUsers();
      setUserToDelete(null);
    } catch (error: any) {
      console.error("Failed to delete user:", error);
      alert(error?.message || "Failed to delete user. Please try again.");
    }
  };

  const handleEditUser = async (data: User & UserFormData) => {
    try {
      // Convert frontend format to backend format
      const updateData: any = {
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        role: data.role,
      };

      await adminAPI.updateUser(data.id, updateData);

      // Refresh users list
      await fetchUsers();
      setShowEditUser(false);
      setEditUser(null);
    } catch (error: any) {
      console.error("Failed to update user:", error);
      alert(error?.message || "Failed to update user. Please try again.");
    }
  };

  const filteredUsers = users.filter((user) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      user.firstName.toLowerCase().includes(q) ||
      user.lastName.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q) ||
      user.UserSchoolID.toLowerCase().includes(q) ||
      user.role.toLowerCase().includes(q);
    const matchRole = filterRole === "all" || user.role === filterRole;
    return matchSearch && matchRole;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h1 className="text-xl font-semibold">Manage Users</h1>
        <Button onClick={() => setShowAddUser(true)}>Add User</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative sm:w-1/3 w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, ID, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="student">Student</SelectItem>
            <SelectItem value="staff">Staff</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users List</CardTitle>
          <CardDescription>View, edit, or remove users</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-6 text-muted-foreground">
              Loading users...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>First Name</TableHead>
                  <TableHead>Last Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>UserSchoolID</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.firstName}</TableCell>
                    <TableCell>{user.lastName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.UserSchoolID}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditUser(user);
                          setShowEditUser(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setUserToDelete(user)} // ✅ trigger confirm dialog
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-6 text-muted-foreground"
                    >
                      No users found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AddUser
        open={showAddUser}
        onOpenChange={setShowAddUser}
        onAdd={handleAddUser}
      />
      <EditUser
        open={showEditUser}
        onOpenChange={setShowEditUser}
        user={editUser}
        onEdit={handleEditUser}
      />

      {/* ✅ Confirm Delete Dialog */}
      {userToDelete && (
        <ConfirmDeleteDialog
          open={!!userToDelete}
          title="Delete User"
          message={`Are you sure you want to delete user "${userToDelete.firstName} ${userToDelete.lastName}" (${userToDelete.role})?`}
          confirmLabel="Delete User"
          onConfirm={() => handleDeleteUser(userToDelete.id)}
          onCancel={() => setUserToDelete(null)}
        />
      )}
    </div>
  );
}
