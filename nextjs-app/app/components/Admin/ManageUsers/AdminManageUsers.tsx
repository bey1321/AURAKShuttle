"use client";

import React, { useState } from "react";
import { users as initialUsers } from "../../../data/database";
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

export function AdminManageUsers() {
  const [users, setUsers] = useState(initialUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");

  const [showAddUser, setShowAddUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);

  const handleAddUser = (data: UserFormData) => {
    const newUser = { id: Date.now(), ...data };
    setUsers([...users, newUser]);
  };

  const handleDeleteUser = (id: number) => {
    setUsers(users.filter((u) => u.id !== id));
  };

  const handleEditUser = (data: any) => {
    setUsers(users.map((u) => (u.id === data.id ? data : u)));
  };

  const filteredUsers = users.filter((user) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      user.name.toLowerCase().includes(q) ||
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
        <Input
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="sm:w-1/3"
        />
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>UserSchoolID</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.name}</TableCell>
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
                      onClick={() => handleDeleteUser(user.id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-6 text-muted-foreground"
                  >
                    No users found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
    </div>
  );
}
