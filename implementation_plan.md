# Implementation Plan - Fix Test Assignment Persistence

The user is experiencing an issue where test assignments appear to be lost in the UI when the management dialog is closed and reopened. This occurs because the frontend currently doesn't fetch pre-existing assignments for a user.

## User Review Required

> [!IMPORTANT]
> I will be adding a new endpoint to the `AdminController` and implementing the logic in the `AdminService` to retrieve existing assignments for a specific user.

## Proposed Changes

### Backend Components

#### [MODIFY] [AdminDtos.cs](file:///d:/Ujjwal/Test%20Management%20Application/Models/DTOs/Admin/AdminDtos.cs)
- Add `AssignmentResponse` DTO to return assignment details (Id, TestId, TestTitle, AssignedAt, ExpiresAt, Status).

#### [MODIFY] [IAdminService.cs](file:///d:/Ujjwal/Test%20Management%20Application/Services/Interfaces/IAdminService.cs)
- Add the method signature: `Task<IEnumerable<AssignmentResponse>> GetAssignmentsByUserAsync(Guid userId);`

#### [MODIFY] [AdminService.cs](file:///d:/Ujjwal/Test%20Management%20Application/Services/Implementations/AdminService.cs)
- Implement `GetAssignmentsByUserAsync` using `_assignmentRepo.GetByUserIdAsync(userId)`.
- Use the navigation properties to include the test title.

#### [MODIFY] [AdminController.cs](file:///d:/Ujjwal/Test%20Management%20Application/Controllers/AdminController.cs)
- Add a new endpoint: `GET api/admin/users/{userId:guid}/assignments`

---

### Frontend Components

#### [MODIFY] [admin.service.ts](file:///d:/Ujjwal/Frontend%20(Online%20test%20Application)2/exam-platform/src/app/core/services/admin.service.ts)
- Add `getUserAssignments(userId: string)` to call the new backend endpoint.

#### [MODIFY] [assign-test-dialog.component.ts](file:///d:/Ujjwal/Frontend%20(Online%20test%20Application)2/exam-platform/src/app/features/admin/users/assign-test-dialog.component.ts)
- Trigger assignment fetching in `ngOnInit`.
- Update the UI state while loading.

## Open Questions

- Currently, I will fetch the assignments inside the dialog's `ngOnInit`. This ensures the dialog always has the latest data. Do you agree with this approach?

## Verification Plan

### Automated Tests
- Manual verification via browser tools to ensure the endpoint is called and returns correct data.

### Manual Verification
1. Open a candidate's test management dialog.
2. Assign a test.
3. Observe the "Remove" button appears.
4. Close the dialog.
5. Re-open the dialog for the same candidate.
6. Verify the assigned test is still visible with the "Remove" option.
