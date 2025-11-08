"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Label,
  Input,
  Button,
} from "../../ui";

interface ClaimFormProps {
  open: boolean;
  onClose: (open: boolean) => void;
  claimForm: any;
  setClaimForm: (data: any) => void;
  onSubmit: () => void;
}

export default function ClaimForm({
  open,
  onClose,
  claimForm,
  setClaimForm,
  onSubmit,
}: ClaimFormProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Claim Item</DialogTitle>
          <DialogDescription>
            Fill out this form to request a claim. The admin will review your
            submission.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-4">
          <Label>Your Name</Label>
          <Input
            value={claimForm.claimedBy}
            onChange={(e) =>
              setClaimForm({ ...claimForm, claimedBy: e.target.value })
            }
          />

          <Label>School ID</Label>
          <Input
            value={claimForm.ClaimerSchoolID}
            onChange={(e) =>
              setClaimForm({ ...claimForm, ClaimerSchoolID: e.target.value })
            }
          />

          <Label>Phone Number</Label>
          <Input
            value={claimForm.PhoneNumber}
            onChange={(e) =>
              setClaimForm({ ...claimForm, PhoneNumber: e.target.value })
            }
          />

          <Label>School Email</Label>
          <Input
            value={claimForm.SchoolEmail}
            onChange={(e) =>
              setClaimForm({ ...claimForm, SchoolEmail: e.target.value })
            }
          />

          <Button className="w-full" onClick={onSubmit}>
            Submit Claim
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
